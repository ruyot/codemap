from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from app.models import (
    CodeFixRequest, CodeFixResponse, GeneratedFix, 
    BlackboxRequest, BlackboxCreateFileRequest,
    SuccessResponse, ErrorResponse
)
from app.services.code_fix_service import code_fix_service
from app.services.blackbox_service import blackbox_service
from app.database import db
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agents", tags=["agents"])

@router.post("/code-fix", response_model=CodeFixResponse)
async def code_fix_agent(request: CodeFixRequest):
    """
    Autonomous code fixing agent that analyzes errors and applies fixes
    """
    try:
        message = request.message
        payload = message.get('payload', {})
        
        file_path = payload.get('filePath', '')
        code = payload.get('code', '')
        errors = payload.get('errors', [])
        
        if not code:
            raise HTTPException(status_code=400, detail="Code is required")
        
        # Step 1: Generate fixes using the code fix service
        fixes = await code_fix_service.generate_fixes(code, errors, file_path)
        
        # Step 2: Apply fixes to code
        fixed_code = await code_fix_service.apply_fixes(code, fixes)
        
        # Step 3: Run tests (simulated)
        test_results = await code_fix_service.run_tests(file_path, fixed_code)
        
        # Step 4: Create PR if tests pass
        pr_url = None
        if test_results.get('success', False):
            pr_url = await code_fix_service.create_pull_request(file_path, fixed_code, fixes)
        
        return CodeFixResponse(
            fixes=fixes,
            fixed_code=fixed_code,
            test_results=test_results,
            pr_url=pr_url,
            summary={
                "errors_fixed": len(fixes),
                "tests_run": test_results.get('total', 0),
                "tests_passed": test_results.get('passed', 0),
                "auto_deployed": bool(pr_url)
            }
        )
        
    except Exception as e:
        logger.error(f"Code fix agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Code fix failed: {str(e)}")

@router.post("/ui-gen", response_model=SuccessResponse)
async def ui_generation_agent(request: Dict[str, Any]):
    """
    UI generation agent that creates React components
    """
    try:
        prompt = request.get('prompt', '')
        component_type = request.get('componentType', 'react')
        user_id = request.get('userId', '')
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID is required")
        
        # Check API usage
        usage = await db.get_api_usage(user_id)
        if usage and usage.get('count', 0) >= settings.max_requests_per_user:
            raise HTTPException(status_code=429, detail="API request limit reached")
        
        # Increment usage
        await db.increment_api_usage(user_id)
        
        # Generate UI component using Blackbox AI
        generated_code = await blackbox_service.create_file(prompt, component_type)
        
        return SuccessResponse(
            message="UI component generated successfully",
            data={
                "generated_code": generated_code,
                "component_type": component_type,
                "prompt": prompt
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"UI generation failed: {str(e)}")

@router.post("/prompt-refine", response_model=SuccessResponse)
async def prompt_refinement_agent(request: Dict[str, Any]):
    """
    Prompt refinement agent that improves user prompts
    """
    try:
        user_request = request.get('userRequest', '')
        context = request.get('context', {})
        user_id = request.get('userId', '')
        
        if not user_request:
            raise HTTPException(status_code=400, detail="User request is required")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID is required")
        
        # Check API usage
        usage = await db.get_api_usage(user_id)
        if usage and usage.get('count', 0) >= settings.max_requests_per_user:
            raise HTTPException(status_code=429, detail="API request limit reached")
        
        # Increment usage
        await db.increment_api_usage(user_id)
        
        # Refine the prompt
        refined_prompt = await _refine_prompt_with_rules(user_request, context)
        
        return SuccessResponse(
            message="Prompt refined successfully",
            data={
                "original_prompt": user_request,
                "refined_prompt": refined_prompt,
                "improvements": _get_prompt_improvements(user_request, refined_prompt)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prompt refinement error: {e}")
        raise HTTPException(status_code=500, detail=f"Prompt refinement failed: {str(e)}")

async def _refine_prompt_with_rules(user_request: str, context: Dict[str, Any] = None) -> str:
    """Apply refinement rules to improve the prompt"""
    refined = user_request.strip()
    
    # Rule 1: Add specificity
    if len(refined.split()) < 5:
        refined += " Please provide a detailed implementation with proper error handling and TypeScript types."
    
    # Rule 2: Add context if available
    if context:
        if context.get('fileType'):
            refined = f"Create a {context['fileType']} file: {refined}"
        if context.get('framework'):
            refined += f" Use {context['framework']} framework."
    
    # Rule 3: Add best practices
    if "component" in refined.lower():
        refined += " Follow React best practices, use functional components with hooks, and include proper prop types."
    
    # Rule 4: Add testing requirements
    if "function" in refined.lower() or "component" in refined.lower():
        refined += " Include unit tests and proper documentation."
    
    # Rule 5: Add accessibility
    if "ui" in refined.lower() or "component" in refined.lower():
        refined += " Ensure accessibility compliance with ARIA labels and keyboard navigation."
    
    return refined

def _get_prompt_improvements(original: str, refined: str) -> List[str]:
    """Get list of improvements made to the prompt"""
    improvements = []
    
    if len(refined) > len(original) * 1.2:
        improvements.append("Added more specific requirements")
    
    if "typescript" in refined.lower() and "typescript" not in original.lower():
        improvements.append("Added TypeScript type requirements")
    
    if "test" in refined.lower() and "test" not in original.lower():
        improvements.append("Added testing requirements")
    
    if "accessibility" in refined.lower():
        improvements.append("Added accessibility requirements")
    
    if "error handling" in refined.lower():
        improvements.append("Added error handling requirements")
    
    return improvements or ["Enhanced clarity and specificity"]

@router.get("/status", response_model=SuccessResponse)
async def get_agents_status():
    """Get status of all available agents"""
    try:
        agents = [
            {
                "id": "code-fix",
                "name": "Code Fix Agent",
                "type": "code-fix",
                "endpoint": "/api/agents/code-fix",
                "status": "active",
                "description": "Automatically fixes code errors and creates pull requests"
            },
            {
                "id": "ui-gen",
                "name": "UI Generation Agent",
                "type": "ui-gen",
                "endpoint": "/api/agents/ui-gen",
                "status": "active",
                "description": "Generates React components and UI code"
            },
            {
                "id": "prompt-refine",
                "name": "Prompt Refinement Agent",
                "type": "prompt-refine",
                "endpoint": "/api/agents/prompt-refine",
                "status": "active",
                "description": "Improves and refines user prompts for better results"
            }
        ]
        
        return SuccessResponse(
            message="Agents status retrieved successfully",
            data={"agents": agents, "total": len(agents)}
        )
        
    except Exception as e:
        logger.error(f"Error getting agents status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get agents status")
