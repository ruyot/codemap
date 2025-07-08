import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fileName, content, projectId, userId } = await request.json()
    
    if (!fileName || !content) {
      return NextResponse.json({ error: 'File name and content are required' }, { status: 400 })
    }

    // Create file object
    const newFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: fileName,
      content: content,
      type: fileName.split('.').pop() || 'text',
      size: content.length,
      lastModified: new Date().toISOString(),
      projectId: projectId || 'default',
      userId: userId || 'anonymous'
    }

    // Store in localStorage (client-side will handle this)
    // For now, just return the file object
    return NextResponse.json({ 
      success: true, 
      file: newFile,
      message: `File ${fileName} created successfully!`
    })

  } catch (error) {
    console.error('Error creating file:', error)
    return NextResponse.json({ error: 'Failed to create file' }, { status: 500 })
  }
}
