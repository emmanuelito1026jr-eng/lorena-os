# Lorena Realtor OS -- Agent System & Build Plan

> **Platform:** Claude Code (Opus/Sonnet)
> **Stack:** React 19 + Vite 6 + TypeScript + Tailwind 3.4 + Supabase + React Router v7
> **Automation:** n8n (self-hosted) | **MLS:** Spark API (GEPAR)
> **Architecture:** Calvin Boardroom Protocol (two-layer: Strategy + Operations)

---

## How This System Works

Claude Code is the orchestrator. It manages **6 teams of 17 specialized agents**, each with defined roles, owned files, and human checkpoints. Agents are invoked via the Task tool with their team/role context loaded from `.agent/teams/`.

### Agent Architecture

- **6 Teams:** Frontend, Backend, AI, Automation, Growth, Quality
- **17 Agents:** Each has a definition file in `.agent/teams/{team}/{agent}.md`
- **19 Skills:** Domain knowledge in `.agent/skills/{skill}/SKILL.md` (13 existing + 6 to create)
- **22 n8n Workflows:** Automation JSONs in `.agent/workflows/n8n_json/`
- **Autonomy:** Human-in-the-loop -- agents propose plans, Emmanuel approves before execution

See `.agent/teams/TEAMS.md` for the full agent registry, communication matrix, escalation protocol, and task assignments.

### Two-Layer Architecture

Inspired by the Improvised Intelligence skill's Calvin Boardroom Protocol:

```
STRATEGY LAYER (Boardroom):
  - Claude Code Orchestrator = Chief of Staff (task routing, conflict resolution)
  - Build Verifier = COO (system-wide quality review, deployment gates)
  - Visual QA + Bilingual QA = Quality Directors (cross-cutting review roles)

OPERATIONS LAYER (Departments):
  - Frontend Team (3 agents): Dashboard Builder, Portal Builder, Visual QA
  - Backend Team (3 agents): Database Architect, Hook Engineer, MLS Specialist
  - AI Team (5 agents): Chatbot Engineer, Briefing Generator, AI SMS Engine, CMA Analyst, Scoring Engine
  - Automation Team (3 agents): n8n Orchestrator, Drip Maestro, Integration Hub
  - Growth Team (2 agents): SEO Strategist, Content Engine
  - Quality Team (2 agents): Build Verifier, Bilingual QA

RULES:
  - No lateral communication between departments (route through Orchestrator)
  - Each agent owns specific files -- no trespassing
  - Escalate blockers UP, never sideways
  - Fresh verification evidence required for all completion claims
```

### Agent Orchestration Protocol

Every task follows this sequence:

```
1. IDENTIFY    -- Determine which agent(s) are needed
2. LOAD        -- Read agent definition + required skills
3. PLAN        -- Draft implementation approach
4. CHECKPOINT  -- Present plan to Emmanuel for approval
5. EXECUTE     -- Implement within owned files only
6. VERIFY      -- Run verification protocol (build, type-check, visual)
7. HANDOFF     -- Pass deliverables to next agent (or complete)
```

### Handoff Matrix

| From | To | Trigger | What's Passed |
|------|----|---------|---------------|
| Database Architect | Hook Engineer | New types generated | Updated database.types.ts, table/column names, RLS rules |
| Hook Engineer | Dashboard Builder | Hook ready | Hook name, return type, usage example |
| Hook Engineer | Portal Builder | Portal hook ready | Hook name, return type, usage example |
| Dashboard Builder | Visual QA | Screen built | Files changed, viewports to test |
| Portal Builder | Visual QA + Bilingual QA | Portal screen built | Files changed, translation keys to verify |
| Any Agent | Build Verifier | Code changes | Files changed, what was done |
| Scoring Engine | Drip Maestro | Score threshold event | Trigger type (hot/cold/warming), lead ID |
| Scoring Engine | AI SMS Engine | Hot lead detected | Lead ID, score, trigger action |
| AI SMS Engine | Drip Maestro | AI SMS active | Lead ID, pause all drips |
| Integration Hub | AI SMS Engine | Twilio configured | Phone number, webhook URL |
| Integration Hub | Drip Maestro | SendGrid configured | API key name, sender domain |
| MLS Specialist | Hook Engineer | Data shape changed | Updated TypeScript interfaces |
| Content Engine | SEO Strategist | New blog post | Post slug, target keywords |
| Content Engine | Bilingual QA | New content | EN + ES content for review |

