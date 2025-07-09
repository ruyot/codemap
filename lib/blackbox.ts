// Blackbox API client for streaming chat (server-side only)

export const bb = {
  chat: {
    async create({ sid, prompt, agent }: { sid: string; prompt: string; agent: string }) {
      const res = await fetch("https://api.blackboxai.dev/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The API key should be set in the API route, not here if this is ever used client-side
          ...(process.env.BLACKBOX_API_KEY ? { "Authorization": `Bearer ${process.env.BLACKBOX_API_KEY}` } : {})
        },
        body: JSON.stringify({ sid, prompt, agent }),
      })
      if (!res.body) throw new Error("No response body from Blackbox API")
      return res.body as ReadableStream<Uint8Array>
    },
  },
}
