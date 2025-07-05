import { NextRequest, NextResponse } from 'next/server'
import { ErrorFlag, BlackboxResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { filePath, code, errors } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // For development, return mock fix suggestions
    if (!process.env.BLACKBOX_API_KEY) {
      const mockResponse: BlackboxResponse = {
        suggestions: [
          'Use optional chaining for safer property access',
          'Export interfaces for better reusability',
          'Add error boundaries for better error handling'
        ],
        diff: generateMockDiff(code),
        explanation: 'Applied optional chaining and exported the interface for better code quality and reusability.'
      }
      
      return NextResponse.json({ 
        fixedCode: applyMockFixes(code),
        ...mockResponse 
      })
    }

    // Real Blackbox API call would go here
    // const response = await fetch('https://api.blackbox.ai/suggest-fix', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.BLACKBOX_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     filePath,
    //     code,
    //     errors
    //   })
    // })

    return NextResponse.json({ 
      fixedCode: applyMockFixes(code),
      suggestions: ['Mock fix applied'],
      explanation: 'This is a mock fix for development purposes.'
    })

  } catch (error) {
    console.error('Error getting fix suggestions:', error)
    return NextResponse.json({ error: 'Failed to get fix suggestions' }, { status: 500 })
  }
}

function generateMockDiff(code: string): string {
  return `--- a/components/Header.tsx
+++ b/components/Header.tsx
@@ -12,7 +12,7 @@
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between items-center py-6">
           <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
-          {onMenuClick && (
+          {onMenuClick?.() && (
             <Button onClick={onMenuClick} variant="outline">
               Menu
             </Button>`
}

function applyMockFixes(code: string): string {
  // Apply some basic fixes for demonstration
  let fixedCode = code
  
  // Fix optional chaining
  fixedCode = fixedCode.replace(
    /onMenuClick && /g,
    'onMenuClick?.() && '
  )
  
  // Export interface if not already exported
  if (fixedCode.includes('interface ') && !fixedCode.includes('export interface ')) {
    fixedCode = fixedCode.replace(
      /interface /g,
      'export interface '
    )
  }
  
  return fixedCode
}
