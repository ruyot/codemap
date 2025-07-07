import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'uploads')
    const projectId = `project_${Date.now()}`
    const projectDir = join(uploadDir, projectId)

    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Create project directory
    await mkdir(projectDir, { recursive: true })

    const uploadedFiles = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Create subdirectories if needed (for folder uploads)
      const relativePath = file.webkitRelativePath || file.name
      const filePath = join(projectDir, relativePath)
      const fileDir = join(filePath, '..')
      
      if (!existsSync(fileDir)) {
        await mkdir(fileDir, { recursive: true })
      }

      await writeFile(filePath, buffer)
      
      uploadedFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        path: relativePath,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      })
    }

    // Generate project structure
    const projectStructure = generateProjectStructure(uploadedFiles)

    return NextResponse.json({
      projectId,
      files: uploadedFiles,
      structure: projectStructure,
      message: `Successfully uploaded ${files.length} files`
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' }, 
      { status: 500 }
    )
  }
}

function generateProjectStructure(files: any[]) {
  const structure: any = {
    type: 'directory',
    name: 'root',
    children: []
  }

  files.forEach(file => {
    const pathParts = file.path.split('/')
    let current = structure

    pathParts.forEach((part: string, index: number) => {
      if (index === pathParts.length - 1) {
        // This is a file
        current.children.push({
          type: 'file',
          name: part,
          path: file.path,
          size: file.size,
          id: file.id,
          language: getLanguageFromExtension(part)
        })
      } else {
        // This is a directory
        let existing = current.children.find((child: any) => 
          child.name === part && child.type === 'directory'
        )
        
        if (!existing) {
          existing = {
            type: 'directory',
            name: part,
            children: []
          }
          current.children.push(existing)
        }
        
        current = existing
      }
    })
  })

  return structure
}

function getLanguageFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  
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
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell'
  }
  
  return languageMap[extension || ''] || 'plaintext'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Return project info (this would typically come from a database)
    return NextResponse.json({
      projectId,
      name: `Project ${projectId}`,
      createdAt: new Date(),
      fileCount: 0,
      status: 'active'
    })

  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json(
      { error: 'Failed to get project' }, 
      { status: 500 }
    )
  }
}
