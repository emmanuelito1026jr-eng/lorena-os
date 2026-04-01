# Lorena OS -- Agent Teams Registry

> **Scope:** Lorena's real estate operating system (Casas En El Paso TX)
> **Autonomy:** Human-in-the-loop -- agents propose plans, Emmanuel approves before execution
> **Orchestrator:** Claude Code (Opus) -- delegates to sub-agents via Task tool
> **Architecture:** Calvin Boardroom Protocol (two-layer: Strategy + Operations)

---

## Orchestration Protocol

How Claude Code delegates work to agents. Every task follows this sequence:

```
1. IDENTIFY    -- Determine which agent(s) are needed for the task
2. LOAD        -- Read agent definition file + required skills
3. PLAN        -- Draft implementation approach (human checkpoint for non-trivial work)
4. CHECKPOINT  -- Present plan to Emmanuel for approval
5. EXECUTE     -- Implement the changes within the agent's owned files
6. VERIFY      -- Run agent's verification protocol (build, type-check, visual)
7. HANDOFF     -- Pass deliverables to the next agent in the chain (or complete)
```

### Rules of Engagement

- **One agent per task.** If a task spans two agents, break it into sub-tasks with explicit handoffs.
- **No lateral file edits.** An agent never directly modifies another agent's owned files. Instead, it creates a handoff request describing what needs to change and why.
- **Skills are pre-read knowledge.** Before an agent starts working, it reads its required skills to load domain context.
- **Fresh verification only.** No claiming "it should work" -- run the commands and show the output.
- **Escalation over guessing.** If an agent hits ambiguity, it escalates to Emmanuel rather than assuming.

---

## Two-Layer Architecture (Calvin Boardroom Protocol)

Inspired by the Improvised Intelligence skill's Operate phase. The system has two layers:

```
+=====================================================+
|              STRATEGY LAYER (Boardroom)              |
|                                                      |
|  Claude Code Orchestrator (Chief of Staff)            |
|    - Reads task requests from Emmanuel                |
|    - Assigns to correct agent(s)                      |
|    - Manages cross-team handoffs                      |
|    - Resolves conflicts between agents                |
|    - Reviews Build Verifier + Visual QA reports       |
|                                                      |
|  Build Verifier (COO)                                 |
|    - Reviews ALL output from every agent              |
|    - Enforces Iron Law: no completion without proof   |
|    - Suggests improvements, catches regressions       |
|    - Gates deployment approval                        |
|                                                      |
+==========================+==========================+
          DELEGATE v       | ^ ESCALATE
+==========================+==========================+
|              OPERATIONS LAYER (Departments)           |
|                                                      |
|  Frontend Dept    Backend Dept    AI Dept             |
|  Automation Dept  Growth Dept     Quality Dept        |
|                                                      |
|  Rules:                                               |
|  - No lateral communication between departments       |
|  - Cross-dept needs route through Orchestrator        |
|  - Each agent owns specific files -- no trespassing   |
|  - Escalate blockers UP, never sideways               |
+=====================================================+
```

---

## Communication Matrix

Who can talk to whom, and how.

| From | To | Allowed? | Format |
|------|----|----------|--------|
| Orchestrator | Any Agent | YES | Task assignment with context |
| Any Agent | Orchestrator | YES | Escalation request or completion report |
| Build Verifier | Any Agent | YES | Failure report with fix instructions |
| Visual QA | Frontend Agents | YES | Issue report with screenshots/descriptions |
| Bilingual QA | Any Agent (client-facing) | YES | Missing translation report |
| Agent A | Agent B (same team) | YES | Intra-team coordination via shared context |
| Agent A | Agent B (different team) | NO | Must go through Orchestrator handoff |

### Handoff Format

When one agent hands off to another, the handoff must include:

```
HANDOFF:
  From: [Agent Name] ([Team])
  To: [Agent Name] ([Team])
  What was done: [1-3 sentence summary]
  Files changed: [list of files modified/created]
  What's needed next: [specific action required from receiving agent]
  Blockers: [any known issues or dependencies]
  Verification status: [build passes? type-check clean?]
```

---

## Escalation Protocol

When an agent is stuck, it follows this escalation path:

