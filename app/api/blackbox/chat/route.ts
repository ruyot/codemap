import { NextResponse } from "next/server"
import { bb } from "@/lib/blackbox"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  // Debug: log if the API key is present
  console.log("BLACKBOX_API_KEY present:", !!process.env.BLACKBOX_API_KEY)

  const { prompt, agent = "VscodeAgent", sid } = await request.json()
  // Generate a session id if not provided
  const sessionId = sid || uuidv4()
  const stream = await bb.chat.create({ sid: sessionId, prompt, agent })
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
