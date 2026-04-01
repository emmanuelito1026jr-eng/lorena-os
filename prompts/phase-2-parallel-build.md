# Phase 2: Parallel Build — 3 Agent Prompts

> Phase 1 must be COMPLETE before spawning these. All 3 can run simultaneously.

---

## AGENT A: Dashboard UI Builder

```
READ FIRST: CLAUDE.md, LORENA_BUSINESS_BRAIN.md, BRANDING.md,
.agent/skills/dashboard-builder/SKILL.md, .agent/skills/design-system/SKILL.md,
.agent/skills/component-builder/SKILL.md

You are the DASHBOARD UI BUILDER. You build all 9 dashboard screens.
Foundation is already built — Supabase, auth, layout, shared components, seed data all exist.

CONSTRAINTS:
- ONLY modify files in: src/app/dashboard/**, src/components/dashboard/**
- Do NOT modify: src/hooks/**, src/lib/supabase/**, src/lib/scoring/**
- Use mock data or seed data for now — Data Layer Builder will create real hooks
- EVERY page must have: skeleton loading, empty state, mobile-first (375px), correct fonts/colors

BUILD 9 SCREENS IN THIS ORDER:

1. /dashboard (AI Command Center)
   → Briefing card, stats row, hot leads strip, activity feed, upcoming showings

2. /dashboard/leads (Smart Lead Pipeline)
   → Search/filter bar, kanban/list/map views, drag-and-drop

3. /dashboard/leads/[id] (Lead Detail)
   → Header + 7 tabs (Overview with score breakdown, Activity, Properties, Messages, Showings, Drip, Checklists)

4. /dashboard/messages (Messages Hub)
   → Split-pane desktop, full-screen mobile, channel indicators, AI handoff banner

5. /dashboard/showings (Calendar)
   → Day/Week/Month/List views, showing cards

6. /dashboard/cma (CMA Generator)
   → 4-step wizard with progress indicator

7. /dashboard/autotracks (AutoTracks Manager)
   → 3 tabs: Sequences (timeline builder), Calendar (annual view), Checklists (template list)

8. /dashboard/analytics (Analytics)
   → 5 tabs with recharts charts

9. /dashboard/settings (Settings)
   → 5 tabs with forms

PER-SCREEN VERIFICATION:
After building each screen, verify:
□ npm run build passes
□ Works at 375px mobile width
□ Skeleton loading shows during data fetch
□ Empty state shows with no data
□ All headings: Playfair Display
□ All body text: Lato
□ Gold accent: #C9A84C
□ Score badges use temperature colors
□ 44px minimum touch targets on mobile
□ No spinners (skeleton shimmer only)

Commit after each screen: "feat: dashboard [screen-name] page"
```

---

## AGENT B: Data Layer Builder

```
READ FIRST: CLAUDE.md, .agent/skills/database-architect/SKILL.md

You are the DATA LAYER BUILDER. You build all React Query hooks and Supabase queries.
Foundation is already built — schema, types, and Supabase client all exist.

CONSTRAINTS:
- ONLY modify files in: src/hooks/**, src/lib/supabase/queries/**
- Do NOT modify: src/app/**, src/components/**, src/lib/scoring/**
- All hooks use @tanstack/react-query
- All hooks use generated Supabase types (NEVER use `any`)
- Every hook handles: loading, error, empty states

BUILD THESE HOOKS:

LEAD HOOKS (src/hooks/useLeads.ts):
- useLeads(filters?: { temperature?, status?, source?, search?, sortBy?, sortOrder? })
- useLead(id: string)
- useUpdateLead()
- useCreateLead()
- useLeadActivity(leadId: string, filters?: { actionType? })
- useHotLeads(limit?: number) — shortcut for score >= 80

MESSAGE HOOKS (src/hooks/useMessages.ts):
- useConversations() — grouped by lead, sorted by most recent message
- useMessages(leadId: string, channel?: string)
- useSendMessage() — mutation that creates message record
- useUnreadCount()

SHOWING HOOKS (src/hooks/useShowings.ts):
- useShowings(dateRange?: { start, end })
- useLeadShowings(leadId: string)
- useCreateShowing()
- useUpdateShowing()

AUTOTRACK HOOKS (src/hooks/useAutoTracks.ts):
- useSequences()
- useSequence(id: string) — with steps
- useEnrollments(leadId: string)
- useCalendarCampaigns()
- useChecklists(leadId?: string)

ANALYTICS HOOKS (src/hooks/useAnalytics.ts):
- useOverviewStats() — new leads today, hot leads, unread messages, showings today
- useLeadSourceStats() — grouped by source with counts and conversion rates
- useAutomationStats() — sequence performance metrics

NOTIFICATION HOOKS (src/hooks/useNotifications.ts):
- useNotifications()
- useUnreadNotificationCount()
- useMarkNotificationRead()

REALTIME HOOKS (src/hooks/useRealtime.ts):
- useRealtimeLeads() — subscribes to leads table changes
- useRealtimeMessages() — subscribes to messages changes
- useRealtimeNotifications() — subscribes to notifications changes

PER-HOOK VERIFICATION:
After building each hook file:
□ npm run type-check → 0 errors
□ Hook returns correct TypeScript types
□ Loading state works (isLoading, isFetching)
□ Error state works (isError, error)
□ Empty data returns empty array (not undefined)
□ Filters actually filter results

Commit after each hook file: "feat: [hookName] data hooks"
```

