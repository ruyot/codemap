import re
import logging
from typing import List, Dict, Any
from app.models import CodeError, GeneratedFix, Fix, FixAction

logger = logging.getLogger(__name__)

class CodeFixService:
    def __init__(self):
        pass
    
    async def generate_fixes(self, code: str, errors: List[CodeError], file_path: str) -> List[GeneratedFix]:
        """Generate fixes for code errors"""
        fixes = []
        
        for error in errors:
            fix = None
            
            if error.type == "style":
                fix = self._generate_style_fix(error, code)
            elif error.type == "bug":
                fix = self._generate_bug_fix(error, code)
            elif error.type == "security":
                fix = self._generate_security_fix(error, code)
            elif error.type == "performance":
                fix = self._generate_performance_fix(error, code)
            else:
                fix = self._generate_generic_fix(error, code)
            
            if fix:
                fixes.append(GeneratedFix(
                    error_id=error.line,
                    type=error.type,
                    description=error.message,
                    fix=fix,
                    confidence=0.85,
                    automated=True
                ))
        
        return fixes
    
    def _generate_style_fix(self, error: CodeError, code: str) -> Fix:
        """Generate style-related fixes"""
        if "optional chaining" in error.message.lower():
            return Fix(
                action=FixAction.REPLACE,
                pattern=r"(\w+)\s*&&\s*\1\(",
                replacement=r"$1?.()",
                explanation="Replace logical AND with optional chaining for safer property access"
            )
        
        if "export" in error.message.lower():
            return Fix(
                action=FixAction.REPLACE,
                pattern=r"^(\s*)(interface\s+\w+)",
                replacement=r"$1export $2",
                explanation="Export interface for better reusability"
            )
        
        if "semicolon" in error.message.lower():
            return Fix(
                action=FixAction.REPLACE,
                pattern=r"(\w+)$",
                replacement=r"$1;",
                explanation="Add missing semicolon"
            )
        
        return Fix(
            action=FixAction.COMMENT,
            line=error.line,
            comment=f"// STYLE: {error.message}",
            explanation="Added style comment for manual review"
        )
    
    def _generate_bug_fix(self, error: CodeError, code: str) -> Fix:
        """Generate bug-related fixes"""
        if "undefined" in error.message.lower():
            return Fix(
                action=FixAction.REPLACE,
                pattern=r"(\w+)\.(\w+)",
                replacement=r"$1?.$2",
                explanation="Add null checking to prevent undefined access"
            )
        
        if "null" in error.message.lower():
            return Fix(
                action=FixAction.REPLACE,
                pattern=r"(\w+)\s*==\s*null",
                replacement=r"$1 === null",
                explanation="Use strict equality for null checks"
            )
        
        if "assignment" in error.message.lower() and "module" in error.message.lower():
            return Fix(
                action=FixAction.REPLACE,
                pattern=r"module\s*=",
                replacement="moduleData =",
                explanation="Rename variable to avoid module assignment conflict"
            )
        
        return Fix(
            action=FixAction.COMMENT,
            line=error.line,
            comment=f"// TODO: Fix bug - {error.message}",
            explanation="Added TODO comment for manual review"
        )
    
    def _generate_security_fix(self, error: CodeError, code: str) -> Fix:
        """Generate security-related fixes"""
        if "injection" in error.message.lower():
            return Fix(
                action=FixAction.REPLACE,
                pattern=r"eval\(",
                replacement="// SECURITY: eval() removed - ",
                explanation="Removed dangerous eval() function"
            )
        
        if "xss" in error.message.lower():
            return Fix(
                action=FixAction.REPLACE,
                pattern=r"innerHTML\s*=",
                replacement="textContent =",
                explanation="Use textContent instead of innerHTML to prevent XSS"
            )
        
        return Fix(
            action=FixAction.COMMENT,
            line=error.line,
            comment=f"// SECURITY: {error.message}",
            explanation="Added security warning comment"
        )
    
    def _generate_performance_fix(self, error: CodeError, code: str) -> Fix:
        """Generate performance-related fixes"""
        if "loop" in error.message.lower():
            return Fix(
                action=FixAction.SUGGEST,
                suggestion="Consider using Array.map() or Array.filter() for better performance",
                explanation="Functional array methods are often more performant"
            )
        
        if "memory" in error.message.lower():
            return Fix(
                action=FixAction.SUGGEST,
                suggestion="Consider implementing object pooling or lazy loading",
                explanation="Optimize memory usage"
            )
        
        return Fix(
            action=FixAction.COMMENT,
            line=error.line,
            comment=f"// PERFORMANCE: {error.message}",
            explanation="Added performance comment for optimization"
        )
    
    def _generate_generic_fix(self, error: CodeError, code: str) -> Fix:
        """Generate generic fixes for unknown error types"""
        return Fix(
            action=FixAction.COMMENT,
            line=error.line,
            comment=f"// REVIEW: {error.message}",
            explanation="Added review comment for manual inspection"
        )
    
    async def apply_fixes(self, code: str, fixes: List[GeneratedFix]) -> str:
        """Apply generated fixes to code"""
        fixed_code = code
        
        # Sort fixes by line number in reverse order to avoid line number shifts
        sorted_fixes = sorted(fixes, key=lambda f: f.fix.line or 0, reverse=True)
        
        for fix in sorted_fixes:
            if fix.fix.action == FixAction.REPLACE:
                if fix.fix.pattern and fix.fix.replacement:
                    try:
                        fixed_code = re.sub(fix.fix.pattern, fix.fix.replacement, fixed_code)
                    except re.error as e:
                        logger.warning(f"Regex error in fix: {e}")
            
            elif fix.fix.action == FixAction.COMMENT:
                if fix.fix.line and fix.fix.comment:
                    lines = fixed_code.split('\n')
                    if fix.fix.line <= len(lines):
                        lines.insert(fix.fix.line - 1, fix.fix.comment)
                        fixed_code = '\n'.join(lines)
            
            elif fix.fix.action == FixAction.SUGGEST:
                # For suggestions, we just log them
                logger.info(f"Suggestion for {fix.description}: {fix.fix.suggestion}")
        
        return fixed_code
    
    async def run_tests(self, file_path: str, code: str) -> Dict[str, Any]:
        """Run mock tests on the code"""
        mock_tests = [
            {"name": "Syntax validation", "passed": True},
            {"name": "Type checking", "passed": True},
            {"name": "Linting rules", "passed": True},
            {"name": "Security scan", "passed": True},
            {"name": "Performance check", "passed": True}
        ]
        
        # Simulate some test failures based on code content
        has_todos = "TODO:" in code or "FIXME:" in code
        has_security_issues = "SECURITY:" in code or "eval(" in code
        has_style_issues = "STYLE:" in code
        
        if has_todos:
            mock_tests[2]["passed"] = False  # Linting would fail
        if has_security_issues:
            mock_tests[3]["passed"] = False  # Security scan would fail
        if has_style_issues:
            mock_tests[2]["passed"] = False  # Linting would fail
        
        passed_count = sum(1 for test in mock_tests if test["passed"])
        
        return {
            "total": len(mock_tests),
            "passed": passed_count,
            "failed": len(mock_tests) - passed_count,
            "tests": mock_tests,
            "success": passed_count == len(mock_tests)
        }
    
    async def create_pull_request(self, file_path: str, fixed_code: str, fixes: List[GeneratedFix]) -> str:
        """Create a mock pull request"""
        import random
        
        mock_pr_url = f"https://github.com/user/repo/pull/{random.randint(1, 1000)}"
        
        logger.info(f"Would create PR for {file_path} with {len(fixes)} fixes")
        logger.info(f"Mock PR URL: {mock_pr_url}")
        
        # In a real implementation, this would:
        # 1. Create a new branch
        # 2. Commit the fixed code
        # 3. Create pull request
        # 4. Add reviewers
        # 5. Set labels and description
        
        return mock_pr_url

# Global service instance
code_fix_service = CodeFixService()
