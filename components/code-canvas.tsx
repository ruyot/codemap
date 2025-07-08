"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import "@xyflow/react/dist/style.css"
import { ModuleNode } from "@/types"

interface CodeCanvasProps {
  selectedRepo: {
    name: string
    branch: string
    status: string
  }
}

// Get user files from localStorage
const getUserFiles = () => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('uploadedFiles')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const generateNodes = (repoName: string, modules: ModuleNode[]): Node[] => {
  // Calculate center offset to center nodes horizontally
  const centerX = 450
  const centerY = 200
  const spacingX = 150
  const spacingY = 150

  return modules.map((module, index) => {
    const row = Math.floor(index / 3)
    const col = index % 3
    const x = centerX + col * spacingX - spacingX
    const y = centerY + row * spacingY - spacingY

    return {
      id: module.id,
      position: { x, y },
      data: { 
        label: `${repoName}/${module.label}`,
        filePath: module.filePath,
        type: module.type,
        language: module.language
      },
      style: { 
        background: module.type === 'directory' ? "#0066ff" : "#3b82f6", 
        color: "white", 
        border: "1px solid #1e40af",
        borderRadius: "8px",
        padding: "10px",
        minWidth: "120px",
        textAlign: "center"
      },
    }
  })
}

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
  { id: "e2-4", source: "2", target: "4", animated: true },
  { id: "e2-5", source: "2", target: "5", animated: true },
]

export default function CodeCanvas({ selectedRepo }: CodeCanvasProps) {
  const router = useRouter()
  const [userFiles, setUserFiles] = useState<any[]>([])
  
  // Initialize with empty arrays but proper typing
  const initialNodes: Node[] = []
  const initialEdges: Edge[] = []
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [mouseMode, setMouseMode] = useState<"selection" | "dragging">("selection")
  const [isWKeyPressed, setIsWKeyPressed] = useState(false)

  // Load user files and generate nodes
  useEffect(() => {
    const files = getUserFiles()
    setUserFiles(files)
    
    if (files.length > 0) {
      const fileNodes = files.map((file: any, index: number) => ({
        id: file.id,
        label: file.name,
        filePath: file.name,
        type: "file",
        language: file.type || "text",
        size: file.size || 0
      }))
      
      const generatedNodes = generateNodes(selectedRepo?.name || 'Project', fileNodes)
      setNodes(generatedNodes)
      
      // Generate simple edges connecting files (only if we have more than 1 file)
      if (fileNodes.length > 1) {
        const generatedEdges = fileNodes.slice(1).map((file: any, index: number) => ({
          id: `e${fileNodes[0].id}-${file.id}`,
          source: fileNodes[0].id,
          target: file.id,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        }))
        setEdges(generatedEdges)
      } else {
        setEdges([])
      }
    } else {
      // Show empty state
      setNodes([])
      setEdges([])
    }
  }, [selectedRepo, setNodes, setEdges])

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  // Handle W key press for alternative navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') {
        setIsWKeyPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') {
        setIsWKeyPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const navigateToNode = useCallback((node: Node) => {
    if (node.data.type === 'file') {
      console.log("Navigating to node:", node.id, "Type:", node.data.type, "FilePath:", node.data.filePath)
      
      // Add visual feedback
      setNodes((nodes: Node[]) =>
        nodes.map((n: Node) => ({
          ...n,
          style: {
            ...n.style,
            border: n.id === node.id ? "3px solid #10b981" : "1px solid #1e40af",
            boxShadow: n.id === node.id ? "0 0 30px rgba(16, 185, 129, 0.8)" : "none",
            transform: n.id === node.id ? "scale(1.05)" : "scale(1)",
          },
        }))
      )
      
      // Navigate after a brief delay to show the visual feedback
      setTimeout(() => {
        router.push(`/module/${node.id}`)
      }, 200)
    } else {
      console.log("Clicked directory node:", node.id, "- not navigating")
    }
  }, [router, setNodes])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (mouseMode !== "selection") return

    // Check if W key is pressed for alternative navigation
    if (isWKeyPressed) {
      navigateToNode(node)
      return
    }

    // Add visual feedback for single clicks
    console.log("Clicked node:", node.data.label)
    
    // Update node style to show selection
    setNodes((nodes: Node[]) =>
      nodes.map((n: Node) => ({
        ...n,
        style: {
          ...n.style,
          border: n.id === node.id ? "2px solid #3b82f6" : "1px solid #1e40af",
          boxShadow: n.id === node.id ? "0 0 20px rgba(59, 130, 246, 0.5)" : "none",
        },
      }))
    )
  }, [setNodes, mouseMode, isWKeyPressed, navigateToNode])

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (mouseMode !== "selection") return

    // Use the same navigation logic
    navigateToNode(node)
  }, [mouseMode, navigateToNode])

  // Update nodes when repo changes
  useEffect(() => {
    const files = getUserFiles()
    if (files.length > 0 && selectedRepo) {
      const fileNodes = files.map((file: any) => ({
        id: file.id,
        label: file.name,
        filePath: file.name,
        type: "file",
        language: file.type || "text",
        size: file.size || 0
      }))
      setNodes(generateNodes(selectedRepo.name, fileNodes))
    }
  }, [selectedRepo, setNodes])

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h2 className="text-lg font-semibold text-white">
          {selectedRepo?.name || 'Project'} - {selectedRepo?.branch || 'main'}
        </h2>
        <p className="text-sm text-gray-400">
          {userFiles.length > 0 
            ? "Double-click or hold W + click any file node to open in code editor"
            : "Upload files to see your project structure here"
          }
        </p>
      </div>

      <div className="h-full">
        {userFiles.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            className="bg-gray-900"
            fitView
            fitViewOptions={{ padding: 0.1, minZoom: 0.8, maxZoom: 1.2 }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            panOnDrag={mouseMode === "dragging"}
            nodesDraggable={mouseMode === "dragging"}
            nodesConnectable={mouseMode === "dragging"}
          >
            <Controls className="bg-gray-800 border-gray-600" />
            <MiniMap className="bg-gray-800" nodeColor="#3b82f6" />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Files Uploaded</h3>
              <p className="text-gray-500 mb-4">Upload files to visualize your project structure</p>
            </div>
          </div>
        )}
      </div>

      {/* Mouse Mode Toggle - only show when there are files */}
      {userFiles.length > 0 && (
        <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-80 rounded-md p-2 flex space-x-2 text-white text-sm select-none z-10 items-center">
          <button
            className={`px-3 py-1 rounded flex items-center gap-1 ${mouseMode === "selection" ? "bg-blue-600" : "bg-gray-600"}`}
            onClick={() => setMouseMode("selection")}
            title="Selection Mode"
          >
            <span>Selection</span>
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            className={`px-3 py-1 rounded flex items-center gap-1 ${mouseMode === "dragging" ? "bg-blue-600" : "bg-gray-600"}`}
            onClick={() => setMouseMode("dragging")}
            title="Dragging Mode"
          >
            <span>Dragging</span>
            <span className="text-lg font-bold">-</span>
          </button>
        </div>
      )}
    </div>
  )
}
