"use client"

import React, { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  File, 
  Folder, 
  X, 
  Check, 
  AlertCircle,
  FileText,
  Image,
  Code,
  Archive
} from "lucide-react"
import { useDragDrop } from "@/hooks/use-drag-drop"

interface FileUploadZoneProps {
  onFileUpload?: (files: FileList) => void
  onProjectUpload?: (files: FileList) => void
  acceptedTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  className?: string
}

interface UploadedFile {
  file: File
  id: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image className="h-4 w-4" />
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'html':
    case 'css':
    case 'scss':
    case 'json':
      return <Code className="h-4 w-4" />
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
      return <Archive className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function FileUploadZone({
  onFileUpload,
  onProjectUpload,
  acceptedTypes = [],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 20,
  className = ""
}: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true)
    
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading' as const,
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Simulate upload progress
    for (const uploadFile of newFiles) {
      try {
        // Simulate upload with progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, progress }
                : f
            )
          )
        }

        // Mark as success
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        )
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { 
                  ...f, 
                  status: 'error' as const, 
                  error: 'Upload failed' 
                }
              : f
          )
        )
      }
    }

    setIsUploading(false)
    onFileUpload?.(files)
  }, [onFileUpload])

  const { dragState, getDropZoneProps } = useDragDrop({
    onFileUpload: handleFileUpload,
    acceptedFileTypes: acceptedTypes,
    maxFileSize,
    maxFiles
  })

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
    // Reset input
    e.target.value = ''
  }, [handleFileUpload])

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const clearAll = useCallback(() => {
    setUploadedFiles([])
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Upload Zone */}
      <motion.div
        {...getDropZoneProps('main')}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
          ${dragState.isDragging 
            ? 'border-blue-400 bg-blue-500/10 scale-105' 
            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence>
          {dragState.isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity }
                }}
                className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              >
                <Upload className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-2">
                  Drop files here
                </h3>
                <p className="text-gray-400">
                  Release to upload your files
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Upload Files or Project
                </h3>
                <p className="text-gray-400 mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => document.getElementById('file-input')?.click()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <File className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                  <Button
                    onClick={() => document.getElementById('folder-input')?.click()}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Upload Folder
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept={acceptedTypes.length > 0 ? acceptedTypes.map(t => `.${t}`).join(',') : undefined}
        />
        <input
          id="folder-input"
          type="file"
          multiple
          {...({ webkitdirectory: "" } as any)}
          className="hidden"
          onChange={handleFileInput}
        />

        {/* Upload constraints */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex flex-wrap gap-1 justify-center">
            <Badge variant="outline" className="text-xs text-gray-500">
              Max {formatFileSize(maxFileSize)}
            </Badge>
            <Badge variant="outline" className="text-xs text-gray-500">
              Up to {maxFiles} files
            </Badge>
            {acceptedTypes.length > 0 && (
              <Badge variant="outline" className="text-xs text-gray-500">
                {acceptedTypes.join(', ')}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">
                Uploaded Files ({uploadedFiles.length})
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAll}
                className="text-gray-400 hover:text-white"
              >
                Clear All
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadedFiles.map((uploadFile) => (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="text-gray-400">
                    {getFileIcon(uploadFile.file.name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        {uploadFile.file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {formatFileSize(uploadFile.file.size)}
                        </span>
                        {uploadFile.status === 'success' && (
                          <Check className="h-4 w-4 text-green-400" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(uploadFile.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {uploadFile.status === 'uploading' && (
                      <Progress 
                        value={uploadFile.progress} 
                        className="h-1"
                      />
                    )}
                    
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-red-400">
                        {uploadFile.error}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
