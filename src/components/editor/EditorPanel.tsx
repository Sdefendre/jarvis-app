'use client';

import { useCallback, useEffect } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { useVaultStore } from '@/stores/vault-store';
import { useUIStore } from '@/stores/ui-store';
import { MarkdownEditor } from './MarkdownEditor';

export function EditorPanel() {
  const { tabs, activeTabId, closeTab } = useEditorStore();
  const { activeFile } = useVaultStore();
  const { toggleChat } = useUIStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Listen for wiki-link navigation events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.target) {
        const { openFile } = useEditorStore.getState();
        const { files, setActiveFile } = useVaultStore.getState();
        const match = files.find(
          (f) =>
            f.split('/').pop()?.replace('.md', '').toLowerCase() ===
            detail.target.toLowerCase()
        );
        if (match) {
          setActiveFile(match);
          openFile(match);
        }
      }
    };
    window.addEventListener('jarvis:open-note', handler);
    return () => window.removeEventListener('jarvis:open-note', handler);
  }, []);

  if (!activeTab) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-3xl mb-2" style={{ color: '#e0dfde' }}>{ }</div>
          <div className="text-sm" style={{ color: '#b0afa9' }}>Select a note or file to begin editing</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center h-9 overflow-x-auto pt-8" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e8e8e8' }}>
        {tabs.map((tab) => {
          const isActiveTab = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className="group flex items-center gap-1.5 px-3 h-full text-xs cursor-pointer transition-colors titlebar-no-drag"
              style={{
                color: isActiveTab ? '#37352f' : '#787774',
                borderBottom: isActiveTab ? '2px solid #2383e2' : '2px solid transparent',
                fontWeight: isActiveTab ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActiveTab) e.currentTarget.style.backgroundColor = '#f7f7f8';
              }}
              onMouseLeave={(e) => {
                if (!isActiveTab) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => {
                useEditorStore.getState().openFile(tab.path);
                useVaultStore.getState().setActiveFile(tab.path);
              }}
            >
              {/* Dirty indicator */}
              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#f2994a' }} />
              )}
              <span className="truncate max-w-[120px]">{tab.name}</span>
              <button
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: '#b0afa9', fontSize: '12px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#37352f')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#b0afa9')}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                &times;
              </button>
            </div>
          );
        })}

        {/* Chat toggle */}
        <button
          onClick={toggleChat}
          className="ml-auto px-3 h-full transition-colors titlebar-no-drag text-xs font-medium"
          style={{ color: '#787774' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#2383e2')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#787774')}
          title="Toggle AI Chat"
        >
          AI
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-1.5 text-xs" style={{ color: '#b0afa9', borderBottom: '1px solid #e8e8e8', backgroundColor: '#ffffff' }}>
        {activeTab.path.replace(/\//g, ' / ')}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor tabId={activeTab.id} content={activeTab.content} />
      </div>
    </div>
  );
}
