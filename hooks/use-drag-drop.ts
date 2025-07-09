"use client"

import { useCallback, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export interface DragDropOptions {
  onFileUpload?: (files: FileList) => void
  onFileDrop?: (files: FileList, position?: { x: number; y: number }) => void
  onNodeDrag?: (nodeId: string, position: { x: number; y: number }) => void
  onNodeDrop?: (nodeId: string, targetId?: string, position?: { x: number; y: number }) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number // in bytes
  maxFiles?: number
}

export interface DragState {
  isDragging: boolean
  draggedItem: any
  draggedType: 'file' | 'node' | null
  dropZone: string | null
  dragPosition: { x: number; y: number } | null
}

export function useDragDrop(options: DragDropOptions = {}) {
  const { toast } = useToast()
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    draggedType: null,
    dropZone: null,
    dragPosition: null
  })

  const dragCounter = useRef(0)
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null)

  // File validation
  const validateFiles = useCallback((files: FileList): boolean => {
    const { acceptedFileTypes, maxFileSize = 10 * 1024 * 1024, maxFiles = 10 } = options

    if (files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      })
      return false
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (maxFileSize && file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`,
          variant: "destructive"
        })
        return false
      }

      if (acceptedFileTypes && acceptedFileTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        if (!fileExtension || !acceptedFileTypes.includes(fileExtension)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an accepted file type`,
            variant: "destructive"
          })
          return false
        }
      }
    }

    return true
  }, [options, toast])

  // File drag handlers
  const handleFileDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current++
    
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        draggedType: 'file'
      }))
    }
  }, [])

  const handleFileDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current--
    
    if (dragCounter.current === 0) {
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        draggedType: null
      }))
    }
  }, [])

  const handleFileDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragState(prev => ({
      ...prev,
      dragPosition: { x: e.clientX, y: e.clientY }
    }))
  }, [])

  const handleFileDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounter.current = 0
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedType: null,
      dragPosition: null
    }))

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      if (validateFiles(files)) {
        const position = { x: e.clientX, y: e.clientY }
        options.onFileDrop?.(files, position)
        options.onFileUpload?.(files)
        
        toast({
          title: "Files uploaded",
          description: `Successfully uploaded ${files.length} file(s)`,
        })
      }
    }
  }, [options, validateFiles, toast])

  // Node drag handlers
  const handleNodeDragStart = useCallback((nodeId: string, nodeData: any, e: React.MouseEvent) => {
    dragStartPosition.current = { x: e.clientX, y: e.clientY }
    
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedItem: { id: nodeId, data: nodeData },
      draggedType: 'node',
      dragPosition: { x: e.clientX, y: e.clientY }
    }))

    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.7'
      e.currentTarget.style.transform = 'scale(1.05)'
    }
  }, [])

  const handleNodeDrag = useCallback((nodeId: string, e: React.MouseEvent) => {
    setDragState(prev => ({
      ...prev,
      dragPosition: { x: e.clientX, y: e.clientY }
    }))

    options.onNodeDrag?.(nodeId, { x: e.clientX, y: e.clientY })
  }, [options])

  const handleNodeDragEnd = useCallback((nodeId: string, targetId?: string, e?: React.MouseEvent) => {
    const position = e ? { x: e.clientX, y: e.clientY } : null
    
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedItem: null,
      draggedType: null,
      dragPosition: null
    }))

    // Reset visual feedback
    if (e?.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
      e.currentTarget.style.transform = 'scale(1)'
    }

    options.onNodeDrop?.(nodeId, targetId, position || undefined)
  }, [options])

  // Drop zone handlers
  const handleDropZoneEnter = useCallback((zoneId: string) => {
    setDragState(prev => ({
      ...prev,
      dropZone: zoneId
    }))
  }, [])

  const handleDropZoneLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dropZone: null
    }))
  }, [])

  // Utility functions
  const isDraggedOver = useCallback((zoneId: string) => {
    return dragState.dropZone === zoneId
  }, [dragState.dropZone])

  const isNodeBeingDragged = useCallback((nodeId: string) => {
    return dragState.draggedItem?.id === nodeId && dragState.draggedType === 'node'
  }, [dragState])

  const getDropZoneProps = useCallback((zoneId: string) => ({
    onDragEnter: () => handleDropZoneEnter(zoneId),
    onDragLeave: handleDropZoneLeave,
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleFileDrop(e.nativeEvent)
    },
    className: isDraggedOver(zoneId) ? 'drag-over' : ''
  }), [handleDropZoneEnter, handleDropZoneLeave, handleFileDrop, isDraggedOver])

  const getDraggableProps = useCallback((nodeId: string, nodeData: any) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      handleNodeDragStart(nodeId, nodeData, e as any)
    },
    onDrag: (e: React.DragEvent) => {
      handleNodeDrag(nodeId, e as any)
    },
    onDragEnd: (e: React.DragEvent) => {
      handleNodeDragEnd(nodeId, undefined, e as any)
    },
    className: isNodeBeingDragged(nodeId) ? 'dragging' : ''
  }), [handleNodeDragStart, handleNodeDrag, handleNodeDragEnd, isNodeBeingDragged])

  // Setup global file drag listeners
  const setupGlobalDragListeners = useCallback((element: HTMLElement) => {
    element.addEventListener('dragenter', handleFileDragEnter)
    element.addEventListener('dragleave', handleFileDragLeave)
    element.addEventListener('dragover', handleFileDragOver)
    element.addEventListener('drop', handleFileDrop)

    return () => {
      element.removeEventListener('dragenter', handleFileDragEnter)
      element.removeEventListener('dragleave', handleFileDragLeave)
      element.removeEventListener('dragover', handleFileDragOver)
      element.removeEventListener('drop', handleFileDrop)
    }
  }, [handleFileDragEnter, handleFileDragLeave, handleFileDragOver, handleFileDrop])

  return {
    dragState,
    isDraggedOver,
    isNodeBeingDragged,
    getDropZoneProps,
    getDraggableProps,
    setupGlobalDragListeners,
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragEnd,
    handleDropZoneEnter,
    handleDropZoneLeave
  }
}

export default useDragDrop
