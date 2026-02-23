'use client';

import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatPanel() {
  const { toggleChat } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

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
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (res.status === 503) {
        setError('AI not configured. Add OPENAI_API_KEY to .env.local');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message || 'No response' },
      ]);
    } catch (err) {
      setError('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full pt-8">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #e8e8e8' }}>
        <span className="text-sm font-semibold" style={{ color: '#37352f' }}>
          AI Assistant
        </span>
        <button
          onClick={toggleChat}
          className="transition-colors text-sm"
          style={{ color: '#b0afa9' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#37352f')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#b0afa9')}
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-center mt-8">
            <p className="mb-2" style={{ color: '#787774' }}>Jarvis AI Assistant</p>
            <p style={{ color: '#b0afa9' }}>
              Configure OPENAI_API_KEY in .env.local to enable
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className="text-xs leading-relaxed rounded p-2"
            style={
              msg.role === 'user'
                ? { color: '#37352f', backgroundColor: '#ffffff', border: '1px solid #e8e8e8' }
                : { color: '#37352f', borderLeft: '3px solid #2383e2', backgroundColor: '#f7f7f8' }
            }
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="text-xs" style={{ color: '#b0afa9' }}>
            Thinking...
          </div>
        )}

        {error && (
          <div className="text-xs p-2 rounded" style={{ color: '#eb5757', backgroundColor: 'rgba(235,87,87,0.04)', border: '1px solid rgba(235,87,87,0.15)' }}>
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid #e8e8e8' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask Jarvis..."
            className="flex-1 px-2 py-1.5 text-xs rounded
                       placeholder:text-gray-400
                       focus:outline-none"
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
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50"
            style={{
              backgroundColor: '#2383e2',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1b6ec2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2383e2')}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
