import { NextResponse } from 'next/server';

type Provider = 'ollama' | 'openai' | 'anthropic' | 'xai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  provider: Provider;
  model: string;
  apiKey?: string;
}

// ---------------------------------------------------------------------------
// Ollama  (local, no API key)
// ---------------------------------------------------------------------------
async function handleOllama(messages: ChatMessage[], model: string): Promise<string> {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.message?.content ?? 'No response from Ollama';
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------
async function handleOpenAI(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'No response from OpenAI';
}

// ---------------------------------------------------------------------------
// Anthropic Claude
// ---------------------------------------------------------------------------
async function handleAnthropic(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
): Promise<string> {
  // Anthropic expects a separate system prompt and messages array with
  // only 'user' and 'assistant' roles.
  let systemPrompt: string | undefined;
  const anthropicMessages: { role: 'user' | 'assistant'; content: string }[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }

  const body: Record<string, unknown> = {
    model,
    max_tokens: 4096,
    messages: anthropicMessages,
  };
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error (${res.status}): ${text}`);
  }

  const data = await res.json();
  // Anthropic returns content as an array of content blocks
  const textBlock = data.content?.find(
    (b: { type: string; text?: string }) => b.type === 'text',
  );
  return textBlock?.text ?? 'No response from Claude';
}

// ---------------------------------------------------------------------------
// xAI Grok  (OpenAI-compatible API)
// ---------------------------------------------------------------------------
async function handleXAI(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`xAI error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'No response from Grok';
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const { messages, provider, model, apiKey } =
      (await req.json()) as ChatRequest;

    if (!messages || !provider || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, provider, model' },
        { status: 400 },
      );
    }

    // ----- Ollama (no key needed) -----
    if (provider === 'ollama') {
      const content = await handleOllama(messages, model);
      return NextResponse.json({ message: content });
    }

    // ----- OpenAI -----
    if (provider === 'openai') {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured. Set OPENAI_API_KEY in .env.local or pass apiKey.' },
          { status: 503 },
        );
      }
      const content = await handleOpenAI(messages, model, key);
      return NextResponse.json({ message: content });
    }

    // ----- Anthropic -----
    if (provider === 'anthropic') {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env.local or pass apiKey.' },
          { status: 503 },
        );
      }
      const content = await handleAnthropic(messages, model, key);
      return NextResponse.json({ message: content });
    }

    // ----- xAI Grok -----
    if (provider === 'xai') {
      const key = apiKey || process.env.XAI_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: 'xAI API key not configured. Set XAI_API_KEY in .env.local or pass apiKey.' },
          { status: 503 },
        );
      }
      const content = await handleXAI(messages, model, key);
      return NextResponse.json({ message: content });
    }

    return NextResponse.json(
      { error: `Unknown provider: ${provider}` },
      { status: 400 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to process request';
    console.error('[chat route]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
