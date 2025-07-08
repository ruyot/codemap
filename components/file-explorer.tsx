"use client"

import React, { useState, useEffect } from 'react'
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal,
  Download,
  Upload,
  Trash2,
  Edit3,
  Copy,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  content?: string
  language?: string
  size?: number
  children?: FileNode[]
  isExpanded?: boolean
}

interface FileExplorerProps {
  files: FileNode[]
  onFileSelect: (file: FileNode) => void
  onFileCreate: (name: string, type: 'file' | 'directory', parentPath?: string) => void
  onFileDelete: (fileId: string) => void
  onFileRename: (fileId: string, newName: string) => void
  onFileUpload: (files: FileList) => void
  onFileDownload: (file: FileNode) => void
  selectedFileId?: string
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileUpload,
  onFileDownload,
  selectedFileId
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [renamingFile, setRenamingFile] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'directory') {
      toggleFolder(file.id)
    } else {
      onFileSelect(file)
    }
  }

  const handleRename = (fileId: string, currentName: string) => {
    setRenamingFile(fileId)
    setNewFileName(currentName)
  }

  const confirmRename = () => {
    if (renamingFile && newFileName.trim()) {
      onFileRename(renamingFile, newFileName.trim())
      setRenamingFile(null)
      setNewFileName('')
    }
  }

  const cancelRename = () => {
    setRenamingFile(null)
    setNewFileName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmRename()
    } else if (e.key === 'Escape') {
      cancelRename()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileUpload(files)
    }
  }

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return expandedFolders.has(file.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'tsx':
      case 'ts':
        return <File className="h-4 w-4 text-blue-400" />
      case 'jsx':
      case 'js':
        return <File className="h-4 w-4 text-yellow-400" />
      case 'css':
      case 'scss':
        return <File className="h-4 w-4 text-pink-400" />
      case 'json':
        return <File className="h-4 w-4 text-green-400" />
      case 'md':
        return <File className="h-4 w-4 text-gray-400" />
      default:
        return <File className="h-4 w-4 text-gray-300" />
    }
  }

  const renderFileNode = (file: FileNode, depth = 0) => {
    const isSelected = selectedFileId === file.id
    const isExpanded = expandedFolders.has(file.id)

    return (
      <div key={file.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-700/50 cursor-pointer group ${
            isSelected ? 'bg-blue-600/20 border-r-2 border-blue-400' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(file)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {getFileIcon(file)}
          
          {renamingFile === file.id ? (
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={confirmRename}
              className="h-6 text-sm bg-gray-700 border-gray-600"
              autoFocus
            />
          ) : (
            <span className="text-sm truncate flex-1">{file.name}</span>
          )}
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => onFileDownload(file)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRename(file.id, file.name)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(file.path)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Path
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onFileDelete(file.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {file.type === 'directory' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">EXPLORER</h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onFileCreate('', 'file')}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onFileCreate('', 'directory')}
            >
              <Folder className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded p-2 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-400 bg-blue-400/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-4 w-4 mx-auto mb-1 text-gray-400" />
          <p className="text-xs text-gray-400">Drop files here</p>
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {files.map(file => renderFileNode(file))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default FileExplorer 