import os
import base64
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from app.config import settings
from app.models import FileNode, DirectoryNode, FileType, UploadedFile
from app.database import db

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
        self.max_file_size = settings.max_file_size_mb * 1024 * 1024  # Convert to bytes
        self.allowed_extensions = settings.allowed_file_extensions
    
    def get_language_from_extension(self, filename: str) -> str:
        """Determine programming language from file extension"""
        extension = Path(filename).suffix.lower()
        
        language_map = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.json': 'json',
            '.md': 'markdown',
            '.sql': 'sql',
            '.sh': 'shell'
        }
        
        return language_map.get(extension, 'plaintext')
    
    def is_allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        extension = Path(filename).suffix.lower()
        return extension in self.allowed_extensions
    
    async def save_file_to_disk(self, content: bytes, filename: str, project_id: str) -> str:
        """Save file content to disk"""
        try:
            project_dir = self.upload_dir / f"project_{project_id}"
            project_dir.mkdir(exist_ok=True)
            
            file_path = project_dir / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'wb') as f:
                f.write(content)
            
            return str(file_path.relative_to(self.upload_dir))
        except Exception as e:
            logger.error(f"Error saving file to disk: {e}")
            raise e
    
    async def read_file_from_disk(self, file_path: str) -> bytes:
        """Read file content from disk"""
        try:
            full_path = self.upload_dir / file_path
            with open(full_path, 'rb') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading file from disk: {e}")
            raise e
    
    async def process_uploaded_files(self, files: List[Dict[str, Any]], project_id: str) -> List[UploadedFile]:
        """Process and save uploaded files"""
        uploaded_files = []
        
        for file_data in files:
            try:
                filename = file_data.get('filename', 'unknown')
                content = file_data.get('content', b'')
                size = len(content)
                
                # Validate file
                if not self.is_allowed_file(filename):
                    logger.warning(f"File type not allowed: {filename}")
                    continue
                
                if size > self.max_file_size:
                    logger.warning(f"File too large: {filename} ({size} bytes)")
                    continue
                
                # Save to disk
                relative_path = await self.save_file_to_disk(content, filename, project_id)
                
                # Save to database
                file_record = await db.create_file(
                    project_id=project_id,
                    name=filename,
                    path=relative_path,
                    content=base64.b64encode(content).decode('utf-8'),
                    file_type='file'
                )
                
                if file_record:
                    uploaded_files.append(UploadedFile(
                        id=file_record['id'],
                        name=filename,
                        path=relative_path,
                        type=FileType.FILE,
                        size=size,
                        content=base64.b64encode(content).decode('utf-8')
                    ))
                
            except Exception as e:
                logger.error(f"Error processing file {filename}: {e}")
                continue
        
        return uploaded_files
    
    def generate_project_structure(self, files: List[UploadedFile]) -> DirectoryNode:
        """Generate hierarchical project structure from files"""
        structure = DirectoryNode(
            type=FileType.DIRECTORY,
            name='root',
            children=[]
        )
        
        for file in files:
            path_parts = file.path.split('/')
            current = structure
            
            # Navigate/create directory structure
            for i, part in enumerate(path_parts):
                if i == len(path_parts) - 1:
                    # This is the file
                    file_node = FileNode(
                        id=file.id,
                        name=part,
                        path=file.path,
                        type=FileType.FILE,
                        size=file.size,
                        language=self.get_language_from_extension(part)
                    )
                    current.children.append(file_node)
                else:
                    # This is a directory
                    existing_dir = None
                    for child in current.children:
                        if isinstance(child, DirectoryNode) and child.name == part:
                            existing_dir = child
                            break
                    
                    if not existing_dir:
                        existing_dir = DirectoryNode(
                            type=FileType.DIRECTORY,
                            name=part,
                            children=[]
                        )
                        current.children.append(existing_dir)
                    
                    current = existing_dir
        
        return structure
    
    async def get_file_content(self, file_id: str) -> Optional[str]:
        """Get file content by ID"""
        try:
            # This would typically fetch from database
            # For now, return a placeholder
            return "// File content would be loaded here"
        except Exception as e:
            logger.error(f"Error getting file content: {e}")
            return None
    
    async def update_file_content(self, file_id: str, content: str) -> bool:
        """Update file content"""
        try:
            result = await db.update_file(file_id, content)
            return result is not None
        except Exception as e:
            logger.error(f"Error updating file content: {e}")
            return False
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete a file"""
        try:
            return await db.delete_file(file_id)
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    async def search_files(self, project_id: str, query: str) -> List[FileNode]:
        """Search files in a project"""
        try:
            files = await db.get_project_files(project_id)
            
            # Simple search implementation
            matching_files = []
            for file_data in files:
                if (query.lower() in file_data['name'].lower() or 
                    query.lower() in file_data['path'].lower()):
                    
                    matching_files.append(FileNode(
                        id=file_data['id'],
                        name=file_data['name'],
                        path=file_data['path'],
                        type=FileType.FILE,
                        size=len(file_data.get('content', '')),
                        language=self.get_language_from_extension(file_data['name'])
                    ))
            
            return matching_files
        except Exception as e:
            logger.error(f"Error searching files: {e}")
            return []
    
    async def get_project_stats(self, project_id: str) -> Dict[str, Any]:
        """Get project statistics"""
        try:
            files = await db.get_project_files(project_id)
            
            # Calculate statistics
            total_files = len(files)
            total_size = sum(len(f.get('content', '')) for f in files)
            
            # Count by language
            language_counts = {}
            for file_data in files:
                lang = self.get_language_from_extension(file_data['name'])
                language_counts[lang] = language_counts.get(lang, 0) + 1
            
            return {
                "total_files": total_files,
                "total_size": total_size,
                "languages": language_counts,
                "last_updated": max((f.get('updated_at') for f in files), default=None)
            }
        except Exception as e:
            logger.error(f"Error getting project stats: {e}")
            return {}

# Global service instance
file_service = FileService()
