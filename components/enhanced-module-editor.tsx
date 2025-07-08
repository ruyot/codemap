"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Editor } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useBlackbox } from "@/hooks/use-blackbox"
import { 
  ArrowLeft, 
  Save, 
  Play, 
  GitBranch, 
  History, 
  Settings, 
  Zap,
  Eye,
  Code2,
  FileText,
  Sparkles,
  Terminal,
  Bug,
  Wand2
} from "lucide-react"
import FileAIChat from "./file-ai-chat"
import type { ModuleNode } from "@/types"

interface EnhancedModuleEditorProps {
  moduleId: string
}

export default function EnhancedModuleEditor({ moduleId }: EnhancedModuleEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { generateCode, suggestFix, loading } = useBlackbox()
  
  const [module, setModule] = useState<ModuleNode | null>(null)
  const [code, setCode] = useState("")
  const [originalCode, setOriginalCode] = useState("")
  const [errors, setErrors] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isModified, setIsModified] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [showPreview, setShowPreview] = useState(false)
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true)
  
  const editorRef = useRef<any>(null)

  useEffect(() => {
    loadModule()
  }, [moduleId])

  useEffect(() => {
    if (code !== originalCode) {
      setIsModified(true)
      if (aiSuggestionsEnabled) {
        debounceAnalyzeCode()
      }
    } else {
      setIsModified(false)
    }
  }, [code, originalCode, aiSuggestionsEnabled])

  const loadModule = async () => {
    try {
      const [moduleRes, fileRes] = await Promise.all([
        fetch(`/api/module/${moduleId}`),
        fetch(`/api/file?path=${getFilePathFromId(moduleId)}`)
      ])

      if (moduleRes.ok && fileRes.ok) {
        const moduleData = await moduleRes.json()
        const fileData = await fileRes.json()
        
        setModule(moduleData)
        setCode(fileData.content)
        setOriginalCode(fileData.content)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load module",
        variant: "destructive"
      })
    }
  }

  const getFilePathFromId = (id: string): string => {
    const pathMap: Record<string, string> = {
      '1': 'App.tsx',
      '4': 'components/Header.tsx',
      '5': 'components/Footer.tsx'
    }
    return pathMap[id] || 'App.tsx'
  }

  const debounceAnalyzeCode = debounce(async () => {
    if (!code.trim()) return

    try {
      const response = await fetch('/api/groq/flag-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          filePath: module?.filePath || 'unknown.tsx'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setErrors(data.flags || [])
      }
    } catch (error) {
      console.error('Error analyzing code:', error)
    }
  }, 1000)

  // Debounce function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  const handleSave = async () => {
    try {
      // Simulate save operation
      setOriginalCode(code)
      setIsModified(false)
      
      toast({
        title: "Saved",
        description: "File saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save file",
        variant: "destructive"
      })
    }
  }

  const handleAIFix = async () => {
    if (errors.length === 0) return

    try {
      const response = await suggestFix(
        module?.filePath || '',
        code,
        errors
      )

      if (response) {
        setSuggestions(prev => [...prev, response])
        toast({
          title: "AI Suggestion",
          description: "New code suggestions available",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI suggestions",
        variant: "destructive"
      })
    }
  }

  const applySuggestion = (suggestion: any) => {
    setCode(suggestion.fixedCode || suggestion.code)
    toast({
      title: "Applied",
      description: "AI suggestion applied to code",
    })
  }

  const handlePreview = () => {
    setShowPreview(!showPreview)
    setActiveTab(showPreview ? "editor" : "preview")
  }

  if (!module) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading module...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Graph
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-blue-400" />
              <h1 className="text-xl font-semibold">{module.label}</h1>
              {isModified && (
                <Badge className="bg-yellow-600/20 text-yellow-400">
                  Modified
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAiSuggestionsEnabled(!aiSuggestionsEnabled)}
              className={`text-sm ${aiSuggestionsEnabled ? "text-green-400" : "text-gray-400"}`}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assist
            </Button>
            
            <Button
              onClick={handlePreview}
              className="text-sm text-gray-400 hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            <Button
              onClick={handleAIFix}
              disabled={errors.length === 0 || loading}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Fix
            </Button>

            <Button
              onClick={handleSave}
              disabled={!isModified}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor Panel */}
        <div className={`${showPreview ? 'w-1/2' : 'flex-1'} flex flex-col`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="bg-gray-800 border-b border-gray-700 rounded-none justify-start px-6">
              <TabsTrigger value="editor" className="data-[state=active]:bg-gray-700">
                <FileText className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="errors" className="data-[state=active]:bg-gray-700">
                <Bug className="h-4 w-4 mr-2" />
                Issues ({errors.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="data-[state=active]:bg-gray-700">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Suggestions ({suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 m-0">
              <Editor
                height="100%"
                language={module.language || "typescript"}
                value={code}
                onChange={(value) => setCode(value || "")}
                onMount={(editor) => { editorRef.current = editor }}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  contextmenu: true,
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true
                }}
              />
            </TabsContent>

            <TabsContent value="errors" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                {errors.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No issues found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errors.map((error, index) => (
                      <Card key={index} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Badge 
                              className={`mt-1 ${error.severity === 'error' ? 'bg-red-600/20 text-red-400' : 'bg-gray-600/20 text-gray-400'}`}
                            >
                              {error.severity}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{error.message}</p>
                              {error.line && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Line {error.line}
                                </p>
                              )}
                              {error.suggestion && (
                                <p className="text-xs text-blue-400 mt-2">
                                  💡 {error.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="suggestions" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                {suggestions.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No AI suggestions yet</p>
                    <p className="text-sm mt-2">Click "AI Fix" to get suggestions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-purple-400" />
                            AI Suggestion #{index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-300 mb-3">
                            {suggestion.explanation || "Code improvement suggestion"}
                          </p>
                          <Button
                            onClick={() => applySuggestion(suggestion)}
                            className="text-sm bg-purple-600 hover:bg-purple-700"
                          >
                            Apply Suggestion
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                <div className="text-center text-gray-400 py-8">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Version history coming soon</p>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-700 bg-gray-800">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </h3>
            </div>
            <div className="p-4">
              <div className="bg-white rounded-lg p-4 text-black min-h-[400px]">
                <p className="text-gray-600">Preview functionality coming soon...</p>
                <p className="text-sm text-gray-500 mt-2">
                  This will show a live preview of your React component
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
=======
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor Panel */}
        <div className={`${showPreview ? 'w-1/2' : 'flex-1'} flex flex-col`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="bg-gray-800 border-b border-gray-700 rounded-none justify-start px-6">
              <TabsTrigger value="editor" className="data-[state=active]:bg-gray-700">
                <FileText className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="errors" className="data-[state=active]:bg-gray-700">
                <Bug className="h-4 w-4 mr-2" />
                Issues ({errors.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="data-[state=active]:bg-gray-700">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Suggestions ({suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 m-0">
              <Editor
                height="100%"
                language={module.language || "typescript"}
                value={code}
                onChange={(value) => setCode(value || "")}
                onMount={(editor) => { editorRef.current = editor }}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  contextmenu: true,
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true
                }}
              />
            </TabsContent>

            <TabsContent value="errors" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                {errors.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No issues found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errors.map((error, index) => (
                      <Card key={index} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Badge 
                              className={`mt-1 ${error.severity === 'error' ? 'bg-red-600/20 text-red-400' : 'bg-gray-600/20 text-gray-400'}`}
                            >
                              {error.severity}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{error.message}</p>
                              {error.line && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Line {error.line}
                                </p>
                              )}
                              {error.suggestion && (
                                <p className="text-xs text-blue-400 mt-2">
                                  💡 {error.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="suggestions" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                {suggestions.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No AI suggestions yet</p>
                    <p className="text-sm mt-2">Click "AI Fix" to get suggestions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-purple-400" />
                            AI Suggestion #{index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-300 mb-3">
                            {suggestion.explanation || "Code improvement suggestion"}
                          </p>
                          <Button
                            onClick={() => applySuggestion(suggestion)}
                            className="text-sm bg-purple-600 hover:bg-purple-700"
                          >
                            Apply Suggestion
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="flex-1 m-0">
              <ScrollArea className="h-full p-4">
                <div className="text-center text-gray-400 py-8">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Version history coming soon</p>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-700 bg-gray-800">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </h3>
            </div>
            <div className="p-4">
              <div className="bg-white rounded-lg p-4 text-black min-h-[400px]">
                <p className="text-gray-600">Preview functionality coming soon...</p>
                <p className="text-sm text-gray-500 mt-2">
                  This will show a live preview of your React component
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
