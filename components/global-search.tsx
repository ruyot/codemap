"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Global Search</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          className="mb-4"
        />
        <ScrollArea className="max-h-60">
          {filteredFiles.length === 0 ? (
            <p className="text-center text-gray-500">No files found.</p>
          ) : (
            filteredFiles.map((file) => (
              <Button
                key={file}
                variant="ghost"
                className="w-full justify-start"
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
