import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/hooks/use-toast"

export interface FileMetadata {
  name: string
  size: number
  updatedAt: string
}

export function useSupabaseStorage(userId: string) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(false)

  const bucket = `user-${userId}`
  const workspacePath = "workspace/"

  const refreshList = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.storage.from(bucket).list(workspacePath, { limit: 100 })
    if (error) {
      setFiles([])
      setLoading(false)
      toast({ title: "Failed to fetch files", description: error.message })
      return
    }
    setFiles(
      (data ?? []).map((f: any) => ({
        name: f.name,
        size: f.metadata?.size ?? 0,
        updatedAt: f.updated_at,
      }))
    )
    setLoading(false)
  }, [bucket])

  const uploadFiles = useCallback(
    async (fileList: File[]) => {
      setLoading(true)
      const results = await Promise.all(
        fileList.map(async (file) => {
          const { error } = await supabase.storage
            .from(bucket)
            .upload(workspacePath + file.name, file, { upsert: true })
          return { file, error }
        })
      )
      setLoading(false)
      await refreshList()
      const failed = results.filter(r => r.error)
      if (failed.length > 0) {
        toast({ title: "Some files failed to upload", description: failed.map(f => f.file.name).join(", ") })
      } else {
        toast({ title: `Uploaded ${results.length} file(s)` })
      }
      return results
    },
    [bucket, refreshList]
  )

  const downloadFile = useCallback(
    async (name: string) => {
      const { data, error } = await supabase.storage.from(bucket).download(workspacePath + name)
      if (error) {
        toast({ title: `Download failed: ${name}`, description: error.message })
        throw error
      }
      return data as Blob
    },
    [bucket]
  )

  const deleteFile = useCallback(
    async (name: string) => {
      const { error } = await supabase.storage.from(bucket).remove([workspacePath + name])
      if (error) {
        toast({ title: `Delete failed: ${name}`, description: error.message })
        throw error
      }
      await refreshList()
      toast({ title: `Deleted ${name}` })
    },
    [bucket, refreshList]
  )

  useEffect(() => {
    refreshList()
  }, [refreshList])

  return { files, loading, uploadFiles, downloadFile, deleteFile, refreshList }
}
