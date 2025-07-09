// Blackbox API client for streaming chat (server-side only)

export const bb = {
  chat: {
    async create({ sid, prompt, agent }: { sid: string; prompt: string; agent: string }) {
      // Ensure the API key is available (server-side only)
      const apiKey = process.env.BLACKBOX_API_KEY
      if (!apiKey) {
        throw new Error("BLACKBOX_API_KEY is not set. Please set it in your environment variables (e.g., Netlify dashboard or .env file).")
      }
      const res = await fetch("https://api.blackboxai.dev/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ sid, prompt, agent }),
      })
      if (!res.body) throw new Error("No response body from Blackbox API")
      return res.body as ReadableStream<Uint8Array>
    },
  },
}
