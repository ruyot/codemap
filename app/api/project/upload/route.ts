import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

interface UploadedFile {
  id: string;
  name: string;
  path: string;
  type: 'file';
  size: number;
  content: string;
}

interface DirectoryNode {
  type: 'directory';
  name: string;
  children: (FileNode | DirectoryNode)[];
}

interface FileNode {
  type: 'file';
  name: string;
  path: string;
  size: number;
  id: string;
  language: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({ name: 'Uploaded Project', user_id: 'user-1234' })
      .single()

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }

    const projectId = newProject.id

    const uploadedFiles: UploadedFile[] = []

    for (const file of files) {
      if (!(file instanceof File)) {
        continue
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const relativePath = file.name

      // Insert file record into Supabase
      const { data: insertedFile, error: fileError } = await supabase
        .from('files')
        .insert({
          project_id: projectId,
          name: file.name,
          type: 'file',
          path: relativePath,
          content: buffer.toString('base64'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .single()

      if (fileError) {
        console.error('Error inserting file:', fileError)
        continue
      }

      uploadedFiles.push({
        id: insertedFile.id,
        name: insertedFile.name,
        path: insertedFile.path,
        type: 'file',
        size: file.size,
        content: insertedFile.content
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

function generateProjectStructure(files: UploadedFile[]): DirectoryNode {
  const structure: DirectoryNode = {
    type: 'directory',
    name: 'root',
    children: []
  }

  files.forEach(file => {
    const pathParts = file.path.split('/')
    let current: DirectoryNode = structure

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
        let existing = current.children.find((child) => 
          child.name === part && child.type === 'directory'
        ) as DirectoryNode | undefined
        
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
