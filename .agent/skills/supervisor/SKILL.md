---
name: Supervisor Agent
description: Master orchestrator that coordinates all dashboard tab agents, verifies cross-tab data consistency, enforces quality standards, and ensures CINC Pro feature parity. The most comprehensive skill in the system.
---

# Supervisor Agent Skill

> Master orchestrator that coordinates all dashboard tab agents, verifies cross-tab data consistency, enforces quality standards, and ensures CINC Pro feature parity. This agent never writes code directly -- it reviews, validates, and directs.

---

## Purpose

The Supervisor Agent is the quality gatekeeper for the entire Casas En El Paso TX dashboard. Every screen, every hook, every modal, every data flow passes through this agent's verification matrix before it can be considered production-ready. The Supervisor exists because:

1. **Cross-tab data consistency is the hardest problem in a CRM.** A lead count that says 47 on the Command Center but 49 on the Leads tab destroys trust instantly. Lorena will stop using the system.
2. **CINC Pro costs $1,750/month.** If our replacement has even one screen that feels broken, slow, or confusing, the entire value proposition collapses.
3. **Lorena is not technical.** She will not debug, she will not file bug reports, she will not try again later. If something is wrong, she closes the tab and goes back to her phone.

The Supervisor holds every tab agent to the standard of a top 0.000001% real estate CRM developer -- someone who would be hired to build CRM software for Compass, Keller Williams, or Zillow at the principal engineer level.

---

## Tab Agents Under Supervision

The Supervisor coordinates 10 tab-specific agents. Each agent owns one dashboard tab and its associated files, hooks, and modals.

| # | Tab Name | Skill Path | Primary File | Primary Hook |
|---|----------|-----------|--------------|--------------|
| 1 | Command Center | `.agent/skills/command-center/SKILL.md` | `pages/dashboard/DashboardHome.tsx` | `useDashboardStats` |
| 2 | Leads Manager | `.agent/skills/leads-manager/SKILL.md` | `pages/dashboard/Leads.tsx` + `LeadDetail.tsx` | `useLeads` |
| 3 | Deals Tracker | `.agent/skills/deals-tracker/SKILL.md` | `pages/dashboard/Deals.tsx` | `useDeals` |
| 4 | Messages Hub | `.agent/skills/messages-hub/SKILL.md` | `pages/dashboard/Messages.tsx` | `useMessages` |
| 5 | Showings Calendar | `.agent/skills/showings-calendar/SKILL.md` | `pages/dashboard/Showings.tsx` | `useShowings` |
| 6 | HomePulse Market | `.agent/skills/homepulse-market/SKILL.md` | `pages/dashboard/Market.tsx` | `useMarketSnapshots`, `useMarketData` |
| 7 | CMA Generator | `.agent/skills/cma-generator/SKILL.md` | `pages/dashboard/CMA.tsx` | `useCMAReports`, `useComparableSales` |
| 8 | AutoTracks Engine | `.agent/skills/autotracks-engine/SKILL.md` | `pages/dashboard/AutoTracks.tsx` | `useAutoTracks` |
| 9 | Analytics Reporting | `.agent/skills/analytics-reporting/SKILL.md` | `pages/dashboard/Analytics.tsx` | `useAnalytics` |
| 10 | Settings Config | `.agent/skills/settings-config/SKILL.md` | `pages/dashboard/DashboardSettings.tsx` | `useProfile`, `useEmailTemplates` |

### Shared Dependencies

All 10 tabs share these components and must use them consistently:

| Shared Component | File | Used By |
|-----------------|------|---------|
| `DashboardLayout` | `components/dashboard/DashboardLayout.tsx` | All tabs (wrapper) |
| `Sidebar` | `components/dashboard/Sidebar.tsx` | All tabs (desktop nav) |
| `BottomNav` | `components/dashboard/BottomNav.tsx` | All tabs (mobile nav) |
| `Modal` | `components/shared/Modal.tsx` | All modals across all tabs |
| `Toast` | `components/shared/Toast.tsx` | All mutation feedback |
| `Skeleton` / `SkeletonList` / `SkeletonStats` | `components/shared/Skeleton.tsx` | All loading states |
| `EmptyState` | `components/shared/EmptyState.tsx` | All empty states |
| `LeadScoreBadge` | `components/shared/LeadScoreBadge.tsx` | Anywhere a lead score is displayed |
| `ConfirmDialog` | `components/shared/ConfirmDialog.tsx` | All destructive actions |

---

## Cross-Tab Verification Matrix

This is the most critical section of the Supervisor skill. Data must be consistent across every tab that displays overlapping information. A single mismatch means a bug exists somewhere in the data pipeline.

### Primary Consistency Rules

