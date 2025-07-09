import httpx
import logging
from typing import List, Optional
from app.config import settings
from app.models import BlackboxResponse, ErrorFlag

logger = logging.getLogger(__name__)

class BlackboxService:
    def __init__(self):
        self.api_key = settings.blackbox_api_key
        self.base_url = "https://api.blackbox.ai"
    
    async def suggest_fix(self, file_path: str, code: str, errors: Optional[List[ErrorFlag]] = None) -> BlackboxResponse:
        """Get fix suggestions from Blackbox AI"""
        try:
            async with httpx.AsyncClient() as client:
                # Prepare the prompt
                prompt = f"Suggest fixes for the following code in file {file_path}:\n\n{code}"
                
                if errors:
                    error_descriptions = "\n".join([f"Line {error.line}: {error.message}" for error in errors])
                    prompt += f"\n\nSpecific errors to fix:\n{error_descriptions}"
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "blackboxai/openai/gpt-4",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt}
                                ]
                            }
                        ]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Extract suggestions from the response
                    suggestions = []
                    if "choices" in result and result["choices"]:
                        content = result["choices"][0].get("message", {}).get("content", "")
                        suggestions = [content] if content else []
                    
                    return BlackboxResponse(
                        suggestions=suggestions,
                        explanation="AI-generated fix suggestions"
                    )
                else:
                    logger.error(f"Blackbox API error: {response.status_code} - {response.text}")
                    return BlackboxResponse(
                        suggestions=["Unable to get AI suggestions at this time"],
                        explanation="API error occurred"
                    )
                    
        except Exception as e:
            logger.error(f"Error calling Blackbox API: {e}")
            return BlackboxResponse(
                suggestions=[f"Error: {str(e)}"],
                explanation="Service temporarily unavailable"
            )
    
    async def create_file(self, prompt: str, file_type: str) -> str:
        """Generate file content using Blackbox AI"""
        try:
            async with httpx.AsyncClient() as client:
                enhanced_prompt = f"Create a {file_type} file based on this request: {prompt}\n\nPlease provide only the code content without explanations."
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "blackboxai/openai/gpt-4",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": enhanced_prompt}
                                ]
                            }
                        ]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if "choices" in result and result["choices"]:
                        content = result["choices"][0].get("message", {}).get("content", "")
                        return content
                    
                return f"// Generated {file_type} file\n// TODO: Implement based on: {prompt}"
                
        except Exception as e:
            logger.error(f"Error generating file with Blackbox AI: {e}")
            return f"// Error generating file: {str(e)}\n// TODO: Implement based on: {prompt}"

# Global service instance
blackbox_service = BlackboxService()
