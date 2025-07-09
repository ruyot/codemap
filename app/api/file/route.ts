import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

// Mock data for development - replace with actual GitHub API calls
const mockFiles: Record<string, string> = {
  'components/Header.tsx': `import React from 'react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {onMenuClick && (
            <Button onClick={onMenuClick} variant="outline">
              Menu
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}`,
  'components/Footer.tsx': `import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © 2024 Code Map. All rights reserved.
        </p>
      </div>
    </footer>
  )
}`,
  'App.tsx': `import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Code Map" />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h2>Welcome to Code Map</h2>
          <p>The world's first UX/UI-first IDE</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // For development, return mock data
    const content = mockFiles[filePath]
    if (!content) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      content,
      filePath,
      size: content.length,
      language: getLanguageFromPath(filePath)
    })

    // TODO: Replace with actual GitHub API call
    /*
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    })

    const response = await octokit.rest.repos.getContent({
      owner: 'owner',
      repo: 'repo',
      path: filePath,
    })

    if ('content' in response.data) {
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8')
      return NextResponse.json({ 
        content,
        filePath,
        size: response.data.size,
        language: getLanguageFromPath(filePath)
      })
    }
    */

  } catch (error) {
    console.error('Error fetching file:', error)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}

function getLanguageFromPath(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()
  
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell'
  }
  
  return languageMap[extension || ''] || 'plaintext'
}
