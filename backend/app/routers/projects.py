from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Dict, Any, Optional
import logging
import base64

from app.models import (
    ProjectUploadResponse, Project, SuccessResponse, ErrorResponse,
    FileNode, DirectoryNode
)
from app.services.file_service import file_service
from app.database import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/project", tags=["projects"])

@router.post("/upload", response_model=ProjectUploadResponse)
async def upload_project(
    files: List[UploadFile] = File(...),
    project_name: Optional[str] = Form("Uploaded Project"),
    user_id: Optional[str] = Form("user-1234")
):
    """
    Upload multiple files and create a new project
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Create new project
        project = await db.create_project(project_name, user_id)
        if not project:
            raise HTTPException(status_code=500, detail="Failed to create project")
        
        project_id = project['id']
        
        # Process uploaded files
        file_data_list = []
        for file in files:
            if not isinstance(file, UploadFile):
                continue
            
            content = await file.read()
            file_data_list.append({
                'filename': file.filename,
                'content': content
            })
        
        # Save files using file service
        uploaded_files = await file_service.process_uploaded_files(file_data_list, project_id)
        
        # Generate project structure
        project_structure = file_service.generate_project_structure(uploaded_files)
        
        return ProjectUploadResponse(
            project_id=project_id,
            files=uploaded_files,
            structure=project_structure,
            message=f"Successfully uploaded {len(uploaded_files)} files"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Project upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload project: {str(e)}")

@router.get("/{project_id}", response_model=SuccessResponse)
async def get_project(project_id: str):
    """
    Get project information by ID
    """
    try:
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get project files
        files = await db.get_project_files(project_id)
        
        # Get project statistics
        stats = await file_service.get_project_stats(project_id)
        
        project_data = {
            "id": project['id'],
            "name": project['name'],
            "user_id": project['user_id'],
            "created_at": project.get('created_at'),
            "updated_at": project.get('updated_at'),
            "file_count": len(files),
            "status": "active",
            "stats": stats
        }
        
        return SuccessResponse(
            message="Project retrieved successfully",
            data=project_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get project: {str(e)}")

@router.get("/{project_id}/files", response_model=SuccessResponse)
async def get_project_files(project_id: str):
    """
    Get all files in a project
    """
    try:
        # Verify project exists
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get project files
        files_data = await db.get_project_files(project_id)
        
        # Convert to FileNode objects
        files = []
        for file_data in files_data:
            files.append(FileNode(
                id=file_data['id'],
                name=file_data['name'],
                path=file_data['path'],
                type=file_data['type'],
                size=len(file_data.get('content', '')),
                language=file_service.get_language_from_extension(file_data['name']),
                created_at=file_data.get('created_at'),
                updated_at=file_data.get('updated_at')
            ))
        
        return SuccessResponse(
            message=f"Retrieved {len(files)} files",
            data={
                "project_id": project_id,
                "files": [file.dict() for file in files],
                "total": len(files)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project files error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get project files: {str(e)}")

@router.get("/{project_id}/structure", response_model=SuccessResponse)
async def get_project_structure(project_id: str):
    """
    Get hierarchical project structure
    """
    try:
        # Verify project exists
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get project files
        files_data = await db.get_project_files(project_id)
        
        # Convert to UploadedFile objects for structure generation
        uploaded_files = []
        for file_data in files_data:
            uploaded_files.append({
                'id': file_data['id'],
                'name': file_data['name'],
                'path': file_data['path'],
                'size': len(file_data.get('content', '')),
                'content': file_data.get('content', '')
            })
        
        # Generate structure
        from app.models import UploadedFile
        files_objects = [UploadedFile(**file) for file in uploaded_files]
        structure = file_service.generate_project_structure(files_objects)
        
        return SuccessResponse(
            message="Project structure retrieved successfully",
            data={
                "project_id": project_id,
                "structure": structure.dict()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project structure error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get project structure: {str(e)}")

@router.get("/{project_id}/file/{file_id}", response_model=SuccessResponse)
async def get_file_content(project_id: str, file_id: str):
    """
    Get content of a specific file
    """
    try:
        # Verify project exists
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get file content
        content = await file_service.get_file_content(file_id)
        if content is None:
            raise HTTPException(status_code=404, detail="File not found")
        
        return SuccessResponse(
            message="File content retrieved successfully",
            data={
                "project_id": project_id,
                "file_id": file_id,
                "content": content
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get file content error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get file content: {str(e)}")

@router.put("/{project_id}/file/{file_id}", response_model=SuccessResponse)
async def update_file_content(project_id: str, file_id: str, request: Dict[str, Any]):
    """
    Update content of a specific file
    """
    try:
        content = request.get('content', '')
        
        # Verify project exists
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update file content
        success = await file_service.update_file_content(file_id, content)
        if not success:
            raise HTTPException(status_code=404, detail="File not found or update failed")
        
        return SuccessResponse(
            message="File content updated successfully",
            data={
                "project_id": project_id,
                "file_id": file_id,
                "updated": True
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update file content error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update file content: {str(e)}")

@router.delete("/{project_id}/file/{file_id}", response_model=SuccessResponse)
async def delete_file(project_id: str, file_id: str):
    """
    Delete a specific file
    """
    try:
        # Verify project exists
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Delete file
        success = await file_service.delete_file(file_id)
        if not success:
            raise HTTPException(status_code=404, detail="File not found or deletion failed")
        
        return SuccessResponse(
            message="File deleted successfully",
            data={
                "project_id": project_id,
                "file_id": file_id,
                "deleted": True
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete file error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@router.get("/{project_id}/search", response_model=SuccessResponse)
async def search_project_files(project_id: str, query: str):
    """
    Search files within a project
    """
    try:
        if not query:
            raise HTTPException(status_code=400, detail="Search query is required")
        
        # Verify project exists
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Search files
        matching_files = await file_service.search_files(project_id, query)
        
        return SuccessResponse(
            message=f"Found {len(matching_files)} matching files",
            data={
                "project_id": project_id,
                "query": query,
                "files": [file.dict() for file in matching_files],
                "total": len(matching_files)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search files error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search files: {str(e)}")

@router.get("/{project_id}/stats", response_model=SuccessResponse)
async def get_project_statistics(project_id: str):
    """
    Get detailed project statistics
    """
    try:
        # Verify project exists
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get project statistics
        stats = await file_service.get_project_stats(project_id)
        
        return SuccessResponse(
            message="Project statistics retrieved successfully",
            data={
                "project_id": project_id,
                "stats": stats
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get project statistics: {str(e)}")

@router.get("/user/{user_id}", response_model=SuccessResponse)
async def get_user_projects(user_id: str, limit: int = 10, offset: int = 0):
    """
    Get all projects for a user
    """
    try:
        # This would typically query the database for user projects
        # For now, return a mock response
        projects = [
            {
                "id": f"project_{i}",
                "name": f"Project {i}",
                "user_id": user_id,
                "created_at": "2024-01-01T00:00:00Z",
                "file_count": i * 5,
                "status": "active"
            }
            for i in range(1, min(limit + 1, 6))
        ]
        
        return SuccessResponse(
            message=f"Retrieved {len(projects)} projects",
            data={
                "user_id": user_id,
                "projects": projects,
                "total": len(projects),
                "limit": limit,
                "offset": offset
            }
        )
        
    except Exception as e:
        logger.error(f"Get user projects error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get user projects: {str(e)}")
