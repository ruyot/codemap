import { NextResponse } from "next/server"
import { bb } from "@/lib/blackbox"

export async function POST(request: Request) {
  const { messages } = await request.json()
  // Directly call the real Blackbox API via the client
  const stream = await bb.chat.create({ model: "blackbox-chat-1", messages, stream: true })
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
