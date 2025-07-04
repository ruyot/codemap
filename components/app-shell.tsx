"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import CodeCanvas from "@/components/code-canvas"
import { Folder, GitBranch, MessageSquare, LogOut } from "lucide-react"

interface AppShellProps {
  onSignOut: () => void
}

const mockRepos = [
  { name: "my-react-app", branch: "main", status: "active" },
  { name: "api-server", branch: "develop", status: "modified" },
  { name: "mobile-app", branch: "feature/auth", status: "clean" },
  { name: "data-pipeline", branch: "main", status: "active" },
]

const mockMessages = [
  { role: "assistant", content: "Hello! I'm your Blackbox.ai coding assistant. How can I help you today?" },
  { role: "user", content: "Can you help me refactor this component?" },
  {
    role: "assistant",
    content: "I'd be happy to help! Please share the component code and I'll suggest improvements.",
  },
]

export default function AppShell({ onSignOut }: AppShellProps) {
  const [selectedRepo, setSelectedRepo] = useState(mockRepos[0])
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState(mockMessages)

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    setMessages([...messages, { role: "user", content: chatInput }])
    setChatInput("")

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I understand. Let me analyze your code and provide suggestions...",
        },
      ])
    }, 1000)
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Left Panel - Repository Menu */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Code Map</h2>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="text-gray-400 hover:text-white">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Repositories</h3>
          <div className="space-y-2">
            {mockRepos.map((repo) => (
              <Card
                key={repo.name}
                className={`cursor-pointer transition-colors ${
                  selectedRepo.name === repo.name
                    ? "bg-blue-600/20 border-blue-500/50"
                    : "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
                }`}
                onClick={() => setSelectedRepo(repo)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Folder className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{repo.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <GitBranch className="h-3 w-3" />
                    <span>{repo.branch}</span>
                    <span
                      className={`ml-auto px-2 py-1 rounded text-xs ${
                        repo.status === "active"
                          ? "bg-green-600/20 text-green-400"
                          : repo.status === "modified"
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "bg-gray-600/20 text-gray-400"
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
      <div className="flex-1 bg-gray-900">
        <div className="h-full">
          <CodeCanvas selectedRepo={selectedRepo} />
        </div>
      </div>

      {/* Right Panel - AI Chat */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold">Blackbox.ai Assistant</h3>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${message.role === "user" ? "bg-blue-600/20 ml-4" : "bg-gray-700/50 mr-4"}`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Blackbox.ai..."
              className="bg-gray-700 border-gray-600 text-white"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} size="sm">
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