| Data Point | Source of Truth | Must Match In | Verification Query |
|-----------|----------------|---------------|-------------------|
| Total lead count | `useLeads` (unfiltered `.length`) | Command Center stat card, Leads tab header count, Analytics lead count | `SELECT COUNT(*) FROM leads WHERE user_id = ?` |
| Hot lead count (score >= 80) | `useLeads` filtered by `score >= 80` | Command Center "Hot Leads" stat, Leads tab "Hot" filter count, Command Center hot leads list | `SELECT COUNT(*) FROM leads WHERE score >= 80 AND user_id = ?` |
| Warm lead count (50-79) | `useLeads` filtered by `score >= 50 AND score < 80` | Command Center pipeline stats, Leads tab "Warm" filter, Analytics pipeline chart | Same pattern |
| Cool lead count (20-49) | `useLeads` filtered by `score >= 20 AND score < 50` | Command Center pipeline stats, Leads tab "Cool" filter, Analytics pipeline chart | Same pattern |
| Cold lead count (0-19) | `useLeads` filtered by `score < 20` | Command Center pipeline stats, Leads tab "Cold" filter, Analytics pipeline chart | Same pattern |
| Unread message count | `useMessages` filtered by `read = false` | Sidebar badge number, Command Center "Unread" stat, Messages tab unread indicator, BottomNav badge | `SELECT COUNT(*) FROM messages WHERE read = false AND user_id = ?` |
| Today's showings count | `useShowings` filtered to today's date | Command Center "Today's Showings" stat, Showings tab today view count | `SELECT COUNT(*) FROM showings WHERE date = CURRENT_DATE AND user_id = ?` |
| Active deals count | `useDeals` filtered by `status NOT IN ('closed', 'cancelled')` | Command Center "Deals In Progress" stat, Deals tab total cards in kanban | `SELECT COUNT(*) FROM deals WHERE status NOT IN ('closed','cancelled') AND user_id = ?` |
| Pipeline value | `useDeals` sum of `price` for active deals | Command Center pipeline value, Deals tab pipeline total, Analytics deal value | `SELECT SUM(price) FROM deals WHERE status NOT IN ('closed','cancelled') AND user_id = ?` |
| Active sequences | `useAutoTracks` sequences with active enrollments | Command Center automation stat, AutoTracks sequence list, Analytics automation stats | `SELECT COUNT(DISTINCT sequence_id) FROM drip_enrollments WHERE status = 'active'` |
| Profile display name | `useProfile` `.full_name` | Settings Profile tab, Command Center greeting ("Good morning, Lorena"), Sidebar user display | `SELECT full_name FROM profiles WHERE id = ?` |
| Market median price | `useMarketSnapshots` latest snapshot | Command Center market snapshot widget, HomePulse overview card | `SELECT median_price FROM market_snapshots ORDER BY created_at DESC LIMIT 1` |

### Secondary Consistency Rules

| Data Point | Where It Appears | Rule |
|-----------|-----------------|------|
| Lead score | LeadScoreBadge anywhere | ALWAYS imported from `lib/scoring/constants.ts` thresholds -- never hardcoded `80`, `50`, `20` |
| Score badge colors | Every LeadScoreBadge | Hot=#DC2626, Warm=#EA580C, Cool=#2563EB, Cold=#9CA3AF -- same everywhere, no exceptions |
| Date formatting | All timestamps across all tabs | Consistent format via `date-fns` (e.g., `formatDistanceToNow`, `format(date, 'MMM d, yyyy')`) -- never raw ISO strings |
| Currency formatting | All money values | Consistent pattern: `$230,000` or `$230K` or `$1.2M` -- never `$230000.00` or `230000` |
| Lead source labels | Leads tab, Analytics source breakdown, Command Center | Same labels everywhere: "Website", "Zillow", "Referral", "Facebook", "Open House", "CINC Import" |
| Neighborhood names | Properties, Market, CMA, Lead detail | Same spelling: "Westside", "Northeast", "East", "Central", "Upper Valley" -- never abbreviated inconsistently |
| Showing statuses | Showings tab, Command Center, Lead detail | Same values: "Scheduled", "Confirmed", "Completed", "Cancelled", "No-Show" |
| Deal stages | Deals tab kanban, Lead detail deals tab, Analytics | Same ordered list: "New", "Under Contract", "Inspection", "Appraisal", "Clear to Close", "Closed" |

### Cache Invalidation Rules

When data changes, related query caches must be invalidated to prevent stale data:

| Mutation | Must Invalidate |
|----------|----------------|
| Add/update/delete a lead | `['leads']`, `['dashboard-stats']`, `['analytics']` |
| Score changes (log activity) | `['leads']`, `['dashboard-stats']`, `['analytics']` |
| Send/receive a message | `['messages']`, `['dashboard-stats']` (unread count) |
| Create/update a showing | `['showings']`, `['dashboard-stats']` |
| Create/update a deal | `['deals']`, `['dashboard-stats']`, `['analytics']` |
| Update profile | `['profile']`, `['dashboard-stats']` (greeting name) |
| Enroll/unenroll from sequence | `['auto-tracks']`, `['analytics']` |
| Generate CMA report | `['cma-reports']` |
| Market snapshot refresh | `['market-snapshots']`, `['dashboard-stats']` |

---

## Quality Standards (0.000001% Developer Level)

These are not aspirational. These are the minimum bar. Every tab agent's work is measured against every item below.

### Code Quality

| Check | Command / Method | Expected Result |
|-------|-----------------|-----------------|
| TypeScript strict | `npm run type-check` | Zero errors. Not "1 error that's probably fine." Zero. |
| ESLint | `npm run lint` | Zero warnings. Warnings are errors you haven't fixed yet. |
| Production build | `npm run build` | Exit code 0. No chunk size warnings (except react-pdf which is lazy-loaded). |
| No `any` types | Grep for `: any` in changed files | Zero occurrences. Use proper types or `unknown` + type guards. |
| No `@ts-ignore` | Grep for `@ts-ignore` or `@ts-expect-error` | Zero occurrences. Fix the actual type error. |
| No `as unknown as T` | Grep for `as unknown as` | Zero occurrences. This is type laundering. |
| No hardcoded strings | Check all visible text | Client-facing text uses `t()` i18n wrapper. Internal text uses constants. |
| No hardcoded colors | Check all `bg-`, `text-`, `border-` classes | Uses dashboard tokens (`bg-dashboard-gold`, `text-dashboard-body`, etc.) or score tokens (`bg-score-hot`). Never raw hex in JSX. |
| No `.single()` on empty tables | Check all Supabase queries | Use `.maybeSingle()` when the row might not exist. `.single()` throws on empty result. |
| Error handling | Check all async operations | Every `useQuery` has error handling. Every `useMutation` has `onError` callback. Every `try/catch` has meaningful error messages. |
| Cache invalidation | Check all `useMutation` calls | Every mutation that changes data invalidates related query keys (see Cache Invalidation Rules above). |
| No `console.log` | Grep for `console.log` | Zero occurrences in production code. Use proper error boundaries or remove. |
| No commented-out code | Visual scan of changed files | Zero blocks of commented code. Git has history. Delete it. |
| Import scoring from constants | Check score thresholds | All threshold values (80, 50, 20, 70, 30) imported from `lib/scoring/constants.ts` as `HOT_THRESHOLD`, `WARM_THRESHOLD`, `COOL_THRESHOLD`, `ALERT_THRESHOLD`, `REENGAGE_THRESHOLD` -- never hardcoded numbers. |

