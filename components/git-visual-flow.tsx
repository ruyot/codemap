"use client"

import React, { useCallback, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  GitBranch, 
  GitMerge, 
  GitCommit, 
  GitPullRequest,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from "lucide-react"
import { useDragDrop } from "@/hooks/use-drag-drop"

interface GitVisualFlowProps {
  repository: {
    name: string
    branches: GitBranch[]
    commits: GitCommit[]
  }
  onGitOperation?: (operation: GitOperation) => void
}

interface GitBranch {
  id: string
  name: string
  lastCommit: string
  ahead: number
  behind: number
  status: 'active' | 'merged' | 'stale'
}

interface GitCommit {
  id: string
  hash: string
  message: string
  author: string
  timestamp: Date
  branch: string
}

interface GitOperation {
  type: 'merge' | 'rebase' | 'cherry-pick' | 'branch' | 'pull-request'
  source: string
  target?: string
  description: string
}

// Custom Git Node Component
const GitBranchNode = React.memo(({ data, selected }: { data: any, selected: boolean }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'from-green-600/20 to-green-500/20 border-green-500/50'
      case 'merged':
        return 'from-blue-600/20 to-blue-500/20 border-blue-500/50'
      case 'stale':
        return 'from-gray-600/20 to-gray-500/20 border-gray-500/50'
      default:
        return 'from-gray-600/20 to-gray-500/20 border-gray-500/50'
    }
  }

  return (
    <motion.div
      className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer min-w-[160px] bg-gradient-to-br ${getStatusColor(data.status)} ${
        selected ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-400/20' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)"
      }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-medium text-white truncate">
          {data.name}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Last commit:</span>
          <span>{data.lastCommit}</span>
        </div>
        
        {data.ahead > 0 && (
          <Badge className="text-xs bg-green-600/20 text-green-400">
            +{data.ahead} ahead
          </Badge>
        )}
        
        {data.behind > 0 && (
          <Badge className="text-xs bg-red-600/20 text-red-400">
            -{data.behind} behind
          </Badge>
        )}
      </div>

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
              title="Create Pull Request"
            >
              <GitPullRequest className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-gray-700"
              title="Merge Branch"
            >
              <GitMerge className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

GitBranchNode.displayName = 'GitBranchNode'

// Custom node types
const nodeTypes = {
  gitBranch: GitBranchNode,
}

// Mock git data
const mockBranches: GitBranch[] = [
  {
    id: "main",
    name: "main",
    lastCommit: "2h ago",
    ahead: 0,
    behind: 0,
    status: "active"
  },
  {
    id: "develop",
    name: "develop",
    lastCommit: "1h ago",
    ahead: 3,
    behind: 1,
    status: "active"
  },
  {
    id: "feature-auth",
    name: "feature/auth",
    lastCommit: "30m ago",
    ahead: 5,
    behind: 2,
    status: "active"
  },
  {
    id: "hotfix-bug",
    name: "hotfix/critical-bug",
    lastCommit: "1d ago",
    ahead: 1,
    behind: 0,
    status: "merged"
  }
]

const generateGitNodes = (branches: GitBranch[]): Node[] => {
  const positions = [
    { x: 100, y: 100 },
    { x: 350, y: 100 },
    { x: 200, y: 250 },
    { x: 450, y: 250 }
  ]

  return branches.map((branch, index) => ({
    id: branch.id,
    type: 'gitBranch',
    position: positions[index] || { x: 100 + (index * 200), y: 100 + Math.floor(index / 2) * 150 },
    data: branch as unknown as Record<string, unknown>,
    draggable: true,
    selectable: true,
  }))
}

const initialGitEdges: Edge[] = [
  { 
    id: "e-main-develop", 
    source: "main", 
    target: "develop", 
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    label: "branched from"
  },
  { 
    id: "e-develop-feature", 
    source: "develop", 
    target: "feature-auth", 
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    label: "feature branch"
  },
  { 
    id: "e-main-hotfix", 
    source: "main", 
    target: "hotfix-bug", 
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },
    label: "hotfix"
  },
]

export default function GitVisualFlow({ 
  repository = { name: "my-repo", branches: mockBranches, commits: [] },
  onGitOperation 
}: GitVisualFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(generateGitNodes(repository.branches))
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGitEdges)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [pendingOperation, setPendingOperation] = useState<GitOperation | null>(null)

  // Memoize expensive calculations
  const memoizedNodes = useMemo(() => nodes, [nodes])
  const memoizedEdges = useMemo(() => edges, [edges])

  const { getDraggableProps, isNodeBeingDragged } = useDragDrop({
    onNodeDrop: (nodeId, targetId, position) => {
      if (targetId && nodeId !== targetId) {
        // Create merge operation
        const operation: GitOperation = {
          type: 'merge',
          source: nodeId,
          target: targetId,
          description: `Merge ${nodeId} into ${targetId}`
        }
        setPendingOperation(operation)
      }
    }
  })

  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    }
    setEdges((eds) => addEdge(newEdge, eds))
  }, [setEdges])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation()
    
    if (event.shiftKey) {
      setSelectedNodes(prev => 
        prev.includes(node.id) 
          ? prev.filter(id => id !== node.id)
          : [...prev, node.id]
      )
    } else {
      setSelectedNodes([node.id])
      setNodes((nodes) =>
        nodes.map((n) => ({
          ...n,
          selected: n.id === node.id,
        }))
      )
    }
  }, [setNodes])

  const executeGitOperation = useCallback((operation: GitOperation) => {
    console.log('Executing git operation:', operation)
    onGitOperation?.(operation)
    setPendingOperation(null)
    
    // Simulate operation completion with visual feedback
    setTimeout(() => {
      if (operation.type === 'merge') {
        // Add merge edge
        const mergeEdge: Edge = {
          id: `merge-${operation.source}-${operation.target}`,
          source: operation.source,
          target: operation.target!,
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 3, strokeDasharray: '5,5' },
          label: 'merged'
        }
        setEdges(prev => [...prev, mergeEdge])
      }
    }, 1000)
  }, [onGitOperation, setEdges])

  const cancelOperation = useCallback(() => {
    setPendingOperation(null)
  }, [])

  return (
    <div className="w-full h-full bg-gray-900 relative overflow-hidden">
      {/* Header */}
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
              Git Flow - {repository.name}
            </h2>
            <Badge className="bg-green-600/20 text-green-400">
              {selectedNodes.length.toString()} selected
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white"
              disabled={selectedNodes.length !== 2}
              onClick={() => {
                if (selectedNodes.length === 2) {
                  const operation: GitOperation = {
                    type: 'merge',
                    source: selectedNodes[0],
                    target: selectedNodes[1],
                    description: `Merge ${selectedNodes[0]} into ${selectedNodes[1]}`
                  }
                  setPendingOperation(operation)
                }
              }}
            >
              <GitMerge className="h-4 w-4 mr-2" />
              Merge Selected
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mt-2">
          Drag branches to merge • Shift+click for multi-select • Visual git operations
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

        {/* Pending Operation Modal */}
        <AnimatePresence>
          {pendingOperation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gray-800 rounded-lg border border-gray-600 p-6 max-w-md w-full mx-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <GitMerge className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Confirm Git Operation</h3>
                    <p className="text-sm text-gray-400">
                      {pendingOperation.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <Badge className="bg-blue-600/20 text-blue-400">
                    {pendingOperation.source}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <Badge className="bg-green-600/20 text-green-400">
                    {pendingOperation.target}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => executeGitOperation(pendingOperation)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                  <Button
                    onClick={cancelOperation}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
