// Core types for Code Map
export interface ModuleNode {
  id: string;              // React Flow node ID
  label: string;           // e.g. "Header"
  filePath: string;        // e.g. "components/Header.tsx"
  type: 'file' | 'directory';
  language?: string;       // e.g. "typescript", "javascript"
  size?: number;          // file size in bytes
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  branch: string;
  status: 'active' | 'modified' | 'clean';
  modules: ModuleNode[];
}

export interface GitOperation {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'branching' | 'remote' | 'advanced';
  shortcut?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ErrorFlag {
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  type: 'bug' | 'security' | 'style' | 'performance';
  suggestion?: string;
}

export interface BlackboxResponse {
  suggestions: string[];
  diff?: string;
  explanation?: string;
}

export interface CoralAgent {
  id: string;
  name: string;
  type: 'ui-gen' | 'error-flag' | 'prompt-refine' | 'code-fix';
  endpoint: string;
  status: 'active' | 'inactive' | 'error';
}

export interface ReactFlowSchema {
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    data: { label: string; filePath: string };
    style?: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
  }>;
  sidebarGroups: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      label: string;
      icon?: string;
    }>;
  }>;
}
