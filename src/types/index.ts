export interface GraphNode {
  id: string;
  label: string;
  category: string;
  path: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'wiki-link' | 'folder-sibling' | 'cross-folder';
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface VaultFile {
  path: string;
  name: string;
  directory: string;
  category: string;
}

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

export type NodeCategory = 'journal' | 'personal' | 'business' | 'workspace' | 'archive';

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  journal: '#7c9bf5',
  personal: '#c084fc',
  business: '#f59e6b',
  workspace: '#5ddb6e',
  archive: '#888899',
};
