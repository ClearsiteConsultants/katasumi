# Shortcut Finder - Project Plan

AI-powered keyboard shortcut discovery tool for terminal and desktop applications. Share core search logic between TUI and web interfaces.

## Architecture Overview

```
shortcut-finder/
├── packages/
│   ├── core/              # Shared search & scraping logic
│   ├── tui/               # Terminal interface
│   └── web/               # Web interface (React/Next.js)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Tech Stack

### Core (Shared)
- **Language**: TypeScript
- **Search**: Keyword (fzf-like fuzzy) + Optional AI (OpenAI/Claude/Ollama)
- **Scraping**: Cheerio (static HTML), Puppeteer (dynamic), possibly scrapy for complex cases
- **Storage**: TBD (see Database Strategy below)

### TUI
- **Framework**: TBD - Need to evaluate Ink vs. simpler alternatives
- **Key Libraries**: 
  - fzf/fuzzy search implementation
  - Terminal UI primitives
  - Minimal dependencies for speed

### Web
- **Framework**: Next.js (React) + Vercel
- **API Routes**: AI queries, search endpoint
- **UI**: Tailwind CSS for styling
- **Monetization**: Optional premium tier (managed API keys)

## Development Phases

### Phase 1: Core Engine & Data Strategy (Week 1-2)

**Goal**: Decide on data architecture and build search foundation

#### 1.1 Database Strategy - HYBRID APPROACH (DECIDED)

**Decision**: Hybrid approach with different storage strategies per deployment mode

**Architecture**:
```
Core shortcuts DB (curated) + On-demand scraping + Local cache

- Ship TUI with embedded SQLite of popular apps (vim, tmux, vscode, etc.)
- Cache scraped results locally (~/.shortcut-finder/cache/)
- Background update check (weekly) for core DB
- On-demand AI scraping for long-tail apps
- Community can contribute to core DB via GitHub
```

**Storage Strategy by Mode**:

**TUI (Local)**:
```
Database: SQLite
Location: 
  - Core DB: ~/.shortcut-finder/shortcuts.db (bundled, read-only)
  - Cache DB: ~/.shortcut-finder/cache.db (user-scraped, read-write)
  - Config: ~/.shortcut-finder/config.json (API keys, preferences)

Pros:
- Zero-config setup (just npm install -g)
- Works 100% offline for core apps
- No server dependencies
- Fast local queries (<10ms)
- Portable (single binary + DB file)

Update Strategy:
- Check for updates on startup (opt-out)
- Download latest shortcuts.db from GitHub releases
- Merge with local cache.db
```

**Web (Free Tier)**:
```
Database: PostgreSQL (Supabase/Vercel Postgres)
Mode: Shared read-only DB

Data:
- Core shortcuts (same as TUI bundle)
- Popular community-scraped shortcuts
- No user-specific data (stateless)

Queries:
- Keyword search: Direct SQL queries
- AI search: 5 queries/day limit (rate-limited by IP)
```

**Web (Premium Tier)**:
```
Database: PostgreSQL + Redis cache

Data:
- All core shortcuts
- User-specific scraped shortcuts (private to account)
- Query history
- Custom collections

Features:
- Unlimited AI queries (managed API key)
- Save custom shortcuts
- Export/import
- Team sharing (SQLite per team)
```

**SQLite vs PostgreSQL Decision Matrix**:

| Aspect | SQLite | PostgreSQL |
|--------|---------|------------|
| TUI | ✅ Perfect (embedded, portable) | ❌ Overkill (needs server) |
| Web Free | ❌ Hard to scale reads | ✅ Better for concurrent users |
| Web Premium | ❌ Can't share data | ✅ Multi-tenant support |
| Offline Mode | ✅ Native | ❌ Requires sync |
| Setup Cost | ✅ Free | ⚠️ Hosting cost (~$0-25/mo) |
| Query Speed | ✅ <10ms local | ⚠️ 20-50ms network |
| Scaling | ⚠️ Single-writer limit | ✅ Handles many writes |

**Recommendation**:
- **TUI**: SQLite only (core + cache)
- **Web Free**: PostgreSQL (shared, read-only)
- **Web Premium**: PostgreSQL + Redis
- **Sync**: TUI can export to web (upload cache.db shortcuts)

**Implementation Plan**:
```typescript
// core/src/db/index.ts
export interface DatabaseAdapter {
  search(query: string, filters?: Filter): Promise<Shortcut[]>;
  insert(shortcut: Shortcut): Promise<void>;
  update(id: string, shortcut: Partial<Shortcut>): Promise<void>;
}