### UX Quality

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Skeleton loading | Navigate to each screen, throttle network to Slow 3G | Every screen shows appropriate `Skeleton*` component while loading. Never blank. Never a spinner. |
| Empty states | Clear all data for a screen | Branded `EmptyState` component with Lucide icon in gold accent circle, Playfair heading, Lato description, gold CTA button. |
| Touch targets | Measure all interactive elements | Minimum 44px height AND 44px width on every button, link, and tappable area. |
| Mobile layout (375px) | Resize viewport to 375px | Bottom nav visible. No horizontal scroll. Content fills width. Cards stack vertically. No text cutoff that hides critical info. |
| Tablet layout (768px) | Resize viewport to 768px | Sidebar may appear. Cards reflow to 2 columns. Navigation adapts. |
| Desktop layout (1440px) | Resize viewport to 1440px | Full sidebar at 240px. Content area with `max-w-7xl` centering. 3+ column grids where appropriate. |
| No horizontal scroll | Scroll horizontally on mobile | Nothing scrolls horizontally except explicitly designed carousels/tables. |
| Consistent spacing | Visual scan of spacing | Follows Tailwind gap pattern: `gap-3` (tight), `gap-4` (standard), `gap-6` (section), `gap-8` (major section). No random `gap-5` or `gap-7`. |
| No text truncation hiding critical info | Check all truncated text | Truncation is acceptable for descriptions/previews. Never truncate: lead names, phone numbers, addresses, prices, scores, dates. |
| Immediate feedback on actions | Click every CTA button | Every action shows immediate feedback: Toast for success/error, optimistic update for mutations, disabled state while loading. |
| "7 AM Phone Check" test | Open each tab at 375px and ask: "Can Lorena instantly know what to do?" | If the answer is no, the screen is too complex. Simplify. |

### Data Quality

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Cross-tab number match | Compare counts across Command Center, Leads, Analytics | All lead counts, deal counts, message counts, showing counts match exactly across all tabs displaying them. |
| Score thresholds from constants | Grep for hardcoded 80, 50, 20 in score context | All score thresholds imported from `lib/scoring/constants.ts`. Never `score >= 80` without using `HOT_THRESHOLD`. |
| Date formatting | Scan all date displays | All dates use `date-fns` functions: `format()`, `formatDistanceToNow()`, `formatRelative()`. Never raw ISO strings like `2024-01-15T08:30:00Z`. |
| Currency formatting | Scan all price displays | Consistent pattern. Full: `$230,000`. Compact: `$230K`. Large: `$1.2M`. Never `$230000` or `$230,000.00` (extra decimals). |
| No mock data in production | Check for hardcoded arrays | All data comes from Supabase hooks. Any fallback/demo data is transparently marked and uses realistic El Paso data. |
| Realtime subscriptions | Check `useRealtime` usage | Tables with realtime enabled (`leads`, `lead_activity`, `messages`, `notifications`) have active subscriptions. New data appears without page refresh. |
| Pagination / infinite scroll | Check lists with 50+ items | Large lists use pagination or infinite scroll. Never load 500 leads into memory at once. |
| Sort order consistency | Check default sort across tabs | Leads default to score (desc). Messages default to date (desc, newest first). Showings default to date (asc, soonest first). Deals default to stage order. |

### Business Rule Compliance

| Rule | Implementation | Verification |
|------|---------------|-------------|
| Score colors | Hot=#DC2626 (>=80), Warm=#EA580C (50-79), Cool=#2563EB (20-49), Cold=#9CA3AF (0-19) | Every `LeadScoreBadge` uses the correct color for the score range. Check edge cases: score=80 is Hot, score=79 is Warm, score=50 is Warm, score=49 is Cool, score=20 is Cool, score=19 is Cold. |
| Score threshold imports | `HOT_THRESHOLD`, `WARM_THRESHOLD`, `COOL_THRESHOLD` from `lib/scoring/constants.ts` | Grep for hardcoded `80`, `50`, `20` in score-related code. All must reference the constants. |
| Alert at 70 | `ALERT_THRESHOLD = 70` from constants | When a lead's score crosses 70 (from below), Lorena gets SMS + push notification. Verify the trigger fires. |
| Re-engagement at 30 | `REENGAGE_THRESHOLD = 30` from constants | When a lead's score drops below 30, auto-enroll in re-engagement sequence. Verify enrollment happens. |
| Quiet hours | No SMS 10 PM - 7 AM CST | AI SMS engine and drip sequences check time before sending. Messages queued during quiet hours are sent at 7:01 AM. |
| Max 1 AI SMS per 7 days | Rate limiting per lead | Check `ai_sms_conversations` or equivalent table for last conversation timestamp. Block if < 7 days. |
| Stop after 2 unanswered | AI SMS conversation limit | If lead does not reply to 2 consecutive AI SMS messages, stop the AI conversation. Mark as "AI Paused." |
| Lead reply pauses drips | Message received from lead | Any inbound message (SMS, email, chat) from a lead immediately pauses all active drip enrollments for that lead and sends Lorena a "Take over" notification. |
| AI SMS pauses drips | AI SMS conversation active | While AI SMS is actively conversing with a lead, all drip enrollments for that lead are paused. Prevents double-messaging. |
| Under Contract/Closed cancels drips | Deal status change | When a lead's deal moves to "Under Contract" or "Closed", cancel all active drip enrollments. Do not send nurture emails to someone about to close. |
| Blocking reminder step | Drip sequence step type "reminder" | A reminder step in a drip sequence pauses the entire sequence for that lead until Lorena manually marks it complete. |
| Email unsubscribe | Every outbound email | CAN-SPAM compliance: every email has an unsubscribe link at the bottom. Unsubscribe action sets `email_opt_out = true` on the lead. |
| GEPAR IDX compliance | All MLS data displays | `IDXCompliance` component rendered on every page showing MLS data. Attribution text: "Listing data provided by Greater El Paso Association of REALTORS." |
| Bilingual (EN/ES) | All client-facing text | Every string visible to clients (portal, public site, emails, SMS) has both English and Spanish versions via `t()` function from `lib/i18n/`. |
| 44px touch targets | All interactive elements | Buttons, links, nav items, toggles, checkboxes -- all have minimum 44x44px clickable area. |
| Local phone number | Twilio configuration | Twilio number uses El Paso area code (915) for trust and local recognition. |
| Calendar auto-roll | Calendar campaigns | All date-based campaigns (holidays, birthdays, anniversaries) automatically roll to the next year. No manual year updates required. |

