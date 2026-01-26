# Katasumi - Development Priority Guide

## Summary of Changes

### 1. **Prisma Added to Tech Stack**

Prisma has been added as the ORM for managing both SQLite (TUI) and PostgreSQL (Web) databases with a unified schema. This solves the challenge of keeping schemas in sync between the two database systems.

**Key Benefits:**
- ✅ Single `schema.prisma` file defines structure for both databases
- ✅ Type-safe database queries with autocomplete
- ✅ Automatic migrations with `prisma migrate`
- ✅ Works seamlessly with TypeScript types
- ✅ Built-in introspection and seeding capabilities

**Schema Applicability:**
- The **Prisma schema applies to BOTH SQLite and PostgreSQL**
- Core tables (`Shortcut`, `AppInfo`) are shared across both databases
- User-related tables (`User`, `UserShortcut`, `Collection`, etc.) are PostgreSQL-only for the web app
- TUI uses: `shortcuts.db` (bundled, read-only) + `user-data.db` (local, read-write)
- Web uses: PostgreSQL with full schema including user management

See [katasumi-plan.md](katasumi-plan.md) section 1.1 for detailed Prisma implementation.

---

## 2. **Priority System**

Each requirement now has:
- `priority` (1-5): Indicates execution order
- `priorityRationale`: Explains why this priority was assigned

### Priority Levels

**Priority 1: Critical Foundation** (3 requirements)
These MUST be completed first as everything else depends on them:
- `PHASE1-INFRA-001`: Monorepo Setup
- `PHASE1-DB-003`: Schema Definition (TypeScript types)
- `PHASE1-INFRA-002`: Database Migrations (Prisma setup)

**Priority 2: Core Features** (7 requirements)
Foundation for both TUI and Web, can be developed in parallel:
- `PHASE1-DB-001`: SQLite Database (TUI)
- `PHASE1-DB-002`: PostgreSQL Database (Web)
- `PHASE1-DATA-001`: Core Shortcuts Database
- `PHASE1-SEARCH-001`: Keyword Search Engine
- `PHASE1-TEST-001`: Unit Tests
- `PHASE2-TUI-001`: TUI App Scaffold
- `PHASE3-WEB-001`: Web App Scaffold

**Priority 3: Enhanced Features** (13 requirements)
Build on core features, can be parallelized:
- Search enhancements (AI, reverse lookup)
- TUI modes (App-First, Full-Phrase, Detail View)
- Web UI (Search modes, Detail modal, API routes)
- Sync API (basic functionality)
- Authentication

**Priority 4: Polish & Optimization** (15 requirements)
Important but not blocking for MVP:
- Settings panels, help overlays
- Error handling
- Performance optimization
- Testing (integration, E2E)
- Responsive design
- Keyboard shortcuts
- Documentation
- CI/CD

**Priority 5: Nice-to-Have** (2 requirements)
Can be deferred to post-MVP:
- API documentation (TypeDoc)
- Contributing guide

---

## 3. **Recommended Development Sequence**

### Week 1: Foundation (Priority 1)
```
Day 1-2: PHASE1-INFRA-001 - Set up monorepo with pnpm
         - Create packages/core, packages/tui, packages/web
         - Configure Turborepo
         - Set up TypeScript with composite projects

Day 3-4: PHASE1-DB-003 - Define Prisma schema
         - Create schema.prisma with Shortcut, AppInfo models
         - Generate Prisma client
         - Export TypeScript types from core package

Day 5:   PHASE1-INFRA-002 - Set up Prisma migrations
         - Create initial migration
         - Test with both SQLite and PostgreSQL
```

### Week 2: Core Databases & Search (Priority 2)
```
Day 1-2: PHASE1-DB-001 & PHASE1-DB-002 - Database adapters
         - Implement PrismaAdapter for both SQLite and PostgreSQL
         - Create shortcuts.db with basic schema
         - Set up PostgreSQL on Vercel/Supabase

Day 3:   PHASE1-DATA-001 - Populate core shortcuts
         - Add vim, tmux, vscode, git, bash shortcuts
         - At least 100 shortcuts total for testing

Day 4-5: PHASE1-SEARCH-001 - Keyword search engine
         - Implement fuzzySearch()
         - Add filtering by app, platform, category
         - Write unit tests (PHASE1-TEST-001)
```

### Week 3: TUI Development (Priority 2-3)
```
Day 1:   PHASE2-TUI-001 - TUI scaffold
         - Set up Ink with React
         - Configure Zustand for state management
         - Basic app structure

Day 2-3: PHASE2-TUI-002 - App-First mode
         - App selector with autocomplete
         - Filters bar
         - Results list

Day 4:   PHASE2-TUI-004 - Detail view
         - Shortcut detail modal
         - Copy/open URL functionality

Day 5:   PHASE2-TUI-003 - Full-Phrase mode
         - Natural language search input
         - Cross-app results
```

