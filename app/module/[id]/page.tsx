"use client"

import { useParams, useSearchParams } from "next/navigation"
import EnhancedModuleEditor from "@/components/enhanced-module-editor"

export default function ModulePage() {
  const params = useParams()
  const moduleId = params.id as string
  const searchParams = useSearchParams()
  const initialFileId = searchParams.get("fileId") || undefined

  return <EnhancedModuleEditor moduleId={moduleId} initialFileId={initialFileId} />
}
