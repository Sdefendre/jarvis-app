'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/ui-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Provider = 'ollama' | 'openai' | 'anthropic' | 'xai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface OllamaModel {
  name: string;
  model: string;
}

// Hard-coded cloud model options
const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini'];
const CLAUDE_MODELS = ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'];
const XAI_MODELS = ['grok-3-fast'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChatPanel() {
  const { toggleChat } = useUIStore();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Model state
  const [provider, setProvider] = useState<Provider>('ollama');
  const [model, setModel] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaRunning, setOllamaRunning] = useState(false);

  // ------------------------------------------------------------------
  // Auto-detect Ollama models on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function detectOllama() {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (!res.ok) throw new Error('not ok');
        const data = await res.json();
        const models: string[] = (data.models ?? []).map(
          (m: OllamaModel) => m.name,
        );
        if (!cancelled) {
          setOllamaRunning(true);
          setOllamaModels(models);
          if (models.length > 0) {
            setProvider('ollama');
            setModel(models[0]);
          } else {
            setProvider('openai');
            setModel(OPENAI_MODELS[0]);
          }
        }
      } catch {
        if (!cancelled) {
          setOllamaRunning(false);
          setOllamaModels([]);
          setProvider('openai');
          setModel(OPENAI_MODELS[0]);
        }
      }
    }

    detectOllama();
    return () => {
      cancelled = true;
    };
  }, []);

  // ------------------------------------------------------------------
  // Scroll to bottom on new messages
  // ------------------------------------------------------------------
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  // ------------------------------------------------------------------
  // Model selector change handler
  // ------------------------------------------------------------------
  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      const [prov, mod] = value.split('::') as [Provider, string];
      setProvider(prov);
      setModel(mod);
    },
    [],
  );

  // ------------------------------------------------------------------
  // Send message
  // ------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          provider,
          model,
        }),
      });

      if (res.status === 503) {
        const data = await res.json();
        setError(
          data.error ||
            'API key not configured. Add the required key to .env.local',
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message || 'No response' },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to connect to AI service';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectValue = `${provider}::${model}`;

  const emptyStateText = ollamaRunning
    ? 'Select a model above and start chatting.'
    : 'Ollama is not running. You can still use OpenAI, Claude, or Grok (requires API keys in .env.local).';

  return (
    <div className="flex flex-col h-full pt-10" style={{ backgroundColor: '#fff' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid #e0e0e0' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#111' }}>
          AI Chat
        </span>
        <button
          onClick={toggleChat}
          className="transition-colors text-sm"
          style={{ color: '#bbb' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#bbb')}
        >
          &times;
        </button>
      </div>

      {/* Model Selector */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: '1px solid #e0e0e0' }}
      >
        {ollamaRunning && (
          <span
            title="Ollama is running"
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              flexShrink: 0,
            }}
          />
        )}

        <select
          value={selectValue}
          onChange={handleModelChange}
          className="flex-1 text-sm rounded px-2 py-1.5 appearance-none cursor-pointer"
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            color: '#111',
            outline: 'none',
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23888\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            paddingRight: 28,
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = '#999';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e0e0e0';
          }}
        >
          {ollamaModels.length > 0 && (
            <optgroup label="Ollama (local)">
              {ollamaModels.map((m) => (
                <option key={`ollama::${m}`} value={`ollama::${m}`}>
                  {m}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="OpenAI">
            {OPENAI_MODELS.map((m) => (
              <option key={`openai::${m}`} value={`openai::${m}`}>
                {m}
              </option>
            ))}
          </optgroup>

          <optgroup label="Claude">
            {CLAUDE_MODELS.map((m) => (
              <option key={`anthropic::${m}`} value={`anthropic::${m}`}>
                {m}
              </option>
            ))}
          </optgroup>

          <optgroup label="xAI Grok">
            {XAI_MODELS.map((m) => (
              <option key={`xai::${m}`} value={`xai::${m}`}>
                {m}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-center mt-8">
            <p className="mb-2" style={{ color: '#888' }}>
              Jarvis AI Assistant
            </p>
            <p style={{ color: '#bbb', maxWidth: 260, margin: '0 auto' }}>
              {emptyStateText}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className="text-sm leading-relaxed rounded p-2"
            style={
              msg.role === 'user'
                ? {
                    color: '#111',
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                  }
                : {
                    color: '#111',
                    borderLeft: '3px solid #111',
                    backgroundColor: '#f5f5f5',
                  }
            }
          >
            <pre
              className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
              style={{ margin: 0 }}
            >
              {msg.content}
            </pre>
          </div>
        ))}

        {loading && (
          <div className="text-xs" style={{ color: '#bbb' }}>
            Thinking...
          </div>
        )}

        {error && (
          <div
            className="text-xs p-2 rounded"
            style={{
              color: '#d00',
              backgroundColor: 'rgba(200,0,0,0.04)',
              border: '1px solid rgba(200,0,0,0.15)',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid #e0e0e0' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask Jarvis..."
            className="flex-1 px-3 py-2 text-sm rounded placeholder:text-gray-400 focus:outline-none"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              color: '#111',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#999';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e0e0e0';
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-2 text-sm rounded transition-colors disabled:opacity-50"
            style={{
              backgroundColor: '#111',
              color: '#fff',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#333')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#111')
            }
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
