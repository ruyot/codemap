import { supabase } from './supabaseClient'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  content?: string
  language?: string
  size?: number
  children?: FileNode[]
  isExpanded?: boolean
  lastModified?: Date
  createdAt?: Date
}

interface SupabaseFile {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content: string;
  language: string;
  project_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export class FileManager {
  private files: FileNode[] = []
  private projectId: string

  constructor(projectId: string) {
    this.projectId = projectId
    this.loadFiles()
  }

  // Load files from database
  async loadFiles() {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', this.projectId)
        .order('created_at', { ascending: true })

      if (error) throw error

      this.files = this.buildFileTree(data as SupabaseFile[] || [])
    } catch (error) {
      console.error('Error loading files:', error)
      // Initialize with default files if loading fails
      this.files = this.getDefaultFiles()
    }
  }

  // Build hierarchical file tree from flat array
  private buildFileTree(files: SupabaseFile[]): FileNode[] {
    const fileMap = new Map<string, FileNode>()
    const rootFiles: FileNode[] = []

    // Create file nodes
    files.forEach(file => {
      const fileNode: FileNode = {
        id: file.id,
        name: file.name,
        type: file.type,
        path: file.path,
        content: file.content,
        language: file.language,
        size: file.content?.length || 0,
        children: [],
        lastModified: new Date(file.updated_at),
        createdAt: new Date(file.created_at)
      }
      fileMap.set(file.id, fileNode)
    })

    // Build hierarchy
    files.forEach(file => {
      const fileNode = fileMap.get(file.id)!
      if (file.parent_id) {
        const parent = fileMap.get(file.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(fileNode)
        }
      } else {
        rootFiles.push(fileNode)
      }
    })

    return rootFiles
  }

  // Get default files for new projects
  private getDefaultFiles(): FileNode[] {
    return []
  }

  // Create a new file
  async createFile(name: string, type: 'file' | 'directory', content: string = '', parentPath?: string): Promise<FileNode> {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const path = parentPath ? `${parentPath}/${name}` : name
    const language = this.getLanguageFromName(name)

    const newFile: FileNode = {
      id,
      name,
      type,
      path,
      content: type === 'file' ? content : undefined,
      language: type === 'file' ? language : undefined,
      size: type === 'file' ? content.length : 0,
      children: type === 'directory' ? [] : undefined,
      lastModified: new Date(),
      createdAt: new Date()
    }

    try {
      // Save to database
      const { error } = await supabase
        .from('files')
        .insert({
          id: newFile.id,
          name: newFile.name,
          type: newFile.type,
          path: newFile.path,
          content: newFile.content,
          language: newFile.language,
          project_id: this.projectId,
          parent_id: parentPath ? this.findFileByPath(parentPath)?.id : null
        })

      if (error) throw error

      // Add to local state
      if (parentPath) {
        const parent = this.findFileByPath(parentPath)
        if (parent && parent.children) {
          parent.children.push(newFile)
        }
      } else {
        this.files.push(newFile)
      }

      return newFile
    } catch (error) {
      console.error('Error creating file:', error)
      throw error
    }
  }

  // Save file content
  async saveFile(fileId: string, content: string): Promise<void> {
    try {
      const file = this.findFileById(fileId)
      if (!file || file.type !== 'file') {
        throw new Error('File not found or not a file')
      }

      file.content = content
      file.size = content.length
      file.lastModified = new Date()

      // Update database
      const { error } = await supabase
        .from('files')
        .update({
          content: content,
          size: content.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId)

      if (error) throw error
    } catch (error) {
      console.error('Error saving file:', error)
      throw error
    }
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    try {
      const file = this.findFileById(fileId)
      if (!file) throw new Error('File not found')

      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      // Remove from local state
      this.removeFileFromTree(fileId)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  // Rename file
  async renameFile(fileId: string, newName: string): Promise<void> {
    try {
      const file = this.findFileById(fileId)
      if (!file) throw new Error('File not found')

      const oldPath = file.path
      const newPath = file.path.replace(file.name, newName)

      file.name = newName
      file.path = newPath
      file.lastModified = new Date()

      // Update database
      const { error } = await supabase
        .from('files')
        .update({
          name: newName,
          path: newPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId)

      if (error) throw error
    } catch (error) {
      console.error('Error renaming file:', error)
      throw error
    }
  }

  // Upload files
  async uploadFiles(files: FileList): Promise<FileNode[]> {
    const uploadedFiles: FileNode[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const content = await this.readFileAsText(file)
      
      const newFile = await this.createFile(
        file.name,
        'file',
        content
      )
      
      uploadedFiles.push(newFile)
    }

    return uploadedFiles
  }

  // Download file
  downloadFile(file: FileNode): void {
    if (file.type !== 'file' || !file.content) {
      throw new Error('Cannot download directory or empty file')
    }

    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Helper methods
  private findFileById(fileId: string): FileNode | null {
    const findInTree = (files: FileNode[]): FileNode | null => {
      for (const file of files) {
        if (file.id === fileId) return file
        if (file.children) {
          const found = findInTree(file.children)
          if (found) return found
        }
      }
      return null
    }
    return findInTree(this.files)
  }

  private findFileByPath(path: string): FileNode | null {
    const findInTree = (files: FileNode[]): FileNode | null => {
      for (const file of files) {
        if (file.path === path) return file
        if (file.children) {
          const found = findInTree(file.children)
          if (found) return found
        }
      }
      return null
    }
    return findInTree(this.files)
  }

  private removeFileFromTree(fileId: string): void {
    const removeFromArray = (files: FileNode[]): boolean => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].id === fileId) {
          files.splice(i, 1)
          return true
        }
        if (files[i].children) {
          if (removeFromArray(files[i].children!)) {
            return true
          }
        }
      }
      return false
    }
    removeFromArray(this.files)
  }

  private getLanguageFromName(name: string): string {
    const extension = name.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'tsx':
      case 'ts':
        return 'typescript'
      case 'jsx':
      case 'js':
        return 'javascript'
      case 'css':
        return 'css'
      case 'scss':
        return 'scss'
      case 'json':
        return 'json'
      case 'md':
        return 'markdown'
      case 'html':
        return 'html'
      default:
        return 'text'
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // Get all files
  getFiles(): FileNode[] {
    return this.files
  }

  // Get file by ID
  getFile(fileId: string): FileNode | null {
    return this.findFileById(fileId)
  }
} 