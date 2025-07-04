"use client"

import { useEffect, useRef } from "react"

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>{}[]();=+-*/&|^%$#@!~`"
    const codeSnippets = [
      "function()",
      "const x =",
      "if (true)",
      "return;",
      "import {",
      "export",
      "async/await",
      "useState",
      "useEffect",
      "git commit",
      "npm install",
      "docker run",
    ]

    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * canvas.height
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#00ff41"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const isCodeSnippet = Math.random() < 0.1
        const text = isCodeSnippet
          ? codeSnippets[Math.floor(Math.random() * codeSnippets.length)]
          : chars[Math.floor(Math.random() * chars.length)]

        ctx.fillStyle = isCodeSnippet ? "#60a5fa" : "#00ff41"
        ctx.fillText(text, i * fontSize, drops[i])

        if (drops[i] > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i] += fontSize
      }
    }

    const interval = setInterval(draw, 50)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-30" style={{ background: "transparent" }} />
}
