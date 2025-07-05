"use client"

import React, { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
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

// Structured module mapping
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
    position: positions[index] || { x: 100 + (index * 150), y: 100 + Math.floor(index / 3) * 150 },
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
  }))
}

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
  { id: "e2-4", source: "2", target: "4", animated: true },
  { id: "e2-5", source: "2", target: "5", animated: true },
]

export default function CodeCanvas({ selectedRepo }: CodeCanvasProps) {
  const router = useRouter()
  const [nodes, setNodes, onNodesChange] = useNodesState(generateNodes(selectedRepo.name, moduleNodes))
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
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
  }, [setNodes])

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Only navigate for file nodes, not directories
    if (node.data.type === 'file') {
      console.log("Navigating to module:", node.id, node.data.filePath)
      router.push(`/module/${node.id}`)
    }
  }, [router])

  // Update nodes when repo changes
  useEffect(() => {
    setNodes(generateNodes(selectedRepo.name, moduleNodes))
  }, [selectedRepo.name, setNodes])

  return (
    <div className="w-full h-full bg-gray-900">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h2 className="text-lg font-semibold text-white">
          {selectedRepo.name} - {selectedRepo.branch}
        </h2>
        <p className="text-sm text-gray-400">Double-click any file node to open in code editor</p>
      </div>

      <div className="h-full">
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
        >
          <Controls className="bg-gray-800 border-gray-600" />
          <MiniMap className="bg-gray-800" nodeColor="#3b82f6" />
          <Background variant="dots" gap={20} size={1} color="#374151" />
        </ReactFlow>
      </div>
    </div>
  )
}
