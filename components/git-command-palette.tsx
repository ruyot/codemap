"use client"

import React, { useState, useEffect } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  GitPullRequest, 
  History, 
  Search,
  Terminal,
  FileText,
  Plus,
  Minus,
  RotateCcw,
  Upload,
  Download
} from "lucide-react"
import { GitOperation } from "@/types"

interface GitCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedRepo?: {
    name: string
    owner: string
    branch: string
  }
}

const gitOperations: GitOperation[] = [
  // High Priority
  {
    id: "status",
    name: "Git Status",
    description: "Show the working tree status",
    category: "basic",
    shortcut: "⌘+G S",
    priority: "high"
  },
  {
    id: "diff",
    name: "Git Diff",
    description: "Show changes between commits, branches, or working tree",
    category: "basic",
    shortcut: "⌘+G D",
    priority: "high"
  },
  {
    id: "commit",
    name: "Git Commit",
    description: "Record changes to the repository",
    category: "basic",
    shortcut: "⌘+G C",
    priority: "high"
  },
  {
    id: "branch",
    name: "Git Branch",
    description: "List, create, or delete branches",
    category: "branching",
    shortcut: "⌘+G B",
    priority: "high"
  },
  {
    id: "merge",
    name: "Git Merge",
    description: "Join two or more development histories together",
    category: "branching",
    shortcut: "⌘+G M",
    priority: "high"
  },
  
  // Medium Priority
  {
    id: "checkout",
    name: "Git Checkout",
    description: "Switch branches or restore working tree files",
    category: "branching",
    shortcut: "⌘+G O",
    priority: "medium"
  },
  {
    id: "log",
    name: "Git Log",
    description: "Show commit logs",
    category: "basic",
    shortcut: "⌘+G L",
    priority: "medium"
  },
  
  // Lower Priority
  {
    id: "add",
    name: "Git Add",
    description: "Add file contents to the index",
    category: "basic",
    priority: "low"
  },
  {
    id: "mv",
    name: "Git Move",
    description: "Move or rename a file, directory, or symlink",
    category: "basic",
    priority: "low"
  },
  {
    id: "rm",
    name: "Git Remove",
    description: "Remove files from the working tree and index",
    category: "basic",
    priority: "low"
  },
  {
    id: "fetch",
    name: "Git Fetch",
    description: "Download objects and refs from another repository",
    category: "remote",
    priority: "low"
  },
  {
    id: "pull",
    name: "Git Pull",
    description: "Fetch from and integrate with another repository or branch",
    category: "remote",
    priority: "low"
  },
  {
    id: "push",
    name: "Git Push",
    description: "Update remote refs along with associated objects",
    category: "remote",
    priority: "low"
  }
]

const getOperationIcon = (operation: GitOperation) => {
  const iconMap: Record<string, React.ReactNode> = {
    status: <FileText className="h-4 w-4" />,
    diff: <Search className="h-4 w-4" />,
    commit: <GitCommit className="h-4 w-4" />,
    branch: <GitBranch className="h-4 w-4" />,
    merge: <GitMerge className="h-4 w-4" />,
    checkout: <GitBranch className="h-4 w-4" />,
    log: <History className="h-4 w-4" />,
    add: <Plus className="h-4 w-4" />,
    mv: <RotateCcw className="h-4 w-4" />,
    rm: <Minus className="h-4 w-4" />,
    fetch: <Download className="h-4 w-4" />,
    pull: <Download className="h-4 w-4" />,
    push: <Upload className="h-4 w-4" />
  }
  
  return iconMap[operation.id] || <Terminal className="h-4 w-4" />
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500/20 text-red-400'
    case 'medium': return 'bg-yellow-500/20 text-yellow-400'
    case 'low': return 'bg-green-500/20 text-green-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

export default function GitCommandPalette({ open, onOpenChange, selectedRepo }: GitCommandPaletteProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const executeGitOperation = async (operation: GitOperation) => {
    if (!selectedRepo) {
      setResult("No repository selected")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/git/${operation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: selectedRepo.name,
          owner: selectedRepo.owner,
          branch: selectedRepo.branch
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data.result || `${operation.name} executed successfully`)
      } else {
        setResult(`Error: ${data.error || 'Operation failed'}`)
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (operation: GitOperation) => {
    executeGitOperation(operation)
  }

  // Group operations by category
  const groupedOperations = gitOperations.reduce((acc, op) => {
    if (!acc[op.category]) {
      acc[op.category] = []
    }
    acc[op.category].push(op)
    return acc
  }, {} as Record<string, GitOperation[]>)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search Git operations..." />
      <CommandList>
        <CommandEmpty>No Git operations found.</CommandEmpty>
        
        {Object.entries(groupedOperations).map(([category, operations]) => (
          <React.Fragment key={category}>
            <CommandGroup heading={category.charAt(0).toUpperCase() + category.slice(1)}>
              {operations.map((operation) => (
                <CommandItem
                  key={operation.id}
                  onSelect={() => handleSelect(operation)}
                  className="flex items-center gap-3 p-3"
                >
                  {getOperationIcon(operation)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{operation.name}</span>
                      <Badge className={`text-xs ${getPriorityColor(operation.priority)}`}>
                        {operation.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{operation.description}</p>
                  </div>
                  {operation.shortcut && (
                    <span className="text-xs text-muted-foreground">{operation.shortcut}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </React.Fragment>
        ))}
        
        {loading && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Executing Git operation...</p>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-gray-800 border-t">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-sm bg-gray-900 p-2 rounded overflow-x-auto">
              {result}
            </pre>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  )
}
