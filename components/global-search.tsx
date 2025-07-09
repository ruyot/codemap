"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files?: string[]
  onFileSelect?: (file: string) => void
}

const mockFiles = [
  "app/page.tsx",
  "components/code-canvas.tsx",
  "components/terminal.tsx",
  "components/cyberpunk-app-shell.tsx",
  "lib/supabaseClient.ts",
  "app/api/file/route.ts",
  "app/api/module/[id]/route.ts",
  "app/layout.tsx",
  "package.json",
  "netlify.toml",
]

export default function GlobalSearch({ open, onOpenChange, files = mockFiles, onFileSelect }: GlobalSearchProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredFiles, setFilteredFiles] = useState<string[]>(files)

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredFiles(files)
    } else {
      setFilteredFiles(
        files.filter((file) =>
          file.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
  }, [searchTerm, files])

  const handleFileClick = (file: string) => {
    if (onFileSelect) {
      onFileSelect(file)
    }
    
    // Extract module ID or use file path to generate one
    const moduleId = file.replace(/[/.]/g, '_')
    
    // Navigate to the module route
    router.push(`/module/${moduleId}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full bg-gray-900 text-white border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Global Search</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          className="mb-4 bg-gray-800 text-white border-gray-700"
        />
        <ScrollArea className="max-h-60">
          {filteredFiles.length === 0 ? (
            <p className="text-center text-gray-400">No files found.</p>
          ) : (
            filteredFiles.map((file) => (
              <Button
                key={file}
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => handleFileClick(file)}
              >
                {file}
              </Button>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
