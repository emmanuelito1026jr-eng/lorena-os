# Phase 1: Foundation Builder — Task Prompt

> Paste this into Antigravity as your FIRST task. It must complete before any other agents.

---

```
READ THESE FILES FIRST (do NOT proceed without reading all of them):
1. CLAUDE.md
2. LORENA_BUSINESS_BRAIN.md
3. BRANDING.md
4. .agent/skills/design-system/SKILL.md
5. .agent/skills/database-architect/SKILL.md
6. .agent/skills/component-builder/SKILL.md

You are the FOUNDATION BUILDER. You build the base layer that every other agent depends on.

## METHODOLOGY: Subagent-Driven Development
- Build each task → self-review → verify with real commands → commit
- NO "should work" claims — run the command, read the output, THEN claim success
- If stuck, say so. Don't guess.

## YOUR 6 TASKS (execute in order):

### TASK 1: Project Scaffolding
1. Initialize Next.js 14+ with App Router, TypeScript strict mode
2. Install dependencies:
   - @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
   - @tanstack/react-query
   - tailwindcss @tailwindcss/forms
   - lucide-react date-fns recharts
   - shadcn/ui (Button, Card, Dialog, DropdownMenu, Input, Label, Select, Tabs, Badge, Separator, Sheet, Tooltip)
3. Configure Tailwind with custom colors from CLAUDE.md:
   - gold: '#C9A84C', black: '#0A0A0A', offwhite: '#FAFAF5'
   - body: '#333333', secondary: '#888888'
   - surface: '#F5F5F0', border: '#E5E5E0'
   - hot: '#DC2626', warm: '#EA580C', cool: '#2563EB', cold: '#9CA3AF'
   - success: '#16A34A', error: '#DC2626', warning: '#F59E0B'
4. Set up Google Fonts: Playfair Display (400, 600, 700) + Lato (300, 400, 500, 700)
5. Create CSS custom properties in globals.css for light + dark mode (see BRANDING.md dark mode section)
6. Create /public/brand/ directory structure (empty placeholders for logos — actual assets added later)

VERIFY:
- Run: npm run build → must pass
- Run: npm run type-check → 0 errors
- Manually confirm: Playfair Display + Lato load from Google Fonts
- Manually confirm: Tailwind colors match BRANDING.md hex values

COMMIT: "feat: project scaffolding with design system"

---

### TASK 2: Supabase Schema
Read .agent/skills/database-architect/SKILL.md for the complete schema.

1. Create these tables (in dependency order):
   - profiles (agent/client roles)
   - leads (with generated temperature column)
   - lead_activity (behavioral tracking)
   - messages (all channels unified)
   - properties (MLS cache)
   - showings
   - saved_searches
   - favorites
   - daily_briefings
   - notifications
   - drip_sequences + drip_enrollments + drip_messages_sent
   - checklist_templates + checklist_instances
   - calendar_campaigns
   - email_templates
   - cma_reports

2. Set up Row Level Security:
   - Agent role: full access to all tables
   - Client role: own data only (leads.id matches auth.uid)

3. Enable Realtime on: leads, lead_activity, messages, notifications

4. Create indexes on:
   - leads: score DESC, temperature, status, last_activity DESC, source
   - lead_activity: lead_id, created_at DESC, action
   - messages: lead_id, channel, created_at DESC

5. Generate TypeScript types:
   npx supabase gen types typescript --local > src/lib/supabase/database.types.ts

VERIFY:
- Run: npx supabase db diff → clean (no pending changes)
- Run: npm run type-check → 0 errors (types import correctly)
- Manually confirm: RLS policies block unauthorized access

COMMIT: "feat: complete Supabase schema with RLS and types"

---

### TASK 3: Authentication
1. Create src/lib/supabase/client.ts (browser client)
2. Create src/lib/supabase/server.ts (server client)
3. Create src/lib/supabase/middleware.ts (auth middleware)
4. Create /login page:
   - Email + password form
   - Gold CTA button
   - Playfair Display heading, Lato body
   - Mobile-first (works at 375px)
5. Create /signup page (same design patterns)
6. Create middleware.ts protecting /dashboard/* and /portal/*
   - Not logged in → redirect to /login
   - Logged in + agent role → allow /dashboard/*
   - Logged in + client role → allow /portal/*
7. Create auth context provider wrapping the app

VERIFY:
- Run: npm run build → passes
- Test: visit /dashboard without auth → redirects to /login
- Test: login with test credentials → reaches dashboard
- Test: incorrect password → shows error message

COMMIT: "feat: authentication with role-based access"

---

### TASK 4: Layout System
Read .agent/skills/dashboard-builder/SKILL.md for layout specs.

1. Create src/app/dashboard/layout.tsx:
   - Desktop (1024px+): 240px sidebar (fixed left) + main content area
   - Mobile (<1024px): full-width content + fixed bottom nav
   - Background: #FAFAF5

2. Create src/components/shared/Sidebar.tsx:
   - Width: 240px, bg: #0A0A0A (dark sidebar)
   - Logo area at top (placeholder)
   - Nav items: Home, Leads, Messages, Showings, CMA, AutoTracks, Analytics, Settings
   - Active state: gold (#C9A84C) text/icon
   - Inactive state: #888888 text/icon
   - Icons: lucide-react

3. Create src/components/shared/BottomNav.tsx:
   - 5 tabs: Home, Leads, Messages, Showings, More
   - Height: 64px, bg: white, border-top
   - Active: gold (#C9A84C) icon + label
   - Inactive: #888888 icon + label
   - 44px minimum touch targets
   - "More" opens a sheet with remaining nav items

VERIFY:
- Test at 375px: bottom nav shows, sidebar hidden
- Test at 1024px: sidebar shows, bottom nav hidden
- Test: active states match gold #C9A84C
- Test: touch targets are at least 44px
- Run: npm run build → passes

COMMIT: "feat: responsive dashboard layout with sidebar and bottom nav"

---

### TASK 5: Shared Components
Read .agent/skills/component-builder/SKILL.md for component specs.

1. Create src/components/shared/Skeleton.tsx:
   - Base: animate-pulse bg-[#E5E5E0] rounded
   - Variants: LeadCard, PropertyCard, StatsCard, MessageBubble, Table
   - Each variant matches the shape of its real component

2. Create src/components/shared/EmptyState.tsx:
   - Gold accent circle around icon
   - Playfair Display title
   - Lato description (medium-gray)
   - Optional gold CTA button
   - Centered layout, py-16

3. Create src/components/shared/LeadScoreBadge.tsx:
   - Props: score (number), size ('sm' | 'md' | 'lg'), showLabel (boolean)
   - Colors: hot(80-100)=#DC2626, warm(50-79)=#EA580C, cool(20-49)=#2563EB, cold(0-19)=#9CA3AF
   - sm: 24px pill, md: 32px pill, lg: 40px pill with "Hot"/"Warm"/"Cool"/"Cold" label

4. Create src/components/shared/LeadCard.tsx:
   - Props: lead, variant ('compact' | 'full' | 'pipeline'), onCall, onText, onClick
   - compact: avatar + name + score badge + last activity
   - full: avatar + name + score + phone + email + status + tags
   - pipeline: name + score + phone + 1 tag + last activity

5. Create src/components/shared/LanguageToggle.tsx:
   - EN/ES toggle button
   - Stores preference in localStorage

VERIFY:
- Each component renders without errors
- ScoreBadge shows correct colors at scores: 10, 35, 65, 90
- EmptyState shows gold accent
- LeadCard all 3 variants render
- All components work at 375px
- Run: npm run type-check → 0 errors

COMMIT: "feat: shared components (skeleton, empty state, score badge, lead card)"

---

### TASK 6: Seed Data
1. Create src/lib/seed/data.ts with:
   - 20 leads with El Paso Hispanic names:
     Hot (80+): Maria Gonzalez (92), Carlos Mendez (85), Rosa Martinez (81)
     Warm (50-79): Ana Rodriguez (72), Luis Hernandez (68), Sofia Morales (61), Diego Torres (55), Isabella Reyes (52)
     Cool (20-49): Pedro Gutierrez (45), Carmen Flores (38), Miguel Sanchez (32), Elena Castillo (28), Roberto Ramirez (42), Lucia Ortiz (35), Andres Vargas (24), Patricia Rivera (40)
     Cold (0-19): Fernando Cruz (15), Gloria Jimenez (8), Manuel Delgado (4), Beatriz Salazar (12)

   - 15 El Paso properties ($150K-$500K):
     Neighborhoods: Mesa Hills, Pebble Hills, Eastlake, West Side, Northeast, Horizon City,
     Canutillo, Upper Valley, Central El Paso, Montecillo, Westway

   - Message threads: 5 SMS, 3 email, 2 AI SMS conversations, 1 chatbot session
   - 6 upcoming showings for this week
   - 3 active AutoTrack sequences with enrolled leads

2. Create src/lib/seed/seed.ts — script to insert seed data into Supabase
3. Create lead_activity records for each lead to support their scores

VERIFY:
- Run seed script → all data inserts successfully
- Query leads ordered by score → returns in correct order
- Query leads by temperature → correct counts (3 hot, 5 warm, 8 cool, 4 cold)
- Activity records sum to each lead's score

COMMIT: "feat: seed data with 20 leads, properties, messages, showings"

---

## COMPLETION PROTOCOL
After all 6 tasks complete, run final verification:
1. npm run build → 0 errors
2. npm run type-check → 0 errors
3. npm run lint → 0 warnings
4. Start dev server → login → see dashboard layout
5. Confirm: sidebar shows on desktop, bottom nav on mobile
6. Confirm: seed data loads, score badges show correct colors

Report results with actual command output. Do NOT say "should pass" — show the output.
```
