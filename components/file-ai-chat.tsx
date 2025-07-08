"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles, User, FileText, Download, Upload } from "lucide-react"
import { useBlackbox } from "@/hooks/use-blackbox"
import { supabase } from "@/lib/supabaseClient"
import { FileManager, FileNode } from "@/lib/file-manager"

interface FileAIChatProps {
  codeContext: string
  fileName: string
  onFileCreated?: (file: { name: string; content: string; type: string }) => void
  projectId?: string
  fileManager?: FileManager
}

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  metadata?: {
    fileCreated?: { name: string; content: string; type: string }
    action?: string
    files?: FileNode[]
  }
}

export default function FileAIChat({ 
  codeContext, 
  fileName, 
  onFileCreated, 
  projectId = 'default',
  fileManager 
}: FileAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string>('anonymous')
  
  const { suggestFix, loading: isLoading, error } = useBlackbox({
    onError: (error) => {
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error.message}. Please try again later.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  })

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
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hello! I am your AI assistant for ${fileName}. I can help you with:\n\n• **Code Analysis**: Review and improve your code\n• **File Creation**: Create new files and components\n• **Bug Fixing**: Identify and fix issues\n• **Code Generation**: Generate new code snippets\n• **File Operations**: Upload, download, and manage files\n\nJust ask me anything!`,
        timestamp: new Date()
      }])
    }
  }, [fileName, messages.length])

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
    } catch (error) {
      console.error('Error creating file:', error)
      throw error
    }
  }

  // Function to parse AI response for file creation requests
  const parseAIResponse = (content: string) => {
    // Look for file creation patterns in AI response
    const fileCreationPattern = /```(\w+):([^\n]+)\n([\s\S]*?)```/g
    const files: Array<{ name: string; content: string; type: string }> = []
    
    let match
    while ((match = fileCreationPattern.exec(content)) !== null) {
      const [, type, name, content] = match
      files.push({ name, content, type })
    }

    return files
  }

  // Function to handle file uploads
  const handleFileUpload = async (files: FileList) => {
    try {
      if (fileManager) {
        const uploadedFiles = await fileManager.uploadFiles(files)
        const fileList = uploadedFiles.map(f => f.name).join(', ')
        
        const uploadMessage: Message = {
          role: "assistant",
          content: `✅ **Files uploaded successfully!**\n\nUploaded: ${fileList}\n\nThe files have been added to your project and are now available in the file explorer.`,
          timestamp: new Date(),
          metadata: {
            action: 'files_uploaded',
            files: uploadedFiles
          }
        }
        setMessages(prev => [...prev, uploadMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ **Upload failed**: ${error}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Function to handle file downloads
  const handleFileDownload = (file: FileNode) => {
    try {
      if (fileManager) {
        fileManager.downloadFile(file)
        
        const downloadMessage: Message = {
          role: "assistant",
          content: `✅ **File downloaded**: \`${file.name}\`\n\nThe file has been downloaded to your computer.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, downloadMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ **Download failed**: ${error}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput("")

    try {
      // Check for special commands
      const lowerInput = input.toLowerCase()
      
      if (lowerInput.includes('upload') || lowerInput.includes('import')) {
        // Handle file upload request
        const uploadMessage: Message = {
          role: "assistant",
          content: `To upload files, you can:\n\n1. **Drag and drop** files into the file explorer\n2. **Click the upload button** in the file explorer\n3. **Use the file menu** to select files\n\nI can help you with the uploaded files once they're in your project!`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, uploadMessage])
        return
      }

      if (lowerInput.includes('download') || lowerInput.includes('export')) {
        // Handle file download request
        const downloadMessage: Message = {
          role: "assistant",
          content: `To download files:\n\n1. **Right-click** on any file in the file explorer\n2. **Select "Download"** from the context menu\n3. **Or use the file menu** to download files\n\nI can help you download specific files if you tell me which ones!`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, downloadMessage])
        return
      }

      // Prepare prompt with code context and user input
      const prompt = `Here is the code from ${fileName}:\n\n${codeContext}\n\nUser question or request:\n${userMessage.content}\n\nIf the user asks you to create a file, respond with the file content in this format:\n\`\`\`language:filename.ext\nfile content here\n\`\`\`\n\nYou can create any type of file: React components, utilities, styles, configuration files, etc.`

      // Use the hook instead of direct fetch
      const result = await suggestFix(fileName, prompt, [])
      
      if (result && result.choices && result.choices[0]?.message?.content) {
        const aiContent = result.choices[0].message.content
        
        // Check if AI wants to create files
        const filesToCreate = parseAIResponse(aiContent)
        
        let finalContent = aiContent
        let metadata: Message['metadata'] = {}

        if (filesToCreate.length > 0) {
          // Create files
          for (const file of filesToCreate) {
            try {
              await createFile(file.name, 'file', file.content)
              finalContent += `\n\n✅ **File created**: \`${file.name}\`\nThe file has been added to your project!`
              metadata.fileCreated = file
            } catch (error) {
              finalContent += `\n\n❌ **Error creating file**: \`${file.name}\`\n${error}`
            }
          }
          metadata.action = 'files_created'
        }

        const aiMessage: Message = {
          role: "assistant",
          content: finalContent,
          timestamp: new Date(),
          metadata
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error("Invalid response format from AI")
      }
    } catch (error: any) {
      // Error handling is done in the hook's onError callback
      console.error('Chat error:', error)
    }
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
        {messages.map((msg, idx) => (
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
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {msg.metadata?.fileCreated && (
                <FileText className="h-3 w-3 text-green-400" />
              )}
              {msg.metadata?.action === 'files_uploaded' && (
                <Upload className="h-3 w-3 text-blue-400" />
              )}
            </div>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="p-3 rounded-lg bg-gray-700/50 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
              <span className="text-xs text-gray-400">AI is thinking...</span>
            </div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask AI to create files, analyze code, or help with anything..."
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={isLoading}
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
