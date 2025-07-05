"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal as TerminalIcon, X, Minimize2, Maximize2 } from "lucide-react"

interface TerminalProps {
  onClose?: () => void
}

interface TerminalLine {
  id: string
  type: 'command' | 'output' | 'error'
  content: string
  timestamp: Date
}

export default function Terminal({ onClose }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'output',
      content: 'Welcome to Web Terminal v1.0.0',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'output',
      content: 'Type "help" for available commands.',
      timestamp: new Date()
    }
  ])
  const [currentCommand, setCurrentCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isMinimized, setIsMinimized] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  useEffect(() => {
    if (inputRef.current && !isMinimized) {
      inputRef.current.focus()
    }
  }, [isMinimized])

  const addLine = (type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setLines(prev => [...prev, newLine])
  }

  const executeCommand = (command: string) => {
    const trimmedCommand = command.trim().toLowerCase()
    
    addLine('command', `$ ${command}`)
    
    if (commandHistory[commandHistory.length - 1] !== command) {
      setCommandHistory(prev => [...prev, command])
    }
    setHistoryIndex(-1)

    switch (trimmedCommand) {
      case 'help':
        addLine('output', 'Available commands:')
        addLine('output', '  help          - Show this help message')
        addLine('output', '  clear         - Clear terminal')
        addLine('output', '  ls            - List files')
        addLine('output', '  pwd           - Print working directory')
        addLine('output', '  whoami        - Show current user')
        addLine('output', '  date          - Show current date and time')
        addLine('output', '  echo <text>   - Echo text')
        addLine('output', '  git status    - Show git status')
        addLine('output', '  npm --version - Show npm version')
        addLine('output', '  node --version- Show node version')
        break
      
      case 'clear':
        setLines([])
        break
      
      case 'ls':
        addLine('output', 'components/     lib/           app/')
        addLine('output', 'public/         styles/        types/')
        addLine('output', 'package.json    tsconfig.json  next.config.mjs')
        break
      
      case 'pwd':
        addLine('output', '/workspace/web-ide')
        break
      
      case 'whoami':
        addLine('output', 'developer')
        break
      
      case 'date':
        addLine('output', new Date().toString())
        break
      
      case 'git status':
        addLine('output', 'On branch main')
        addLine('output', 'Your branch is up to date with \'origin/main\'.')
        addLine('output', '')
        addLine('output', 'Changes not staged for commit:')
        addLine('output', '  modified:   components/code-canvas.tsx')
        addLine('output', '  modified:   components/hero-section.tsx')
        addLine('output', '')
        addLine('output', 'no changes added to commit')
        break
      
      case 'npm --version':
        addLine('output', '10.2.4')
        break
      
      case 'node --version':
        addLine('output', 'v20.11.0')
        break
      
      default:
        if (trimmedCommand.startsWith('echo ')) {
          const text = command.slice(5)
          addLine('output', text)
        } else if (trimmedCommand === '') {
          // Empty command, just add a new prompt
        } else {
          addLine('error', `Command not found: ${trimmedCommand}`)
          addLine('output', 'Type "help" for available commands.')
        }
        break
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentCommand.trim()) {
      executeCommand(currentCommand)
      setCurrentCommand('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCurrentCommand('')
        } else {
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[newIndex])
        }
      }
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
        >
          <TerminalIcon className="h-4 w-4 mr-2" />
          Terminal
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-80 z-50">
      <Card className="h-full bg-gray-900 border-gray-700 text-white flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TerminalIcon className="h-4 w-4" />
              Terminal
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0 hover:bg-gray-700"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              {onClose && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="h-6 w-6 p-0 hover:bg-gray-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-3 pt-0">
          <ScrollArea className="flex-1 mb-2" ref={scrollRef}>
            <div className="space-y-1 font-mono text-xs">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`${
                    line.type === 'command'
                      ? 'text-green-400'
                      : line.type === 'error'
                      ? 'text-red-400'
                      : 'text-gray-300'
                  }`}
                >
                  {line.content}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-green-400 font-mono text-xs">$</span>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none text-white font-mono text-xs p-0 h-auto focus-visible:ring-0"
              placeholder="Type a command..."
              autoComplete="off"
            />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
