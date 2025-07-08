"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles, User } from "lucide-react"

interface FileAIChatProps {
  codeContext: string
  fileName: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function FileAIChat({ codeContext, fileName }: FileAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hello! I am your AI assistant for ${fileName}. You can ask me to analyze, improve, or fix the code in this file.`,
        timestamp: new Date()
      }])
    }
  }, [fileName, messages.length])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Prepare prompt with code context and user input
      const prompt = `Here is the code from ${fileName}:\n\n${codeContext}\n\nUser question or request:\n${userMessage.content}`

      const response = await fetch('/api/blackbox/suggest-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: fileName,
          code: prompt,
          errors: [],
          userId: 'anonymous'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const result = await response.json()
      const aiContent = result.choices?.[0]?.message?.content || "Sorry, I couldn't process that request."

      const aiMessage: Message = {
        role: "assistant",
        content: aiContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "There was an error processing your request. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <h2 className="text-lg font-semibold">AI Assistant - {fileName}</h2>
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
            </div>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask AI about this file..."
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
          onKeyDown={e => e.key === "Enter" && sendMessage()}
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
