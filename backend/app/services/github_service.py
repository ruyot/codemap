import httpx
import logging
from typing import Dict, Any, List
from github import Github
from app.config import settings
from app.models import GitOperationType, GitOperationResponse

logger = logging.getLogger(__name__)

class GitHubService:
    def __init__(self):
        self.token = settings.github_token
        self.github = Github(self.token) if self.token != "mock-token" else None
    
    async def execute_git_operation(self, operation: GitOperationType, repo: str, owner: str, branch: str = "main", message: str = None) -> GitOperationResponse:
        """Execute various Git operations"""
        try:
            if not self.github:
                return await self._mock_git_operation(operation, repo, owner, branch, message)
            
            repository = self.github.get_repo(f"{owner}/{repo}")
            
            if operation == GitOperationType.STATUS:
                return await self._handle_status(repository, branch)
            elif operation == GitOperationType.DIFF:
                return await self._handle_diff(repository, branch)
            elif operation == GitOperationType.COMMIT:
                return await self._handle_commit(repository, branch, message)
            elif operation == GitOperationType.BRANCH:
                return await self._handle_branch(repository)
            elif operation == GitOperationType.MERGE:
                return await self._handle_merge(repository, branch)
            elif operation == GitOperationType.LOG:
                return await self._handle_log(repository, branch)
            elif operation == GitOperationType.CHECKOUT:
                return await self._handle_checkout(repository, branch)
            else:
                return GitOperationResponse(
                    success=False,
                    operation=operation.value,
                    result={},
                    message=f"Unsupported operation: {operation}"
                )
                
        except Exception as e:
            logger.error(f"Git operation error: {e}")
            return GitOperationResponse(
                success=False,
                operation=operation.value,
                result={"error": str(e)},
                message=f"Failed to execute {operation.value}: {str(e)}"
            )
    
    async def _handle_status(self, repo, branch: str) -> GitOperationResponse:
        """Get repository status"""
        try:
            # Get recent commits
            commits = list(repo.get_commits(sha=branch)[:5])
            
            # Get repository info
            status_info = {
                "branch": branch,
                "latest_commit": {
                    "sha": commits[0].sha[:8] if commits else None,
                    "message": commits[0].commit.message if commits else None,
                    "author": commits[0].commit.author.name if commits else None,
                    "date": commits[0].commit.author.date.isoformat() if commits else None
                },
                "total_commits": repo.get_commits().totalCount,
                "open_issues": repo.open_issues_count,
                "forks": repo.forks_count,
                "stars": repo.stargazers_count
            }
            
            return GitOperationResponse(
                success=True,
                operation="status",
                result=status_info,
                message=f"Repository status for {repo.name}"
            )
        except Exception as e:
            raise e
    
    async def _handle_diff(self, repo, branch: str) -> GitOperationResponse:
        """Get diff between commits"""
        try:
            commits = list(repo.get_commits(sha=branch)[:2])
            
            if len(commits) < 2:
                return GitOperationResponse(
                    success=True,
                    operation="diff",
                    result={"diff": "No previous commits to compare"},
                    message="Not enough commits for diff"
                )
            
            # Get comparison between latest two commits
            comparison = repo.compare(commits[1].sha, commits[0].sha)
            
            diff_info = {
                "files_changed": comparison.files,
                "additions": comparison.ahead_by,
                "deletions": comparison.behind_by,
                "total_changes": len(comparison.files),
                "commits": [
                    {
                        "sha": commit.sha[:8],
                        "message": commit.commit.message,
                        "author": commit.commit.author.name
                    } for commit in [commits[0], commits[1]]
                ]
            }
            
            return GitOperationResponse(
                success=True,
                operation="diff",
                result=diff_info,
                message=f"Diff between latest commits"
            )
        except Exception as e:
            raise e
    
    async def _handle_commit(self, repo, branch: str, message: str) -> GitOperationResponse:
        """Simulate commit operation"""
        return GitOperationResponse(
            success=True,
            operation="commit",
            result={
                "message": message or "Automated commit",
                "branch": branch,
                "simulated": True
            },
            message="Commit operation simulated (read-only mode)"
        )
    
    async def _handle_branch(self, repo) -> GitOperationResponse:
        """List repository branches"""
        try:
            branches = list(repo.get_branches())
            
            branch_info = [
                {
                    "name": branch.name,
                    "protected": branch.protected,
                    "commit_sha": branch.commit.sha[:8]
                } for branch in branches
            ]
            
            return GitOperationResponse(
                success=True,
                operation="branch",
                result={"branches": branch_info, "total": len(branch_info)},
                message=f"Found {len(branch_info)} branches"
            )
        except Exception as e:
            raise e
    
    async def _handle_merge(self, repo, branch: str) -> GitOperationResponse:
        """Simulate merge operation"""
        return GitOperationResponse(
            success=True,
            operation="merge",
            result={
                "target_branch": branch,
                "simulated": True
            },
            message="Merge operation simulated (read-only mode)"
        )
    
    async def _handle_log(self, repo, branch: str) -> GitOperationResponse:
        """Get commit log"""
        try:
            commits = list(repo.get_commits(sha=branch)[:10])
            
            log_info = [
                {
                    "sha": commit.sha[:8],
                    "message": commit.commit.message.split('\n')[0],  # First line only
                    "author": commit.commit.author.name,
                    "date": commit.commit.author.date.isoformat(),
                    "url": commit.html_url
                } for commit in commits
            ]
            
            return GitOperationResponse(
                success=True,
                operation="log",
                result={"commits": log_info, "total": len(log_info)},
                message=f"Retrieved {len(log_info)} recent commits"
            )
        except Exception as e:
            raise e
    
    async def _handle_checkout(self, repo, branch: str) -> GitOperationResponse:
        """Simulate checkout operation"""
        return GitOperationResponse(
            success=True,
            operation="checkout",
            result={
                "branch": branch,
                "simulated": True
            },
            message=f"Checkout to {branch} simulated (read-only mode)"
        )
    
    async def _mock_git_operation(self, operation: GitOperationType, repo: str, owner: str, branch: str, message: str) -> GitOperationResponse:
        """Mock Git operations when no real GitHub token is available"""
        mock_data = {
            "status": {
                "branch": branch,
                "latest_commit": {
                    "sha": "abc12345",
                    "message": "Mock commit message",
                    "author": "Mock Author",
                    "date": "2024-01-01T12:00:00Z"
                },
                "total_commits": 42,
                "open_issues": 3,
                "forks": 5,
                "stars": 15
            },
            "diff": {
                "files_changed": ["src/main.py", "README.md"],
                "additions": 10,
                "deletions": 5,
                "total_changes": 2
            },
            "branch": {
                "branches": [
                    {"name": "main", "protected": True, "commit_sha": "abc12345"},
                    {"name": "develop", "protected": False, "commit_sha": "def67890"}
                ],
                "total": 2
            },
            "log": {
                "commits": [
                    {
                        "sha": "abc12345",
                        "message": "Initial commit",
                        "author": "Mock Author",
                        "date": "2024-01-01T12:00:00Z"
                    }
                ],
                "total": 1
            }
        }
        
        return GitOperationResponse(
            success=True,
            operation=operation.value,
            result=mock_data.get(operation.value, {"mock": True}),
            message=f"Mock {operation.value} operation completed"
        )

# Global service instance
github_service = GitHubService()
