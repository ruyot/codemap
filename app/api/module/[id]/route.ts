import { NextRequest, NextResponse } from 'next/server'
import { ModuleNode } from '@/types'

// Mock module data - replace with actual database/GitHub API calls
const mockModules: Record<string, ModuleNode> = {
  '1': {
    id: '1',
    label: 'App.tsx',
    filePath: 'App.tsx',
    type: 'file',
    language: 'typescript',
    size: 1024
  },
  '2': {
    id: '2',
    label: 'components/',
    filePath: 'components',
    type: 'directory',
    size: 0
  },
  '3': {
    id: '3',
    label: 'utils/',
    filePath: 'utils',
    type: 'directory',
    size: 0
  },
  '4': {
    id: '4',
    label: 'Header.tsx',
    filePath: 'components/Header.tsx',
    type: 'file',
    language: 'typescript',
    size: 2048
  },
  '5': {
    id: '5',
    label: 'Footer.tsx',
    filePath: 'components/Footer.tsx',
    type: 'file',
    language: 'typescript',
    size: 1536
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params
    
    const module = mockModules[moduleId]
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    return NextResponse.json(module)

  } catch (error) {
    console.error('Error fetching module:', error)
    return NextResponse.json({ error: 'Failed to fetch module' }, { status: 500 })
  }
}
