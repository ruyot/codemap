// Blackbox API client for streaming chat

export const bb = {
  chat: {
    async create({ model, messages, stream }: { model: string; messages: any[]; stream?: boolean }) {
      // Call the real Blackbox API endpoint
      const res = await fetch("https://api.blackbox.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Optionally add your API key here if required by Blackbox
          ...(process.env.BLACKBOX_API_KEY ? { "Authorization": `Bearer ${process.env.BLACKBOX_API_KEY}` } : {})
        },
        body: JSON.stringify({ model, messages, stream }),
      })
      if (!res.body) throw new Error("No response body from Blackbox API")
      return res.body as ReadableStream<Uint8Array>
    },
  },
}