```
Level 1: SELF-RESOLVE
  - Re-read relevant skill documentation
  - Check CLAUDE.md for conventions
  - Look at similar patterns in the codebase

Level 2: INTRA-TEAM
  - Consult with same-team agents (e.g., Dashboard Builder asks Hook Engineer)
  - Share context about the blocker

Level 3: ORCHESTRATOR
  - Escalate to Claude Code Orchestrator with:
    * What was attempted
    * What failed and why
    * Proposed alternatives (if any)
  - Orchestrator may reassign, break the task down, or consult another team

Level 4: HUMAN (Emmanuel)
  - Orchestrator escalates to Emmanuel when:
    * Business logic is ambiguous
    * API keys or credentials are needed
    * Architecture decisions with long-term impact
    * External service configuration (Twilio, SendGrid, n8n)
    * Cost implications (API usage, service subscriptions)
    * Security-sensitive changes (RLS policies, auth)
```

### Specific Escalation Triggers

| Situation | Escalate To | Example |
|-----------|-------------|---------|
| Build fails, error in own files | Self-resolve (Level 1) | TypeScript error in component you're editing |
| Build fails, error in another agent's files | Orchestrator (Level 3) | Hook returns wrong type, UI agent can't fix |
| Need a new database table | Database Architect via Orchestrator | New feature needs schema change |
| Need a new hook | Hook Engineer via Orchestrator | UI component needs data not yet accessible |
| Need API key or credential | Emmanuel (Level 4) | Twilio, OpenAI, Anthropic keys needed |
| Unclear business rule | Emmanuel (Level 4) | "Should this alert fire on weekends?" |
| Schema migration needed | Emmanuel (Level 4) | Any change to production database |
| Design ambiguity | Emmanuel (Level 4) | "Is this the right UX for mobile?" |

---

## Dependency Graph

```
                    +-------------------+
                    |   Emmanuel        |
                    |   (Human)         |
                    +--------+----------+
                             |
                    +--------v----------+
                    | Claude Code       |
                    | Orchestrator      |
                    | (Chief of Staff)  |
                    +--------+----------+
                             |
          +------------------+------------------+
          |                  |                  |
    +-----v------+   +------v------+   +-------v-----+
    | Build       |   | Visual QA  |   | Bilingual   |
    | Verifier    |   |            |   | QA          |
    | (COO)       |   |            |   |             |
    +-----+------+   +------+------+   +------+------+
          |                  |                 |
          |  (reviews all)   | (reviews UI)    | (reviews i18n)
          |                  |                 |
   +------v-------+  +------v------+  +-------v------+
   |              |  |             |  |              |
+--v---+  +------v-+ | +---------v-+ | +----------v-+
|Front |  |Back   | | |AI        | | |Automation  | |
|end   |  |end    | | |Team      | | |Team        | |
|Team  |  |Team   | | |          | | |            | |
+--+---+  +--+----+ | +----+----+  | +----+-------+ |
   |         |       |      |       |      |         |
   |         |       |      |       |      |         |
   |    +----v----+  |  +---v---+   |  +---v------+  |
   |    | Database|  |  |Scoring|   |  |n8n       |  |
   |    | Arch.   |--+->|Engine |---+->|Orchestr. |  |
   |    +----+----+  |  +---+---+   |  +---+------+  |
   |         |       |      |       |      |         |
   |    +----v----+  |  +---v---+   |  +---v------+  |
   |    | Hook    |---->|Chatbot|   |  |Drip      |  |
   |    | Engineer|  |  |Eng.   |   |  |Maestro   |  |
   |    +---------+  |  +-------+   |  +----------+  |
   |                 |              |                 |
+--v--------+  +-----v----+  +-----v------+  +-------v---+
|Dashboard  |  |MLS       |  |Briefing    |  |Integration|
|Builder    |  |Specialist|  |Generator   |  |Hub        |
+-----------+  +----------+  +------------+  +-----------+
|Portal     |                |AI SMS      |
|Builder    |                |Engine      |
+-----------+                +------------+
                             |CMA        |
                             |Analyst    |
                             +------------+

Data Flow (simplified):
  Database Architect --> Hook Engineer --> Dashboard Builder / Portal Builder
  MLS Specialist --> Hook Engineer --> Dashboard Builder (Market) / Portal Builder (Search)
  Scoring Engine --> AI SMS Engine / Drip Maestro
  Integration Hub --> AI SMS Engine / Drip Maestro / n8n Orchestrator
  Build Verifier --> reviews ALL agent output
  Visual QA --> reviews Frontend output
  Bilingual QA --> reviews client-facing output
```

