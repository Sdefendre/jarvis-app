# Traces

A desktop knowledge management app with a 3D galaxy-themed knowledge graph, markdown editor, and multi-provider agentic AI assistant. Built with Electron + Next.js 15.

## Features

- **3D Galaxy Knowledge Graph** — Interactive force-directed graph in a starfield with shooting stars and bloom glow effects. Color-coded nodes by category. Configurable node size, labels, line thickness, color, and auto-rotation.
- **Agentic AI Chat** — AI assistant that can read, write, edit, search, and delete files in your vault using tool calls. Supports Ollama (local), OpenAI, Anthropic Claude, Google Gemini, and xAI Grok.
- **Markdown Editor** — CodeMirror 6 with wiki-link navigation (`[[note name]]`), auto-save, syntax highlighting, and light/dark mode toggle. Live sync reflects AI edits in real-time.
- **File Management** — Sidebar file tree with search, create, delete, right-click context menu, and folder navigation. Open any folder as a vault.
- **Collapsible Panels** — Every pane (sidebar, graph, editor, chat) can be independently collapsed and expanded with uniform chevron controls. Drag dividers to resize.
- **Glass UI** — Frosted glass panels with backdrop blur, built on shadcn/ui with custom glass and gradient button variants.

## Tech Stack

- **Runtime** — Electron + Next.js 15 (App Router)
- **3D** — React Three Fiber (R3F v9) + Three.js + d3-force-3d
- **Editor** — CodeMirror 6
- **UI** — shadcn/ui + Tailwind CSS v4 + lucide-react
- **State** — Zustand
- **Language** — TypeScript

## Getting Started

```bash
pnpm install
pnpm dev
```

## API Keys

Create `.env.local` in the project root:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
XAI_API_KEY=xai-...
```

Ollama runs locally and needs no API key. Install from [ollama.ai](https://ollama.ai).

## Project Structure

```
traces/
├── main/                  # Electron main process
│   ├── index.ts           # Window creation, IPC handlers
│   ├── preload.ts         # Context bridge API
│   └── ipc/               # File system, vault parser, watcher
├── src/
│   ├── app/
│   │   ├── api/chat/      # Multi-provider agentic AI route
│   │   ├── layout.tsx     # Root layout with TooltipProvider
│   │   └── globals.css    # Tailwind v4 + shadcn tokens
│   ├── components/
│   │   ├── ui/            # shadcn/ui primitives (Button, Popover, etc.)
│   │   ├── graph/         # 3D knowledge graph + settings + starfield
│   │   ├── editor/        # CodeMirror markdown editor
│   │   ├── sidebar/       # File tree + context menu
│   │   ├── chat/          # AI chat panel
│   │   └── layout/        # AppShell (panel orchestration)
│   ├── stores/            # Zustand (vault, editor, graph, UI)
│   ├── lib/               # Electron API wrapper, cn() utility
│   └── types/             # TypeScript types
├── components.json        # shadcn/ui config
├── scripts/               # Dev scripts
└── package.json
```

## License

MIT
