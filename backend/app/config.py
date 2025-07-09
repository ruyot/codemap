from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    
    # External API Keys
    blackbox_api_key: str
    github_token: str
    groq_api_key: str
    
    # Application Settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS Settings
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Rate Limiting
    max_requests_per_user: int = 100
    rate_limit_window_minutes: int = 60
    
    # File Upload Settings
    max_file_size_mb: int = 50
    upload_dir: str = "uploads"
    allowed_file_extensions: List[str] = [
        ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".cpp", ".c", 
        ".cs", ".php", ".rb", ".go", ".rs", ".swift", ".kt", 
        ".html", ".css", ".scss", ".json", ".md", ".sql", ".sh"
    ]
    
    # Development Settings
    debug: bool = True
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