---

## Team Overview

| Team | Agents | Focus | Phase 3-4 Role |
|------|--------|-------|----------------|
| **Frontend** | 3 | Visual layer -- dashboard, portal, visual QA | Portal wiring, responsive fixes, briefing card |
| **Backend** | 3 | Data layer -- schema, hooks, MLS sync | Edge functions for AI, hook gaps, portal hooks |
| **AI** | 5 | Intelligence -- chatbot, briefing, SMS, CMA, scoring | GPT-4o streaming, daily briefing, AI SMS, CMA analysis |
| **Automation** | 3 | Nervous system -- n8n, drips, integrations | Speed-to-Lead, drip execution, Twilio/SendGrid setup |
| **Growth** | 2 | Business -- SEO, content, lead capture | Blog content, meta tags, capture optimization |
| **Quality** | 2 | Verification -- builds, bilingual, accessibility | Cross-cutting QA on all changes |

---

## Agent Quick Reference

### Frontend Team (`.agent/teams/frontend/`)
| Agent | File | Role | Scope Boundary |
|-------|------|------|----------------|
| Dashboard Builder | `dashboard-builder.md` | All 11 dashboard screens + modals | Only `pages/dashboard/`, `components/dashboard/` |
| Portal Builder | `portal-builder.md` | All 10 client portal screens | Only `pages/portal/`, `components/portal/`, `hooks/portal/` |
| Visual QA | `visual-qa.md` | Responsive testing, design system enforcement | Reviews only -- no owned source files |

### Backend Team (`.agent/teams/backend/`)
| Agent | File | Role | Scope Boundary |
|-------|------|------|----------------|
| Database Architect | `database-architect.md` | Schema, migrations, RLS, types, Edge Functions | Only `supabase/`, `lib/supabase/` |
| Hook Engineer | `hook-engineer.md` | All TanStack Query hooks | Only `hooks/*.ts`, `hooks/portal/*.ts` |
| MLS Specialist | `mls-specialist.md` | Spark API sync, IDX compliance | Only `lib/mls/`, `components/mls/`, `scripts/` |

### AI Team (`.agent/teams/ai/`)
| Agent | File | Role | Scope Boundary |
|-------|------|------|----------------|
| Chatbot Engineer | `chatbot-engineer.md` | GPT-4o streaming + function calling | Only `lib/chat/`, `hooks/useChat.ts`, `supabase/functions/chat/` |
| Briefing Generator | `briefing-generator.md` | Claude Sonnet daily briefings | Only `supabase/functions/briefing/`, n8n LOS-06 |
| AI SMS Engine | `ai-sms-engine.md` | Lead qualification via AI SMS | Only `supabase/functions/ai-sms/`, n8n LOS-12 |
| CMA Analyst | `cma-analyst.md` | 60-second CMA with Claude analysis | Only `pages/dashboard/CMA.tsx`, `components/dashboard/cma/`, `hooks/useCMA*.ts`, `supabase/functions/cma-analysis/` |
| Scoring Engine | `scoring-engine.md` | Behavioral scoring, calibration, triggers | Only `lib/scoring/` (6 files) |

### Automation Team (`.agent/teams/automation/`)
| Agent | File | Role | Scope Boundary |
|-------|------|------|----------------|
| n8n Orchestrator | `n8n-orchestrator.md` | Deploy + monitor 22 workflows | Only `.agent/workflows/`, `.agent/n8n-workflows/` |
| Drip Maestro | `drip-maestro.md` | Sequences, calendar campaigns | Only `hooks/useAutoTracks.ts` (coordinate with Dashboard Builder for UI) |
| Integration Hub | `integration-hub.md` | Twilio, SendGrid, Zillow, Meta | Only external service configs, webhook setup |

### Growth Team (`.agent/teams/growth/`)
| Agent | File | Role | Scope Boundary |
|-------|------|------|----------------|
| SEO Strategist | `seo-strategist.md` | Technical SEO, structured data | Only `public/robots.txt`, `public/sitemap.xml`, `index.html`, `hooks/usePageMeta.ts`, `hooks/usePageTitle.ts` |
| Content Engine | `content-engine.md` | Blog, social, bilingual copy | Only `lib/blog/posts.ts`, `pages/BlogHub.tsx`, `pages/BlogPost.tsx`, `components/BlogCard.tsx` |