### Workflow Protocol

```
1. Read the relevant SKILL.md for the domain (see Skills Registry below)
2. Read TASKS.md to understand current phase and what's next
3. Plan the implementation (use EnterPlanMode for non-trivial work)
4. Implement the changes
5. Verify:
   - npm run build (must exit 0)
   - Visual check at 375px (mobile) and 1024px (desktop)
   - Skeleton loading states (never spinners, never blank)
   - Empty states branded with gold accent
   - Correct fonts (Playfair Display headlines, Lato body)
   - Score badges use correct temperature colors
6. Mark task complete in .agent/TASKS.md
7. Write results to .agent/RESULTS.md
```

---

## Directory Map

```
casas-en-el-paso-tx/
+-- pages/                          # All page components
|   +-- dashboard/                  # Agent dashboard (11 screens)
|   |   +-- DashboardHome.tsx       # AI Command Center
|   |   +-- Leads.tsx               # Smart Lead Pipeline
|   |   +-- LeadDetail.tsx          # Lead detail (7 tabs)
|   |   +-- Deals.tsx               # Transaction pipeline
|   |   +-- Messages.tsx            # Messages hub (split-pane)
|   |   +-- Showings.tsx            # Showing calendar
|   |   +-- Market.tsx              # Market intelligence
|   |   +-- CMA.tsx                 # CMA wizard
|   |   +-- AutoTracks.tsx          # Drip sequences, campaigns, checklists
|   |   +-- Analytics.tsx           # 5-tab analytics
|   |   +-- DashboardSettings.tsx   # Settings (5 tabs)
|   +-- portal/                     # Client portal (10 screens)
|   |   +-- PortalHome.tsx          # Client dashboard
|   |   +-- PortalLogin.tsx         # Client login
|   |   +-- PropertySearch.tsx      # Property search
|   |   +-- SavedHomes.tsx          # Saved homes
|   |   +-- ClientMessages.tsx      # Client messaging
|   |   +-- MyShowings.tsx          # Client showings
|   |   +-- HomeValueEstimate.tsx   # Home value tool
|   |   +-- MortgageCalculator.tsx  # Mortgage calculator
|   |   +-- ClientProfile.tsx       # Client profile
|   |   +-- TransactionTracker.tsx  # Deal tracking
|   +-- Home.tsx, About.tsx, Properties.tsx, Contact.tsx, etc.
|   +-- Login.tsx, Signup.tsx
|   +-- NotFound.tsx
+-- components/
|   +-- dashboard/                  # Sidebar, BottomNav, DashboardLayout, modals/
|   |   +-- cma/                    # CMA PDF components
|   +-- portal/                     # PortalLayout, PortalRoute
|   +-- shared/                     # Modal, Toast, Skeleton, EmptyState, LeadScoreBadge
|   +-- lead-capture/               # FloatingChatButton, ExitIntentPopup, StickyMobileCTA
|   +-- mls/                        # PropertyCard, PropertyMap, IDXCompliance
|   +-- auth/                       # AuthProvider, ProtectedRoute
|   +-- Navbar.tsx, Hero.tsx, Footer.tsx, etc.
+-- hooks/                          # 25+ agent hooks + useChat, useTheme, etc.
|   +-- portal/                     # 6 client portal hooks
+-- lib/
|   +-- scoring/                    # 23-action behavioral scoring engine (6 files)
|   +-- chat/                       # Chatbot service, lead scoring, capture, webhooks
|   +-- mls/                        # Spark API client, sync service, adapter
|   +-- supabase/                   # Client, database types
|   +-- i18n/                       # Bilingual support (EN/ES)
|   |   +-- messages/               # en.json, es.json
|   +-- blog/                       # Blog post data
|   +-- seed/                       # Seed data (20 leads, 15 properties)
+-- supabase/
|   +-- migrations/                 # 001-011 SQL migration files
|   +-- functions/                  # Edge functions (create-profile, chat, briefing, ai-sms, cma-analysis)
+-- scripts/                        # pull-mls.mjs, gen-snapshots.mjs
+-- .agent/
|   +-- TASKS.md                    # Phase-based task tracker
|   +-- RESULTS.md                  # Completion log
|   +-- teams/                      # Agent team definitions (17 agents across 6 teams)
|   |   +-- TEAMS.md                # Master registry, orchestration protocol, communication matrix
|   |   +-- frontend/               # dashboard-builder.md, portal-builder.md, visual-qa.md
|   |   +-- backend/                # database-architect.md, hook-engineer.md, mls-specialist.md
|   |   +-- ai/                     # chatbot-engineer.md, briefing-generator.md, ai-sms-engine.md, cma-analyst.md, scoring-engine.md
|   |   +-- automation/             # n8n-orchestrator.md, drip-maestro.md, integration-hub.md
|   |   +-- growth/                 # seo-strategist.md, content-engine.md
|   |   +-- quality/                # build-verifier.md, bilingual-qa.md
|   +-- skills/                     # 13 existing + 6 to create skill reference documents
|   +-- workflows/                  # Deploy scripts + 22 n8n JSON workflows
|   +-- n8n-workflows/              # MLS sync + alert engine documentation
+-- prompts/                        # Phase build prompts (1-3)
+-- AGENT_SYSTEM.md                 # THIS FILE -- system architecture
+-- CLAUDE.md                       # Project instructions for Claude Code
+-- LORENA_BUSINESS_BRAIN.md        # Business DNA, customer profiles
+-- BRANDING.md                     # Visual identity system
```

