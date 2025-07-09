# Code Map FastAPI Backend

A robust Python FastAPI backend that replaces the problematic Next.js backend, providing comprehensive APIs for code management, AI-powered code fixing, Git operations, and project management.

## 🚀 Features

### Core APIs
- **Agents API** - AI-powered code fixing, UI generation, and prompt refinement
- **Blackbox AI Integration** - Code suggestions, analysis, and optimization
- **Git Operations** - Repository management, branch operations, and workflow automation
- **Project Management** - File upload, project organization, and content management

### Key Capabilities
- ✅ **Autonomous Code Fixing** - Automatically detect and fix code issues
- ✅ **AI-Powered Code Generation** - Generate React components and code files
- ✅ **Git Workflow Automation** - Streamlined Git operations with visual feedback
- ✅ **Project File Management** - Upload, organize, and manage project files
- ✅ **Real-time Code Analysis** - Security, performance, and style analysis
- ✅ **API Rate Limiting** - User-based request limits and usage tracking

## 🛠 Installation

### Prerequisites
- Python 3.8+
- pip or poetry
- Supabase account (for database)
- API keys for external services

### Setup

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your actual API keys and configuration
```

5. **Required environment variables**
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# External API Keys
BLACKBOX_API_KEY=your_blackbox_api_key
GITHUB_TOKEN=your_github_token
GROQ_API_KEY=your_groq_api_key

# Application Settings
SECRET_KEY=your_secret_key_for_jwt
```

## 🚀 Running the Server

### Development Mode
```bash
python run.py
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Using Docker (Optional)
```bash
docker build -t codemap-backend .
docker run -p 8000:8000 codemap-backend
```

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔗 API Endpoints

### Agents API (`/api/agents`)
- `POST /api/agents/code-fix` - Autonomous code fixing
- `POST /api/agents/ui-gen` - UI component generation
- `POST /api/agents/prompt-refine` - Prompt improvement
- `GET /api/agents/status` - Agent status overview

### Blackbox AI API (`/api/blackbox`)
- `POST /api/blackbox/suggest-fix` - Get AI fix suggestions
- `POST /api/blackbox/create-file` - Generate file content
- `POST /api/blackbox/analyze-code` - Code analysis
- `POST /api/blackbox/optimize-code` - Code optimization
- `GET /api/blackbox/usage/{user_id}` - Usage statistics

### Git Operations API (`/api/git`)
- `POST /api/git/{operation}` - Execute Git operations
- `GET /api/git/operations` - Available operations
- `POST /api/git/validate-repo` - Repository validation
- `GET /api/git/repo/{owner}/{repo}/branches` - List branches
- `GET /api/git/repo/{owner}/{repo}/commits` - Commit history

### Project Management API (`/api/project`)
- `POST /api/project/upload` - Upload project files
- `GET /api/project/{project_id}` - Get project info
- `GET /api/project/{project_id}/files` - List project files
- `GET /api/project/{project_id}/structure` - Project structure
- `GET /api/project/{project_id}/file/{file_id}` - Get file content
- `PUT /api/project/{project_id}/file/{file_id}` - Update file
- `DELETE /api/project/{project_id}/file/{file_id}` - Delete file

## 🔧 Configuration

### Settings (`app/config.py`)
- **API Rate Limiting**: Configure request limits per user
- **File Upload**: Set max file size and allowed extensions
- **CORS**: Configure allowed origins for frontend
- **Logging**: Set log levels and formats

### Database Integration
- Uses Supabase for data persistence
- Automatic table creation and management
- Real-time data synchronization

## 🧪 Testing

### Run Tests
```bash
pytest
```

### Test Coverage
```bash
pytest --cov=app
```

### Manual Testing
Use the interactive API docs at `/docs` to test endpoints manually.

## 🔄 Migration from Next.js Backend

This FastAPI backend replaces the problematic Next.js backend with:

### ✅ Improvements
- **Syntax Error Resolution**: No more "use client" directive issues
- **Better Error Handling**: Comprehensive error responses
- **Type Safety**: Pydantic models for request/response validation
- **Performance**: Async/await support for better concurrency
- **Documentation**: Auto-generated API docs
- **Testing**: Built-in testing framework

### 🔄 Compatibility
- **Legacy Endpoint Support**: Maintains compatibility with existing frontend
- **Same Data Models**: Equivalent response structures
- **API Parity**: All original functionality preserved and enhanced

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── models.py            # Pydantic models
│   ├── database.py          # Database client
│   ├── routers/             # API route handlers
│   │   ├── agents.py        # AI agents endpoints
│   │   ├── blackbox.py      # Blackbox AI endpoints
│   │   ├── git.py           # Git operations endpoints
│   │   └── projects.py      # Project management endpoints
│   └── services/            # Business logic services
│       ├── blackbox_service.py
│       ├── github_service.py
│       ├── code_fix_service.py
│       └── file_service.py
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
├── run.py                  # Development server runner
└── README.md              # This file
```

## 🚀 Deployment

### Environment Setup
1. Set production environment variables
2. Configure database connections
3. Set up API key management
4. Configure CORS for production domains

### Recommended Deployment Platforms
- **Railway**: Easy Python deployment
- **Heroku**: Traditional PaaS option
- **DigitalOcean App Platform**: Scalable container deployment
- **AWS ECS/Fargate**: Enterprise container deployment
- **Google Cloud Run**: Serverless container deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the logs for error details
3. Ensure all environment variables are set correctly
4. Verify external API keys are valid

---

**Note**: This backend completely replaces the problematic Next.js backend and provides a robust, scalable solution for the Code Map application.
