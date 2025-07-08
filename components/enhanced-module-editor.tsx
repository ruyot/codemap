'use client'

import React, { useState, useRef } from 'react'
import { Editor, OnMount } from '@monaco-editor/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, Bug, Sparkles, History, Eye, Wand2 } from 'lucide-react'

// Mock data and types for now
interface Module {
  language?: string;
}

interface Error {
  message: string;
  line?: number;
  severity: 'error' | 'warning';
  suggestion?: string;
}

interface Suggestion {
  explanation?: string;
  // Add other properties of suggestion
}

const EnhancedModuleEditor = () => {
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState('editor');
  const [errors] = useState<Error[]>([]);
  const [suggestions] = useState<Suggestion[]>([]);
  const [code, setCode] = useState('// Start coding here...');
  const editorRef = useRef(null);
  const module: Module = { language: 'typescript' };

  const applySuggestion = (suggestion: Suggestion) => {
    console.log('Applying suggestion:', suggestion);
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Enhanced Module Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button size="sm">
            Save
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col`}>
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

            <TabsContent value="editor" className="flex-1 m-0 overflow-auto">
              <Editor
                height="100%"
                language={module.language || "typescript"}
                value={code}
                onChange={(value) => setCode(value || "")}
                onMount={handleEditorDidMount}
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
          <div className="w-1/2 border-l border-gray-700 bg-gray-800 overflow-auto">
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
  );
};

export default EnhancedModuleEditor;