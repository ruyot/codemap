import FileExplorer from "./file-explorer"
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage"
import { useState } from "react"

export default function StorageExplorerExample({ userId }: { userId: string }) {
  const storage = useSupabaseStorage(userId)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  return (
    <FileExplorer
      files={storage.files.map(f => ({
        id: f.name,
        name: f.name,
        type: "file",
        path: f.name,
        size: f.size,
      }))}
      onFileSelect={file => setSelectedFile(file.id)}
      onFileCreate={() => {}}
      onFileDelete={() => {}}
      onFileRename={() => {}}
      onFileUpload={async (files) => {
        await storage.uploadFiles(Array.from(files))
      }}
      onFileDownload={async (file) => {
        const blob = await storage.downloadFile(file.name)
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
      }}
      userId={userId}
    />
  )
}