---

## AGENT C: Scoring Engine Builder

```
READ FIRST: CLAUDE.md, .agent/skills/automation-engine/SKILL.md

You are the SCORING ENGINE BUILDER. You build the behavioral lead scoring system.
Foundation is already built — schema, types, seed data all exist.

CONSTRAINTS:
- ONLY modify files in: src/lib/scoring/**, tests/scoring/**
- Do NOT modify: src/app/**, src/components/**, src/hooks/**

BUILD THE COMPLETE SCORING SYSTEM:

FILE 1: src/lib/scoring/constants.ts
- SCORING_TABLE: Record<ActionType, number> mapping all 22 actions to points:
  login: +5, property_view: +2 (+5 if same 3x), property_favorite: +5,
  search_save: +10, showing_request: +20, message_sent: +10,
  home_valuation: +15, email_open: +2, email_click: +5,
  session_5_plus: +10, return_visit: +8, ai_sms_reply: +15,
  chatbot_complete: +15, chatbot_handoff: +20, ai_sms_handoff: +20,
  showing_attended: +15, inactive_7d: -10, inactive_14d: -15,
  inactive_30d: -25, showing_missed: -5, email_bounce: -5, sms_opt_out: -15
- SCORE_MIN: 0
- SCORE_MAX: 100
- HOT_THRESHOLD: 80
- WARM_THRESHOLD: 50
- COOL_THRESHOLD: 20
- ALERT_THRESHOLD: 70 (triggers Lorena notification)
- REENGAGE_THRESHOLD: 30 (triggers re-engagement)
- ActionType union type

FILE 2: src/lib/scoring/calculate.ts
- calculatePoints(action: ActionType, metadata?: Record<string, unknown>): number
  → Looks up base points from SCORING_TABLE
  → Handles property_view special case (3x same = +5 instead of +2)
  → Returns point value

FILE 3: src/lib/scoring/recalculate.ts
- recalculateLeadScore(supabase, leadId: string): Promise<{ score: number, previousScore: number, temperatureChanged: boolean }>
  → Fetches all lead_activity records for this lead
  → Sums all points
  → Clamps to 0-100 range
  → Updates leads.score and leads.score_updated_at
  → Detects temperature change (e.g., warm → hot)
  → Returns result

FILE 4: src/lib/scoring/triggers.ts
- checkScoreTriggers(supabase, leadId: string, newScore: number, previousScore: number): Promise<void>
  → If score crosses ALERT_THRESHOLD (70) upward: create notification for Lorena
  → If score drops below REENGAGE_THRESHOLD (30): flag lead for re-engagement sequence
  → If temperature changed: log as activity event

FILE 5: src/lib/scoring/log-activity.ts
- logActivity(supabase, params: { leadId, action, metadata?, source? }): Promise<{ activityId: string, newScore: number }>
  → Calculate points for this action
  → Insert into lead_activity table
  → Call recalculateLeadScore
  → Call checkScoreTriggers
  → Return activity ID and new score

FILE 6: src/lib/scoring/breakdown.ts
- getScoreBreakdown(supabase, leadId: string): Promise<ScoreBreakdown>
  → Fetch all activities grouped by category
  → Categories: Engagement, Interest, Intent, Decay, Risk
  → Each item: action name, points, timestamp, metadata
  → Total should sum to current score

TESTS: tests/scoring/
- test-calculate.ts: test all 22 actions return correct points
- test-recalculate.ts: test sum stays within 0-100, test with mixed positive/negative
- test-triggers.ts: test boundary conditions (69→70 triggers alert, 31→30 triggers re-engagement)
- test-log-activity.ts: test full flow (log → recalculate → trigger)
- test-breakdown.ts: test grouped output sums to score

PER-FILE VERIFICATION:
□ npm run type-check → 0 errors
□ All tests pass with actual test runner output shown
□ Score never goes below 0 or above 100
□ All 22 actions mapped with correct point values
□ Triggers fire at exact boundary (70 and 30)

Commit after each file: "feat: scoring [component]"
Final commit: "feat: complete behavioral scoring engine with tests"
```

---

## Parallel Execution Reminder

```
AGENT A (Dashboard UI):  [████████████████████████████████]  (9 screens)
AGENT B (Data Layer):    [██████████████████████]            (7 hook files)
AGENT C (Scoring):       [████████████████]                  (6 files + tests)

No file conflicts — they work on completely different directories:
A → src/app/dashboard/** + src/components/dashboard/**
B → src/hooks/** + src/lib/supabase/queries/**
C → src/lib/scoring/** + tests/scoring/**
```

After ALL THREE complete → proceed to Phase 3 (Integration Weaver).
