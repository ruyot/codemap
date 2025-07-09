from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import logging

from app.models import (
    BlackboxRequest, BlackboxCreateFileRequest, BlackboxResponse,
    SuccessResponse, ErrorResponse
)
from app.services.blackbox_service import blackbox_service
from app.database import db
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/blackbox", tags=["blackbox"])

@router.post("/suggest-fix", response_model=BlackboxResponse)
async def suggest_fix(request: BlackboxRequest):
    """
    Get AI-powered fix suggestions for code issues
    """
    try:
        if not request.code:
            raise HTTPException(status_code=400, detail="Code is required")
        
        if not request.user_id:
            raise HTTPException(status_code=401, detail="User ID is required")
        
        # Check API usage limits
        usage = await db.get_api_usage(request.user_id)
        if usage and usage.get('count', 0) >= settings.max_requests_per_user:
            raise HTTPException(status_code=429, detail="API request limit reached")
        
        # Increment API usage
        await db.increment_api_usage(request.user_id)
        
        # Get fix suggestions from Blackbox AI
        response = await blackbox_service.suggest_fix(
            file_path=request.file_path,
            code=request.code,
            errors=request.errors
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Blackbox suggest fix error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get fix suggestions: {str(e)}")

@router.post("/create-file", response_model=SuccessResponse)
async def create_file(request: BlackboxCreateFileRequest):
    """
    Generate file content using AI based on a prompt
    """
    try:
        if not request.prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        if not request.user_id:
            raise HTTPException(status_code=401, detail="User ID is required")
        
        # Check API usage limits
        usage = await db.get_api_usage(request.user_id)
        if usage and usage.get('count', 0) >= settings.max_requests_per_user:
            raise HTTPException(status_code=429, detail="API request limit reached")
        
        # Increment API usage
        await db.increment_api_usage(request.user_id)
        
        # Generate file content
        generated_content = await blackbox_service.create_file(
            prompt=request.prompt,
            file_type=request.file_type
        )
        
        return SuccessResponse(
            message="File content generated successfully",
            data={
                "content": generated_content,
                "file_type": request.file_type,
                "prompt": request.prompt
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Blackbox create file error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate file: {str(e)}")

@router.post("/analyze-code", response_model=SuccessResponse)
async def analyze_code(request: Dict[str, Any]):
    """
    Analyze code for potential issues and improvements
    """
    try:
        code = request.get('code', '')
        file_path = request.get('filePath', '')
        user_id = request.get('userId', '')
        
        if not code:
            raise HTTPException(status_code=400, detail="Code is required")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID is required")
        
        # Check API usage limits
        usage = await db.get_api_usage(user_id)
        if usage and usage.get('count', 0) >= settings.max_requests_per_user:
            raise HTTPException(status_code=429, detail="API request limit reached")
        
        # Increment API usage
        await db.increment_api_usage(user_id)
        
        # Analyze code using Blackbox AI
        analysis_prompt = f"Analyze the following code for potential issues, bugs, security vulnerabilities, and performance improvements:\n\n{code}"
        
        analysis_result = await blackbox_service.create_file(analysis_prompt, "analysis")
        
        # Parse analysis result into structured format
        analysis_data = {
            "file_path": file_path,
            "analysis": analysis_result,
            "issues_found": _extract_issues_from_analysis(analysis_result),
            "suggestions": _extract_suggestions_from_analysis(analysis_result),
            "security_score": _calculate_security_score(code),
            "complexity_score": _calculate_complexity_score(code)
        }
        
        return SuccessResponse(
            message="Code analysis completed successfully",
            data=analysis_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Code analysis failed: {str(e)}")

@router.post("/optimize-code", response_model=SuccessResponse)
async def optimize_code(request: Dict[str, Any]):
    """
    Optimize code for better performance and readability
    """
    try:
        code = request.get('code', '')
        optimization_type = request.get('optimizationType', 'general')
        user_id = request.get('userId', '')
        
        if not code:
            raise HTTPException(status_code=400, detail="Code is required")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID is required")
        
        # Check API usage limits
        usage = await db.get_api_usage(user_id)
        if usage and usage.get('count', 0) >= settings.max_requests_per_user:
            raise HTTPException(status_code=429, detail="API request limit reached")
        
        # Increment API usage
        await db.increment_api_usage(user_id)
        
        # Optimize code using Blackbox AI
        optimization_prompt = f"Optimize the following code for {optimization_type}. Provide the optimized version with explanations:\n\n{code}"
        
        optimized_result = await blackbox_service.create_file(optimization_prompt, "optimized_code")
        
        return SuccessResponse(
            message="Code optimization completed successfully",
            data={
                "original_code": code,
                "optimized_code": optimized_result,
                "optimization_type": optimization_type,
                "improvements": _extract_improvements_from_optimization(optimized_result)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code optimization error: {e}")
        raise HTTPException(status_code=500, detail=f"Code optimization failed: {str(e)}")

def _extract_issues_from_analysis(analysis: str) -> List[Dict[str, Any]]:
    """Extract issues from analysis text"""
    issues = []
    
    # Simple keyword-based extraction
    if "security" in analysis.lower():
        issues.append({"type": "security", "severity": "high", "description": "Potential security vulnerability detected"})
    
    if "performance" in analysis.lower():
        issues.append({"type": "performance", "severity": "medium", "description": "Performance improvement opportunity"})
    
    if "bug" in analysis.lower() or "error" in analysis.lower():
        issues.append({"type": "bug", "severity": "high", "description": "Potential bug detected"})
    
    if "style" in analysis.lower() or "formatting" in analysis.lower():
        issues.append({"type": "style", "severity": "low", "description": "Code style improvement needed"})
    
    return issues

def _extract_suggestions_from_analysis(analysis: str) -> List[str]:
    """Extract suggestions from analysis text"""
    suggestions = []
    
    # Simple extraction based on common patterns
    lines = analysis.split('\n')
    for line in lines:
        if any(keyword in line.lower() for keyword in ['suggest', 'recommend', 'consider', 'should']):
            suggestions.append(line.strip())
    
    return suggestions[:5]  # Limit to top 5 suggestions

def _calculate_security_score(code: str) -> int:
    """Calculate a simple security score (0-100)"""
    score = 100
    
    # Deduct points for potential security issues
    if "eval(" in code:
        score -= 30
    if "innerHTML" in code:
        score -= 20
    if "document.write" in code:
        score -= 25
    if "setTimeout" in code and "string" in code:
        score -= 15
    if "localStorage" in code and "password" in code.lower():
        score -= 20
    
    return max(0, score)

def _calculate_complexity_score(code: str) -> int:
    """Calculate a simple complexity score (0-100)"""
    lines = code.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    
    # Simple complexity calculation
    complexity = len(non_empty_lines)
    nested_blocks = code.count('{') + code.count('if') + code.count('for') + code.count('while')
    
    # Normalize to 0-100 scale
    score = min(100, max(0, 100 - (complexity // 10) - (nested_blocks * 5)))
    
    return score

def _extract_improvements_from_optimization(optimization: str) -> List[str]:
    """Extract improvements from optimization text"""
    improvements = []
    
    # Simple extraction based on common patterns
    if "faster" in optimization.lower():
        improvements.append("Performance improvement")
    if "readable" in optimization.lower():
        improvements.append("Code readability enhancement")
    if "memory" in optimization.lower():
        improvements.append("Memory usage optimization")
    if "efficient" in optimization.lower():
        improvements.append("Algorithm efficiency improvement")
    
    return improvements or ["General code optimization"]

@router.get("/usage/{user_id}", response_model=SuccessResponse)
async def get_api_usage(user_id: str):
    """Get API usage statistics for a user"""
    try:
        usage = await db.get_api_usage(user_id)
        
        return SuccessResponse(
            message="API usage retrieved successfully",
            data={
                "user_id": user_id,
                "requests_used": usage.get('count', 0) if usage else 0,
                "requests_limit": settings.max_requests_per_user,
                "requests_remaining": max(0, settings.max_requests_per_user - (usage.get('count', 0) if usage else 0))
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting API usage: {e}")
        raise HTTPException(status_code=500, detail="Failed to get API usage")