---

## Skills Registry

### Project-Specific Skills (8)

| Skill | Path | Domain | Read Before |
|-------|------|--------|-------------|
| **design-system** | `.agent/skills/design-system/SKILL.md` | Colors, fonts, layout, loading states | Any UI component work |
| **dashboard-builder** | `.agent/skills/dashboard-builder/SKILL.md` | All 11 dashboard screens + modals | Dashboard page changes |
| **database-architect** | `.agent/skills/database-architect/SKILL.md` | Supabase schema, RLS, hooks, types | Database or hook changes |
| **ai-engine** | `.agent/skills/ai-engine/SKILL.md` | Chatbot, briefing, AI SMS, CMA | AI feature work |
| **automation-engine** | `.agent/skills/automation-engine/SKILL.md` | Scoring, AutoTracks, n8n, notifications | Scoring or automation work |
| **component-builder** | `.agent/skills/component-builder/SKILL.md` | Shared components, patterns, props | Creating/modifying components |
| **cinc-replacer** | `.agent/skills/cinc-replacer/SKILL.md` | CINC Pro feature parity analysis | Competitive reference |
| **oauth** | `.agent/skills/oauth/SKILL.md` | Social login (Google, Facebook, Apple) | Adding OAuth providers |

### General-Purpose Skills (5)

