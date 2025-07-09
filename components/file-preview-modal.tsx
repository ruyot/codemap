"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, 
  Code2, 
  FileText, 
  Download, 
  ExternalLink,
  Copy,
  Check,
  X
} from "lucide-react"
// Using a simple code block instead of external syntax highlighter

interface FilePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string | null
  filePath: string | null
}

interface FileData {
  content: string
  language: string
  size: number
  lastModified: string
  lines: number
}

export default function FilePreviewModal({ 
  open, 
  onOpenChange, 
  fileId, 
  filePath 
}: FilePreviewModalProps) {
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")

  useEffect(() => {
    if (open && filePath) {
      loadFileData()
    }
  }, [open, filePath])

  const loadFileData = async () => {
    if (!filePath) return

    setLoading(true)
    try {
      const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`)
      if (response.ok) {
        const data = await response.json()
        setFileData({
          content: data.content,
          language: getLanguageFromPath(filePath),
          size: data.content.length,
          lastModified: new Date().toISOString(),
          lines: data.content.split('\n').length
        })
      }
    } catch (error) {
      console.error('Failed to load file:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'tsx': 'typescript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'js': 'javascript',
      'py': 'python',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml'
    }
    return languageMap[ext || ''] || 'text'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyToClipboard = async () => {
    if (!fileData?.content) return
    
    try {
      await navigator.clipboard.writeText(fileData.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const openInEditor = () => {
    if (fileId) {
      window.open(`/module/${fileId}`, '_blank')
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-gray-900 text-white border-gray-700">
        <DialogHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-400" />
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {filePath?.split('/').pop() || 'File Preview'}
                </DialogTitle>
                <p className="text-sm text-gray-400">{filePath}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {fileData && (
                <>
                  <Badge className="bg-blue-600/20 text-blue-400">
                    {fileData.language}
                  </Badge>
                  <Badge className="bg-gray-600/20 text-gray-400">
                    {formatFileSize(fileData.size)}
                  </Badge>
                  <Badge className="bg-green-600/20 text-green-400">
                    {fileData.lines} lines
                  </Badge>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading file...</p>
            </div>
          </div>
        ) : fileData ? (
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <TabsList className="bg-gray-800">
                  <TabsTrigger value="preview" className="data-[state=active]:bg-gray-700">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="data-[state=active]:bg-gray-700">
                    <Code2 className="h-4 w-4 mr-2" />
                    Raw
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={copyToClipboard}
                    className="text-sm bg-gray-700 hover:bg-gray-600"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={openInEditor}
                    className="text-sm bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Editor
                  </Button>
                </div>
              </div>

              <TabsContent value="preview" className="flex-1 mt-4">
                <ScrollArea className="h-full">
                  <div className="rounded-lg overflow-hidden bg-gray-800">
                    <div className="flex">
                      <div className="bg-gray-700 px-3 py-2 text-xs text-gray-400 border-r border-gray-600 min-w-[3em] text-right">
                        {fileData.content.split('\n').map((_, index) => (
                          <div key={index} className="leading-6">
                            {index + 1}
                          </div>
                        ))}
                      </div>
                      <pre className="flex-1 p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                        <code className={`language-${fileData.language}`}>
                          {fileData.content}
                        </code>
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="raw" className="flex-1 mt-4">
                <ScrollArea className="h-full">
                  <pre className="bg-gray-800 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                    {fileData.content}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load file</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
