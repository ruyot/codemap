"use client"

import { useParams } from "next/navigation"
import EnhancedModuleEditor from "@/components/enhanced-module-editor"

export default function ModulePage() {
  const params = useParams()
  const moduleId = params.id as string

  return <EnhancedModuleEditor moduleId={moduleId} />
}