export class SqliteAdapter implements DatabaseAdapter {
  // For TUI
  constructor(dbPath: string);
}

export class PostgresAdapter implements DatabaseAdapter {
  // For Web
  constructor(connectionString: string);
}
```

#### 1.2 Search Engine Implementation

**Unified Schema Design**:

```typescript
// core/src/types/shortcut.ts
export type Platform = 'mac' | 'windows' | 'linux';
export type SourceType = 'official' | 'community' | 'ai-scraped' | 'user-added';

export interface Shortcut {
  // Identity
  id: string;                    // UUID
  app: string;                   // 'vim', 'vscode', 'tmux'
  appVersion?: string;           // '2.0', '1.85.0' (optional)
  
  // Core data
  action: string;                // 'Move cursor left', 'Open file'
  description?: string;          // Longer explanation
  
  // Keybindings
  keys: {
    mac?: string;                // '⌘K', 'Cmd+K'
    windows?: string;            // 'Ctrl+K'
    linux?: string;              // 'Ctrl+K'
  };
  
  // Context & categorization
  context?: string;              // 'Normal Mode', 'Editor Focus', 'Git Panel'
  category?: string;             // 'Navigation', 'Editing', 'Window Management'
  tags: string[];                // ['cursor', 'movement', 'vim-motion']
  
  // Metadata
  source: {
    type: SourceType;
    url: string;                 // Documentation URL
    scrapedAt?: Date;            // When it was scraped
    confidence?: number;         // 0-1 for AI-scraped shortcuts
  };
  
  // Search optimization
  searchTerms: string[];         // Pre-computed for fuzzy search
  popularity?: number;           // Usage frequency (0-1)
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface AppInfo {
  id: string;                    // 'vim'
  name: string;                  // 'Vim'
  displayName: string;           // 'Vim - Vi IMproved'
  category: string;              // 'Editor', 'Terminal', 'Browser'
  platforms: Platform[];         // ['mac', 'linux', 'windows']
  icon?: string;                 // URL or emoji
  homepage?: string;
  docsUrl?: string;
  shortcutCount: number;         // Number of shortcuts in DB
}
```

**Keyword Search (Default/Free)**
```typescript
// core/src/search/keyword.ts
export interface SearchOptions {
  app?: string;                  // Filter by app
  platform?: Platform;           // Filter by platform
  category?: string;             // Filter by category
  maxResults?: number;           // Default 50
  fuzzyThreshold?: number;       // 0-1, default 0.6
}

export class KeywordSearchEngine {
  constructor(db: DatabaseAdapter);
  
  // Fuzzy search across action, tags, searchTerms
  fuzzySearch(query: string, options?: SearchOptions): Promise<Shortcut[]>;
  
  // Exact keypress match (e.g., search for 'Ctrl+K')
  searchByKeys(keys: string, platform?: Platform): Promise<Shortcut[]>;
  
  // List all shortcuts for an app
  listByApp(app: string, platform?: Platform): Promise<Shortcut[]>;
  
