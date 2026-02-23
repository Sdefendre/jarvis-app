'use client';

import { useState, useMemo, useCallback } from 'react';
import { useVaultStore } from '@/stores/vault-store';
import { useEditorStore } from '@/stores/editor-store';
import { FileTreeItem, TreeNode } from './FileTreeItem';
import { electronAPI } from '@/lib/electron-api';

function buildTree(files: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');

      let existing = current.find((n) => n.name === name);
      if (!existing) {
        existing = {
          name,
          path,
          isFile,
          children: isFile ? undefined : [],
        };
        current.push(existing);
      }
      if (!isFile && existing.children) {
        current = existing.children;
      }
    }
  }

  // Sort: folders first, then alphabetically
  function sortTree(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortTree(node.children);
    }
  }
  sortTree(root);
  return root;
}

export function FileTree() {
  const { files, activeFile, setActiveFile, refreshFiles, openFolder, vaultName } = useVaultStore();
  const { openFile } = useEditorStore();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const filteredFiles = useMemo(() => {
    if (!search) return files;
    const q = search.toLowerCase();
    return files.filter((f) => f.toLowerCase().includes(q));
  }, [files, search]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  const handleSelect = useCallback(
    (path: string) => {
      setActiveFile(path);
      openFile(path);
    },
    [setActiveFile, openFile]
  );

  const handleCreate = useCallback(async () => {
    if (!newFileName.trim()) return;
    const fileName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    const filePath = `Memory/${fileName}`;
    await electronAPI.createFile(filePath, `# ${newFileName.replace('.md', '')}\n\n`);
    await refreshFiles();
    setCreating(false);
    setNewFileName('');
    handleSelect(filePath);
  }, [newFileName, refreshFiles, handleSelect]);

  const handleDelete = useCallback(
    async (path: string) => {
      await electronAPI.deleteFile(path);
      await refreshFiles();
    },
    [refreshFiles]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid #e8e8e8' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold truncate" style={{ color: '#37352f' }}>
            {vaultName}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={openFolder}
              className="transition-colors text-xs leading-none px-1"
              style={{ color: '#787774' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#37352f')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#787774')}
              title="Open Folder"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              onClick={() => setCreating(true)}
              className="transition-colors text-lg leading-none"
              style={{ color: '#787774' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#37352f')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#787774')}
              title="New Note"
            >
              +
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1.5 text-xs rounded
                     placeholder:text-gray-400
                     focus:outline-none focus:ring-2"
          style={{
            backgroundColor: '#f7f7f8',
            border: '1px solid #e8e8e8',
            color: '#37352f',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(35,131,226,0.25)';
            e.currentTarget.style.borderColor = '#2383e2';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e8e8e8';
          }}
        />
      </div>

      {/* New file input */}
      {creating && (
        <div className="px-3 py-2" style={{ borderBottom: '1px solid #e8e8e8' }}>
          <input
            type="text"
            placeholder="Note name..."
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setCreating(false);
            }}
            autoFocus
            className="w-full px-2 py-1.5 text-xs rounded
                       placeholder:text-gray-400
                       focus:outline-none focus:ring-2"
            style={{
              backgroundColor: '#f7f7f8',
              border: '1px solid #2383e2',
              color: '#37352f',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(35,131,226,0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {tree.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            depth={0}
            activeFile={activeFile}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* File count */}
      <div className="px-3 py-1.5 text-xs" style={{ borderTop: '1px solid #e8e8e8', color: '#b0afa9' }}>
        {files.length} notes
      </div>
    </div>
  );
}
