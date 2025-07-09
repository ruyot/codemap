import { NextRequest, NextResponse } from 'next/server'

// Mock Fetch.ai uAgent implementation
// In a real implementation, this would connect to the Fetch.ai network

interface RequestContext {
  filePath?: string;
  repo?: {
    name: string;
    branch: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message, thread } = await request.json()
    const { userRequest, context } = message.payload

    // For development, use rule-based prompt refinement
    const refinedPrompt = await refinePromptWithRules(userRequest, context)

    return NextResponse.json({
      prompt: refinedPrompt,
      confidence: 0.85,
      improvements: [
        'Added specific technical context',
        'Clarified user intent',
        'Included relevant constraints',
        'Optimized for AI model understanding'
      ],
      originalLength: userRequest.length,
      refinedLength: refinedPrompt.length
    })

  } catch (error) {
    console.error('Prompt refinement failed:', error)
    return NextResponse.json({ 
      error: 'Failed to refine prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function refinePromptWithRules(userRequest: string, context?: RequestContext): Promise<string> {
  let refined = userRequest.trim()

  // Rule 1: Add technical context if missing
  if (!refined.toLowerCase().includes('code') && !refined.toLowerCase().includes('function')) {
    if (context?.filePath) {
      refined = `For the ${context.filePath} file: ${refined}`
    } else {
      refined = `In the context of software development: ${refined}`
    }
  }

  // Rule 2: Clarify vague requests
  const vagueTerms = ['fix', 'improve', 'update', 'change', 'make better']
  for (const term of vagueTerms) {
    if (refined.toLowerCase().includes(term) && refined.length < 50) {
      refined = refined.replace(
        new RegExp(term, 'gi'), 
        `${term} (please specify what aspects need attention)`
      )
    }
  }

  // Rule 3: Add specific requirements for common tasks
  if (refined.toLowerCase().includes('refactor')) {
    refined += '. Focus on code readability, performance, and maintainability. Preserve existing functionality.'
  }

  if (refined.toLowerCase().includes('debug') || refined.toLowerCase().includes('error')) {
    refined += '. Identify the root cause, explain the issue, and provide a step-by-step solution.'
  }

  if (refined.toLowerCase().includes('optimize')) {
    refined += '. Consider performance, memory usage, and code efficiency. Measure impact where possible.'
  }

  // Rule 4: Add context about the codebase
  if (context?.repo) {
    refined += ` (Repository: ${context.repo.name}, Branch: ${context.repo.branch})`
  }

  // Rule 5: Ensure actionable language
  if (!refined.match(/\b(analyze|create|update|fix|refactor|optimize|implement|review)\b/i)) {
    refined = `Please analyze and ${refined}`
  }

  // Rule 6: Add constraints for safety
  refined += ' Ensure all changes maintain backward compatibility and follow best practices.'

  return refined
}

// Mock Fetch.ai uAgent handler
class PromptRefinementAgent {
  private agentId: string
  private capabilities: string[]

  constructor() {
    this.agentId = `prompt-agent-${Date.now()}`
    this.capabilities = [
      'natural_language_processing',
      'intent_classification', 
      'context_enhancement',
      'technical_specification'
    ]
  }

  async processRequest(request: string, context?: RequestContext): Promise<{
    refined: string
    confidence: number
    reasoning: string[]
  }> {
    // Simulate uAgent processing
    const reasoning: string[] = []
    let confidence = 0.7

    // Intent classification
    const intent = this.classifyIntent(request)
    reasoning.push(`Classified intent as: ${intent}`)
    confidence += 0.1

    // Context enhancement
    if (context) {
      reasoning.push('Enhanced with provided context')
      confidence += 0.05
    }

    // Technical specification
    const hasSpecifics = this.hasTechnicalSpecifics(request)
    if (!hasSpecifics) {
      reasoning.push('Added technical specifications')
      confidence += 0.1
    }

    const refined = await refinePromptWithRules(request, context)

    return {
      refined,
      confidence: Math.min(confidence, 0.95),
      reasoning
    }
  }

  private classifyIntent(request: string): string {
    const intents = {
      'debug': ['debug', 'error', 'bug', 'issue', 'problem'],
      'refactor': ['refactor', 'clean', 'restructure', 'reorganize'],
      'optimize': ['optimize', 'performance', 'speed', 'efficiency'],
      'implement': ['create', 'add', 'implement', 'build', 'develop'],
      'review': ['review', 'analyze', 'check', 'examine', 'assess']
    }

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => request.toLowerCase().includes(keyword))) {
        return intent
      }
    }

    return 'general'
  }

  private hasTechnicalSpecifics(request: string): boolean {
    const technicalTerms = [
      'function', 'class', 'component', 'module', 'api', 'database',
      'typescript', 'javascript', 'react', 'node', 'performance',
      'security', 'testing', 'deployment'
    ]

    return technicalTerms.some(term => 
      request.toLowerCase().includes(term)
    )
  }
}

// Export the agent instance for use in other parts of the system
export const promptAgent = new PromptRefinementAgent()
