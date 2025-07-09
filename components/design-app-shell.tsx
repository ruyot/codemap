use client

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
import { User as SupabaseUser } from "@supabase/supabase-js"

interface CyberpunkAppShellProps {
  onSignOut: () => void
}

interface Project {
  id: string;
  name: string;
  fileCount: number;
  uploadedAt: string;
  branch: string;
}

interface UserFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string | null;
  lastModified: string;
  projectId: string;
  userId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Real user data will be loaded from localStorage and API
const getStoredProjects = (): Project[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('uploadedProjects')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const getStoredFiles = (): UserFile[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('uploadedFiles')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export default function CyberpunkAppShell({ onSignOut }: CyberpunkAppShellProps) {
  const router = useRouter()
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [userFiles, setUserFiles] = useState<UserFile[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Project | null>(null)
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [activeTab, setActiveTab] = useState("files")
  const [isAIEnabled, setIsAIEnabled] = useState(true)
  const [notifications, setNotifications] = useState(0)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [leftPanelMinimized, setLeftPanelMinimized] = useState(false)
  const [rightPanelMinimized, setRightPanelMinimized] = useState(false)

  // Load user data on component mount
  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Load stored projects and files
    const projects = getStoredProjects()
    const files = getStoredFiles()
    setUserProjects(projects)
    setUserFiles(files)

    // Initialize AI assistant with welcome message if no messages exist
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        role: "assistant",
        content: files.length > 0 
          ? "Welcome back! I can see you have uploaded files. I can help you analyze your code, suggest improvements, create new files, and fix bugs. What would you like to work on?"
          : "Welcome to your AI coding assistant! Please upload some files first, or I can help you create new files. What would you like to build today?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }

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
    if (!chatInput.trim() || !isAIEnabled) return

    const userMessage: Message = {
      role: "user",
      content: chatInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = chatInput
    setChatInput("")

    // Check if user wants to create a file
    const createFileRegex = /create\s+(?:a\s+)?file\s+(?:called\s+)?([^\s]+(?:\.[a-zA-Z0-9]+)?)/i
    const createMatch = currentInput.match(createFileRegex)
    
    if (createMatch) {
      const fileName = createMatch[1]
      
      // Extract content if provided
      let content = "// New file created by AI Assistant\n"
      const contentMatch = currentInput.match(/(?:with|containing|that says?)\s+(.+)/i)
      if (contentMatch) {
        content = contentMatch[1].replace(/[\"\']/g, '')
      }
      
      // Determine file type and add appropriate content
      const extension = fileName.split('.').pop()?.toLowerCase()
      switch (extension) {
        case 'js':
        case 'jsx': {
          content = contentMatch ? contentMatch[1].replace(/[\"\']/g, '') : `// ${fileName}\nconsole.log('Hello from ${fileName}');`
          break
        }
        case 'ts':
        case 'tsx': {
          content = contentMatch ? contentMatch[1].replace(/[\"\']/g, '') : `// ${fileName}\nconsole.log('Hello from ${fileName}');`
          break
        }
        case 'py': {
          content = contentMatch ? contentMatch[1].replace(/[\"\']/g, '') : `# ${fileName}\nprint('Hello from ${fileName}')`
          break
        }
        case 'java': {
          const className = fileName.replace('.java', '')
          content = contentMatch ? contentMatch[1].replace(/[\"\']/g, '') : `public class ${className} {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from ${className}\");\n    }\n}`
          break
        }
        case 'html': {
          content = contentMatch ? contentMatch[1].replace(/[\"\']/g, '') : `<!DOCTYPE html>\n<html>\n<head>\n    <title>${fileName}</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>`
          break
        }
        case 'css': {
          content = contentMatch ? contentMatch[1].replace(/[\"\']/g, '') : `/* ${fileName} */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}`
          break
        }
        case 'md': {
          content = contentMatch ? contentMatch[1].replace(/[\"\']/g, '') : `# ${fileName.replace('.md', '')}\n\nHello world`
          break
        }
        default: {
          content = contentMatch ? contentMatch[1].replace(/[\"\']/g, '') : `Hello world`
        }
      }

      try {
        // Create the file
        const newFile: UserFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: fileName,
          content: content,
          type: extension || 'text',
          size: content.length,
          lastModified: new Date().toISOString(),
          projectId: selectedRepo?.id || 'default',
          userId: user?.id || 'anonymous'
        }

        // Update state
        setUserFiles(prev => [...prev, newFile])
        
        // Store in localStorage
        const updatedFiles = [...userFiles, newFile]
        localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles))

        // Create project if none exists
        if (userProjects.length === 0) {
          const project: Project = {
            id: `project_${Date.now()}`,
            name: 'My Project',
            fileCount: 1,
            uploadedAt: new Date().toISOString(),
            branch: 'main'
          }
          setUserProjects([project])
          setSelectedRepo(project)
          localStorage.setItem('uploadedProjects', JSON.stringify([project]))
        }

        const successMessage: Message = {
          role: "assistant",
          content: `✅ Successfully created ${fileName}! The file has been added to your project. You can now:\n\n• Click on the file in the Files tab to edit it\n• Ask me to modify or add more content\n• Create additional files\n\nWhat would you like to do next?`,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, successMessage])
        return
      } catch (error) {
        console.error('File creation error:', error)
        const errorMessage: Message = {
          role: "assistant",
          content: `❌ Sorry, I couldn't create the file ${fileName}. Please try again.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        return
      }
    }

    // Check if user has no files and wants to create something (but didn't specify a filename)
    if (userFiles.length === 0 && (
      currentInput.toLowerCase().includes('create') ||
      currentInput.toLowerCase().includes('make') ||
      currentInput.toLowerCase().includes('build') ||
      currentInput.toLowerCase().includes('new file')
    )) {
      const helpMessage: Message = {
        role: "assistant",
        content: "I'd be happy to help you create files! To create a file, just tell me:\n\n**\"Create a file called [filename]\"**\n\nFor example:\n• \"Create a file called app.js\"\n• \"Create a file called index.html\"\n• \"Create a file called readme.md and say hello world\"\n\nI can create files in many languages: JavaScript, TypeScript, Python, Java, HTML, CSS, and more!",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, helpMessage])
      return
    }

    try {
      // Prepare context with user's files
      const fileContext = userFiles.map(file => `${file.name}: ${file.type || 'file'}`).join('\n')
      const contextualPrompt = userFiles.length > 0 
        ? `User has these files: ${fileContext}\n\nUser request: ${currentInput}`
        : currentInput

      // Make actual API call to Blackbox
      const response = await fetch('/api/blackbox/suggest-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: 'chat',
          code: contextualPrompt,
          errors: [],
          userId: user?.id || 'anonymous'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const result = await response.json()
      
      const aiMessage: Message = {
        role: "assistant",
        content: result.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI response error:', error)
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm experiencing some technical difficulties. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
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
            
            {selectedRepo && (
              <div className="hidden md:flex items-center gap-2 text-sm text-pink-300">
                <span>•</span>
                <span>{selectedRepo.name}</span>
                <GitBranch className="h-3 w-3" />
                <span>{selectedRepo.branch || 'main'}</span>
              </div>
            )}
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
          <Tabs value="files" onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="bg-gray-800/50 border-b border-gray-700 rounded-none justify-start px-4 py-2">
              <TabsTrigger value="repos" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                <Folder className="h-4 w-4 mr-2" />
                Explorer
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
                  {userProjects.length > 0 ? (
                    userProjects.map((project) => (
                      <Card
                        key={project.id}
                        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                          selectedRepo?.id === project.id
                            ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20"
                            : "bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500"
                        }`}
                        onClick={() => setSelectedRepo(project)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Folder className="h-4 w-4 text-blue-400" />
                            <span className="font-medium">{project.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <GitBranch className="h-3 w-3" />
                            <span>{project.branch || 'main'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{project.fileCount || 0} files</span>
                            <span>{new Date(project.uploadedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2">
                            <Badge className="text-xs bg-green-600/20 text-green-400 border-green-500/30">
                              active
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No projects uploaded yet</p>
                      <p className="text-sm mt-2">Upload files to create your first project</p>
                    </div>
                  )}
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
                  
                  {userFiles.length > 0 ? (
                    <div className="space-y-2">
                      {userFiles.map((file) => (
                        <Card
                          key={file.id}
                          className="cursor-pointer transition-all duration-300 hover:scale-105 bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500"
                          onClick={() => {
                            const projectId = file.projectId || selectedRepo?.id || 'default';
                            router.push(`/module/${projectId}?fileId=${file.id}`);
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <Code2 className="h-4 w-4 text-blue-400" />
                              <span className="font-medium text-sm">{file.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                              <span>{file.type || 'file'}</span>
                              <span>{file.size ? `${Math.round(file.size / 1024)}KB` : ''}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No files uploaded yet</p>
                      <p className="text-sm mt-2">Upload files to start coding</p>
                    </div>
                  )}
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

          <ScrollArea className="flex-1 p-4 h-[calc(100vh-300px)]">
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
              onFileUpload={async (files: FileList) => {
                console.log('Files uploaded:', files)
                
                // Convert FileList to Array and process uploaded files
                const filesArray = Array.from(files)
                const processedFiles: UserFile[] = filesArray.map((file: File) => ({
                  id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  uploadedAt: new Date().toISOString(),
                  content: null, // Will be populated when file is opened
                  lastModified: new Date().toISOString(),
                  projectId: selectedRepo?.id || 'default',
                  userId: user?.id || 'anonymous'
                }))

                // Update state
                setUserFiles(prev => [...prev, ...processedFiles])
                
                // Store in localStorage
                const updatedFiles = [...userFiles, ...processedFiles]
                localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles))

                // Create/update project
                const projectId = `project_${Date.now()}`
                const project: Project = {
                  id: projectId,
                  name: files.length > 1 ? `Project ${new Date().toLocaleDateString()}` : files[0].name.split('.')[0],
                  fileCount: files.length,
                  uploadedAt: new Date().toISOString(),
                  branch: 'main'
                }

                setUserProjects(prev => [...prev, project])
                localStorage.setItem('uploadedProjects', JSON.stringify([...userProjects, project]))

                // Update AI assistant with success message
                const successMessage: Message = {
                  role: "assistant",
                  content: `Great! I've successfully uploaded ${files.length} file(s). I can now help you analyze your code, suggest improvements, create new files, and fix bugs. What would you like to work on?`,
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, successMessage])

                setShowFileUpload(false)
              }}
              acceptedTypes={['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json', 'md']}
              maxFileSize={50 * 1024 * 1024}
              maxFiles={100}
            />
          </div>
        </div>
      )}
    </div>
  )
}