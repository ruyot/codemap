"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import DragDropCanvas from "@/components/drag-drop-canvas"
import GitCommandPalette from "@/components/git-command-palette"
import TerminalComponent from "@/components/terminal"
import GlobalSearch from "@/components/global-search"
import MinimizablePanel from "@/components/minimizable-panel"
import FileUploadZone from "@/components/file-upload-zone"
import Image from "next/image"
import { 
  Folder, 
  GitBranch, 
  MessageSquare, 
  LogOut, 
  Settings,
  Search,
  Command,
  Zap,
  Eye,
  Code2,
  Terminal,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  Upload,
  Share,
  Bell,
  User,
  Menu,
  X
} from "lucide-react"

interface CyberpunkAppShellProps {
  onSignOut: () => void
}

const mockRepos = [
  { 
    name: "my-react-app", 
    owner: "user",
    branch: "main", 
    status: "active",
    lastCommit: "2 hours ago",
    commits: 42,
    contributors: 3
  },
  { 
    name: "api-server", 
    owner: "user",
    branch: "develop", 
    status: "modified",
    lastCommit: "1 day ago",
    commits: 128,
    contributors: 5
  },
  { 
    name: "mobile-app", 
    owner: "user",
    branch: "feature/auth", 
    status: "clean",
    lastCommit: "3 days ago",
    commits: 89,
    contributors: 2
  },
  { 
    name: "data-pipeline", 
    owner: "user",
    branch: "main", 
    status: "active",
    lastCommit: "5 hours ago",
    commits: 67,
    contributors: 4
  },
]

const mockMessages = [
  { 
    role: "assistant", 
    content: "🚀 Welcome to Code Map! I'm your AI coding assistant. I can help you analyze code, suggest improvements, and fix bugs. What would you like to work on?",
    timestamp: new Date(Date.now() - 300000)
  },
  { 
    role: "user", 
    content: "Can you help me refactor this React component to use hooks?",
    timestamp: new Date(Date.now() - 240000)
  },
  {
    role: "assistant",
    content: "Absolutely! I'd be happy to help you refactor your component to use React hooks. Please share the component code, and I'll provide a modern hooks-based version with explanations.",
    timestamp: new Date(Date.now() - 180000)
  },
]

