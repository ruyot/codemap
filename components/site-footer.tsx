"use client"

import { Github, Twitter, MessageCircle } from "lucide-react"

export default function SiteFooter() {
  return (
    <footer className="bg-black py-12 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex justify-center gap-6 mb-6">
          <a href="https://github.com" aria-label="GitHub" className="text-gray-400 hover:text-white transition-colors">
            <Github className="h-6 w-6" />
          </a>
          <a
            href="https://twitter.com"
            aria-label="Twitter"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Twitter className="h-6 w-6" />
          </a>
          <a
            href="https://discord.com"
            aria-label="Discord"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
          </a>
        </div>

        <p className="text-gray-400">Built by devs for devs.</p>
      </div>
    </footer>
  )
}