  // Search by category
  searchByCategory(category: string): Promise<Shortcut[]>;
}

// Search ranking algorithm:
// 1. Exact action match (score: 1.0)
// 2. Action starts with query (score: 0.8)
// 3. Tag exact match (score: 0.7)
// 4. Fuzzy match in action (score: 0.3-0.6)
// 5. Fuzzy match in searchTerms (score: 0.2-0.4)
// 6. Boost by popularity (multiply by popularity score)
```

**AI Search (Optional/BYOK)**
```typescript
// core/src/search/ai.ts
export type AIProviderType = 'openai' | 'anthropic' | 'ollama';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;               // Not needed for Ollama
  model?: string;                // 'gpt-4', 'claude-3-sonnet'
  baseUrl?: string;              // For Ollama: http://localhost:11434
}

export interface AISearchContext {
  app?: string;                  // Current app context
  platform: Platform;            // User's OS
  recentActions?: string[];      // Recently used shortcuts
}

export class AISearchEngine {
  constructor(config: AIProviderConfig, db: DatabaseAdapter);
  
  // Natural language search
  // Example: "how do I split window vertically in tmux"
  async semanticSearch(
    naturalQuery: string, 
    context?: AISearchContext
  ): Promise<Shortcut[]> {
    // 1. Use AI to extract intent & keywords
    // 2. Convert to structured query
    // 3. Search DB with keyword engine
    // 4. If no results, trigger on-demand scraping
    // 5. Re-rank results with AI relevance
  }
  
  // Explain a shortcut in plain English
  async explainShortcut(shortcut: Shortcut): Promise<string>;
  
  // Suggest related shortcuts
  async getSimilar(shortcut: Shortcut): Promise<Shortcut[]>;
  
  // Generate shortcuts from documentation
  async extractFromDocs(url: string, app: string): Promise<Shortcut[]>;
}
```

**Search Flow**:
```
User types: "vim move word"
  ↓
[Keyword Engine]
  - Fuzzy match: 'move', 'word' in action/tags
  - Filter: app='vim'
  - Results: [w, b, e, ge, ...]
  ↓
[Optional: AI Enhancement]
  - Re-rank by semantic relevance
  - Add explanation: "w = word forward"
  - Suggest related: [W, B, E (WORD variants)]
  ↓
[Return to UI]
```

#### 1.3 Scraping Pipeline - HYBRID APPROACH (DECIDED)

**Decision**: Hybrid scheduled + on-demand scraping

**Architecture**:
```
Scheduled Pipeline (Weekly)
  ↓
Top 50 apps → Core DB → GitHub Release
  ↓
TUI/Web downloads on update

On-Demand Pipeline (User-triggered)
  ↓
Long-tail apps → Local cache → Optional: Contribute to core
```

**Scheduled Pipeline (GitHub Actions)**:

```yaml
# .github/workflows/scrape-shortcuts.yml
name: Scrape Shortcuts
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:      # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Scrape top 50 apps
        run: npm run scrape:scheduled
      
      - name: Validate shortcuts
        run: npm run validate:shortcuts
      
      - name: Update SQLite DB
        run: npm run db:build
      
      - name: Create GitHub Release
        # Publish shortcuts.db as release asset
```

**Scraping Strategy by Source Type**:

**Type 1: Man Pages (Simple)**
```typescript
// core/src/scrapers/man-page.ts
export class ManPageScraper {
  async scrape(command: string): Promise<Shortcut[]> {
    // 1. Run: man ${command} | col -b
    // 2. Parse sections: KEY BINDINGS, COMMANDS
    // 3. Extract with regex patterns
    // 4. Map to Shortcut schema
  }
}

// Examples: vim, tmux, less, git
// Pattern: "^\s+([a-zA-Z0-9]+)\s+(.+)$"
// Example: "     j       Move down one line"
```

**Type 2: GitHub README (Markdown)**
```typescript
// core/src/scrapers/github.ts
export class GitHubScraper {
  async scrape(repo: string, path?: string): Promise<Shortcut[]> {
    // 1. Fetch README via GitHub API
    // 2. Parse markdown tables
    // 3. Look for patterns:
    //    | Key | Action |
    //    | Ctrl+K | Open file |
  }
}