### Quality Team (`.agent/teams/quality/`)
| Agent | File | Role | Scope Boundary |
|-------|------|------|----------------|
| Build Verifier | `build-verifier.md` | TypeScript, lint, build checks | Reviews all -- owns `vite.config.ts`, `tsconfig.json`, `package.json` |
| Bilingual QA | `bilingual-qa.md` | EN/ES parity on all client-facing text | Only `lib/i18n/` (translation files) |

---

## Phase 3-4 Task Assignment (Updated 2026-03-25)

### Phase 3: AI Layer (~70% complete)

| Task | Agent | Status | Dependencies | Blocked On |
|------|-------|--------|-------------|------------|
| 3.1.1-6 Pattern chatbot, UI, capture, scoring, webhooks, tables | Chatbot Engineer | COMPLETE | -- | -- |
| 3.1.7 GPT-4o streaming via Edge Function | Chatbot Engineer | TODO | Database Architect (Edge Function) | OPENAI_API_KEY |
| 3.1.8 Function calling (schedule, capture, property) | Chatbot Engineer | TODO | Hook Engineer (hooks ready) | OPENAI_API_KEY |
| 3.2.1 n8n workflow LOS-06 activation | n8n Orchestrator | TODO | Briefing Generator (endpoint ready) | ANTHROPIC_API_KEY |
| 3.2.2 Claude Sonnet briefing endpoint | Briefing Generator | TODO | Database Architect (Edge Function) | ANTHROPIC_API_KEY |
| 3.2.3 Briefing card on DashboardHome | Dashboard Builder | TODO | Briefing Generator (data available) | -- |
| 3.3.1 n8n workflow LOS-12 activation | n8n Orchestrator | TODO | AI SMS Engine (endpoint ready) | ANTHROPIC_API_KEY, Twilio |
| 3.3.2 Twilio + Claude SMS integration | AI SMS Engine | TODO | Integration Hub (Twilio setup) | ANTHROPIC_API_KEY, TWILIO_* |
| 3.3.3 SMS business rules | AI SMS Engine | TODO | Scoring Engine (triggers ready) | -- |
| 3.4.1 CMA wizard UI | CMA Analyst | COMPLETE | -- | -- |
| 3.4.2 PDF generation | CMA Analyst | COMPLETE | -- | -- |
| 3.4.3 Comparable sales hook | CMA Analyst | COMPLETE | -- | -- |
| 3.4.4 Claude Sonnet CMA analysis endpoint | CMA Analyst | TODO | Database Architect (Edge Function) | ANTHROPIC_API_KEY |
| 3.X.1 Scoring pipeline + recalculation | Scoring Engine | COMPLETE | -- | -- |
| 3.X.2 Score breakdown UI + activity labels | Dashboard Builder | COMPLETE | Scoring Engine | -- |
| 3.X.3 RLS policies hardened | Database Architect | COMPLETE | -- | -- |
| 3.X.4 Dark mode CSS overrides | Visual QA | COMPLETE | -- | -- |
| 3.X.5 Portal bilingual (170 keys) | Bilingual QA | COMPLETE | -- | -- |
| 3.X.6 Drip sequence bilingual | Bilingual QA | COMPLETE | -- | -- |
| 3.X.7 CMA code-split + lazy load | CMA Analyst | COMPLETE | -- | -- |
| 3.X.8 CORS + rate limiting (Edge Functions) | Database Architect | COMPLETE | -- | -- |

### Phase 4: Automation Engine (0% complete)

| Task | Agent | Status | Dependencies | Blocked On |
|------|-------|--------|-------------|------------|
| 4.1 Speed-to-Lead activation | n8n Orchestrator | TODO | Integration Hub (Twilio) | TWILIO_* |
| 4.2 Drip execution engine | Drip Maestro | TODO | n8n Orchestrator, Integration Hub (SendGrid) | SENDGRID_API_KEY |
| 4.3 Calendar campaign auto-send | Drip Maestro | TODO | Integration Hub (SendGrid) | SENDGRID_API_KEY |
| 4.4 Checklist automation triggers | n8n Orchestrator | TODO | -- | n8n instance URL |
| 4.5 Property alert system | n8n Orchestrator | TODO | MLS Specialist (sync engine) | SPARK_API_TOKEN |
| 4.6 Notification batching | n8n Orchestrator | TODO | -- | n8n instance URL |
| 4.7 Client portal wiring | Portal Builder | TODO | Hook Engineer (portal hooks), Backend complete | Phase 3 AI endpoints |