| Skill | Path | Domain | Read Before |
|-------|------|--------|-------------|
| **vibe-coding** | `.agent/skills/vibe-coding/SKILL.md` | Live browser CSS/DOM debugging | Frontend visual bugs |
| **marketing-orchestrator** | `.agent/skills/marketing-orchestrator/SKILL.md` | Brand strategy, ad copy, content, campaigns (6 sub-skills) | Any marketing task |
| **improvised-intelligence** | `.agent/skills/improvised-intelligence/SKILL.md` | Client acquisition pipeline, brand books, agent architecture (5 phases) | Client onboarding, agent system design |
| **n8n-workflow-reviewer** | `.agent/skills/n8n-workflow-reviewer/SKILL.md` | n8n workflow audit and debugging | Reviewing n8n workflows |
| **seo-strategy** | `.agent/skills/seo-strategy/SKILL.md` | SEO optimization (article mode + site audit mode) | SEO tasks |

### New Skills (6 -- TO CREATE)

| Skill | Path | Domain | Supporting Agents | Read Before |
|-------|------|--------|-------------------|-------------|
| **portal-builder** | `.agent/skills/portal-builder/SKILL.md` | Portal screen specs, client UX | Portal Builder | Portal page work |
| **mls-specialist** | `.agent/skills/mls-specialist/SKILL.md` | Spark API, IDX compliance, sync | MLS Specialist | MLS/property work |
| **integration-hub** | `.agent/skills/integration-hub/SKILL.md` | Twilio, SendGrid, API patterns | Integration Hub | External service setup |
| **bilingual-engine** | `.agent/skills/bilingual-engine/SKILL.md` | i18n patterns, translation workflow | Bilingual QA, Content Engine | Translation work |
| **qa-ops** | `.agent/skills/qa-ops/SKILL.md` | Testing strategies, regression checklist | Build Verifier, Visual QA | QA tasks |
| **deploy-ops** | `.agent/skills/deploy-ops/SKILL.md` | Deployment readiness, CI/CD | Build Verifier | Deployment prep |

---

## Phase Status

| Phase | Name | Status | Completion |
|-------|------|--------|------------|
| 1 | Foundation | COMPLETE | 100% |
| 2 | Intelligence Layer | COMPLETE | 100% |
| 3 | AI Layer | IN PROGRESS | ~70% |
| 4 | Automation Engine | PENDING | 0% |

See `.agent/TASKS.md` for detailed task-level tracking.

---

## Phase 3: AI Layer -- Remaining Work

### 3.1 Website Chatbot (IN PROGRESS)
- DONE: Pattern-matching chatbot (`lib/chat/chatService.ts`)
- DONE: FloatingChatButton UI, lead capture, chat scoring
- DONE: `chat_sessions`, `chat_messages`, `chat_lead_captures` tables
- TODO: OpenAI GPT-4o streaming via Supabase Edge Function -- BLOCKED on OPENAI_API_KEY
- TODO: Function calling (schedule_showing, capture_info, get_property) -- BLOCKED on OPENAI_API_KEY

### 3.2 Daily Briefing (PENDING)
- TODO: Activate n8n workflow LOS-06 -- BLOCKED on ANTHROPIC_API_KEY
- TODO: Claude Sonnet analysis endpoint -- BLOCKED on ANTHROPIC_API_KEY
- TODO: Wire briefing card on DashboardHome

### 3.3 AI SMS Engine (PENDING)
- TODO: Activate n8n workflow LOS-12 -- BLOCKED on ANTHROPIC_API_KEY, TWILIO_*
- TODO: Twilio integration + Claude Sonnet conversation -- BLOCKED on ANTHROPIC_API_KEY, TWILIO_*
- TODO: Business rules (quiet hours, max frequency, stop after 2 unanswered)

### 3.4 CMA Generator AI (IN PROGRESS)
- DONE: CMA wizard UI (`pages/dashboard/CMA.tsx`)
- DONE: PDF generation (`components/dashboard/cma/`)
- DONE: Comparable sales hook
- DONE: Code-split + lazy-loaded (Round 2 fix)
- TODO: Claude Sonnet analysis endpoint -- BLOCKED on ANTHROPIC_API_KEY