### Design System Compliance

| Element | Rule | Verification |
|---------|------|-------------|
| Headline fonts | Playfair Display for ALL h1, h2, h3, page titles, section headers | Grep for `<h1`, `<h2`, `<h3` -- each must have `font-playfair` class. No headings using Lato. |
| Body fonts | Lato for ALL body text, buttons, inputs, labels, descriptions | Check all `<p>`, `<span>`, `<button>`, `<input>`, `<label>` elements. Must use `font-lato` or inherit from parent. |
| Gold accent | #C9A84C (`bg-dashboard-gold`, `text-dashboard-gold`, `border-dashboard-gold`) | Used for: CTAs, active nav items, borders, highlights, toggle states, empty state icon circles. NEVER used for body text. |
| Background | #FAFAF5 (`bg-dashboard-bg`) | Page backgrounds use off-white, not pure white (#FFFFFF). |
| Text black | #0A0A0A (`text-dashboard-black`) | Headlines use off-black, not pure black (#000000). |
| Body text | #333333 (`text-dashboard-body`) | All body text uses dark gray, not black. |
| Secondary text | #888888 (`text-dashboard-secondary`) | Labels, timestamps, placeholders use medium gray. |
| Card surfaces | #F5F5F0 (`bg-dashboard-surface`) | Card backgrounds and section dividers. |
| Borders | #E5E5E0 (`border-dashboard-border`) | All borders and separators. |
| Card radius | `rounded-xl` | All cards use `rounded-xl` (12px). |
| Button/input radius | `rounded-lg` | Buttons and inputs use `rounded-lg` (8px). |
| Hover shadow | `shadow-premium` | Cards show elevated shadow on hover (custom class in tailwind.config.js). |
| Dark mode | `[data-theme="dark"]` CSS overrides | Gold stays the same. Backgrounds invert (#FAFAF5 to #0A0A0A). Text inverts (#0A0A0A to #FAFAF5). Surfaces become #1A1A1A. Borders become #333333. |
| No framework branding | Visual scan | No "Powered by Supabase", "Built with React", "Tailwind CSS" badges anywhere. This is Lorena's system, not a portfolio piece. |

---

## CINC Pro Feature Parity Matrix

This is the definitive comparison between what Lorena currently pays $1,750/month for and what our system provides. Every feature marked "Gap" or "Partial" is a priority item.

### Lead Management

| CINC Feature | Our Equivalent | Status | Notes |
|-------------|----------------|--------|-------|
| Lead capture from IDX website | Website registration + chatbot capture + exit intent popup | EXCEEDS | We have 4 capture methods vs CINC's 1 |
| Auto-lead routing | Single agent (Lorena), no routing needed | MATCH | N/A for solo agent |
| Lead pipeline view | Leads tab with Hot/Warm/Cool/Cold filters | MATCH | Plus behavioral score transparency (CINC is opaque) |
| Lead detail page | LeadDetail with 7 tabs (Overview, Activity, Messages, Showings, Properties, Deals, Notes) | EXCEEDS | CINC has 3-4 tabs max |
| "Pond" accounts (unresponsive leads) | Cold filter (score < 20) + re-engagement auto-enrollment | EXCEEDS | Our scoring-based approach is smarter than manual pond |
| Lead source tracking | Source field on all leads (Website, Zillow, Referral, Facebook, Open House, CINC Import) | MATCH | |
| Lead import (CSV) | ImportLeadsModal with CSV parser + CINC field mapping | MATCH | n8n workflow LOS-03 for bulk import |
| Lead tags | Tags array on leads + bulk tag assignment | MATCH | |
| Lead search and filter | Search + filter by source, status, score range, date, tags | EXCEEDS | Real-time score filtering is unique to us |
| Duplicate detection | Matching on email + phone during import | PARTIAL | Need to add real-time duplicate detection on new lead creation |

### Communication

| CINC Feature | Our Equivalent | Status | Notes |
|-------------|----------------|--------|-------|
| CINC AI "Alex" SMS qualification ($200/mo) | AI SMS Engine (Claude + Twilio) -- included free | EXCEEDS | Better AI (Claude vs Structurely), no extra cost, contextual |
| Email marketing | n8n + SendGrid drip sequences | MATCH | |
| SMS texting | Twilio integration (915 area code) | MATCH | |
| VOIP dialer (~$50-100/mo) | Click-to-call from dashboard (Twilio) | MATCH | One-click dial from lead detail |
| Behavioral messaging (texts after website activity) | Behavioral triggers (n8n LOS-17) + scoring | EXCEEDS | We trigger on 23 actions, CINC has ~5 |
| Message history | Messages tab with full conversation threads (SMS, email, chat) | MATCH | Split-pane UI with channel filters |
| Email templates | Settings > Templates with CreateEmailTemplateModal | MATCH | |

### Automation

| CINC Feature | Our Equivalent | Status | Notes |
|-------------|----------------|--------|-------|
| AutoTracks drip campaigns | AutoTracks tab with 5 pre-built sequences + custom creation | EXCEEDS | Our sequences are bilingual and context-aware |
| Campaign scheduling | Calendar campaigns (8 holidays + custom dates) | EXCEEDS | Auto-roll to next year (CINC requires manual updates) |
| Listing alerts | Property alert system (n8n LOS-27-31) + saved search matching | MATCH | Blocked on Spark API token |
| Task reminders | Blocking reminder steps in drip sequences + showing reminders | MATCH | |
| Follow-up reminders | Daily briefing + score-based alerts | EXCEEDS | AI tells Lorena WHO to call, not just "you have 5 tasks" |

### Analytics & Reporting

| CINC Feature | Our Equivalent | Status | Notes |
|-------------|----------------|--------|-------|
| Lead activity tracking | Behavioral scoring engine (23 actions, 5 categories) | EXCEEDS | CINC tracks ~5 actions, we track 23 with point values |
| Conversion reporting | Analytics tab (5 sub-tabs: Overview, Leads, Deals, Marketing, ROI) | EXCEEDS | CINC has 2 basic report screens |
| ROI tracking | ROI sub-tab with cost-per-lead, cost-per-close, revenue | EXCEEDS | CINC does not have ROI tracking |
| Pipeline reporting | Pipeline donut chart + deal stage breakdown | MATCH | |
| Agent performance | Single agent -- all metrics are Lorena's | N/A | |

### Property & MLS

| CINC Feature | Our Equivalent | Status | Notes |
|-------------|----------------|--------|-------|
| IDX website | Public property search (Spark API / GEPAR) | MATCH | IDX compliance with attribution |
| Property detail pages | PropertyDetail page with map, photos, details | MATCH | |
| CMA generation | CMA wizard (60-second AI CMAs) | EXCEEDS | CINC requires manual CMA via separate tool ($30-50/mo extra) |
| Market data | HomePulse Market tab (median price, trends, zip breakdown) | EXCEEDS | CINC has no market intelligence tab |
| Saved searches | Saved search system with alert matching | MATCH | |
| Comparable sales | ComparableSales hook + CMA integration | MATCH | |

### Client Experience

| CINC Feature | Our Equivalent | Status | Notes |
|-------------|----------------|--------|-------|
| Etta client app (most clients don't use it) | Custom client portal (10 screens) + future React Native app | EXCEEDS | Etta adoption is low. Our portal is designed to be actually useful. |
| Client property search | Portal property search with filters | MATCH | |
| Client saved homes | SavedHomes portal page | MATCH | |
| Client showing requests | MyShowings portal page | MATCH | |
| Client messaging | ClientMessages portal page | MATCH | |
| Home value estimate | HomeValueEstimate portal page + public Home Estimate page | EXCEEDS | AI-powered, not just a basic form |
| Mortgage calculator | MortgageCalculator portal page | EXCEEDS | CINC does not have a built-in mortgage calculator |
| Transaction tracking | TransactionTracker portal page | EXCEEDS | Clients can see their deal progress (CINC has nothing like this) |

### Administrative

| CINC Feature | Our Equivalent | Status | Notes |
|-------------|----------------|--------|-------|
| User management | Auth (Supabase) + roles (agent/client) | MATCH | |
| Integration settings | Settings > Integrations tab | MATCH | |
| Notification preferences | Settings > Notifications tab | MATCH | |
| Billing management | Settings > Billing tab (future) | PARTIAL | Placeholder -- will implement when SaaS model launches |
| Data export | Not yet implemented | GAP | Need CSV export for leads, deals, messages |
| Managed ad spend | Not yet implemented (future: Manorev partnership) | GAP | CINC includes managed ads (Lorena pays but doesn't use them) |

### Parity Summary

| Category | MATCH | EXCEEDS | PARTIAL | GAP |
|----------|-------|---------|---------|-----|
| Lead Management | 6 | 3 | 1 | 0 |
| Communication | 4 | 2 | 0 | 0 |
| Automation | 2 | 3 | 0 | 0 |
| Analytics | 1 | 3 | 0 | 0 |
| Property & MLS | 4 | 2 | 0 | 0 |
| Client Experience | 3 | 4 | 0 | 0 |
| Administrative | 3 | 0 | 1 | 2 |
| **TOTAL** | **23** | **17** | **2** | **2** |

**Result:** We MATCH or EXCEED CINC on 40 of 42 features (95.2%). Two gaps remain: data export (CSV) and managed ad spend integration. Both are non-critical for MVP launch.

---

## Verification Protocol

This is the step-by-step process the Supervisor runs when verifying any tab agent's work. Every step is mandatory. Skipping a step is a protocol violation.

### Phase 1: Understand Requirements

1. **Read the tab's SKILL.md** -- Understand what the tab is supposed to do, what data it displays, what interactions it supports.
2. **Read the primary page file** -- `pages/dashboard/{Tab}.tsx` -- Check the actual implementation against the spec.
3. **Read the primary hook(s)** -- `hooks/use{Feature}.ts` -- Verify data fetching, caching, mutations, and error handling.
4. **Read any modal files** -- `components/dashboard/modals/{Modal}.tsx` -- Check form validation, submission, and cache invalidation.

### Phase 2: Automated Checks

5. **Run `npm run type-check`** -- Must be zero errors. If any errors exist, stop verification and return to the tab agent with the specific error messages and file locations.
6. **Run `npm run lint`** -- Must be zero warnings. Same rule: stop and return if any warnings.
7. **Run `npm run build`** -- Must exit 0 with no chunk size warnings (except lazy-loaded chunks like react-pdf). If build fails, stop and return.

### Phase 3: Cross-Tab Consistency

8. **Check data source** -- Is the tab using the correct hook? Is the hook querying the right Supabase table with the right filters?
9. **Compare counts** -- Do the numbers displayed on this tab match the same numbers displayed on Command Center, Analytics, and any other tab that shows the same data?
10. **Check cache keys** -- Are the TanStack Query cache keys consistent? Does `['leads']` mean the same thing everywhere?
11. **Verify mutations invalidate** -- When data is changed on this tab (add, edit, delete), are all related query caches invalidated?

### Phase 4: Visual Verification

12. **Test at 375px (mobile)** -- Bottom nav visible. Content fills width. No horizontal scroll. Touch targets >= 44px. Cards stack single-column.
13. **Test at 768px (tablet)** -- Layout adapts. Cards may go 2-column. Navigation transitions appropriately.
14. **Test at 1440px (desktop)** -- Full sidebar at 240px. Content area with max-w-7xl centering. Proper grid columns (3+).

### Phase 5: Loading and Empty States

15. **Verify skeleton loading** -- Throttle network to Slow 3G. Navigate to the tab. Appropriate skeleton shimmer must appear immediately.
16. **Verify empty state** -- Remove all data for this tab (or test with empty seed). Branded `EmptyState` component must appear with icon, title, description, and gold CTA.

### Phase 6: Business Rule Check

17. **Score colors correct** -- Every `LeadScoreBadge` on this tab uses the right color for the score range.
18. **Bilingual support** -- All text visible to clients uses `t()` wrapper. (Dashboard-internal text is English-only, which is fine.)
19. **Dark mode** -- Toggle to dark mode. Every element is visible and readable. No white-on-white or black-on-black text. Gold stays gold.
20. **Quiet hours** -- If this tab triggers any SMS/notification, verify quiet hours check exists.
21. **Drip pause rules** -- If this tab interacts with sequences, verify pause/cancel logic on lead reply, AI SMS active, and Under Contract/Closed status.

### Phase 7: Improvement Assessment

22. **CINC comparison** -- Does CINC have an equivalent to this tab? If yes, does ours match or exceed? If no, is this a competitive advantage we should highlight?
23. **Simplicity audit** -- Can Lorena use every feature on this tab in 2 clicks or less? If not, what can be simplified?
24. **Revenue impact** -- Does this tab help Lorena close more deals or save time? If the answer is unclear, the tab may need better focus.

### Phase 8: Report

25. **Generate verification report** with:
    - Pass/Fail for each check (1-24)
    - Specific issues found with file paths and line numbers
    - Suggested fixes for each issue
    - Priority ranking (P0 = blocker, P1 = must fix before launch, P2 = improve post-launch)
    - Overall assessment: APPROVED, NEEDS FIXES, or REJECTED

---

## Improvement Framework

When the Supervisor identifies potential improvements (beyond bug fixes), it uses this 5-question framework to prioritize:

### 1. User Impact (Weight: 40%)

> "Does this make Lorena's morning 7 AM phone check faster or more useful?"

- **High impact:** Saves Lorena time, reduces clicks, surfaces insights she would have missed.
- **Medium impact:** Nicer to have, improves experience but doesn't change behavior.
- **Low impact:** Developer convenience, code cleanliness, architecture improvement with no user-facing change.

### 2. CINC Comparison (Weight: 25%)

> "Does CINC have this? If yes, do we match or exceed? If no, should we add it?"

- **CINC has it, we don't:** HIGH PRIORITY. This is a reason Lorena might not switch.
- **CINC has it, we match:** Baseline. No improvement needed unless we can exceed.
- **CINC has it, we exceed:** Competitive advantage. Highlight in marketing.
- **CINC doesn't have it, we do:** Unique selling point. Protect and polish.
- **Neither has it:** Evaluate based on other criteria.

### 3. Simplicity Test (Weight: 15%)

> "Can Lorena use this feature in under 2 clicks?"

- If the feature requires more than 2 clicks from the dashboard home, it needs a shortcut or redesign.
- If the feature requires reading instructions, it is too complex. Simplify the UI.
- If the feature has more than 5 options/settings, it has too many. Reduce to 3 or use smart defaults.

### 4. Data Integrity (Weight: 10%)

> "Does this use real data, not mock/placeholder?"

- All displayed data should come from Supabase via hooks.
- Any demo/seed data should be clearly distinguished or use realistic El Paso data.
- Numbers should never be stale (realtime subscriptions for critical data).

### 5. Revenue Impact (Weight: 10%)

> "Does this directly help Lorena close more deals or save time?"

- **Direct:** Speed-to-Lead reduces response time, AI SMS qualifies leads 24/7, CMA wins listing appointments.
- **Indirect:** Better analytics help Lorena understand her funnel, scoring helps prioritize time.
- **Minimal:** Settings page, billing page, cosmetic improvements.

### Improvement Priority Matrix

| Priority | Criteria | Timeline |
|----------|----------|----------|
| P0 (Blocker) | Data inconsistency, TypeScript error, security vulnerability, broken mobile layout | Fix immediately. Block all other work. |
| P1 (Must Fix) | CINC feature gap, business rule violation, missing loading/empty state, design system violation | Fix before next review cycle. |
| P2 (Should Fix) | UX improvement, performance optimization, code quality improvement, additional test coverage | Fix in next sprint. |
| P3 (Nice to Have) | Cosmetic polish, micro-interaction, animation improvement, developer experience | Add to backlog. Fix when time allows. |

---

## Emergency Protocols

These are the escalation procedures when the Supervisor finds critical issues.

### Data Inconsistency Found

**Severity:** P0 -- Stop everything.

1. Identify which tabs show conflicting data.
2. Trace data flow: Which hook? Which Supabase query? Which cache key?
3. Determine root cause: Stale cache? Wrong query filter? Missing cache invalidation? Race condition?
4. Fix at the SOURCE, not at the display layer. If the hook returns wrong data, fix the hook. Do not add a UI workaround.
5. After fix, verify EVERY tab that displays the affected data shows the same number.
6. Add a regression test pattern: document the inconsistency and how it was fixed so it never recurs.

### TypeScript Error Found

**Severity:** P0 -- Block deployment.

1. Do not ship any build with TypeScript errors. Period.
2. Identify the specific error(s) and file(s).
3. Fix the type, not the symptom. If the fix requires `any`, the approach is wrong. Redesign.
4. After fix, run `npm run type-check` and `npm run build` to confirm clean.
5. Check if the same pattern exists elsewhere (e.g., if one Supabase query is missing types, check all Supabase queries).

### Security Vulnerability Found

**Severity:** P0 -- Immediate fix, no exceptions.

1. Exposed API keys or secrets: Rotate immediately. Check git history for exposure. Add to `.gitignore`.
2. Missing RLS policy: Add the policy. Verify with a test query as an unauthenticated user.
3. Missing input validation: Add validation. Check for SQL injection, XSS, and CSRF.
4. CORS misconfiguration: Restrict to known domains (production URL + localhost for dev).
5. Missing rate limiting: Add rate limiting on Edge Functions.
6. Notify Emmanuel immediately for any secrets that may have been committed to git.

### CINC Feature Missing (Gap Found)

**Severity:** P1 -- Add to improvement roadmap.

1. Document the specific CINC feature and what it does.
2. Assess user impact: Does Lorena actually use this feature in CINC? If yes, priority is HIGH. If she doesn't know it exists, priority is MEDIUM.
3. Design the equivalent for our system. It should be simpler than CINC's version.
4. Add to `.agent/TASKS.md` with estimated effort and dependencies.
5. Brief the relevant tab agent on the new requirement.

### Build Failure

**Severity:** P0 -- Block all merges.

1. Read the build error output carefully. Vite errors are usually clear.
2. Common causes: missing import, circular dependency, type error not caught by `type-check`, missing environment variable.
3. Fix the root cause. Do not add `// @ts-ignore` or comment out the broken code.
4. After fix, run full verification loop: `type-check` then `lint` then `build`.
5. If the build failure was caused by a dependency update, check `package-lock.json` diff.

### Performance Degradation

**Severity:** P1 -- Fix before next review.

1. Identify the slow component/page using browser DevTools Performance tab.
2. Common causes: unnecessary re-renders, large list without virtualization, missing `useMemo`/`useCallback`, N+1 queries, missing database indexes.
3. Fix the root cause. Common fixes: add `React.memo()`, virtualize long lists, optimize Supabase queries, add database indexes.
4. Verify improvement: page load time should be < 1 second for dashboard pages on a 4G connection.

---

## Orchestration Rules

These rules govern how the Supervisor interacts with tab agents and the broader system.

### Communication Protocol

1. **The Supervisor never writes code directly.** It reviews, validates, and directs. If a fix is needed, it assigns the fix to the appropriate tab agent with specific instructions.
2. **Tab agents do not communicate laterally.** All inter-tab communication goes through the Supervisor. If the Leads agent needs something from the Messages agent, it requests through the Supervisor.
3. **Escalation flows upward.** Tab agents escalate blockers to the Supervisor. The Supervisor escalates to Emmanuel only for decisions requiring human judgment (business rules, design choices, API key provisioning).
4. **Fresh evidence required.** The Supervisor never accepts "it should work" or "I think it passes." Every claim must be backed by current terminal output, file contents, or test results from the current session.

### Review Cadence

| Trigger | Review Type | Scope |
|---------|------------|-------|
| Tab agent completes a task | Full verification (Phases 1-8) | Single tab |
| New phase begins (Phase 3 to 4) | Cross-tab consistency audit | All 10 tabs |
| New feature added that touches multiple tabs | Integration review | Affected tabs + shared components |
| Bug report from Emmanuel/Lorena | Root cause analysis | Full system trace |
| Weekly (every Monday) | Comprehensive system review | All tabs + shared + build + deploy |

### Handoff Protocol

When the Supervisor identifies an issue and assigns it to a tab agent:

1. **Issue description** -- What is wrong, with specific file paths and line numbers.
2. **Expected behavior** -- What the correct behavior should be, referencing the relevant spec or business rule.
3. **Suggested fix** -- A concrete suggestion for how to fix it (the tab agent may propose a different approach).
4. **Acceptance criteria** -- What the Supervisor will check when the fix is submitted for re-review.
5. **Priority** -- P0, P1, P2, or P3.

---

## File Ownership Map

The Supervisor does not own any code files. It owns only this skill document and the verification process. Below is the map of which tab agent owns which files, used by the Supervisor to route issues correctly.

### Tab 1: Command Center

- `pages/dashboard/DashboardHome.tsx`
- `hooks/useDashboardStats.ts`

### Tab 2: Leads Manager

- `pages/dashboard/Leads.tsx`
- `pages/dashboard/LeadDetail.tsx`
- `hooks/useLeads.ts`
- `components/dashboard/modals/AddLeadModal.tsx`
- `components/dashboard/modals/ImportLeadsModal.tsx`

### Tab 3: Deals Tracker

- `pages/dashboard/Deals.tsx`
- `hooks/useDeals.ts`

### Tab 4: Messages Hub

- `pages/dashboard/Messages.tsx`
- `hooks/useMessages.ts`
- `hooks/useRealtime.ts`

### Tab 5: Showings Calendar

- `pages/dashboard/Showings.tsx`
- `hooks/useShowings.ts`
- `components/dashboard/modals/AddShowingModal.tsx`

### Tab 6: HomePulse Market

- `pages/dashboard/Market.tsx`
- `hooks/useMarketSnapshots.ts`
- `hooks/useMarketData.ts`

### Tab 7: CMA Generator

- `pages/dashboard/CMA.tsx`
- `hooks/useCMAReports.ts`
- `hooks/useComparableSales.ts`
- `components/dashboard/cma/` (all files)

### Tab 8: AutoTracks Engine

- `pages/dashboard/AutoTracks.tsx`
- `hooks/useAutoTracks.ts`
- `components/dashboard/modals/CreateSequenceModal.tsx`
- `components/dashboard/modals/CreateCampaignModal.tsx`
- `components/dashboard/modals/CreateChecklistModal.tsx`
- `components/dashboard/modals/AssignChecklistModal.tsx`
- `components/dashboard/modals/EnrollLeadModal.tsx`

### Tab 9: Analytics Reporting

- `pages/dashboard/Analytics.tsx`
- `hooks/useAnalytics.ts`

### Tab 10: Settings Config

- `pages/dashboard/DashboardSettings.tsx`
- `hooks/useProfile.ts`
- `hooks/useEmailTemplates.ts`
- `components/dashboard/modals/CreateEmailTemplateModal.tsx`

### Shared (All Agents)

- `components/dashboard/DashboardLayout.tsx`
- `components/dashboard/Sidebar.tsx`
- `components/dashboard/BottomNav.tsx`
- `components/shared/Modal.tsx`
- `components/shared/Toast.tsx`
- `components/shared/Skeleton.tsx`
- `components/shared/EmptyState.tsx`
- `components/shared/LeadScoreBadge.tsx`
- `components/shared/ConfirmDialog.tsx`
- `lib/scoring/constants.ts`
- `lib/scoring/calculate.ts`
- `lib/scoring/log-activity.ts`
- `lib/scoring/recalculate.ts`
- `lib/scoring/triggers.ts`
- `lib/scoring/breakdown.ts`
- `lib/supabase/client.ts`
- `lib/supabase/database.types.ts`
- `lib/i18n/` (all files)

---

## Appendix A: Scoring Engine Quick Reference

Imported from `lib/scoring/constants.ts`. The Supervisor uses this to verify every score display across all tabs.

### 23 Tracked Actions

**Engagement (+):** login (+5), property_view (+2, +5 bonus at 3x), property_favorite (+5), search_save (+10), session_5_plus (+10), return_visit (+8), email_open (+2), email_click (+5)

**Intent (+):** showing_request (+20), message_sent (+10), home_valuation (+15), ai_sms_reply (+15), chatbot_complete (+15), chatbot_handoff (+20), ai_sms_handoff (+20), showing_attended (+15)

**Decay (-):** inactive_7d (-10), inactive_14d (-15), inactive_30d (-25)

**Risk (-):** showing_missed (-5), email_bounce (-5), sms_opt_out (-15)

### Thresholds

| Constant | Value | Behavior |
|----------|-------|----------|
| `SCORE_MIN` | 0 | Floor -- score never goes below 0 |
| `SCORE_MAX` | 100 | Ceiling -- score never goes above 100 |
| `HOT_THRESHOLD` | 80 | Score >= 80 = Hot (red #DC2626) |
| `WARM_THRESHOLD` | 50 | Score >= 50 = Warm (orange #EA580C) |
| `COOL_THRESHOLD` | 20 | Score >= 20 = Cool (blue #2563EB) |
| `ALERT_THRESHOLD` | 70 | Score crosses 70 = notify Lorena |
| `REENGAGE_THRESHOLD` | 30 | Score drops below 30 = auto-enroll in re-engagement |

---

## Appendix B: n8n Workflow Quick Reference

22 workflows the Supervisor monitors for health and correct wiring:

| ID | Name | Category | Status |
|----|------|----------|--------|
| LOS-01 | Contact Form | Lead Capture | Ready |
| LOS-02 | Home Estimate | Lead Capture | Ready |
| LOS-03 | CINC Import | Migration | Ready |
| LOS-04 | Open House | Lead Capture | Ready |
| LOS-05 | Behavioral Scoring | Scoring | Ready |
| LOS-06 | Daily Briefing | AI | Blocked (ANTHROPIC_API_KEY) |
| LOS-07 | ROI Tracker | Analytics | Ready |
| LOS-08 | CMA Generator | AI | Blocked (ANTHROPIC_API_KEY) |
| LOS-09 | Checklist Automator | Automation | Ready |
| LOS-10 | System Monitor | Ops | Ready |
| LOS-11 | Speed to Lead | Automation | Blocked (TWILIO_*) |
| LOS-12 | AI SMS Engine | AI | Blocked (ANTHROPIC_API_KEY, TWILIO_*) |
| LOS-13 | Zillow Parser | Lead Capture | Ready |
| LOS-14 | Meta Lead Sync | Lead Capture | Ready |
| LOS-15 | Drip Orchestrator | Automation | Blocked (SENDGRID_API_KEY) |
| LOS-16 | Lead Reactivation | Automation | Ready |
| LOS-17 | Behavioral Triggers | Scoring | Ready |
| LOS-18 | Showing Coordinator | Coordination | Ready |
| LOS-19 | Pre-Showing Brief | Coordination | Ready |
| LOS-20 | Post-Showing | Coordination | Ready |
| LOS-21 | Post-Close Nurture | Retention | Ready |
| LOS-22 | Social Content | Marketing | Ready |

---

## Appendix C: Verification Report Template

Use this template when generating a verification report for any tab:

```
## Verification Report: [Tab Name]
**Date:** [YYYY-MM-DD]
**Agent:** Supervisor
**Tab Agent:** [Agent Name]
**Files Reviewed:** [list of files]

### Automated Checks
- [ ] TypeScript: [PASS/FAIL] — [error count or "0 errors"]
- [ ] ESLint: [PASS/FAIL] — [warning count or "0 warnings"]
- [ ] Build: [PASS/FAIL] — [exit code]

### Cross-Tab Consistency
- [ ] Lead count matches: [PASS/FAIL]
- [ ] Score colors correct: [PASS/FAIL]
- [ ] Cache invalidation complete: [PASS/FAIL]

### Visual QA
- [ ] Mobile (375px): [PASS/FAIL] — [notes]
- [ ] Desktop (1440px): [PASS/FAIL] — [notes]
- [ ] Skeleton loading: [PASS/FAIL]
- [ ] Empty state: [PASS/FAIL]
- [ ] Dark mode: [PASS/FAIL]

### Business Rules
- [ ] Score thresholds from constants: [PASS/FAIL]
- [ ] Bilingual support: [PASS/FAIL]
- [ ] Touch targets >= 44px: [PASS/FAIL]
- [ ] Quiet hours enforced: [PASS/FAIL or N/A]
- [ ] Drip pause rules: [PASS/FAIL or N/A]

### Design System
- [ ] Fonts correct: [PASS/FAIL]
- [ ] Colors correct: [PASS/FAIL]
- [ ] No framework branding: [PASS/FAIL]

### CINC Parity
- [ ] Feature match/exceed: [PASS/FAIL] — [details]

### Issues Found
| # | Severity | Description | File | Line | Suggested Fix |
|---|----------|-------------|------|------|---------------|
| 1 | P[0-3]   | ...         | ...  | ...  | ...           |

### Overall Assessment
**[APPROVED / NEEDS FIXES / REJECTED]**

### Notes
[Additional context, improvement suggestions, or follow-up items]
```

---

*The Supervisor does not build. The Supervisor ensures what is built is worthy of replacing a $1,750/month system. Every tab, every hook, every pixel must earn its place.*
