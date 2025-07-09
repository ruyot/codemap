// Minimal Blackbox API client for streaming chat

export const bb = {
  chat: {
    async create({ model, messages, stream }: { model: string; messages: any[]; stream?: boolean }) {
      const res = await fetch("/api/blackbox/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream }),
      })
      if (!res.body) throw new Error("No response body from Blackbox API")
      return res.body
    },
  },
}