export default function CyberpunkAppShell({ onSignOut }: CyberpunkAppShellProps) {
  const router = useRouter()
  const [selectedRepo, setSelectedRepo] = useState(mockRepos[0])
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState(mockMessages)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [activeTab, setActiveTab] = useState("repos")
  const [isAIEnabled, setIsAIEnabled] = useState(true)
  const [notifications, setNotifications] = useState(3)
  const [user, setUser] = useState<any>(null)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [leftPanelMinimized, setLeftPanelMinimized] = useState(false)
  const [rightPanelMinimized, setRightPanelMinimized] = useState(false)

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    onSignOut()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = {
      role: "user" as const,
      content: chatInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setChatInput("")

    // Simulate AI response with typing indicator
    setTimeout(() => {
      const responses = [
        "I'll analyze that for you. Let me examine the code structure and suggest improvements...",
        "Great question! Here's what I found and my recommendations:",
        "I can help with that. Let me break down the solution step by step:",
        "Interesting challenge! Here's my analysis and suggested approach:",
      ]
      
      const aiMessage = {
        role: "assistant" as const,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
    }, 1500)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-black text-white flex flex-col overflow-hidden">
      {/* Cyberpunk Header */}
      <div className="bg-gradient-to-r from-purple-700 via-pink-700 to-purple-800 text-white border-b border-pink-600 shadow-lg">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse relative">
                <Image
                  src="/spiderlogonew.png"
                  alt="Web Logo"
                  fill
                  className="object-contain filter brightness-0 invert rounded-lg"
                  sizes="32px"
                />
              </div>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent animate-text-flicker">
                Web
              </h1>
            </div>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-pink-300">
              <span>•</span>
              <span>{selectedRepo.name}</span>
              <GitBranch className="h-3 w-3" />
              <span>{selectedRepo.branch}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowCommandPalette(true)}
              className="bg-pink-600 text-white hover:bg-pink-700 border border-pink-500 shadow-lg shadow-pink-600/50"
            >
              <Command className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Command Palette</span>
              <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-pink-700 rounded">⌘P</kbd>
            </Button>

            <Button
              onClick={() => setIsAIEnabled(!isAIEnabled)}
              className={`${isAIEnabled 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
              } border border-purple-600 shadow-lg shadow-purple-600/50`}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI
            </Button>

            <div className="relative">
              <Button className="bg-pink-600 text-white hover:bg-pink-700 border border-pink-500 shadow-lg shadow-pink-600/50">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
            </div>

            <Button
              onClick={handleSignOut}
              className="bg-pink-600 text-white hover:bg-pink-700 border border-pink-500 shadow-lg shadow-pink-600/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Left Panel */}
        <MinimizablePanel
          title="Project Explorer"
          side="left"
          defaultMinimized={leftPanelMinimized}
          onToggle={setLeftPanelMinimized}
          icon={<Folder className="h-4 w-4" />}
          className="bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="bg-gray-800/50 border-b border-gray-700 rounded-none justify-start px-4 py-2">
              <TabsTrigger value="repos" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                <Folder className="h-4 w-4 mr-2" />
                Repos
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                <Code2 className="h-4 w-4 mr-2" />
                Files
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                <Zap className="h-4 w-4 mr-2" />
                Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="repos" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {mockRepos.map((repo) => (
                    <Card
                      key={repo.name}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        selectedRepo.name === repo.name
                          ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20"
                          : "bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500"
                      }`}
                      onClick={() => setSelectedRepo(repo)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Folder className="h-4 w-4 text-blue-400" />
                          <span className="font-medium">{repo.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <GitBranch className="h-3 w-3" />
                          <span>{repo.branch}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{repo.commits} commits</span>
                          <span>{repo.contributors} contributors</span>
                        </div>
                        <div className="mt-2">
                          <Badge
                            className={`text-xs ${
                              repo.status === "active"
                                ? "bg-green-600/20 text-green-400 border-green-500/30"
                                : repo.status === "modified"
                                  ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30"
                                  : "bg-gray-600/20 text-gray-400 border-gray-500/30"
                            }`}
                          >
                            {repo.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="files" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  <Button 
                    onClick={() => setShowFileUpload(true)}
                    className="w-full justify-start bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files/Project
                  </Button>
                  
                  <div className="text-center text-gray-400 py-8">
                    <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Drag files here or use upload button</p>
                    <p className="text-sm mt-2">File tree will appear after upload</p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tools" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowTerminal(true)}
                    className="w-full justify-start bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Terminal
                  </Button>
                  <Button 
                    onClick={() => setShowGlobalSearch(true)}
                    className="w-full justify-start bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Global Search
                  </Button>
                  <Button 
                    onClick={() => setShowCommandPalette(true)}
                    className="w-full justify-start bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600"
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Git Commands
                  </Button>
                  <Button className="w-full justify-start bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </MinimizablePanel>

        {/* Enhanced Center Panel - Drag & Drop Canvas */}
        <div className="flex-1 bg-gray-800 relative overflow-hidden">
          {/* Cyberpunk grid background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }} />
          </div>
          
          <div className="relative h-full">
            <DragDropCanvas 
              selectedRepo={selectedRepo}
              onFileSelect={(fileId, filePath) => {
                // Navigate to file editor
                router.push(`/module/${fileId}`)
              }}
              onFileUpload={(files) => {
                console.log('Files uploaded:', files)
                // Handle file upload logic here
              }}
            />
          </div>
        </div>

        {/* Enhanced Right Panel - AI Chat */}
        <MinimizablePanel
          title="AI Assistant"
          side="right"
          defaultMinimized={rightPanelMinimized}
          onToggle={setRightPanelMinimized}
          icon={<Sparkles className="h-4 w-4" />}
          className="bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-700"
        >
          <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs text-gray-400">Powered by Blackbox.ai</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isAIEnabled ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-400">
                  {isAIEnabled ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    message.role === "user" 
                      ? "bg-gradient-to-r from-blue-600/20 to-blue-500/20 ml-4 border border-blue-500/30" 
                      : "bg-gradient-to-r from-gray-700/50 to-gray-600/50 mr-4 border border-gray-600/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === "assistant" ? (
                      <Sparkles className="h-3 w-3 text-purple-400" />
                    ) : (
                      <User className="h-3 w-3 text-blue-400" />
                    )}
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI anything..."
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={!isAIEnabled}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!isAIEnabled || !chatInput.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            {!isAIEnabled && (
              <p className="text-xs text-gray-500 mt-2">
                AI Assistant is disabled. Enable it in the header to chat.
              </p>
            )}
          </div>
        </MinimizablePanel>
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <GitCommandPalette
          open={showCommandPalette}
          onOpenChange={setShowCommandPalette}
          selectedRepo={selectedRepo}
        />
      )}

      {/* Terminal */}
      {showTerminal && (
        <TerminalComponent onClose={() => setShowTerminal(false)} />
      )}

      {/* Global Search */}
      {showGlobalSearch && (
        <GlobalSearch 
          open={showGlobalSearch} 
          onOpenChange={setShowGlobalSearch} 
          onFileSelect={(file) => {
            setShowGlobalSearch(false)
            // Navigate to file editor page or handle file open
            router.push(`/module/${file}`)
          }}
        />
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Upload Files or Project</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <FileUploadZone
              onFileUpload={(files) => {
                console.log('Files uploaded:', files)
                setShowFileUpload(false)
                // Handle file upload logic
              }}
              acceptedTypes={['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json', 'md']}
              maxFileSize={50 * 1024 * 1024} // 50MB
              maxFiles={100}
            />
          </div>
        </div>
      )}
    </div>
  )
}
