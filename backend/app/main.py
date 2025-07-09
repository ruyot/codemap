from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn

from app.config import settings
from app.routers import agents, blackbox, git, projects
from app.models import SuccessResponse

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Code Map Backend API",
    description="Python FastAPI backend for Code Map application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router)
app.include_router(blackbox.router)
app.include_router(git.router)
app.include_router(projects.router)

@app.get("/", response_model=SuccessResponse)
async def root():
    """Root endpoint"""
    return SuccessResponse(
        message="Code Map Backend API is running",
        data={
            "version": "1.0.0",
            "status": "healthy",
            "endpoints": [
                "/api/agents",
                "/api/blackbox", 
                "/api/git",
                "/api/project"
            ]
        }
    )

@app.get("/health", response_model=SuccessResponse)
async def health_check():
    """Health check endpoint"""
    return SuccessResponse(
        message="Service is healthy",
        data={
            "status": "ok",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    )

@app.get("/api/status", response_model=SuccessResponse)
async def api_status():
    """API status endpoint"""
    return SuccessResponse(
        message="API is operational",
        data={
            "services": {
                "agents": "active",
                "blackbox": "active",
                "git": "active",
                "projects": "active",
                "database": "connected"
            },
            "version": "1.0.0"
        }
    )

# Legacy endpoints for compatibility with existing frontend
@app.get("/api/file")
async def legacy_file_endpoint():
    """Legacy file endpoint for compatibility"""
    return JSONResponse({
        "message": "This endpoint has been moved to /api/project/{project_id}/files",
        "new_endpoints": {
            "upload_files": "POST /api/project/upload",
            "get_files": "GET /api/project/{project_id}/files",
            "get_file_content": "GET /api/project/{project_id}/file/{file_id}"
        }
    })

@app.get("/api/module/{module_id}")
async def legacy_module_endpoint(module_id: str):
    """Legacy module endpoint for compatibility"""
    return JSONResponse({
        "message": f"Module endpoint for {module_id} has been moved",
        "new_endpoint": f"/api/project/{{project_id}}/file/{module_id}",
        "suggestion": "Use the new project-based file management endpoints"
    })

@app.post("/api/ingestRepo")
async def legacy_ingest_repo():
    """Legacy repository ingestion endpoint"""
    return JSONResponse({
        "message": "Repository ingestion has been moved to Git operations",
        "new_endpoints": {
            "validate_repo": "POST /api/git/validate-repo",
            "get_repo_info": "POST /api/git/status",
            "get_branches": "GET /api/git/repo/{owner}/{repo}/branches",
            "get_commits": "GET /api/git/repo/{owner}/{repo}/commits"
        }
    })

@app.post("/api/groq/flag-errors")
async def legacy_groq_endpoint():
    """Legacy Groq endpoint for compatibility"""
    return JSONResponse({
        "message": "Error flagging has been moved to Blackbox AI services",
        "new_endpoints": {
            "analyze_code": "POST /api/blackbox/analyze-code",
            "suggest_fix": "POST /api/blackbox/suggest-fix",
            "code_fix": "POST /api/agents/code-fix"
        }
    })

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "details": str(exc) if settings.debug else "An unexpected error occurred"
        }
    )

# HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
