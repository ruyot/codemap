"use client"

import type React from "react"

import { useCallback } from "react"
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

interface CodeCanvasProps {
  selectedRepo: {
    name: string
    branch: string
    status: string
  }
}

const generateNodes = (repoName: string): Node[] => {
  const baseNodes = [
    {
      id: "1",
      position: { x: 100, y: 100 },
      data: { label: "App.tsx" },
      style: { background: "#3b82f6", color: "white", border: "1px solid #1e40af" },
    },
    {
      id: "2",
      position: { x: 300, y: 100 },
      data: { label: "components/" },
      style: { background: "#0066ff", color: "white", border: "1px solid #1e40af" },
    },
    {
      id: "3",
      position: { x: 500, y: 100 },
      data: { label: "utils/" },
      style: { background: "#1e40af", color: "white", border: "1px solid #0066ff" },
    },
    {
      id: "4",
      position: { x: 200, y: 250 },
      data: { label: "Header.tsx" },
      style: { background: "#6366f1", color: "white", border: "1px solid #4f46e5" },
    },
    {
      id: "5",
      position: { x: 400, y: 250 },
      data: { label: "Footer.tsx" },
      style: { background: "#6366f1", color: "white", border: "1px solid #4f46e5" },
    },
  ]

  return baseNodes.map((node) => ({
    ...node,
    data: { ...node.data, label: `${repoName}/${node.data.label}` },
  }))
}

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
  { id: "e2-4", source: "2", target: "4", animated: true },
  { id: "e2-5", source: "2", target: "5", animated: true },
]

export default function CodeCanvas({ selectedRepo }: CodeCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(generateNodes(selectedRepo.name))
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log("Double clicked node:", node.data.label)
    // Here you would open the code editor for this file
  }, [])

  return (
    <div className="w-full h-full bg-gray-900">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h2 className="text-lg font-semibold text-white">
          {selectedRepo.name} - {selectedRepo.branch}
        </h2>
        <p className="text-sm text-gray-400">Double-click any node to open in code editor</p>
      </div>

      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
