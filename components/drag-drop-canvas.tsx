"use client"

import React, { useCallback, useEffect, useState, useRef, useMemo } from "react"
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react"
import { motion, AnimatePresence } from "framer-motion"
import "@xyflow/react/dist/style.css"
import { ModuleNode } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Folder, 
  File, 
  GitBranch, 
  Upload,
  Maximize2,
  Eye,
  Code2
} from "lucide-react"

interface DragDropCanvasProps {
  selectedRepo?: {
    name: string
    branch: string
    status: string
  } | null
  onFileSelect?: (fileId: string, filePath: string, preview?: boolean) => void
  onFileUpload?: (files: FileList) => void
  onFileContextMenu?: (fileId: string, x: number, y: number) => void
}

interface DraggableNodeData {
  label: string;
  filePath: string;
  type: 'file' | 'directory';
  language?: string;
  size?: number;
}

// Enhanced node types with drag and drop capabilities
const DraggableFileNode = React.memo(({ data, selected }: { data: DraggableNodeData, selected: boolean }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer min-w-[120px] ${
        data.type === 'directory' 
          ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/50' 
          : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600/50'
      } ${selected ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-400/20' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)"
      }}
      whileTap={{ scale: 0.95 }}
      animate={{
        borderColor: isHovered ? '#3b82f6' : selected ? '#60a5fa' : '#6b7280',
        boxShadow: isHovered 
          ? "0 0 20px rgba(59, 130, 246, 0.4)" 
          : selected 
            ? "0 0 15px rgba(96, 165, 250, 0.3)" 
            : "none"
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {data.type === 'directory' ? (
          <Folder className="h-4 w-4 text-blue-400" />
        ) : (
          <File className="h-4 w-4 text-gray-300" />
        )}
        <span className="text-sm font-medium text-white truncate">
          {data.label}
        </span>
      </div>
      
      {data.type === 'file' && (
        <div className="flex items-center gap-1">
          <Badge className="text-xs bg-gray-600/30 text-gray-300">
            {data.language || 'text'}
          </Badge>
          {data.size && (
            <Badge className="text-xs bg-gray-600/30 text-gray-300">
              {formatFileSize(data.size)}
            </Badge>
          )}
        </div>
      )}

      {/* Hover actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-1 right-1 flex gap-1"
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation()
                // Handle preview
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            {data.type === 'file' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle edit
                }}
              >
                <Code2 className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

DraggableFileNode.displayName = 'DraggableFileNode'

// Custom node types
const nodeTypes = {
  fileNode: DraggableFileNode,
}

// Structured module mapping with enhanced data
const moduleNodes: ModuleNode[] = [
  {
    id: "1",
    label: "App.tsx",
    filePath: "App.tsx",
    type: "file",
    language: "typescript",
    size: 1024
  },
  {
    id: "2",
    label: "components/",
    filePath: "components",
    type: "directory",
    size: 0
  },
  {
    id: "3",
    label: "utils/",
    filePath: "utils",
    type: "directory",
    size: 0
  },
  {
    id: "4",
    label: "Header.tsx",
    filePath: "components/Header.tsx",
    type: "file",
    language: "typescript",
    size: 2048
  },
  {
    id: "5",
    label: "Footer.tsx",
    filePath: "components/Footer.tsx",
    type: "file",
    language: "typescript",
    size: 1536
  }
]

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
}

const generateNodes = (repoName: string, modules: ModuleNode[]): Node[] => {
  const positions = [
    { x: 100, y: 100 },
    { x: 300, y: 100 },
    { x: 500, y: 100 },
    { x: 200, y: 250 },
    { x: 400, y: 250 }
  ]

  return modules.map((module, index) => ({
    id: module.id,
    type: 'fileNode',
    position: positions[index] || { x: 100 + (index * 150), y: 100 + Math.floor(index / 3) * 150 },
    data: { 
      label: module.label,
      filePath: module.filePath,
      type: module.type,
      language: module.language,
      size: module.size
    },
    draggable: true,
    selectable: true,
  }))
}

const initialEdges: Edge[] = [
  { 
    id: "e1-2", 
    source: "1", 
    target: "2", 
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 }
  },
  { 
    id: "e1-3", 
    source: "1", 
    target: "3", 
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 }
  },
  { 
    id: "e2-4", 
    source: "2", 
    target: "4", 
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 }
  },
  { 
    id: "e2-5", 
    source: "2", 
    target: "5", 
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 }
  },
]

export default function DragDropCanvas({ 
  selectedRepo, 
  onFileSelect, 
  onFileUpload 
}: DragDropCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(generateNodes(selectedRepo?.name || 'Project', moduleNodes))
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Performance optimization: Memoize expensive calculations
  const memoizedNodes = useMemo(() => nodes, [nodes])
  const memoizedEdges = useMemo(() => edges, [edges])

  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    }
    setEdges((eds) => addEdge(newEdge, eds))
  }, [setEdges])

  // Enhanced node selection with animations
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation()
    
    if (event.button === 2) { // Right click
      if (typeof onFileContextMenu === 'function') {
        onFileContextMenu(node.id, event.clientX, event.clientY)
      }
      return
    }

    if (event.shiftKey) {
      // Multi-select with shift
      setSelectedNodes(prev => 
        prev.includes(node.id) 
          ? prev.filter(id => id !== node.id)
          : [...prev, node.id]
      )
    } else {
      // Single select
      setSelectedNodes([node.id])
      
      // Animate selection
      setNodes((nodes) =>
        nodes.map((n) => ({
          ...n,
          selected: n.id === node.id,
        }))
      )
    }
  }, [setNodes])

  // Double click to open file
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (node.data?.type === 'file' && typeof onFileSelect === 'function' && typeof node.data.filePath === 'string') {
      const previewable = ['.tsx','.jsx','.html','.css'].some(ext => node.data.filePath.endsWith(ext))
      onFileSelect(node.id, node.data.filePath, previewable)
    }
  }, [onFileSelect])


  // Drag and drop file upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0 && onFileUpload) {
      onFileUpload(files)
    }
  }, [onFileUpload])

  // Performance optimization: Debounced node drag handler
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    // Add visual feedback during drag
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: n.id === node.id ? 0.8 : 1,
        },
      }))
    )
  }, [setNodes])

  const onNodeDragStop = useCallback((_event: React.MouseEvent, _node: Node) => {
    // Reset opacity after drag
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
        },
      }))
    )
  }, [setNodes])

  // Update nodes when repo changes
  useEffect(() => {
    setNodes(generateNodes(selectedRepo?.name || 'Project', moduleNodes))
  }, [selectedRepo?.name, setNodes])

  return (
    <div 
      className="w-full h-full bg-gray-900 relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      ref={canvasRef}
    >
      {/* Enhanced Header */}
      <motion.div 
        className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-400" />
              {selectedRepo?.name || 'Project'} - {selectedRepo?.branch || 'main'}
            </h2>
            <Badge className="bg-green-600/20 text-green-400">
              {selectedNodes.length.toString()} selected
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle preview
                  if (node.data?.type === 'file' && typeof onFileSelect === 'function') {
                    onFileSelect(node.id, node.data.filePath + '?preview=true')
                  }
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation()
                  if (node.data?.type === 'file' && typeof onFileSelect === 'function') {
                    onFileSelect(node.id, node.data.filePath, true)
                  }
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation()
                  if (node.data?.type === 'file' && typeof onFileSelect === 'function') {
                    onFileSelect(node.id, node.data.filePath)
                  }
                }}
              >
                <Code2 className="h-3 w-3" />
              </Button>


          </div>
        </div>
        
        <p className="text-sm text-gray-400 mt-2">
          Drag files to organize • Shift+click for multi-select • Double-click to open • Drop files to upload
        </p>
      </motion.div>

      {/* Main Canvas */}
      <div className="h-full relative">
        <ReactFlow
          nodes={memoizedNodes}
          edges={memoizedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          className="bg-gray-900"
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
        >
          <Controls 
            className="bg-gray-800/90 border-gray-600 backdrop-blur-sm" 
            showInteractive={false}
          />
          <MiniMap 
            className="bg-gray-800/90 backdrop-blur-sm" 
            nodeColor="#3b82f6" 
            maskColor="rgba(0, 0, 0, 0.2)"
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#374151" 
          />
        </ReactFlow>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500/10 border-4 border-blue-400 border-dashed rounded-lg flex items-center justify-center z-50"
            >
              <div className="text-center">
                <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-blue-400">Drop files to upload</p>
                <p className="text-sm text-gray-400">Supports individual files and folders</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
