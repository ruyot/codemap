"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import CodeCanvas from "@/components/code-canvas"
import GitCommandPalette from "@/components/git-command-palette"
import { Folder, GitBranch, MessageSquare, LogOut, Terminal } from "lucide-react"
import { useBlackboxChat } from "@/hooks/use-blackbox"
import { Repository } from "@/types"

interface AppShellProps {
  onSignOut: () => void
}

const mockRepos: Repository[] = [
  { 
    id: "1",
    name: "my-react-app", 
    owner: "user",
    branch: "main", 
    status: "active",
    modules: []
  },
  { 
    id: "2",
    name: "api-server", 
    owner: "user",
    branch: "develop", 
    status: "modified",
    modules: []
  },
  { 
    id: "3",
    name: "mobile-app", 
    owner: "user",
    branch: "feature/auth", 
    status: "clean",
    modules: []
  },
  { 
    id: "4",
    name: "data-pipeline", 
    owner: "user",
    branch: "main", 
    status: "active",
    modules: []
  },
]

export default function AppShell({ onSignOut }: AppShellProps) {
  const [selectedRepo, setSelectedRepo] = useState(mockRepos[0])
  const [chatInput, setChatInput] = useState("")
  const [gitPaletteOpen, setGitPaletteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [openTabs, setOpenTabs] = useState([mockRepos[0]])

  const blackboxChat = useBlackboxChat()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault()
        setGitPaletteOpen(true)
      }
      
      if (event.key === 'Escape') {
        setGitPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const message = chatInput
    setChatInput("")

    try {
      await blackboxChat.sendMessage(message, {
        repo: selectedRepo,
        filePath: 'current-context'
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const openRepoInNewTab = (repo: Repository) => {
    if (!openTabs.find(tab => tab.id === repo.id)) {
      setOpenTabs([...openTabs, repo])
    }
    setActiveTab(openTabs.length)
    setSelectedRepo(repo)
  }

  const closeTab = (index: number) => {
    const newTabs = openTabs.filter((_, i) => i !== index)
    setOpenTabs(newTabs)
    
    if (index === activeTab && newTabs.length > 0) {
      const newActiveIndex = Math.min(activeTab, newTabs.length - 1)
      setActiveTab(newActiveIndex)
      setSelectedRepo(newTabs[newActiveIndex])
    }
  }

  return (
    <>
      <div className="h-screen bg-white text-black flex flex-col">
        {/* Tab Bar */}
        {openTabs.length > 1 && (
          <div className="bg-white border-b border-gray-300 flex items-center px-4">
            {openTabs.map((tab, index) => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-3 py-2 border-r border-gray-300 cursor-pointer ${
                  index === activeTab ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setActiveTab(index)
                  setSelectedRepo(tab)
                }}
              >
                <span className="text-sm text-black">{tab.name}</span>
                {openTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(index)
                    }}
                    className="text-gray-600 hover:text-black"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 flex">
          {/* Left Panel - Repository Menu */}
          <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Code Map</h2>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setGitPaletteOpen(true)}
                  className="text-black hover:text-gray-700"
                  title="Git Command Palette (⌘+P)"
                  variant="ghost"
                >
                  <Terminal className="h-4 w-4" />
                </Button>
                <Button onClick={onSignOut} className="text-black hover:text-gray-700" variant="ghost">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Repositories</h3>
              <div className="space-y-2">
                {mockRepos.map((repo) => (
                  <Card
                    key={repo.name}
                    className={`cursor-pointer transition-colors ${
                      selectedRepo.name === repo.name
                        ? "bg-blue-100 border-blue-300"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => openRepoInNewTab(repo)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Folder className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-black">{repo.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GitBranch className="h-3 w-3" />
                        <span>{repo.branch}</span>
                        <span
                          className={`ml-auto px-2 py-1 rounded text-xs ${
                            repo.status === "active"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : repo.status === "modified"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                : "bg-gray-100 text-gray-600 border-gray-300"
                          }`}
                        >
                          {repo.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Center Panel - Code Canvas */}
          <div className="flex-1 bg-white">
            <div className="h-full">
              <CodeCanvas selectedRepo={selectedRepo} />
            </div>
          </div>

          {/* Right Panel - AI Chat */}
          <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
            <div className="p-4 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-black" />
                <h3 className="font-semibold text-black">Blackbox.ai Assistant</h3>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {blackboxChat.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${message.role === "user" ? "bg-blue-100 ml-4" : "bg-gray-100 mr-4"}`}
                  >
                    <p className="text-sm text-black">{message.content}</p>
                    <span className="text-xs text-gray-600">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {blackboxChat.loading && (
                  <div className="p-3 bg-gray-100 mr-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-300">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Blackbox.ai..."
                  className="bg-gray-50 border border-gray-300 text-black"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={blackboxChat.loading}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={blackboxChat.loading || !chatInput.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Git Command Palette */}
      <GitCommandPalette
        open={gitPaletteOpen}
        onOpenChange={setGitPaletteOpen}
        selectedRepo={selectedRepo}
      />
    </>
  )
}
