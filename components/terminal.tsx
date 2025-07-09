"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
  const [isMaximized, setIsMaximized] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 320 })
  const [size, setSize] = useState({ width: 384, height: 320 })
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 })

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

  const onMouseDownDrag = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    e.preventDefault()
  }, [position])

  const onMouseMoveDrag = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
    }
  }, [])

  const onMouseUpDrag = useCallback(() => {
    isDragging.current = false
  }, [])

  const onMouseDownResize = useCallback((e: React.MouseEvent) => {
    isResizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height }
    e.preventDefault()
    e.stopPropagation()
  }, [size])

  const onMouseMoveResize = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = Math.max(300, resizeStart.current.width + (e.clientX - resizeStart.current.x))
      const newHeight = Math.max(200, resizeStart.current.height + (e.clientY - resizeStart.current.y))
      setSize({ width: newWidth, height: newHeight })
    }
  }, [])

  const onMouseUpResize = useCallback(() => {
    isResizing.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMoveDrag)
    window.addEventListener('mouseup', onMouseUpDrag)
    window.addEventListener('mousemove', onMouseMoveResize)
    window.addEventListener('mouseup', onMouseUpResize)
    return () => {
      window.removeEventListener('mousemove', onMouseMoveDrag)
      window.removeEventListener('mouseup', onMouseUpDrag)
      window.removeEventListener('mousemove', onMouseMoveResize)
      window.removeEventListener('mouseup', onMouseUpResize)
    }
  }, [onMouseMoveDrag, onMouseUpDrag, onMouseMoveResize, onMouseUpResize])

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
    <div
      className="fixed z-50 bg-gray-900 border border-gray-700 text-white flex flex-col shadow-lg"
      style={{
        width: size.width,
        height: size.height,
        left: position.x,
        top: position.y,
        userSelect: isDragging.current || isResizing.current ? 'none' : 'auto',
        color: 'white'
      }}
    >
      <Card className="h-full flex flex-col bg-transparent border-none">
        <CardHeader
          className="pb-2 cursor-move select-none"
          onMouseDown={onMouseDownDrag}
          ref={dragRef}
        >
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
                title="Minimize"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMaximized(!isMaximized)}
                className="h-6 w-6 p-0 hover:bg-gray-700"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
              {onClose && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="h-6 w-6 p-0 hover:bg-gray-700"
                  title="Close"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-3 pt-0 overflow-hidden">
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
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-700"
          onMouseDown={onMouseDownResize}
          ref={resizeRef}
          title="Resize"
        />
      </Card>
    </div>
  )
}
