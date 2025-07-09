#!/usr/bin/env python3
"""
FastAPI Backend Runner

This script starts the FastAPI backend server for the Code Map application.
It replaces the problematic Next.js backend with a robust Python solution.
"""

import uvicorn
import os
from app.config import settings

if __name__ == "__main__":
    # Set environment variables if not already set
    if not os.getenv("PYTHONPATH"):
        os.environ["PYTHONPATH"] = os.path.dirname(os.path.abspath(__file__))
    
    print("🚀 Starting Code Map FastAPI Backend...")
    print(f"📍 Environment: {'Development' if settings.debug else 'Production'}")
    print(f"🔧 Log Level: {settings.log_level}")
    print(f"🌐 CORS Origins: {settings.allowed_origins}")
    print("📚 API Documentation will be available at:")
    print("   - Swagger UI: http://localhost:8000/docs")
    print("   - ReDoc: http://localhost:8000/redoc")
    print("=" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=True
    )