### 3.X Fixes Completed (Rounds 1-3)
- DONE: Scoring pipeline + recalculation (Round 2)
- DONE: Score breakdown UI + activity labels (Round 2)
- DONE: RLS policies hardened (Round 3)
- DONE: Dark mode CSS overrides (Round 3)
- DONE: CMA code-split + lazy load (Round 2)
- DONE: CORS + rate limiting on Edge Functions (Round 3)
- DONE: Portal bilingual (170 keys) (Round 3)
- DONE: Drip sequence bilingual (Round 3)
- DONE: TypeScript root cause fix (Round 2)
- DONE: Security fixes (Round 1)
- DONE: Font fixes (Round 1)
- DONE: n8n workflow fixes (Round 1)
- DONE: Backend hooks (Round 1)
- DONE: Portal UI (Round 1)
- DONE: CSS fixes (Round 1)

### Blockers Summary

All remaining Phase 3 tasks are blocked on API keys:

| Key | Blocks | Status |
|-----|--------|--------|
| OPENAI_API_KEY | GPT-4o chatbot streaming, function calling | NOT SET |
| ANTHROPIC_API_KEY | Daily briefing, AI SMS, CMA analysis | NOT SET |
| TWILIO_* | AI SMS, Speed-to-Lead | NOT SET |
| SENDGRID_API_KEY | Drip execution, calendar campaigns | NOT SET |
| SPARK_API_TOKEN | Live MLS data sync | NOT SET |

---

## Phase 4: Automation Engine -- Task Plan

| Task | Description | Dependencies | Blocked On |
|------|-------------|-------------|------------|
| 4.1 | Speed-to-Lead sequence activation | Twilio, n8n LOS-11 | TWILIO_* |
| 4.2 | Drip execution engine (n8n cron + Twilio/SendGrid) | n8n LOS-15 | SENDGRID_API_KEY |
| 4.3 | Calendar campaign auto-send | n8n, SendGrid | SENDGRID_API_KEY |
| 4.4 | Checklist automation triggers | n8n LOS-09 | n8n instance URL |
| 4.5 | Property alert system (saved search matching) | n8n LOS-27-31 | SPARK_API_TOKEN |
| 4.6 | Notification batching and delivery | n8n LOS-30 | n8n instance URL |
| 4.7 | Client portal wiring (portal pages -> real data) | Phase 3 complete | Phase 3 AI endpoints |

---

## Lead Source Integration

All sources flow into the same pipeline:

```
Apollo Prospect --------> |
Instantly Reply --------> |
Website Registration ---> |-> LEAD PIPELINE -> Score -> Qualify -> Convert
Zillow Lead ------------> |
Referral ---------------> |
Open House -------------> |
Chat Capture -----------> |
```

### Apollo.io
- Lead source: `source = 'apollo'`
- Contact enrichment stored in `leads.metadata` (JSONB)
- n8n webhook -> Supabase insert -> score -> trigger drip

### Instantly
- Lead source: `source = 'instantly'`
- Reply detection: webhook -> create/update lead -> AI SMS
- Bounce: webhook -> flag lead -> reduce score (-5)

---

## n8n Workflow Registry

22 workflows ready for deployment in `.agent/workflows/n8n_json/`:

| ID | Name | Trigger | Category | Status |
|----|------|---------|----------|--------|
| LOS-01 | Contact Form | Webhook | Lead Capture | Ready |
| LOS-02 | Home Estimate | Webhook | Lead Capture | Ready |
| LOS-03 | CINC Import | Webhook | Migration | Ready |
| LOS-04 | Open House | Webhook | Lead Capture | Ready |
| LOS-05 | Behavioral Scoring | Webhook | Scoring | Ready |
| LOS-06 | Daily Briefing | Schedule (7 AM) | AI | Blocked (ANTHROPIC_API_KEY) |
| LOS-07 | ROI Tracker | Schedule | Analytics | Ready |
| LOS-08 | CMA Generator | Webhook | AI | Blocked (ANTHROPIC_API_KEY) |
| LOS-09 | Checklist Automator | Webhook | Automation | Ready |
| LOS-10 | System Monitor | Schedule | Ops | Ready |
| LOS-11 | Speed to Lead | Schedule | Automation | Blocked (TWILIO_*) |
| LOS-12 | AI SMS Engine | Webhook | AI | Blocked (ANTHROPIC_API_KEY, TWILIO_*) |
| LOS-13 | Zillow Parser | Schedule | Lead Capture | Ready |
| LOS-14 | Meta Lead Sync | Webhook | Lead Capture | Ready |
| LOS-15 | Drip Orchestrator | Schedule | Automation | Blocked (SENDGRID_API_KEY) |
| LOS-16 | Lead Reactivation | Schedule | Automation | Ready |
| LOS-17 | Behavioral Triggers | Schedule | Scoring | Ready |
| LOS-18 | Showing Coordinator | Webhook | Coordination | Ready |
| LOS-19 | Pre-Showing Brief | Schedule | Coordination | Ready |
| LOS-20 | Post-Showing | Webhook | Coordination | Ready |
| LOS-21 | Post-Close Nurture | Webhook | Retention | Ready |
| LOS-22 | Social Content | Schedule | Marketing | Ready |

Detailed documentation: `.agent/n8n-workflows/LOS-26-mls-sync-engine.md` and `LOS-27-31-alert-workflows.md`

Deploy scripts: `.agent/workflows/deploy_all.py`, `deploy_v2.py`

---

## Verification Protocol

**The Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

After EVERY task, run:

```bash
# 1. Build check
npm run build
# Expected: exit 0

# 2. Visual check (if UI task)
# Open at 375px -> verify mobile layout
# Open at 1024px -> verify desktop layout
# Check: correct fonts, colors, loading states, empty states
```

**Red flags:**
- "Should work" or "probably passes" = NOT VERIFIED
- "Looks correct" = NOT VERIFIED until build runs
- Claiming completion without running commands = VIOLATION

---

## Troubleshooting

| How You're Stuck | What To Do |
|------------------|------------|
| Complexity spiraling | Simplify. Remove features. YAGNI. |
| Same bug keeps returning | Root cause trace -- find the real issue, not symptoms |
| Multiple independent failures | Use Task tool to investigate each in parallel |
| Can't figure out architecture | Re-read LORENA_BUSINESS_BRAIN.md + CLAUDE.md |
| Design doesn't match spec | Re-read BRANDING.md + design-system skill |
| Database question | Read database-architect skill + database.types.ts |
| Scoring issue | Read automation-engine skill + lib/scoring/constants.ts |
| Agent scope conflict | Read TEAMS.md Communication Matrix + agent definitions |
| Cross-team dependency | Route through Orchestrator, not directly |
| Blocked on API key | Escalate to Emmanuel -- cannot proceed without credentials |

---

## Environment Variables Required

```
# Frontend (.env)
VITE_SUPABASE_URL=https://zdonombljnuylmnwkhga.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_WEBHOOK_URL=<n8n-webhook-base-url>

# Backend / Edge Functions
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
OPENAI_API_KEY=<for-chatbot>
ANTHROPIC_API_KEY=<for-briefing-cma-sms>

# External Services
TWILIO_ACCOUNT_SID=<twilio>
TWILIO_AUTH_TOKEN=<twilio>
TWILIO_PHONE_NUMBER=+1915XXXXXXX
SENDGRID_API_KEY=<sendgrid>
SPARK_API_TOKEN=<mls-token>
```

---

## Quick Reference

- **Dev server:** `npm run dev` -> localhost:3000
- **Build:** `npm run build`
- **Type check:** `npx tsc --noEmit`
- **Seed data:** `npx tsx lib/seed/seed.ts`
- **MLS pull:** `node scripts/pull-mls.mjs`
- **Market snapshots:** `node scripts/gen-snapshots.mjs`
- **Deploy n8n:** `python3 .agent/workflows/deploy_v2.py`
