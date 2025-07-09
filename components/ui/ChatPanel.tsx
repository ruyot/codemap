import { useRef, useEffect } from "react"
import { ChatMessage } from "@/hooks/useChat"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Sparkles, Loader2 } from "lucide-react"

interface ChatPanelProps {
  history: ChatMessage[]
  streamedReply: string
  sendMessage: (text: string) => Promise<void>
}

export function ChatPanel({ history, streamedReply, sendMessage }: ChatPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, streamedReply])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = inputRef.current?.value.trim()
    if (val) {
      await sendMessage(val)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ minHeight: 0 }}
      >
        {history.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-md whitespace-pre-wrap break-words ${
                msg.role === "user"
                  ? "bg-blue-600 text-white ml-auto"
                  : msg.role === "assistant"
                  ? "bg-gray-800 text-purple-200"
                  : "bg-gray-700 text-gray-300"
              } flex items-start gap-2`}
            >
              {msg.role === "assistant" ? (
                <Sparkles className="h-4 w-4 text-purple-400 mt-0.5" />
              ) : msg.role === "user" ? (
                <User className="h-4 w-4 text-blue-200 mt-0.5" />
              ) : null}
              <span>{msg.content}</span>
            </div>
          </div>
        ))}
        {streamedReply && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-md bg-gray-800 text-purple-200 flex items-center gap-2 animate-pulse">
              <Sparkles className="h-4 w-4 text-purple-400 mt-0.5" />
              <span>{streamedReply}</span>
              <span className="animate-blink ml-1 text-purple-400">|</span>
            </div>
          </div>
        )}
      </div>
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-gray-800 flex gap-2 bg-gray-900"
        autoComplete="off"
      >
        <Input
          ref={inputRef}
          className="flex-1 bg-gray-800 text-white border-gray-700 focus:border-blue-500"
          placeholder="Ask AI anything..."
          autoComplete="off"
        />
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Loader2 className="h-4 w-4 animate-spin hidden" />
          Send
        </Button>
      </form>
    </div>
  )
}
