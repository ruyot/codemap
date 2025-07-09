"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw, Maximize2, Minimize2 } from "lucide-react"

interface PreviewPanelProps {
  content: string
  fileType: string
  onRefresh?: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}

export default function PreviewPanel({
  content,
  fileType,
  onRefresh,
  onToggleFullscreen,
  isFullscreen = false
}: PreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [content])

  // Handle different file types
  const renderContent = () => {
    switch(fileType) {
      case 'html':
        return (
          <iframe
            ref={iframeRef}
            srcDoc={content}
            className="w-full h-full border-0 bg-white"
            onLoad={() => setIsLoading(false)}
          />
        )
      case 'css':
      case 'javascript':
      case 'typescript':
        return (
          <div className="p-4 bg-gray-900 text-gray-100 overflow-auto h-full">
            <pre className="text-sm">{content}</pre>
          </div>
        )
      default:
        return (
          <div className="p-4 bg-gray-900 text-gray-100 overflow-auto h-full">
            <pre className="text-sm">{content}</pre>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 border-t border-gray-700">
      <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700">
        <div className="text-sm font-medium text-gray-300">
          Preview
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  )
}