// Examples: vimium, tmux plugins
```

**Type 3: Web Documentation (HTML)**
```typescript
// core/src/scrapers/web.ts
export class WebScraper {
  async scrape(url: string, selectors: ScraperConfig): Promise<Shortcut[]> {
    // 1. Fetch with Cheerio (static) or Puppeteer (dynamic)
    // 2. Find shortcut elements:
    //    - <kbd> tags
    //    - Tables with 'Shortcut' header
    //    - <code> within specific sections
    // 3. Extract surrounding context
    // 4. Map to schema
  }
}

// Examples: VSCode docs, Obsidian docs, Notion docs
```

**Type 4: Config Files (JSON/YAML)**
```typescript
// core/src/scrapers/config.ts
export class ConfigScraper {
  async scrape(configPath: string): Promise<Shortcut[]> {
    // 1. Parse JSON/YAML
    // 2. Extract keybindings
    // 3. Match with action descriptions
  }
}

// Examples:
// - VSCode: keybindings.json
// - Sublime: Default.sublime-keymap
// - Tmux: .tmux.conf
```

**Type 5: AI-Enhanced Scraping**
```typescript
// core/src/scrapers/ai.ts
export class AIScraper {
  constructor(aiEngine: AISearchEngine);
  
  async scrape(url: string, app: string): Promise<Shortcut[]> {
    // 1. Fetch page HTML
    // 2. Send to AI with prompt:
    //    "Extract keyboard shortcuts from this documentation.
    //     Return as JSON array with keys: action, keys (mac/win/linux)"
    // 3. Parse AI response
    // 4. Validate & normalize
    // 5. Mark as confidence < 1.0 (needs review)
  }
}

// Fallback for complex/unstructured docs
// Used in on-demand scraping
```

**Scraper Registry**:
```typescript
// core/src/scrapers/registry.ts
export interface ScraperConfig {
  app: string;
  type: 'man' | 'github' | 'web' | 'config' | 'ai';
  source: string;              // URL, command, or file path
  selectors?: Record<string, string>; // For web scraping
  parser?: string;             // Custom parser name
}

// registry.json
{
  "vim": {
    "type": "man",
    "source": "vim"
  },
  "vscode": {
    "type": "web",
    "source": "https://code.visualstudio.com/docs/getstarted/keybindings",
    "selectors": {
      "table": ".keybindings-table",
      "key": "td.key",
      "action": "td.command"
    }
  },
  "tmux": {
    "type": "man",
    "source": "tmux"
  }
}
```

**On-Demand Scraping Flow**:
```
User searches: "notion shortcuts"
  ↓
[Check Core DB] → Not found
  ↓
[Check Cache DB] → Not found
  ↓
[Trigger On-Demand Scrape]
  1. Look up scraper config for 'notion'
  2. If config exists: Use configured scraper
  3. If not: Prompt user for docs URL → Use AI scraper
  4. Extract shortcuts
  5. Save to cache.db
  6. (Optional) Prompt user: "Contribute to core DB?"
  ↓
[Return Results]
```

**Quality Control**:
```typescript
// Validation rules
export interface ValidationRule {
  name: string;
  check: (shortcut: Shortcut) => boolean;
  severity: 'error' | 'warning';
}

