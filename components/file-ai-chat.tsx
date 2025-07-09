"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles, User, FileText, Download, Upload } from "lucide-react"
import { useChat } from "@/hooks/useChat"
import { supabase } from "@/lib/supabaseClient"
import { FileManager, FileNode } from "@/lib/file-manager"

interface FileAIChatProps {
  codeContext: string
  fileName: string
  onFileCreated?: (file: { name: string; content: string; type: string }) => void
  projectId?: string
  fileManager?: FileManager
}

export default function FileAIChat({
  codeContext,
  fileName,
  onFileCreated,
  projectId = 'default',
  fileManager
}: FileAIChatProps) {
  const { history, streamedReply, sendMessage } = useChat({ userFiles: fileManager ? fileManager.getFiles().map(f => f.name) : [] })
  const [input, setInput] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string>('anonymous')

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id)
      } else {
        setCurrentUserId('anonymous')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (history.length === 0) {
      // Send initial greeting message
      const initialMessage = `Hello! I am your AI assistant for ${fileName}. I can help you with:\n\n• **Code Analysis**: Review and improve your code\n• **File Creation**: Create new files and components\n• **Bug Fixing**: Identify and fix issues\n• **Code Generation**: Generate new code snippets\n• **File Operations**: Upload, download, and manage files\n\nJust ask me anything!`
      sendMessage(initialMessage)
    }
  }, [fileName, history.length, sendMessage])

  // Function to create a file using file manager
  const createFile = async (fileName: string, type: 'file' | 'directory' = 'file', content: string = '') => {
    try {
      if (fileManager) {
        // Use file manager if available
        const newFile = await fileManager.createFile(fileName, type, content)

        // Notify parent component
        if (onFileCreated) {
          onFileCreated({
            name: newFile.name,
            content: newFile.content || '',
            type: newFile.language || 'text'
          })
        }

        return newFile
      } else {
        // Fallback to API
        const response = await fetch('/api/blackbox/create-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            content,
            projectId,
            userId: currentUserId
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create file')
        }

        const result = await response.json()

        // Notify parent component
        if (onFileCreated) {
          onFileCreated({
            name: fileName,
            content: content,
            type: fileName.split('.').pop() || 'text'
          })
        }

        return result
      }
    } catch (err) {
      console.error('Error creating file:', err)
      throw err
    }
  }

  // Function to parse AI response for file creation or code blocks
  const parseAIResponse = (content: string) => {
    // 1. Try to match triple-backtick file blocks: ```lang:filename\ncode```
    const fileBlockPattern = /```(\w+):([^\n]+)\n([\s\S]*?)```/g
    const files: Array<{ name: string; content: string; type: string }> = []
    let match
    while ((match = fileBlockPattern.exec(content)) !== null) {
      const [, type, name, code] = match
      files.push({ name: name.trim(), content: code.trim(), type })
    }
    // 2. If no file blocks, look for generic code blocks: ```lang\ncode```
    if (files.length === 0) {
      const codeBlockPattern = /```(\w+)\n([\s\S]*?)```/g
      let codeMatch
      let i = 1
      while ((codeMatch = codeBlockPattern.exec(content)) !== null) {
        const [, type, code] = codeMatch
        // Try to find a file name in the text before the code block
        const before = content.slice(0, codeMatch.index)
        const fileNameMatch = before.match(/(?:file(?: name)?(?: called)?|create|add|make)[^\n]*([\w-]+\.[\w]+)/i)
        const name = fileNameMatch ? fileNameMatch[1] : `ai-generated-${i}.${type}`
        files.push({ name, content: code.trim(), type })
        i++
      }
    }
    return files
  }

  // Function to handle file uploads
  const handleFileUpload = async (files: FileList) => {
    try {
      if (fileManager) {
        const uploadedFiles = await fileManager.uploadFiles(files)
        const fileList = uploadedFiles.map(f => f.name).join(', ')

        const uploadMessage = `✅ **Files uploaded successfully!**\n\nUploaded: ${fileList}\n\nThe files have been added to your project and are now available in the file explorer.`
        sendMessage(uploadMessage)
      }
    } catch (err) {
      const errorMessage = `❌ **Upload failed**: ${err}`
      sendMessage(errorMessage)
    }
  }

  // Function to handle file downloads
  const handleFileDownload = (file: FileNode) => {
    try {
      if (fileManager) {
        fileManager.downloadFile(file)

        const downloadMessage = `✅ **File downloaded**: \`${file.name}\`\n\nThe file has been downloaded to your computer.`
        sendMessage(downloadMessage)
      }
    } catch (err) {
      const errorMessage = `❌ **Download failed**: ${err}`
      sendMessage(errorMessage)
    }
  }

  // New send handler
  const handleSend = async () => {
    if (!input.trim()) return
    await sendMessage(input)
    setInput("")
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <h2 className="text-lg font-semibold">AI Assistant - {fileName}</h2>
        {currentUserId !== 'anonymous' && (
          <span className="text-xs text-gray-400 ml-auto">Connected</span>
        )}
      </div>
      <ScrollArea className="flex-1 p-4 space-y-4 overflow-y-auto">
        {history.slice(2).map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-600/20 ml-4" : "bg-gray-700/50 mr-4"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.role === "assistant" ? (
                <Sparkles className="h-4 w-4 text-purple-400" />
              ) : (
                <User className="h-4 w-4 text-blue-400" />
              )}
              <span className="text-xs text-gray-400">
                {/* No timestamp in new chat, could add if needed */}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {streamedReply && (
          <div className="p-3 rounded-lg bg-gray-700/50 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
              <span className="text-xs text-gray-400">AI is thinking...</span>
            </div>
            <p className="whitespace-pre-wrap">{streamedReply}</p>
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask AI to create files, analyze code, or help with anything..."
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}