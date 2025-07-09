from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

from app.models import (
    GitOperationRequest, GitOperationResponse, GitOperationType,
    SuccessResponse, ErrorResponse
)
from app.services.github_service import github_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/git", tags=["git"])

@router.post("/{operation}", response_model=GitOperationResponse)
async def execute_git_operation(operation: str, request: Dict[str, Any]):
    """
    Execute various Git operations (status, diff, commit, branch, merge, log, checkout)
    """
    try:
        # Extract parameters from request
        repo = request.get('repo', '')
        owner = request.get('owner', '')
        branch = request.get('branch', 'main')
        message = request.get('message', '')
        
        if not repo:
            raise HTTPException(status_code=400, detail="Repository name is required")
        
        if not owner:
            raise HTTPException(status_code=400, detail="Repository owner is required")
        
        # Validate operation type
        try:
            git_operation = GitOperationType(operation)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid operation: {operation}")
        
        # Execute the Git operation
        result = await github_service.execute_git_operation(
            operation=git_operation,
            repo=repo,
            owner=owner,
            branch=branch,
            message=message
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Git operation error: {e}")
        raise HTTPException(status_code=500, detail=f"Git operation failed: {str(e)}")

@router.get("/operations", response_model=SuccessResponse)
async def get_available_operations():
    """
    Get list of available Git operations
    """
    try:
        operations = [
            {
                "id": "status",
                "name": "Status",
                "description": "Get repository status and recent commits",
                "category": "basic",
                "shortcut": "Ctrl+Shift+S",
                "priority": "high"
            },
            {
                "id": "diff",
                "name": "Diff",
                "description": "Show differences between commits",
                "category": "basic",
                "shortcut": "Ctrl+Shift+D",
                "priority": "high"
            },
            {
                "id": "commit",
                "name": "Commit",
                "description": "Create a new commit (simulated)",
                "category": "basic",
                "shortcut": "Ctrl+Shift+C",
                "priority": "high"
            },
            {
                "id": "branch",
                "name": "Branch",
                "description": "List repository branches",
                "category": "branching",
                "shortcut": "Ctrl+Shift+B",
                "priority": "medium"
            },
            {
                "id": "merge",
                "name": "Merge",
                "description": "Merge branches (simulated)",
                "category": "branching",
                "shortcut": "Ctrl+Shift+M",
                "priority": "medium"
            },
            {
                "id": "log",
                "name": "Log",
                "description": "Show commit history",
                "category": "basic",
                "shortcut": "Ctrl+Shift+L",
                "priority": "medium"
            },
            {
                "id": "checkout",
                "name": "Checkout",
                "description": "Switch branches (simulated)",
                "category": "branching",
                "shortcut": "Ctrl+Shift+O",
                "priority": "medium"
            }
        ]
        
        return SuccessResponse(
            message="Available Git operations retrieved successfully",
            data={
                "operations": operations,
                "total": len(operations),
                "categories": ["basic", "branching", "remote", "advanced"]
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting Git operations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get Git operations")

@router.post("/validate-repo", response_model=SuccessResponse)
async def validate_repository(request: Dict[str, Any]):
    """
    Validate if a repository exists and is accessible
    """
    try:
        repo = request.get('repo', '')
        owner = request.get('owner', '')
        
        if not repo or not owner:
            raise HTTPException(status_code=400, detail="Repository name and owner are required")
        
        # Try to get repository status to validate access
        result = await github_service.execute_git_operation(
            operation=GitOperationType.STATUS,
            repo=repo,
            owner=owner,
            branch="main"
        )
        
        if result.success:
            return SuccessResponse(
                message="Repository is valid and accessible",
                data={
                    "repo": repo,
                    "owner": owner,
                    "accessible": True,
                    "status": result.result
                }
            )
        else:
            return SuccessResponse(
                message="Repository validation failed",
                data={
                    "repo": repo,
                    "owner": owner,
                    "accessible": False,
                    "error": result.message
                }
            )
        
    except Exception as e:
        logger.error(f"Repository validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Repository validation failed: {str(e)}")

@router.get("/repo/{owner}/{repo}/branches", response_model=SuccessResponse)
async def get_repository_branches(owner: str, repo: str):
    """
    Get all branches for a repository
    """
    try:
        result = await github_service.execute_git_operation(
            operation=GitOperationType.BRANCH,
            repo=repo,
            owner=owner
        )
        
        if result.success:
            return SuccessResponse(
                message="Repository branches retrieved successfully",
                data=result.result
            )
        else:
            raise HTTPException(status_code=404, detail=result.message)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting repository branches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get repository branches")

@router.get("/repo/{owner}/{repo}/commits", response_model=SuccessResponse)
async def get_repository_commits(owner: str, repo: str, branch: str = "main", limit: int = 10):
    """
    Get commit history for a repository
    """
    try:
        result = await github_service.execute_git_operation(
            operation=GitOperationType.LOG,
            repo=repo,
            owner=owner,
            branch=branch
        )
        
        if result.success:
            commits = result.result.get('commits', [])
            limited_commits = commits[:limit] if commits else []
            
            return SuccessResponse(
                message=f"Repository commits retrieved successfully (showing {len(limited_commits)} of {len(commits)})",
                data={
                    "commits": limited_commits,
                    "total": len(commits),
                    "branch": branch,
                    "limit": limit
                }
            )
        else:
            raise HTTPException(status_code=404, detail=result.message)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting repository commits: {e}")
        raise HTTPException(status_code=500, detail="Failed to get repository commits")

@router.post("/repo/{owner}/{repo}/compare", response_model=SuccessResponse)
async def compare_branches(owner: str, repo: str, request: Dict[str, Any]):
    """
    Compare two branches or commits
    """
    try:
        base_branch = request.get('base', 'main')
        compare_branch = request.get('compare', 'main')
        
        # Get diff between branches
        result = await github_service.execute_git_operation(
            operation=GitOperationType.DIFF,
            repo=repo,
            owner=owner,
            branch=compare_branch
        )
        
        if result.success:
            return SuccessResponse(
                message=f"Branch comparison completed: {base_branch}...{compare_branch}",
                data={
                    "base": base_branch,
                    "compare": compare_branch,
                    "diff": result.result
                }
            )
        else:
            raise HTTPException(status_code=404, detail=result.message)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing branches: {e}")
        raise HTTPException(status_code=500, detail="Failed to compare branches")

@router.get("/workflow-templates", response_model=SuccessResponse)
async def get_workflow_templates():
    """
    Get predefined Git workflow templates
    """
    try:
        templates = [
            {
                "id": "feature-branch",
                "name": "Feature Branch Workflow",
                "description": "Create feature branch, make changes, and merge back",
                "steps": [
                    {"operation": "branch", "description": "Create feature branch"},
                    {"operation": "checkout", "description": "Switch to feature branch"},
                    {"operation": "commit", "description": "Make commits"},
                    {"operation": "merge", "description": "Merge back to main"}
                ]
            },
            {
                "id": "hotfix",
                "name": "Hotfix Workflow",
                "description": "Quick fix for production issues",
                "steps": [
                    {"operation": "branch", "description": "Create hotfix branch"},
                    {"operation": "checkout", "description": "Switch to hotfix branch"},
                    {"operation": "commit", "description": "Apply fix"},
                    {"operation": "merge", "description": "Merge to main and develop"}
                ]
            },
            {
                "id": "release",
                "name": "Release Workflow",
                "description": "Prepare and deploy a release",
                "steps": [
                    {"operation": "branch", "description": "Create release branch"},
                    {"operation": "commit", "description": "Finalize release"},
                    {"operation": "merge", "description": "Merge to main"},
                    {"operation": "commit", "description": "Tag release"}
                ]
            }
        ]
        
        return SuccessResponse(
            message="Git workflow templates retrieved successfully",
            data={
                "templates": templates,
                "total": len(templates)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting workflow templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get workflow templates")