const rules: ValidationRule[] = [
  {
    name: 'has-action',
    check: (s) => s.action?.length > 0,
    severity: 'error'
  },
  {
    name: 'has-keys',
    check: (s) => Object.keys(s.keys).length > 0,
    severity: 'error'
  },
  {
    name: 'valid-key-format',
    check: (s) => /^[A-Za-z0-9+⌘⇧⌥⌃]+$/.test(s.keys.mac || ''),
    severity: 'warning'
  },
  {
    name: 'has-source',
    check: (s) => isValidUrl(s.source.url),
    severity: 'warning'
  }
];
```

**Performance Targets**:
- Scheduled scrape: Complete top 50 in <30min
- On-demand scrape: Return results in <10sec
- Cache hit rate: >90% for popular apps

### Phase 2: TUI Implementation (Week 2-3)

#### 2.1 UI Framework Decision - INK (DECIDED) ✅

**Decision**: Use Ink (React-based TUI framework)

**Rationale**:
- Component-based architecture (familiar, maintainable)
- Rich ecosystem (ink-select, ink-text-input, ink-spinner)
- Used by production CLIs (GitHub Copilot, Gatsby, Cloudflare)
- Development speed is priority for MVP
- Can optimize later if performance becomes an issue
- ~100ms startup overhead is acceptable for our use case

**Implementation Stack**:
```json
{
  "dependencies": {
    "ink": "^4.0.0",
    "react": "^18.0.0",
    "ink-text-input": "^5.0.0",
    "ink-select-input": "^5.0.0",
    "ink-spinner": "^5.0.0",
    "ink-gradient": "^3.0.0",
    "chalk": "^5.0.0"
  }
}
```

**Performance Baseline**:
- Target startup: <200ms (including React overhead)
- Search latency: <50ms for keyword search
- UI update rate: 60fps (Ink's default)
- Memory footprint: <50MB

#### 2.2 TUI Features (MVP) - TO BE DISCUSSED LATER ⏸️

**Note**: Coming back to this after database and scraping implementation.

**Initial Mockup**:
```
┌─ Shortcut Finder ────────────────────────────┐
│ Search: vim motion commands_█                │
│                                              │
│ Results (12):                                │
│ ▸ h/j/k/l    - Move left/down/up/right     │
│   w/b        - Jump word forward/backward   │
│   gg/G       - Jump to top/bottom           │
│   0/$        - Jump to line start/end       │
│                                              │
│ [Tab] Toggle AI  [Ctrl+C] Exit             │
└──────────────────────────────────────────────┘
```

**Core Interactions** (tentative):
- Always-active search input (type to filter)
- Arrow keys: navigate results
- Enter: show detailed view (context, examples, source link)
- Tab: toggle between keyword/AI search (if API key configured)
- ?: show help overlay
- q/Esc: quit

**Performance Target**: <100ms from keystroke to updated results

**TODO**: Design detailed component structure, state management, and user flows

### Phase 3: Web Interface (Week 3-4)

#### 3.1 Web App Structure

```
web/
├── app/
│   ├── page.tsx              # Main search interface
│   ├── api/
│   │   ├── search/route.ts   # Keyword search endpoint
│   │   └── ai/route.ts       # AI search (BYOK or managed)
│   └── layout.tsx
├── components/
│   ├── SearchBar.tsx
│   ├── ResultsList.tsx
│   └── ShortcutDetail.tsx
└── lib/
    └── api-client.ts
