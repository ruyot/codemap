from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Enums
class FileType(str, Enum):
    FILE = "file"
    DIRECTORY = "directory"

class ErrorSeverity(str, Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

class ErrorType(str, Enum):
    BUG = "bug"
    SECURITY = "security"
    STYLE = "style"
    PERFORMANCE = "performance"

class GitOperationType(str, Enum):
    STATUS = "status"
    DIFF = "diff"
    COMMIT = "commit"
    BRANCH = "branch"
    MERGE = "merge"
    LOG = "log"
    CHECKOUT = "checkout"

class AgentType(str, Enum):
    UI_GEN = "ui-gen"
    ERROR_FLAG = "error-flag"
    PROMPT_REFINE = "prompt-refine"
    CODE_FIX = "code-fix"

class FixAction(str, Enum):
    REPLACE = "replace"
    COMMENT = "comment"
    SUGGEST = "suggest"

# Base Models
class ModuleNode(BaseModel):
    id: str
    label: str
    file_path: str
    type: FileType
    language: Optional[str] = None
    size: Optional[int] = None

class Repository(BaseModel):
    id: str
    name: str
    owner: str
    branch: str
    status: str
    modules: List[ModuleNode]

class ErrorFlag(BaseModel):
    line: int
    column: Optional[int] = None
    severity: ErrorSeverity
    message: str
    type: ErrorType
    suggestion: Optional[str] = None

class BlackboxResponse(BaseModel):
    suggestions: List[str]
    diff: Optional[str] = None
    explanation: Optional[str] = None

class CoralAgent(BaseModel):
    id: str
    name: str
    type: AgentType
    endpoint: str
    status: str

# File and Project Models
class FileNode(BaseModel):
    id: str
    name: str
    path: str
    type: FileType
    size: Optional[int] = None
    language: Optional[str] = None
    content: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DirectoryNode(BaseModel):
    type: FileType = FileType.DIRECTORY
    name: str
    children: List[Union['FileNode', 'DirectoryNode']]

class ProjectStructure(BaseModel):
    project_id: str
    files: List[FileNode]
    structure: DirectoryNode

class UploadedFile(BaseModel):
    id: str
    name: str
    path: str
    type: FileType = FileType.FILE
    size: int
    content: str

# Git Models
class GitOperation(BaseModel):
    id: str
    name: str
    description: str
    category: str
    shortcut: Optional[str] = None
    priority: str

class GitOperationRequest(BaseModel):
    operation: GitOperationType
    repo: str
    owner: str
    branch: str = "main"
    message: Optional[str] = None

class GitOperationResponse(BaseModel):
    success: bool
    operation: str
    result: Dict[str, Any]
    message: str

# Agent Models
class Fix(BaseModel):
    action: FixAction
    pattern: Optional[str] = None
    replacement: Optional[str] = None
    explanation: Optional[str] = None
    line: Optional[int] = None
    comment: Optional[str] = None
    suggestion: Optional[str] = None

class GeneratedFix(BaseModel):
    error_id: int
    type: str
    description: str
    fix: Fix
    confidence: float
    automated: bool

class CodeError(BaseModel):
    type: str
    line: int
    message: str

class CodeFixRequest(BaseModel):
    message: Dict[str, Any]
    thread: Optional[List[Dict[str, Any]]] = None

class CodeFixResponse(BaseModel):
    fixes: List[GeneratedFix]
    fixed_code: str
    test_results: Dict[str, Any]
    pr_url: Optional[str] = None
    summary: Dict[str, Any]

# Blackbox API Models
class BlackboxRequest(BaseModel):
    file_path: str
    code: str
    errors: Optional[List[ErrorFlag]] = None
    user_id: str

class BlackboxCreateFileRequest(BaseModel):
    prompt: str
    file_type: str
    user_id: str

# Project Models
class ProjectUploadRequest(BaseModel):
    files: List[UploadedFile]

class ProjectUploadResponse(BaseModel):
    project_id: str
    files: List[UploadedFile]
    structure: DirectoryNode
    message: str

class Project(BaseModel):
    id: str
    name: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    file_count: int = 0
    status: str = "active"

# Repository Ingestion Models
class FileNodeIngestion(BaseModel):
    path: str
    content: str
    language: str
    size: int

class FunctionNode(BaseModel):
    name: str
    file_path: str
    start_line: int
    end_line: int
    parameters: List[str]
    return_type: Optional[str] = None

class RepositoryIngestionRequest(BaseModel):
    repo_url: str
    branch: str = "main"
    user_id: str

class RepositoryIngestionResponse(BaseModel):
    success: bool
    project_id: str
    files_processed: int
    functions_extracted: int
    message: str

# API Usage Models
class APIUsage(BaseModel):
    user_id: str
    count: int
    last_request: datetime

# Response Models
class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None

# Update forward references
DirectoryNode.model_rebuild()
