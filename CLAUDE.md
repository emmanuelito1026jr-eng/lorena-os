# CLAUDE.md

> **Stack:** React 19 + Vite 6 + TypeScript + Tailwind CSS 3.4 + Supabase + React Router v7 (BrowserRouter)
> **Deploy:** Vercel | **Automation:** n8n (self-hosted) | **MLS:** Spark API (GEPAR)

## Project Context

A complete AI-powered real estate operating system for Lorena Ontiveros-Ortega (Casas En El Paso TX) that replaces her CINC Pro CRM ($1,500/mo), CINC AI Alex ($200/mo), CINC VOIP Dialer (~$50-100/mo), and all separate tools - saving her ~$1,700/month. CRITICAL CONTEXT: Lorena was closing MORE deals BEFORE she started using CINC. The platform's complexity is actively hurting her productivity. Our system must be radically simpler while doing significantly more. She has under 100 leads (small, clean migration), lead sources include referrals and CINC website registrations (possibly Zillow), and MLS/Spark API access is approved (GEPAR). The system features AI daily briefings, transparent behavioral lead scoring, AI SMS qualification (replacing CINC's $200/mo "Alex"), 60-second CMA generation, automated drip sequences, bilingual (EN/ES) everything, and a client portal that must dramatically outperform CINC's Etta app (which most of her clients ignore).

## Tech Stack

- Framework: React 19 + Vite 6 (SPA)
- Language: TypeScript (strict mode)
- Database: Supabase (PostgreSQL, Auth, Realtime, Storage, Row Level Security)
- Styling: Tailwind CSS 3.4
- AI: Claude API (Sonnet 4.5 `claude-sonnet-4-5-20250929` - briefing, CMA, SMS) + OpenAI GPT-4o (chatbot - streaming + function calling)
- Automation: n8n (self-hosted - workflows, drips, scoring, alerts)
- SMS/Voice: Twilio
- Email: SendGrid
- MLS: Spark API (GEPAR — Feed ID: bs1gx50w59ms8w6qyza2tpmjl, sync engine in lib/mls/)
- Mobile: React Native + Expo (Phase 5)
- Hosting: Vercel
- Fonts: Playfair Display (headlines) + Lato (body)

## Current Architecture

The full system (public site + dashboard + portal) is a single Vite SPA:
- React 19 + TypeScript + Vite 6
- Tailwind CSS 3.4
- React Router v7 (BrowserRouter) — lazy-loaded routes with React.lazy() + Suspense
- GSAP + Lenis for animations/smooth scroll
- TanStack Query v5 (React Query) for server state
- Dark mode via `[data-theme="dark"]` CSS overrides (toggle: `hooks/useTheme.ts`)
- Brand gold: #C9A84C
- Deployed on Vercel

## Key Directories

- `pages/` - All page components (Login, Signup, Home, Properties, etc.)
- `pages/dashboard/` - Agent dashboard (DashboardHome, Leads, Messages, Showings, CMA, AutoTracks, Analytics, Settings, etc.)
- `pages/portal/` - Client portal (PortalHome, Search, Favorites, Messages, Showings, HomeValue, Calculator, Profile, Transaction)
- `components/` - Reusable components (Navbar, Hero, Footer, etc.)
- `components/dashboard/` - Agent dashboard components (Sidebar, BottomNav, modals)
- `components/portal/` - Client portal components (PortalLayout)
- `components/shared/` - Shared components (Modal, Toast, LeadScoreBadge, Skeleton, etc.)
- `components/lead-capture/` - Lead capture widgets (FloatingChatButton, ExitIntentPopup, StickyMobileCTA)
- `components/mls/` - MLS/property components (PropertyCard, PropertyMap, IDXCompliance)
- `components/auth/` - Auth components (AuthProvider, ProtectedRoute)
- `lib/supabase/` - Supabase client, database types
- `lib/chat/` - Chat system (leadScoring, chatService, webhookTriggers, leadCapture)
- `lib/scoring/` - Behavioral scoring engine, score recalculator
- `lib/mls/` - MLS adapter, Spark API client, sync service
- `lib/i18n/` - Bilingual support (EN/ES)
- `lib/seed/` - Seed data for development
- `hooks/` - 25 custom React hooks (useLeads, useMessages, useChat, useAuth, useListings, useTheme, etc.)
- `hooks/portal/` - 6 client portal hooks
- `supabase/migrations/` - Database migration SQL files (001-011)
- `supabase/functions/` - Edge functions (create-profile)
- `.agent/skills/` - 13 skill reference documents (see AGENT_SYSTEM.md)
- `.agent/workflows/` - Deploy scripts + 22 n8n JSON workflows (LOS-01 through LOS-22)
- `scripts/` - Utility scripts (pull-mls.mjs, gen-snapshots.mjs)

