# Traces

A desktop knowledge management app with a 3D force-directed knowledge graph, markdown editor, and multi-provider AI assistant. Built with Electron, Next.js 15, and React Three Fiber.

---

## Overview

Traces is a local-first note-taking and knowledge management tool designed for exploring connections between ideas. Notes are stored as markdown files in a vault directory on your machine. A real-time 3D graph visualizes how notes link to each other through wiki-links, while an integrated AI assistant can read, write, and edit files directly in your vault.

The interface is built around four collapsible panels -- Files, Graph, Notes, and Chat -- that can each be independently toggled and resized to fit your workflow.

---

## Features

### 3D Knowledge Graph

Interactive force-directed graph visualization of notes and their connections, rendered with React Three Fiber and Three.js. Nodes represent notes and edges represent wiki-links between them. Includes configurable node size, label visibility, line thickness, line color, auto-rotation, and rotation speed. Background starfield with bloom post-processing.

### Markdown Editor

CodeMirror 6-based editor with wiki-link support (`[[note name]]`) for navigating between notes. Features syntax highlighting, auto-save, light and dark themes, a live preview mode, and word count statistics.

### AI Chat (TracesAI)

Multi-provider chat panel supporting:

- **Ollama** -- local models, no API key required
- **Anthropic Claude**
- **OpenAI GPT**
- **Google Gemini**
- **xAI Grok**

The assistant has model identity awareness and access to file tools (read, write, edit, search, delete) for working directly with vault files through tool calls.

### File Tree Sidebar

Hierarchical file browser with search, context menus, and new note/folder creation. Open any folder on your system as a vault.

### Collapsible Panel Layout

Four panels (Files, Graph, Notes, Chat) can be independently collapsed to a vertical tab strip on the left side of the window. Dynamic resizing fills available space. Drag dividers to adjust panel widths.

### Settings Panel

Accessed via the gear icon at the bottom-left of the sidebar. Contains graph settings (node size, labels, line thickness, auto-rotate, rotate speed, line color) and editor settings.

### Glass UI

Frosted glass panels with backdrop blur, built on shadcn/ui with custom glass and gradient button variants.

---

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Desktop Runtime | Electron 34 |
| Language | TypeScript |
| Styling | Tailwind CSS v4, tw-animate-css |
| Components | shadcn/ui (New York style, CVA variants) |
| State Management | Zustand |
| Editor | CodeMirror 6 |
| 3D Rendering | React Three Fiber, Three.js, @react-three/drei, @react-three/postprocessing |
| Graph Physics | D3 Force 3D |
| Icons | Lucide React |
| Package Manager | pnpm |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/)
- [Ollama](https://ollama.ai/) (optional, for local AI models)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
pnpm start
```

### API Keys

To use cloud AI providers, create a `.env.local` file in the project root:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
XAI_API_KEY=xai-...
```

Ollama runs locally and requires no API key.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd + 1` | Toggle Files panel |
| `Cmd + 2` | Toggle Graph panel |
| `Cmd + 3` | Toggle Notes panel |
| `Cmd + 4` | Toggle Chat panel |
| `Cmd + N` | New note |
| `Cmd + F` | Search |
| `Cmd + \` | Fullscreen graph |

---

## Project Structure

```
traces-app/
├── main/                          # Electron main process
│   ├── index.ts                   # Window creation, IPC handlers
│   ├── preload.ts                 # Context bridge API
│   └── ipc/
│       ├── handlers.ts            # IPC handler registration
│       ├── file-system.ts         # File system operations
│       ├── vault-parser.ts        # Vault parsing and graph data
│       └── vault-watcher.ts       # File watching with chokidar
├── src/
│   ├── app/
│   │   ├── api/chat/              # Multi-provider AI chat route
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Entry page
│   │   └── globals.css            # Tailwind v4 + shadcn tokens
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── switch.tsx
│   │   │   └── tooltip.tsx
│   │   ├── graph/                 # 3D knowledge graph
│   │   │   ├── KnowledgeGraph.tsx
│   │   │   ├── GraphScene.tsx
│   │   │   ├── GraphSettings.tsx
│   │   │   ├── NeuralNode.tsx
│   │   │   ├── Synapse.tsx
│   │   │   ├── BackgroundField.tsx
│   │   │   └── useForceGraph.ts
│   │   ├── editor/                # Markdown editor
│   │   │   ├── EditorPanel.tsx
│   │   │   ├── MarkdownEditor.tsx
│   │   │   ├── MarkdownPreview.tsx
│   │   │   └── extensions/
│   │   ├── sidebar/               # File tree browser
│   │   │   ├── FileTree.tsx
│   │   │   └── FileTreeItem.tsx
│   │   ├── chat/                  # AI chat panel
│   │   │   └── ChatPanel.tsx
│   │   ├── settings/              # Settings panel
│   │   │   └── SettingsPanel.tsx
│   │   └── layout/                # Panel orchestration
│   │       └── AppShell.tsx
│   ├── stores/                    # Zustand state
│   │   ├── vault-store.ts
│   │   ├── editor-store.ts
│   │   ├── graph-store.ts
│   │   └── ui-store.ts
│   ├── lib/
│   │   ├── electron-api.ts        # Electron API wrapper
│   │   └── utils.ts               # cn() utility
│   └── types/                     # TypeScript type definitions
├── scripts/
│   └── dev.mjs                    # Development script
├── components.json                # shadcn/ui config
├── package.json
└── tsconfig.json
```

---

## License

MIT
