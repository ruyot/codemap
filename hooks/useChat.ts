import { useState, useRef, useCallback } from "react"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

interface UseChatOptions {
  userFiles: string[]
}

export function useChat({ userFiles }: UseChatOptions) {
  const [history, setHistory] = useState<ChatMessage[]>(() => [
    {
      role: "system",
      content:
        "You are an expert AI coding assistant. Help the user with code, answer questions, and provide suggestions. Be concise, helpful, and context-aware.",
    },
    {
      role: "system",
      content: `User uploaded files: ${userFiles.length > 0 ? userFiles.join(", ") : "(none)"}`,
    },
  ])
  const [streamedReply, setStreamedReply] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (text: string) => {
      setHistory((prev) => [...prev, { role: "user", content: text }])
      setStreamedReply("")
      const messages = [
        ...history,
        { role: "user", content: text },
      ]
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      try {
        const res = await fetch("/api/blackbox/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, stream: true }),
          signal: abortRef.current.signal,
        })
        if (!res.body) throw new Error("No response body")
        const reader = res.body.getReader()
        let full = ""
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = new TextDecoder().decode(value)
          setStreamedReply((prev) => prev + chunk)
          full += chunk
        }
        setHistory((prev) => [...prev, { role: "assistant", content: full }])
        setStreamedReply("")
      } catch (e) {
        setStreamedReply("")
        setHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't process your request. Please try again or check your connection.",
          },
        ])
      }
    },
    [history, userFiles]
  )

  return { history, streamedReply, sendMessage }
}
