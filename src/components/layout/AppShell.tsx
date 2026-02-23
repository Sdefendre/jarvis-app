'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useVaultStore } from '@/stores/vault-store';
import { useUIStore } from '@/stores/ui-store';
import { electronAPI } from '@/lib/electron-api';
import { FileTree } from '@/components/sidebar/FileTree';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { GraphSettings } from '@/components/graph/GraphSettings';

export function AppShell() {
  const { loadVault, setGraphData, refreshFiles, loading } = useVaultStore();
  const {
    sidebarWidth,
    editorWidth,
    chatOpen,
    chatWidth,
    graphFullscreen,
    graphCollapsed,
    sidebarCollapsed,
    toggleGraphFullscreen,
    toggleGraphCollapsed,
    toggleSidebar,
    toggleChat,
  } = useUIStore();
  const editorDividerRef = useRef<HTMLDivElement>(null);
  const sidebarDividerRef = useRef<HTMLDivElement>(null);
  const [editorDividerHover, setEditorDividerHover] = useState(false);
  const [sidebarDividerHover, setSidebarDividerHover] = useState(false);
  const [editorDragging, setEditorDragging] = useState(false);
  const [sidebarDragging, setSidebarDragging] = useState(false);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  // Listen for file changes and graph updates from main process
  useEffect(() => {
    const unsubFile = electronAPI.onFileChange((event, filePath) => {
      refreshFiles();
    });

    const unsubGraph = electronAPI.onGraphUpdate((data) => {
      setGraphData(data);
    });

    return () => {
      unsubFile();
      unsubGraph();
    };
  }, [refreshFiles, setGraphData]);

  // Resizable editor divider — works bidirectionally
  const handleEditorDividerDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = useUIStore.getState().editorWidth;
    const maxWidth = Math.floor(window.innerWidth * 0.8);

    setEditorDragging(true);

    const onMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX;
      const newWidth = Math.max(300, Math.min(maxWidth, startWidth + delta));
      useUIStore.getState().setEditorWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setEditorDragging(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // Resizable sidebar divider
  const handleSidebarDividerDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = useUIStore.getState().sidebarWidth;

    setSidebarDragging(true);

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(180, Math.min(400, startWidth + delta));
      useUIStore.getState().setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setSidebarDragging(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen relative z-10">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
            TRACES
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading your knowledge graph...</div>
        </div>
      </div>
    );
  }

  /* ---- Fullscreen overlay ---- */
  if (graphFullscreen) {
    return (
      <div className="fixed inset-0 z-[100]">
        {/* Title bar drag region */}
        <div className="fixed top-0 left-0 right-0 h-8 titlebar-drag z-[110]" />

        <KnowledgeGraph />

        {/* Floating toolbar — exit fullscreen only */}
        <div className="fixed top-10 right-3 z-[120] flex gap-1 rounded-xl px-2 py-1.5 glass">
          <button
            onClick={toggleGraphFullscreen}
            className="flex h-6 w-6 items-center justify-center rounded text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Exit fullscreen"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden relative z-10">
      {/* Title bar drag region */}
      <div className="fixed top-0 left-0 right-0 h-8 titlebar-drag z-50" />

      {/* Sidebar collapse expand button (shown when sidebar is collapsed) */}
      {sidebarCollapsed && (
        <div className="flex-shrink-0 flex items-start pt-10 px-1">
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="glass rounded-lg p-1.5 transition-all hover:scale-105"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar */}
      {!sidebarCollapsed && (
        <>
          <div
            className="flex-shrink-0 panel-glass overflow-hidden"
            style={{ width: sidebarWidth, borderRight: '1px solid var(--glass-border)' }}
          >
            <FileTree />
          </div>

          {/* Sidebar resize divider */}
          <div
            ref={sidebarDividerRef}
            onMouseDown={handleSidebarDividerDrag}
            onMouseEnter={() => setSidebarDividerHover(true)}
            onMouseLeave={() => setSidebarDividerHover(false)}
            className="flex-shrink-0 cursor-col-resize transition-colors relative"
            style={{
              width: 4,
              backgroundColor:
                sidebarDragging || sidebarDividerHover
                  ? '#2383e2'
                  : 'rgba(255,255,255,0.06)',
            }}
          >
            {/* Invisible wider hit area */}
            <div className="absolute inset-y-0 -left-2 -right-2" />
          </div>
        </>
      )}

      {/* Graph */}
      <div
        className="relative min-w-0 transition-all duration-300 ease-in-out"
        style={{
          flex: graphCollapsed ? '0 0 0px' : '1 1 0%',
          overflow: graphCollapsed ? 'hidden' : 'visible',
          opacity: graphCollapsed ? 0 : 1,
        }}
      >
        <KnowledgeGraph />

        {/* Floating toolbar — collapse, fullscreen, settings */}
        {!graphCollapsed && (
          <div className="absolute top-10 right-3 z-30 flex items-center gap-1 rounded-xl px-2 py-1.5 glass">
            <button
              onClick={toggleGraphCollapsed}
              className="flex h-6 w-6 items-center justify-center rounded text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Collapse graph"
            >
              −
            </button>
            <button
              onClick={toggleGraphFullscreen}
              className="flex h-6 w-6 items-center justify-center rounded text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Fullscreen"
            >
              ⛶
            </button>
            <GraphSettings />
          </div>
        )}
      </div>

      {/* Expand graph button when collapsed */}
      {graphCollapsed && (
        <div className="flex-shrink-0 flex flex-col items-center pt-10 px-1">
          <button
            onClick={toggleGraphCollapsed}
            title="Expand graph"
            className="glass rounded-2xl px-3.5 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
            style={{ color: 'var(--text)' }}
          >
            <span style={{ fontSize: 15 }}>◧</span>
            Graph
          </button>
        </div>
      )}

      {/* Editor resize divider */}
      <div
        ref={editorDividerRef}
        onMouseDown={handleEditorDividerDrag}
        onMouseEnter={() => setEditorDividerHover(true)}
        onMouseLeave={() => setEditorDividerHover(false)}
        className="flex-shrink-0 cursor-col-resize transition-colors relative"
        style={{
          width: 4,
          backgroundColor:
            editorDragging || editorDividerHover
              ? '#2383e2'
              : 'rgba(255,255,255,0.06)',
        }}
      >
        {/* Invisible wider hit area */}
        <div className="absolute inset-y-0 -left-2 -right-2" />
      </div>

      {/* Editor */}
      <div
        className="panel-glass overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          ...(graphCollapsed
            ? { flex: '1 1 0%' }
            : { width: editorWidth, flexShrink: 0 }),
          borderLeft: '1px solid var(--glass-border)',
        }}
      >
        <EditorPanel />
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div
          className="flex-shrink-0 panel-glass overflow-hidden"
          style={{ width: chatWidth, borderLeft: '1px solid var(--glass-border)' }}
        >
          <ChatPanel />
        </div>
      )}

      {/* Floating AI Chat button (when chat is closed) */}
      {!chatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-5 right-5 z-50 rounded-2xl px-4 py-2.5 flex items-center gap-2 transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(35,131,226,0.35), rgba(155,89,182,0.35))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(35,131,226,0.25)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 15 }}>&#10024;</span>
          AI Chat
        </button>
      )}
    </div>
  );
}
