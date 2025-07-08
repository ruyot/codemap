"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, Bug, Sparkles, History, Eye, Wand2, MessageSquare, FolderOpen } from 'lucide-react'
import FileAIChat from './file-ai-chat'
import FileExplorer from './file-explorer'
import { FileManager, FileNode } from '@/lib/file-manager'

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

interface EnhancedModuleEditorProps {
  moduleId?: string;
}

const EnhancedModuleEditor = ({ moduleId }: EnhancedModuleEditorProps) => {
  const [showPreview, setShowPreview] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [activeTab, setActiveTab] = useState('editor');
  const [errors, setErrors] = useState<Error[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [code, setCode] = useState('// Start coding here...');
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [fileManager, setFileManager] = useState<FileManager | null>(null);
  const editorRef = useRef(null);
  const module: Module = { language: 'typescript' };

  // Initialize file manager
  useEffect(() => {
    if (moduleId) {
      const manager = new FileManager(moduleId);
      setFileManager(manager);
      
      // Load initial files
      const loadFiles = async () => {
        await manager.loadFiles();
        setFiles(manager.getFiles());
      };
      loadFiles();
    }
  }, [moduleId]);

  const applySuggestion = (suggestion: Suggestion) => {
    console.log('Applying suggestion:', suggestion);
  };

  const handleFileCreated = (file: { name: string; content: string; type: string }) => {
    if (fileManager) {
      // Refresh file list
      setFiles([...fileManager.getFiles()]);
    }
    console.log('New file created:', file);
  };

  const handleFileSelect = (file: FileNode) => {
    setCurrentFile(file);
    if (file.content) {
      setCode(file.content);
    }
  };

  const handleFileCreate = async (name: string, type: 'file' | 'directory', parentPath?: string) => {
    if (fileManager) {
      try {
        const content = type === 'file' ? '// New file' : '';
        await fileManager.createFile(name, type, content, parentPath);
        setFiles([...fileManager.getFiles()]);
      } catch (error) {
        console.error('Error creating file:', error);
      }
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (fileManager) {
      try {
        await fileManager.deleteFile(fileId);
        setFiles([...fileManager.getFiles()]);
        
        // Clear current file if it was deleted
        if (currentFile?.id === fileId) {
          setCurrentFile(null);
          setCode('// No file selected');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const handleFileRename = async (fileId: string, newName: string) => {
    if (fileManager) {
      try {
        await fileManager.renameFile(fileId, newName);
        setFiles([...fileManager.getFiles()]);
        
        // Update current file if it was renamed
        if (currentFile?.id === fileId) {
          setCurrentFile({ ...currentFile, name: newName });
        }
      } catch (error) {
        console.error('Error renaming file:', error);
      }
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (fileManager) {
      try {
        await fileManager.uploadFiles(files);
        setFiles([...fileManager.getFiles()]);
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    }
  };

  const handleFileDownload = (file: FileNode) => {
    if (fileManager) {
      try {
        fileManager.downloadFile(file);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }
  };

  const handleSaveFile = async () => {
    if (currentFile && fileManager) {
      try {
        await fileManager.saveFile(currentFile.id, code);
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Enhanced Module Editor</h2>
          {currentFile && (
            <span className="text-sm text-gray-400">
              {currentFile.path}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className={showFileExplorer ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Explorer
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowAIChat(!showAIChat)}
            className={showAIChat ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Chat
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button size="sm" onClick={handleSaveFile} disabled={!currentFile}>
            Save
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {showFileExplorer && (
          <div className="w-64 border-r border-gray-700">
            <FileExplorer
              files={files}
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onFileDelete={handleFileDelete}
              onFileRename={handleFileRename}
              onFileUpload={handleFileUpload}
              onFileDownload={handleFileDownload}
              selectedFileId={currentFile?.id}
            />
          </div>
        )}

        {/* Editor Panel */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} ${showAIChat ? 'w-1/3' : ''} flex flex-col`}>
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
                language={currentFile?.language || module.language || "typescript"}
                value={code}
                onChange={(value) => setCode(value || "")}
                onMount={(editor) => { editorRef.current = editor as any }}
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

        {/* AI Chat Panel */}
        {showAIChat && (
          <div className="w-1/3 border-l border-gray-700">
            <FileAIChat
              codeContext={code}
              fileName={currentFile?.name || "untitled"}
              onFileCreated={handleFileCreated}
              projectId={moduleId}
              fileManager={fileManager || undefined}
            />
          </div>
        )}

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