---

## Skills Registry (19 Skills)

### Project-Specific Skills (8 existing)
| Skill | Path | Supporting Agents |
|-------|------|-------------------|
| design-system | `.agent/skills/design-system/SKILL.md` | Dashboard Builder, Portal Builder, Visual QA |
| dashboard-builder | `.agent/skills/dashboard-builder/SKILL.md` | Dashboard Builder |
| database-architect | `.agent/skills/database-architect/SKILL.md` | Database Architect, Hook Engineer |
| ai-engine | `.agent/skills/ai-engine/SKILL.md` | Chatbot Engineer, Briefing Generator, AI SMS Engine, CMA Analyst |
| automation-engine | `.agent/skills/automation-engine/SKILL.md` | Scoring Engine, n8n Orchestrator, Drip Maestro |
| component-builder | `.agent/skills/component-builder/SKILL.md` | Dashboard Builder, Portal Builder |
| cinc-replacer | `.agent/skills/cinc-replacer/SKILL.md` | All agents (competitive context) |
| oauth | `.agent/skills/oauth/SKILL.md` | Database Architect |

### General-Purpose Skills (5 existing)
| Skill | Path | Supporting Agents |
|-------|------|-------------------|
| vibe-coding | `.agent/skills/vibe-coding/SKILL.md` | Visual QA |
| marketing-orchestrator | `.agent/skills/marketing-orchestrator/SKILL.md` | Content Engine, SEO Strategist |
| improvised-intelligence | `.agent/skills/improvised-intelligence/SKILL.md` | Orchestrator (architecture reference) |
| n8n-workflow-reviewer | `.agent/skills/n8n-workflow-reviewer/SKILL.md` | n8n Orchestrator |
| seo-strategy | `.agent/skills/seo-strategy/SKILL.md` | SEO Strategist |

### New Skills (6 -- TO CREATE)
| Skill | Path | Supporting Agents | Status |
|-------|------|-------------------|--------|
| portal-builder | `.agent/skills/portal-builder/SKILL.md` | Portal Builder | TO CREATE |
| mls-specialist | `.agent/skills/mls-specialist/SKILL.md` | MLS Specialist | TO CREATE |
| integration-hub | `.agent/skills/integration-hub/SKILL.md` | Integration Hub | TO CREATE |
| bilingual-engine | `.agent/skills/bilingual-engine/SKILL.md` | Bilingual QA, Content Engine | TO CREATE |
| qa-ops | `.agent/skills/qa-ops/SKILL.md` | Build Verifier, Visual QA | TO CREATE |
| deploy-ops | `.agent/skills/deploy-ops/SKILL.md` | Build Verifier | TO CREATE |

---

## Memory Architecture

Each agent reads specific files before working. This ensures consistent context without overloading.

### Always Read (All Agents)
- `CLAUDE.md` -- Project instructions, conventions, design system
- The agent's own definition file in `.agent/teams/{team}/{agent}.md`

### Read Per Domain
| Domain | Files to Read |
|--------|---------------|
| UI work | `BRANDING.md`, design-system skill, component-builder skill |
| Database work | database-architect skill, `lib/supabase/database.types.ts` |
| AI work | ai-engine skill, `LORENA_BUSINESS_BRAIN.md` |
| Automation work | automation-engine skill, `lib/scoring/constants.ts` |
| Content work | marketing-orchestrator skill, `LORENA_BUSINESS_BRAIN.md` |
| i18n work | `lib/i18n/messages/en.json`, `lib/i18n/messages/es.json` |

### Read Before Phase Work
| Phase | Read |
|-------|------|
| Phase 3 | `prompts/phase-3-integration.md`, ai-engine skill |
| Phase 4 | `prompts/phase-2-parallel-build.md` (automation section), automation-engine skill |