### Week 4: Web Development (Priority 2-3)
```
Day 1:   PHASE3-WEB-001 - Web scaffold
         - Next.js 14 with App Router
         - Tailwind CSS setup

Day 2-3: PHASE3-WEB-003 & PHASE3-WEB-004 - Search modes
         - App-First mode UI
         - Full-Phrase mode UI
         - API routes (PHASE3-WEB-008)

Day 4:   PHASE3-WEB-005 - Detail modal
         - Shortcut detail dialog
         - Copy/share functionality

Day 5:   PHASE3-WEB-002 - Authentication
         - NextAuth.js setup
         - Login/signup pages
```

### Week 5: Premium Features (Priority 3-4)
```
Day 1-2: PHASE1-SEARCH-002 - AI search
         - OpenAI/Anthropic/Ollama integration
         - Semantic search
         - Rate limiting for free tier

Day 3-4: PHASE1-SYNC-001 - Sync API
         - Push/pull endpoints
         - JWT authentication
         - Basic conflict detection

Day 5:   PHASE2-TUI-008 - Login command
         - CLI authentication
         - Token storage
```

### Week 6+: Polish (Priority 4-5)
- Settings panels
- Help overlays
- Error handling
- Performance optimization
- Testing (integration, E2E)
- Documentation
- CI/CD pipeline

---

## 4. **Parallel Development Opportunities**

These tasks can be done simultaneously by different developers:

**Track 1: Core + TUI**
- Database setup (Priority 1-2)
- Search engine (Priority 2)
- TUI implementation (Priority 2-3)

**Track 2: Web**
- Web scaffold (Priority 2)
- Web UI (Priority 3)
- API routes (Priority 3)

**Track 3: Data + Testing**
- Core shortcuts data (Priority 2)
- Unit tests (Priority 2)
- Integration tests (Priority 4)

---

## 5. **Dependencies Map**

```
PHASE1-INFRA-001 (Monorepo)
  ├─→ PHASE1-DB-003 (Schema Definition)
  │     ├─→ PHASE1-INFRA-002 (Prisma Migrations)
  │     │     ├─→ PHASE1-DB-001 (SQLite)
  │     │     └─→ PHASE1-DB-002 (PostgreSQL)
  │     │           ├─→ PHASE1-DATA-001 (Core Data)
  │     │           │     └─→ PHASE1-SEARCH-001 (Keyword Search)
  │     │           │           ├─→ PHASE1-SEARCH-002 (AI Search)
  │     │           │           ├─→ PHASE1-SEARCH-003 (Reverse Lookup)
  │     │           │           └─→ PHASE2-TUI-001 (TUI Scaffold)
  │     │           │                 ├─→ PHASE2-TUI-002 (App-First)
  │     │           │                 │     ├─→ PHASE2-TUI-003 (Full-Phrase)
  │     │           │                 │     └─→ PHASE2-TUI-004 (Detail View)
  │     │           │                 └─→ PHASE2-TUI-005 (Platform Selector)
  │     │           └─→ PHASE3-WEB-001 (Web Scaffold)
  │     │                 ├─→ PHASE3-WEB-002 (Auth)
  │     │                 ├─→ PHASE3-WEB-003 (App-First Web)
  │     │                 ├─→ PHASE3-WEB-004 (Full-Phrase Web)
  │     │                 ├─→ PHASE3-WEB-005 (Detail Modal)
  │     │                 └─→ PHASE3-WEB-008 (API Routes)
  │     │                       └─→ PHASE1-SYNC-001 (Sync API)
  │     │                             └─→ PHASE2-TUI-008 (Login Command)
  └─→ PHASE1-TEST-001 (Unit Tests)
```

---

## 6. **Key Insights**

### Database Strategy Clarification
- **Prisma manages BOTH SQLite and PostgreSQL** using the same schema
- Use `provider = "sqlite"` for TUI, `provider = "postgresql"` for Web
- Migrations are automatically generated and can be applied to both
- TypeScript types are generated from the single source of truth

### Why These Priorities?
1. **Foundation first**: Can't build anything without monorepo and schema
2. **Database before features**: Search needs data to work with
3. **TUI and Web in parallel**: Different teams can work simultaneously
4. **Polish last**: Don't optimize or document incomplete features
5. **MVP focus**: Get core functionality working before premium features

### Blockers to Watch
- PHASE1-INFRA-001 blocks everything
- PHASE1-DB-003 blocks all database work
- PHASE1-SEARCH-001 blocks all search features
- PHASE2-TUI-001 blocks all TUI features
- PHASE3-WEB-001 blocks all web features

---

## Next Steps

1. **Start with Priority 1** (Week 1)
   - Set up monorepo
   - Define Prisma schema
   - Configure migrations

2. **Tackle Priority 2** (Week 2)
   - Build databases
   - Implement keyword search
   - Create scaffolds

3. **Expand to Priority 3** (Weeks 3-4)
   - Build TUI features
   - Build Web features
   - Add AI search

4. **Polish with Priority 4-5** (Week 5+)
   - Settings, help, errors
   - Performance optimization
   - Documentation

---

## References

- Full PRD: [prd.json](prd.json)
- Technical Plan: [katasumi-plan.md](katasumi-plan.md)
- Prisma Schema: Will be in `packages/core/prisma/schema.prisma`
