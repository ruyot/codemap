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

// Drag and Drop Types
export interface DragDropFile {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  content?: string;
  lastModified: Date;
}

export interface DragDropNode {
  id: string;
  type: 'file' | 'directory' | 'component' | 'module';
  label: string;
  filePath: string;
  position: { x: number; y: number };
  size?: number;
  language?: string;
  children?: DragDropNode[];
  parent?: string;
  metadata?: Record<string, any>;
}

export interface DragDropOperation {
  id: string;
  type: 'move' | 'copy' | 'merge' | 'link' | 'upload';
  source: DragDropNode | DragDropFile;
  target?: DragDropNode;
  position?: { x: number; y: number };
  timestamp: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface GitVisualOperation {
  id: string;
  type: 'merge' | 'rebase' | 'cherry-pick' | 'branch' | 'commit';
  source: string; // branch/commit id
  target?: string; // branch/commit id
  position: { x: number; y: number };
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  conflicts?: Array<{
    file: string;
    line: number;
    content: string;
  }>;
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  selectedNodes: string[];
  selectedEdges: string[];
  draggedNodes: string[];
  viewport: { x: number; y: number; zoom: number };
  miniMapVisible: boolean;
  gridVisible: boolean;
}

export interface PanelState {
  id: string;
  title: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  isMinimized: boolean;
  size: number;
  minSize: number;
  maxSize: number;
  isResizing: boolean;
  order: number;
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  panels: PanelState[];
  canvas: CanvasState;
  createdAt: Date;
  updatedAt: Date;
}
