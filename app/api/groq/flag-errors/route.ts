import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { ErrorFlag } from '@/types'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock-key'
})

export async function POST(request: NextRequest) {
  try {
    const { code, filePath } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // For development, return mock error flags
    if (!process.env.GROQ_API_KEY) {
      const mockFlags: ErrorFlag[] = [
        {
          line: 15,
          column: 10,
          severity: 'warning',
          message: 'Consider using optional chaining for safer property access',
          type: 'style',
          suggestion: 'Use onMenuClick?.() instead of onMenuClick && onMenuClick()'
        },
        {
          line: 8,
          severity: 'info',
          message: 'Interface could be exported for reusability',
          type: 'style',
          suggestion: 'Export HeaderProps interface for use in other components'
        }
      ]
      
      return NextResponse.json({ flags: mockFlags })
    }

    // Real Groq API call
    const prompt = `Analyze the following ${getLanguageFromPath(filePath)} code for potential issues:

${code}

Please identify:
1. Bugs or logical errors
2. Security vulnerabilities
3. Performance issues
4. Code style improvements
5. Best practice violations

Return a JSON array of issues with this structure:
{
  "line": number,
  "column": number (optional),
  "severity": "error" | "warning" | "info",
  "message": "description of the issue",
  "type": "bug" | "security" | "performance" | "style",
  "suggestion": "how to fix it"
}

Focus on actionable feedback. Only return the JSON array, no other text.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert code reviewer. Analyze code and return only a JSON array of issues found."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 2048
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      return NextResponse.json({ flags: [] })
    }

    try {
      const flags = JSON.parse(response) as ErrorFlag[]
      return NextResponse.json({ flags })
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError)
      return NextResponse.json({ flags: [] })
    }

  } catch (error) {
    console.error('Error flagging errors:', error)
    return NextResponse.json({ error: 'Failed to flag errors' }, { status: 500 })
  }
}

function getLanguageFromPath(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()
  
  const languageMap: Record<string, string> = {
    'ts': 'TypeScript',
    'tsx': 'TypeScript React',
    'js': 'JavaScript',
    'jsx': 'JavaScript React',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'swift': 'Swift'
  }
  
  return languageMap[extension || ''] || 'code'
}
