# Katasumi (隅) - Your Corner Companion for Keyboard Shortcuts

**Katasumi** (カタスミ / 隅) - meaning "in the corner" - is an AI-powered keyboard shortcut discovery tool that stays quietly in the background, ready to help whenever you need it.

Like a helpful friend waiting in the corner of your workspace, Katasumi provides instant access to keyboard shortcuts across terminal and desktop applications, supporting you without getting in the way.

## 🎯 Philosophy

The name "katasumi" embodies our design philosophy:

- **Always There**: Like something resting in the corner, always accessible but never intrusive
- **Background Support**: Provides help exactly when you need it, then gets out of your way
- **Quiet Helper**: Runs unobtrusively, blending into your workflow
- **Reliable Companion**: Dependable support for your daily productivity

## ✨ Features

### Terminal Interface (TUI)
- 🚀 Lightning-fast fuzzy search for keyboard shortcuts
- 📦 Works 100% offline with bundled shortcuts database
- 🎨 Multiple search modes: App-First, Full-Phrase, and Detail View
- 💾 Local caching of custom shortcuts
- 🤖 AI-powered scraping for long-tail applications (optional)

### Web Interface
- 🌐 Accessible from any browser
- 🔍 Shared database of curated shortcuts
- 💎 Premium tier with managed API keys for AI searches
- 📱 Responsive design for desktop and mobile

## 🏗️ Architecture

Katasumi uses a monorepo structure with shared core logic:

```
katasumi/
├── packages/
│   ├── core/              # Shared search & scraping logic
│   ├── tui/               # Terminal interface
│   └── web/               # Web interface (React/Next.js)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### Tech Stack

**Core (Shared)**
- TypeScript
- Prisma ORM (unified schema for SQLite + PostgreSQL)
- Keyword search + Optional AI (OpenAI/Claude/Ollama)

**TUI**
- SQLite for local storage
- Zero-config setup
- Fast local queries (<10ms)

**Web**
- Next.js (React) + Vercel
- PostgreSQL (Supabase/Vercel Postgres)
- Tailwind CSS

## 🚀 Getting Started

> **Note**: Detailed installation and setup instructions will be added as development progresses.

### Running Unobtrusively

Katasumi is designed to stay out of your way. Here are some tips for running it unobtrusively:

- **TUI Mode**: Assign a global keyboard shortcut to launch Katasumi instantly
- **Background Process**: Run the TUI in a tmux/screen session for instant access
- **Terminal Dropdown**: Use with terminal drop-down tools (e.g., Guake, iTerm2 Hotkey Window)
- **Web Bookmarklet**: Save the web version as a bookmarklet for quick browser access

## 📊 Database Strategy

Katasumi uses a hybrid approach:

- **Bundled Core DB**: Ships with shortcuts for popular apps (vim, tmux, VSCode, etc.)
- **Local Cache**: Stores your custom and scraped shortcuts
- **On-Demand Scraping**: AI-powered scraping for long-tail applications
- **Community Contributions**: Core database enhanced by community via GitHub

## 🛠️ Development

This project is currently in early development. See [DEVELOPMENT_PRIORITIES.md](DEVELOPMENT_PRIORITIES.md) for the development roadmap and [katasumi-plan.md](katasumi-plan.md) for detailed project planning.

## 📝 License

TBD

## 🤝 Contributing

Contributions welcome! More details coming soon.

---

**Katasumi** - Always there in your corner, ready to help. 隅