```

#### 3.2 Monetization Model

**Free Tier (TUI)**:
- Full keyword search
- BYOK for AI search (provide your own API key)
- Open source (MIT license)
- Self-hosted data

**Free Tier (Web)**:
- Keyword search
- Limited AI queries (5/day)
- Community shortcuts only

**Premium Tier (Web) - $5/mo**:
- Unlimited AI queries (managed API key)
- Priority scraping requests
- Export shortcuts (JSON, PDF)
- Team sharing features

### Phase 4: Data Sources & Scraping (Ongoing)

#### 4.1 Initial Target Apps (Top 20)

**Terminal Tools**:
- vim/neovim
- tmux
- less/bat/more
- git
- fzf
- ripgrep
- zsh/bash

**Code Editors**:
- VSCode
- Sublime Text
- IntelliJ IDEA

**Productivity**:
- Obsidian
- Notion (web app)
- Linear

**Browsers**:
- Chrome/Firefox DevTools
- Vimium extensions

#### 4.2 Scraping Strategy per Source Type

**Type 1: Man Pages**
```bash
man vim | col -b > vim.txt
# Parse with regex for KEY sections
```

**Type 2: GitHub README**
```typescript
// Use GitHub API to fetch README
// Parse markdown tables/lists
```

**Type 3: Web Documentation**
```typescript
// Cheerio for static HTML
// Puppeteer if JavaScript-rendered
// Look for: <kbd>, <code>, tables with "Shortcut" headers
```

**Type 4: Config Files**
```json
// Many apps ship with default keybindings
// VSCode: keybindings.json
// Tmux: tmux.conf
```

#### 4.3 MCP Integration (Explore)

**Potential MCP Servers**:
- `@modelcontextprotocol/server-puppeteer` - web scraping
- `@modelcontextprotocol/server-filesystem` - read local configs
- `@modelcontextprotocol/server-github` - fetch from GitHub

**Usage**: Connect MCP client in core engine, use for on-demand scraping

### Phase 5: MVP Launch (Week 4)

**Deliverables**:
1. TUI npm package: `npm install -g shortcut-finder`
2. Web app: shortcutfinder.dev (or similar)
3. Core shortcuts DB for 20 popular apps
4. GitHub repo with contribution guide

**Success Metrics**:
- <100ms search latency (TUI)
- >80% accuracy for popular apps
- Community contributions (PRs to shortcuts DB)

## Open Questions (NEEDS DISCUSSION)

### 1. Database Strategy
- [ ] No DB (pure pull) vs Curated DB vs Hybrid?
- [ ] If DB: SQLite (embedded) vs PostgreSQL (hosted)?
- [ ] Update frequency: Real-time, Daily, Weekly?

### 2. TUI Framework
- [ ] Ink (React) vs Blessed vs Bare Metal?
- [ ] Trade-off: Dev speed vs Performance vs Simplicity

### 3. Scraping Approach
- [ ] On-demand vs Scheduled vs Hybrid?
- [ ] Should we use scrapy (Python) for complex cases?
- [ ] How to handle rate limiting?

### 4. AI Integration
- [ ] Default to keyword search, AI as enhancement?
- [ ] Which providers: OpenAI only or multi-provider?
- [ ] Ollama support for local/offline?

### 5. Data Schema
```typescript
// Proposed schema (needs refinement)
interface Shortcut {
  id: string;
  app: string;
  version?: string;
  action: string;          // "Move cursor left"
  keys: {
    mac?: string;          // "⌘←"
    windows?: string;      // "Ctrl+←"
    linux?: string;        // "Ctrl+←"
  };
  context?: string;        // "Normal Mode", "Editor Focus"
  category?: string;       // "Navigation", "Editing"
  tags: string[];          // ["cursor", "movement"]
  source: string;          // URL to docs
  confidence?: number;     // 0-1 if AI-scraped
  lastUpdated: Date;
}
```

## Next Steps

1. **Decide on architecture choices** (review questions above)
2. **Create monorepo scaffold** (`pnpm init` + workspaces)
3. **Build core search engine** (keyword first)
4. **Choose TUI approach** and build MVP interface
5. **Manually create initial dataset** (10-20 apps) in JSON
6. **Test with real users** (dogfood the TUI)
7. **Iterate based on feedback**

## Timeline Estimate

- Week 1: Architecture decisions + core engine
- Week 2: TUI MVP + manual data for 5 apps
- Week 3: Web interface + scraping pipeline
- Week 4: Polish + 20 app coverage + launch

**Total: ~4 weeks to MVP**

---

## Notes

- Start simple: keyword search + manually curated shortcuts
- Add AI enhancement later (not MVP blocker)
- Focus on making the core experience fast and delightful
- Community contributions will be key to scale
- Consider using existing cheat.sh data as starting point?

