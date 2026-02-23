import fs from 'fs/promises';
import path from 'path';

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

const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

function getCategory(filePath: string): string {
  const parts = filePath.split(path.sep);
  if (parts[0] === 'Memory') {
    if (parts[1] === 'journal') return 'journal';
    if (parts[1] === 'personal') return 'personal';
    if (parts[1] === 'business') return 'business';
    if (parts[1] === 'archive') return 'archive';
    // Top-level Memory files
    return 'journal';
  }
  if (parts[0] === 'Workspace') return 'workspace';
  return 'archive';
}

function fileId(filePath: string): string {
  // Use filename without extension as ID
  return path.basename(filePath, '.md');
}

export async function parseVault(vaultRoot: string, files: string[]): Promise<GraphData> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  // File ID → relative path mapping for link resolution
  const idToPath = new Map<string, string>();
  const pathToId = new Map<string, string>();

  // Build node list
  for (const file of files) {
    const id = fileId(file);
    nodes.push({
      id,
      label: id,
      category: getCategory(file),
      path: file,
    });
    idToPath.set(id.toLowerCase(), file);
    pathToId.set(file, id);
  }

  const nodeIds = new Set(nodes.map((n) => n.id));

  function addEdge(source: string, target: string, type: GraphEdge['type'], strength: number) {
    const key = [source, target].sort().join('::') + '::' + type;
    if (!edgeSet.has(key) && source !== target) {
      edgeSet.add(key);
      edges.push({ source, target, type, strength });
    }
  }

  // Parse wiki-links from each file
  for (const file of files) {
    const fullPath = path.join(vaultRoot, file);
    let content: string;
    try {
      content = await fs.readFile(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const sourceId = pathToId.get(file)!;
    let match: RegExpExecArray | null;
    const regex = new RegExp(WIKI_LINK_REGEX.source, WIKI_LINK_REGEX.flags);

    while ((match = regex.exec(content)) !== null) {
      const linkTarget = match[1].trim();
      // Try exact match, then case-insensitive
      if (nodeIds.has(linkTarget)) {
        addEdge(sourceId, linkTarget, 'wiki-link', 1.0);
      } else if (idToPath.has(linkTarget.toLowerCase())) {
        const targetFile = idToPath.get(linkTarget.toLowerCase())!;
        const targetId = pathToId.get(targetFile)!;
        addEdge(sourceId, targetId, 'wiki-link', 1.0);
      }
    }
  }

  // Folder-sibling edges: files in the same directory
  const folderGroups = new Map<string, string[]>();
  for (const file of files) {
    const dir = path.dirname(file);
    if (!folderGroups.has(dir)) folderGroups.set(dir, []);
    folderGroups.get(dir)!.push(pathToId.get(file)!);
  }

  for (const [, siblings] of folderGroups) {
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        addEdge(siblings[i], siblings[j], 'folder-sibling', 0.3);
      }
    }
  }

  // Cross-folder bridge edges: connect closest files between different top-level folders
  const topLevelGroups = new Map<string, string[]>();
  for (const file of files) {
    const topDir = file.split(path.sep)[0];
    if (!topLevelGroups.has(topDir)) topLevelGroups.set(topDir, []);
    topLevelGroups.get(topDir)!.push(pathToId.get(file)!);
  }

  const topDirs = [...topLevelGroups.keys()];
  for (let i = 0; i < topDirs.length; i++) {
    for (let j = i + 1; j < topDirs.length; j++) {
      const groupA = topLevelGroups.get(topDirs[i])!;
      const groupB = topLevelGroups.get(topDirs[j])!;
      // Connect first 3 nodes of each group as bridges
      const bridgeCount = Math.min(3, groupA.length, groupB.length);
      for (let k = 0; k < bridgeCount; k++) {
        addEdge(groupA[k], groupB[k], 'cross-folder', 0.15);
      }
    }
  }

  // --- Orphan-node elimination pass ---
  // Ensure every node has at least one edge so the graph is fully connected.
  const connectedIds = new Set<string>();
  for (const edge of edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }

  const orphanNodes = nodes.filter((n) => !connectedIds.has(n.id));

  if (orphanNodes.length > 0) {
    // Pre-compute lookup helpers for orphan resolution
    const idToFile = new Map<string, string>();
    for (const file of files) {
      idToFile.set(pathToId.get(file)!, file);
    }

    for (const orphan of orphanNodes) {
      const orphanFile = idToFile.get(orphan.id);
      if (!orphanFile) continue;

      const orphanDir = path.dirname(orphanFile);
      const orphanTopDir = orphanFile.split(path.sep)[0];
      let connected = false;

      // 1st preference: folder-sibling in the same directory
      const sameDirSiblings = folderGroups.get(orphanDir);
      if (sameDirSiblings) {
        for (const siblingId of sameDirSiblings) {
          if (siblingId !== orphan.id && connectedIds.has(siblingId)) {
            addEdge(orphan.id, siblingId, 'folder-sibling', 0.3);
            connectedIds.add(orphan.id);
            connected = true;
            break;
          }
        }
      }

      if (connected) continue;

      // 2nd preference: any file in the same top-level directory
      const sameTopDirNodes = topLevelGroups.get(orphanTopDir);
      if (sameTopDirNodes) {
        for (const nodeId of sameTopDirNodes) {
          if (nodeId !== orphan.id && connectedIds.has(nodeId)) {
            addEdge(orphan.id, nodeId, 'cross-folder', 0.2);
            connectedIds.add(orphan.id);
            connected = true;
            break;
          }
        }
      }

      if (connected) continue;

      // Last resort: connect to the first node in the graph
      if (nodes.length > 0) {
        const fallbackTarget = nodes[0].id !== orphan.id ? nodes[0].id : (nodes.length > 1 ? nodes[1].id : null);
        if (fallbackTarget) {
          addEdge(orphan.id, fallbackTarget, 'cross-folder', 0.1);
          connectedIds.add(orphan.id);
        }
      }
    }
  }

  return { nodes, edges };
}
