"use client"

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
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

const initialNodes = [
  {
    id: "1",
    position: { x: 50, y: 50 },
    data: { label: "GitView Agent" },
    style: { background: "#3b82f6", color: "white", border: "1px solid #1e40af" },
  },
  {
    id: "2",
    position: { x: 300, y: 50 },
    data: { label: "Review Agent" },
    style: { background: "#0066ff", color: "white", border: "1px solid #1e40af" },
  },
  {
    id: "3",
    position: { x: 550, y: 50 },
    data: { label: "Merge Agent" },
    style: { background: "#1e40af", color: "white", border: "1px solid #0066ff" },
  },
  {
    id: "4",
    position: { x: 200, y: 200 },
    data: { label: "Blackbox.ai Integration" },
    style: { background: "#6366f1", color: "white", border: "1px solid #4f46e5" },
  },
]

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
  { id: "e1-4", source: "1", target: "4", animated: true },
  { id: "e4-3", source: "4", target: "3", animated: true },
]

export default function AgentFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        className="bg-gray-900"
      >
        <Controls className="bg-gray-800 border-gray-600" />
        <MiniMap className="bg-gray-800" />
        <Background gap={12} size={1} color="#374151" />
      </ReactFlow>
    </div>
  )
}