## Commands

- `npm run dev` - Start dev server (localhost:3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript strict check
- `npx supabase db push` - Push schema changes to Supabase
- `npx supabase gen types typescript` - Regenerate TypeScript types from DB schema

---

## How I Want You to Work

### Before Coding

- Read the relevant skill from `.agent/skills/` for the domain you're working in (see AGENT_SYSTEM.md Skills Registry)
- Read the Business Brain document (LORENA_BUSINESS_BRAIN.md) for full business context
- Check `.agent/TASKS.md` for current phase status and what's next
- Ask clarifying questions before starting complex features
- Draft a plan for multi-file changes and confirm before coding
- If unsure about business logic, ask - don't assume

### While Coding

- Write complete, working code - no placeholders, no TODOs in visible features
- Keep it simple and readable over clever
- Follow existing patterns in the codebase
- One change at a time, verify as you go
- Every component must be mobile-first (test at 375px width minimum)
- Use the design system colors and fonts exactly - no deviations
- All text that faces clients must support bilingual (EN/ES)

### After Coding

- Run type-check and lint to verify
- Test on mobile viewport (375px) and desktop (1440px)
- Verify skeleton loading states work (never blank screens)
- Summarize what you changed and why

---

## Design System - STRICT

```
/* Colors - use these EXACTLY */
--gold: #C9A84C;           /* Primary accent, CTAs, highlights, borders, active states */
--black: #0A0A0A;          /* Headlines, text, nav backgrounds */
--white: #FAFAF5;          /* Backgrounds, cards */
--dark-gray: #333333;      /* Body text */
--medium-gray: #888888;    /* Secondary text, labels */
--light-gray: #F5F5F0;     /* Card backgrounds, section dividers */
--border: #E5E5E0;         /* Borders, separators */

/* Score Colors */
--hot: #DC2626;            /* Score 80-100, red glow, fire emoji */
--warm: #EA580C;           /* Score 50-79, orange */
--cool: #2563EB;           /* Score 20-49, blue */
--cold: #9CA3AF;           /* Score 0-19, gray */
--success: #16A34A;        /* Green confirmations */

/* Fonts */
--font-headline: 'Playfair Display', serif;   /* ALL h1, h2, h3, page titles, section headers, logo */
--font-body: 'Lato', sans-serif;              /* ALL body text, buttons, inputs, labels */
```

### Design Principles

- **SIMPLICITY IS THE #1 PRIORITY.** Lorena closed MORE deals before CINC because CINC is too complex. Every screen must pass the "7 AM phone check" test - can Lorena open this on her phone at 7 AM and instantly know what to do? If not, simplify.
- **Compass-inspired luxury minimalism.** Clean, spacious, editorial feel.
- **No neon gradients.** No glassmorphism. No "AI-looking" interfaces.
- **2-click rule** for any action.
- **Mobile-first responsive.** Bottom nav on mobile (Home, Leads, Messages, Showings, More). No sidebar on mobile.
- **44px minimum touch targets** on all interactive elements.
- **Skeleton shimmer loading** on every screen - NEVER spinners, NEVER blank screens.
- **Zero empty states.** Every screen has a branded empty state with clear CTA and gold accent.
- **Gold on dark mode = stunning.** Support dark mode via CSS variables.
- **No framework branding anywhere.** No "Powered by" badges. This is Lorena's system.

---

## Code Style

- Use ES modules (import/export)
- Functional components with hooks (React)
- TypeScript strict - no `any` types, ever
- All Supabase queries wrapped in custom hooks (reusable, testable)
- Descriptive variable names - `leadScore` not `ls`, `isHotLead` not `flag`
- No commented-out code in production
- Tailwind utility classes - no separate CSS files except for global variables
- Custom components with Tailwind utility classes

## Database Conventions

- All tables use UUID primary keys (`gen_random_uuid()`)
- All tables have `created_at TIMESTAMPTZ DEFAULT NOW()`
- JSONB for flexible data (preferences, metadata, steps, items)
- TEXT arrays for lists (tags, photos, features)
- Row Level Security on every table - agent sees all, clients see own data only
- Realtime enabled on: `leads`, `lead_activity`, `messages`, `notifications`
- Index hot paths: `lead_activity(lead_id)`, `drip_enrollments(next_send_at) WHERE status = 'active'`

## Key Business Rules

- **Score 80-100 = Hot (red)** - Lorena gets immediate SMS + push notification
- **Score 50-79 = Warm (orange)** - In active nurture sequences
- **Score 20-49 = Cool (blue)** - In drip sequences, monitoring
- **Score 0-19 = Cold (gray)** - Auto-enrolled in re-engagement sequence when drops below 30
- **Score crosses 70** - Alert Lorena immediately
- **Lead replies to ANY message** - Pause all drip enrollments, notify Lorena "take over"
- **AI SMS active** - Pause drip sequences (prevent double-messaging)
- **Status = "Under Contract" or "Closed"** - Cancel all sequence enrollments
- **Blocking reminder step** - Pauses entire sequence until Lorena marks complete
- **No SMS during quiet hours** (10 PM - 7 AM CST) except critical alerts
- **Max 1 AI SMS conversation per lead per 7 days** (anti-spam)
- **Stop after 2 unanswered AI SMS messages** (respectful)
- **All client-facing text must have EN and ES versions**
- **Email unsubscribe link in every email** (CAN-SPAM compliance)

## El Paso Market Context

When generating content, displaying neighborhoods, or working with property data:

- **El Paso is ~82% Hispanic** - bilingual (EN/ES) is non-negotiable, not a nice-to-have
- **Fort Bliss military base** - constant inflow/outflow, VA loans common
- **Median home price ~$230K** - ranges $120K (Central) to $600K+ (Upper Valley/Country Club)
- **Key neighborhoods:** Westside (Mesa Hills, Coronado Hills, Kern Place), Northeast (Pebble Hills, Horizon), East (Montwood, Eastlake, Socorro), Central (Sunset Heights, Manhattan Heights), Upper Valley (Canutillo, Country Club)
- **Property types:** Single family (primary), townhomes, condos, mobile homes, multi-family (investors)
- **Buyer types:** Military/Fort Bliss, first-time (FHA), growing families, retirees, investors

## Do Not

- Edit Supabase migration files directly - use `supabase db push`
- Use spinners - always skeleton shimmer
- Use `any` type in TypeScript
- Leave placeholder code, TODOs, or "Coming Soon" in visible UI
- Use neon colors, glassmorphism, or trendy AI aesthetics
- Put framework/tool branding anywhere in the UI
- Send SMS outside 8 AM - 9 PM CST (except critical alerts)
- Allow double-messaging (drip + AI SMS simultaneously to same lead)
- Skip bilingual support on any client-facing text
- Make the mobile experience an afterthought - it's primary
- Assume Lorena is technical - every UI must be zero-learning-curve

---

## Verification Loop

After completing a task, verify:

1. Code compiles without TypeScript errors (`npm run type-check`)
2. No ESLint warnings (`npm run lint`)
3. Renders correctly on mobile (375px) and desktop (1440px)
4. Loading states show skeleton shimmer (not blank, not spinner)
5. Empty states are branded with gold accent and clear CTA
6. Score badges use correct colors (hot=red, warm=orange, cool=blue, cold=gray)
7. Fonts are correct (Playfair Display for headings, Lato for body)
8. Gold accent (#C9A84C) used consistently for CTAs, borders, active states
9. Changes match the original request and nothing extra

If any fail, fix before marking complete.

---

## Quick Commands

When I type these shortcuts, do the following:

**"plan"** - Analyze the task, read relevant Phase prompt if needed, draft an approach, ask clarifying questions, don't write code yet

**"build"** - Implement the plan, follow design system strictly, run type-check + lint, verify mobile + desktop

**"check"** - Review your changes like a skeptical senior dev. Check for: TypeScript errors, missing bilingual text, wrong colors/fonts, broken mobile layout, missing loading states, business rule violations

**"verify"** - Run type-check, lint, test mobile viewport, summarize results

**"done"** - Summarize: what changed, what files were touched, what was tested, any notes or follow-ups needed

**"score"** - Show me the current behavioral scoring table and confirm all point values are implemented correctly

**"seed"** - Generate or update seed data matching the spec (20 leads, 15-20 properties, El Paso neighborhoods, realistic Hispanic names)

---

## Success Criteria

A task is complete when:

- [ ] Code works as requested
- [ ] TypeScript compiles with zero errors
- [ ] No ESLint warnings
- [ ] Mobile-first - looks great at 375px
- [ ] Design system followed exactly (colors, fonts, spacing)
- [ ] Loading states use skeleton shimmer
- [ ] Empty states are branded
- [ ] Bilingual support where client-facing
- [ ] Business rules respected (scoring, drip pause, quiet hours, etc.)
- [ ] Changes are minimal and focused
- [ ] I can understand what you did without explanation

---

## Agent System & Skills

The project uses a skill-based agent system. **Read the relevant skill BEFORE working in any domain.**

- **AGENT_SYSTEM.md** - System architecture, workflow protocol, skills registry, phase status
- **`.agent/TASKS.md`** - Phase-based task tracker (Phase 1-2 COMPLETE, Phase 3 IN PROGRESS, Phase 4 PENDING)
- **`.agent/RESULTS.md`** - Phase completion log

### Skills Registry (13 skills in `.agent/skills/`)

**Project-Specific:** design-system, dashboard-builder, database-architect, ai-engine, automation-engine, component-builder, cinc-replacer, oauth

**General-Purpose:** vibe-coding, marketing-orchestrator (6 sub-skills), improvised-intelligence (4 references), n8n-workflow-reviewer, seo-strategy

See `AGENT_SYSTEM.md` for the full registry with paths and "Read Before" guidance.

---

## Reference Documents

- **LORENA_BUSINESS_BRAIN.md** - Complete business DNA, customer profiles, market knowledge, competitive analysis
- **BRANDING.md** - Visual brand guidelines (colors, fonts, logos, buttons, animations, accessibility)
- **LORENA_PHASE1_COMPLETE_PROMPT.md** - Foundation: database, auth, all screens, design system, seed data (1,022 lines)
- **LORENA_PHASE2_INTELLIGENCE_PROMPT.md** - Intelligence layer: scoring engine, real-time tracking, smart lists, analytics (892 lines)
- **LORENA_PHASE3_AI_LAYER_PROMPT.md** - AI layer: chatbot, daily briefing, AI SMS, CMA generator (1,334 lines)
- **LORENA_PHASE4_AUTOMATION_AND_PAGES_PROMPT.md** - Automation engine + complete page specs for every screen (1,564 lines)

Read the relevant Phase prompt BEFORE building any feature from that phase.

---

## Current Build Status

- **Phase 1 (Foundation):** COMPLETE — Supabase schema, auth, design system, dashboard layout, seed data
- **Phase 2 (Intelligence):** COMPLETE — All 11 dashboard screens, 25 hooks, scoring engine, MLS, i18n, lead capture, public site
- **Phase 3 (AI Layer):** IN PROGRESS (~60%) — Rule-based chatbot DONE, CMA wizard DONE, GPT-4o streaming/Daily Briefing/AI SMS TODO
- **Phase 4 (Automation):** PENDING — Speed-to-Lead, drip execution, calendar campaigns, portal wiring

---

## Notes

- **CINC MIGRATION IS SMALL:** Under 100 leads. Clean CSV export - n8n workflow - Supabase import. No massive data headaches.
- **MLS ACCESS APPROVED:** Spark API credentials are live. Feed ID: bs1gx50w59ms8w6qyza2tpmjl. Sync engine built in lib/mls/.
- **LORENA'S CINC PLAN:** Pro ($1,500/mo) + AI Alex ($200/mo) + VOIP Dialer (~$50-100/mo) + Managed Ad Spend (paying but NOT running ads) = ~$1,750-$1,800/mo total
- **THE KEY INSIGHT:** Lorena closed MORE deals before CINC. Our system must be dramatically simpler, not just feature-equivalent. Every screen should feel like "finally, something that works" not "another complicated tool."
- **ETTA ADOPTION IS LOW:** Most clients use the website, not the app. Our portal must be so good clients actually open it. Push property alerts + showing reminders via SMS to drive portal usage.
- **AUTOTRACKS UNKNOWN:** We don't know if Lorena has active drip sequences in CINC. Build our 5 pre-built sequences and assume fresh start.
- **LEAD SOURCES:** Referrals + CINC website + possibly Zillow. Full source mapping TBD during migration.
- **AGENT SYSTEM:** 13 skills in `.agent/skills/`, 22 n8n workflows in `.agent/workflows/n8n_json/`. Read AGENT_SYSTEM.md for the full system architecture.
- White-label opportunity: build once for Lorena, template for every realtor (InnoClose brand)
- At 5 realtor clients: $6K-$7.5K/mo recurring + $100K-$125K project fees
- Lorena's mom is also a realtor - potential second client for the template
- The chatbot uses OpenAI (GPT-4o) for speed + streaming, but briefing/CMA/SMS use Claude (Sonnet) for reasoning quality
- Twilio phone number must be a local El Paso area code (915) for trust
- All calendar campaigns auto-roll to next year - no manual year updates (this beats CINC's manual process)
- Dark mode implemented via `[data-theme="dark"]` in index.css, toggle via useTheme hook
