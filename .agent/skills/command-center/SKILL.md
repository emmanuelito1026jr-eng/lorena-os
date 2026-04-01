# Command Center Agent Skill
> Domain-specific knowledge for the DashboardHome (Command Center) dashboard tab

## Purpose

The Command Center is Lorena's AI-powered morning dashboard -- the first screen she sees when she opens the app at 7 AM on her phone. It surfaces everything she needs to know for the day in one scrollable view: AI daily briefing, key stats, priority actions requiring her attention, today's showings, pipeline health, hot leads, recent activity, MLS listings, market pulse, and notifications. It must pass the "7 AM phone check" test -- instantly actionable, zero learning curve.

## Files

- **Primary:** `pages/dashboard/DashboardHome.tsx` (988 lines)
- **Hooks:**
  - `hooks/useAnalytics.ts` -- `useOverviewStats()` (hot leads count, unread messages, showings today)
  - `hooks/useLeads.ts` -- `useHotLeads(5)` (top 5 leads with score >= 80)
  - `hooks/useDashboardStats.ts` -- `usePipelineStats()`, `useDealsSummary()`, `usePriorityActions()`, `useTodayShowings()`, `useRecentActivity(8)`, `usePerformanceMetrics()`
  - `hooks/useMessages.ts` -- `useUnreadCount()`
  - `hooks/useNotifications.ts` -- `useNotifications()`, `useMarkNotificationRead()`, `useMarkAllNotificationsRead()`
  - `hooks/useMarketSnapshots.ts` -- `useMarketSnapshot('El Paso', 'city')`
  - `hooks/useListingInteractions.ts` -- `useRecentMatches(5)`
  - `hooks/useDailyBriefing.ts` -- `useDailyBriefing()` (calls Supabase Edge Function `daily-briefing`)
  - `hooks/useAuth.ts` -- `useAuth()` (profile/user context for greeting)
  - `hooks/useRealtime.ts` -- `useRealtimeLeads()`, `useRealtimeMessages()`, `useRealtimeNotifications()`, `useRealtimeListings()`, `useRealtimeInteractions()`
  - `hooks/usePageTitle.ts` -- sets document title to "Command Center"
  - `hooks/useListings.ts` -- referenced via inline `useQuery` for Lorena's own listings
- **Components:**
  - `components/shared/EmptyState.tsx` -- branded empty states with gold accent
  - `components/shared/Skeleton.tsx` -- `SkeletonStats`, `SkeletonCard`, `SkeletonList`, `Skeleton`
  - `components/shared/LeadScoreBadge.tsx` -- color-coded score badge
- **External Libraries:**
  - `recharts` -- `PieChart`, `Pie`, `Cell`, `ResponsiveContainer`, `Tooltip` (pipeline donut chart)
  - `date-fns` -- `format`, `isToday`, `isTomorrow`, `parseISO`
  - `lucide-react` -- 22 icon imports

## Data Sources

### Supabase Tables Queried
| Table | Query Context | Used For |
|---|---|---|
| `leads` | Hot leads (score >= 80), pipeline stats, performance metrics | Hot Leads widget, Pipeline donut, Stats grid |
| `deals` | Active deals (not closed/fallen_through) | Active Deals widget, Stats grid |
| `messages` | Unread inbound messages | Unread count badge, Priority Queue |
| `showings` | Today's showings (date = today, not cancelled) | Today's Schedule widget |
| `lead_activity` | Recent activity with lead joins | Activity Feed widget |
| `notifications` | Unread notifications | Notifications panel |
| `listings` | Lorena's active/pending listings (`is_lorenas_listing = true`) | My Listings widget |
| `market_snapshots` | El Paso city-level market data | Market Pulse widget |
| `lead_listing_interactions` | Recent lead-to-listing matches | Recent Matches widget |

### Supabase Edge Functions
| Function | Trigger | Purpose |
|---|---|---|
| `daily-briefing` | Called via `useDailyBriefing()` hook on page load | AI-generated morning narrative, priority actions, key stats |

### Realtime Subscriptions (5 active channels)
- `leads-changes` -- invalidates `leads`, `overview-stats` queries
- `messages-changes` -- invalidates `messages`, `conversations`, `unread-count`
- `notifications-changes` -- invalidates `notifications`, `notification-count`
- `listings-changes` -- invalidates `listings`, `featured-listings`, `market-snapshot`, `market-snapshots`
- `interactions-changes` -- invalidates `recent-matches`, `listing-interactions`

## Current Features

### Layout Sections (top to bottom)
1. **Smart Greeting Header** -- Time-based greeting + first name + date + "El Paso, TX" + quick-action pills (hot leads count, unread messages count)
2. **Daily AI Briefing Card** -- AI narrative (greeting + summary), 4-stat bar (New Leads, Hot Leads, Showings, Unread Msgs), numbered Priority Actions list, additional sections (Pipeline Review, Market Update, etc.), refresh button
3. **Stats Grid** -- 6 clickable cards: Total Leads, Hot Leads, Unread Messages, Showings Today, Active Deals, Avg Score. Each links to its respective tab.
4. **Priority Action Queue** (3/5 cols) -- Urgent/high/normal items with color-coded left borders (red=urgent, amber=high, teal=normal). Types: hot_lead, unread_message, showing_confirm, follow_up, new_lead. Links to lead detail.
5. **Today's Schedule** (2/5 cols) -- List of today's showings with time, status badge, address, lead name. Links to showings tab.
6. **Pipeline Donut + Active Deals** (2-col row):
   - Pipeline: Recharts donut chart with interactive tooltip + color legend by lead status
   - Active Deals: Volume/commission summary, stage breakdown progress bars, 3 most recent deals
7. **Hot Leads + Activity Feed** (2-col row):
   - Hot Leads: Top 5 leads scoring 80+, with avatar initials, status, timeline, budget, score badge
   - Activity Feed: Last 8 lead activities with icon, label, lead name, points (+/-), relative timestamp
8. **Performance Metrics** -- 4-stat row: Hot Lead Rate %, Closed This Month, Closed Volume, Active Sequences
9. **MLS Integration Widgets** (3-col row):
   - My Listings: Lorena's active/pending listings with photos, price, beds/baths/sqft
   - Market Pulse: Active listings count, median price, avg days on market
   - Recent Matches: Lead-listing interaction pairs with price and timestamp
10. **Notifications** -- Unread notifications with show all/less toggle and "Mark All Read" action

### Internal Components
- `DailyBriefingCard` -- Standalone function component (lines 149-301) with loading skeleton, error/empty fallback, and full briefing render

### Helper Functions
- `getGreeting()` -- Returns Spanish greeting based on hour: "Buenos dias" / "Buenas tardes" / "Buenas noches"
- `formatRelativeTime(dateStr)` -- "just now" / "5m ago" / "2h ago" / "3d ago" / "MMM d"
- `formatCurrency(amount)` -- "$1.2M" / "$350K" / "$500"

### Lookup Maps
- `actionIcons` -- Maps priority action types to Lucide icons (5 entries)
- `actionColors` -- Maps priority levels to Tailwind border/bg classes (3 entries)
- `activityIcons` -- Maps 25 activity types to Lucide icons
- `activityLabels` -- Maps 30+ activity types to human-readable labels

## Business Rules

- **Score 80+ = Hot (red #DC2626)** -- Leads appear in Hot Leads widget + Priority Queue as "urgent"
- **Score 50-79 = Warm (orange #EA580C)** -- Warm leads tracked in pipeline stats
- **Score 20-49 = Cool (blue #2563EB)** -- Cool leads tracked in pipeline stats
- **Score 0-19 = Cold (gray #9CA3AF)** -- Cold leads tracked in pipeline stats
- **Hot lead with no outreach in 3+ days** -- Shows as "urgent" priority action
- **Unread inbound messages** -- Show as "high" priority actions (up to 5)
- **Scheduled showings needing confirmation** -- Show as "normal" priority actions (up to 3)
- **New leads from today** -- Show as "high" priority actions (up to 3)
- **Commission defaults to 3%** when `commission_rate` is null on deals
- **Daily briefing cached for 1 hour** (staleTime), kept in memory for 4 hours (gcTime), max 1 retry
- **Lorena's listings filtered by** `is_lorenas_listing = true` AND status IN ('active', 'pending')
- **Listings data stale time: 5 minutes** (queryKey: 'lorena-listings')

## Known Issues

1. **Greeting is hardcoded Spanish only** -- `getGreeting()` always returns "Buenos dias/tardes/noches" regardless of user language preference. Should be bilingual based on `preferred_language` or i18n context.
2. **Daily briefing section titles not localized** -- "Priority Actions", "Pipeline Review", etc. are English-only in the AI response.
3. **No error boundaries per section** -- If one data source fails (e.g., deals query), the entire page might show a generic error instead of gracefully degrading per widget.
4. **Inline query for Lorena's listings** -- Uses raw `useQuery` + `supabase` call instead of a dedicated reusable hook (lines 326-344). Should be extracted to `hooks/useListings.ts`.
5. **Activity labels have duplicates** -- Both `form_submit` and `form_submission`, `email_open` and `email_opened`, `email_click` and `email_clicked` are mapped. Should normalize upstream.
6. **Pipeline donut tooltip uses `as never` cast** -- Type assertion on Recharts tooltip formatter (line 601) is a code smell.
7. **No scroll-to-top on mount** -- Long page might open mid-scroll if navigating from another tab.
8. **Performance metrics section conditionally rendered** -- Uses `!perfLoading && performance` which hides the entire section during loading instead of showing a skeleton.
9. **Notifications panel only shows when unread > 0** -- No way to view read/past notifications.
10. **"My Listings" widget uses `<a>` with `target="_blank"`** instead of React Router `<Link>` for internal property pages.
11. **Market Pulse widget shows "N/A" for missing median price** -- Should show skeleton or "Syncing..." instead of a literal "N/A" string.
12. **5 concurrent Supabase realtime channels** -- Could be consolidated into fewer channels for performance.

## CINC Pro Comparison

### What CINC Has That We Don't (Yet)
- AI-generated suggested next actions per lead (not just priority queue)
- Team member activity dashboard (Lorena is solo, but template needs this)
- Revenue forecasting with probability-weighted pipeline
- Monthly/quarterly comparisons for performance metrics
- Drip sequence performance summary on command center
- SMS/Twilio balance display
- Integration status indicators (MLS sync health, SMS deliverability)

### What We Do BETTER Than CINC
- **AI Daily Briefing** -- CINC has no equivalent. Our briefing gives Lorena a narrative summary, not just raw numbers.
- **Priority Queue with urgency levels** -- CINC shows a flat task list. Ours triages by urgency (urgent/high/normal) with color coding.
- **MLS widgets on the command center** -- CINC separates MLS from the dashboard. We integrate listings, market pulse, and lead-listing matches right on the home screen.
- **Real-time everything** -- 5 Supabase realtime channels keep the dashboard live without manual refresh. CINC requires page reloads.
- **Beautiful, scannable design** -- CINC's dashboard is cluttered and utilitarian. Ours is Compass-inspired luxury minimalism.
- **One-screen actionability** -- Lorena can see everything at a glance. CINC requires clicking into 4-5 different tabs.

## Improvement Roadmap

### Priority 1 -- Critical (Beat CINC)
1. **Bilingual greeting and section headers** -- Read `profile.preferred_language` or i18n context to alternate between Spanish and English for the greeting, section titles, and empty states.
2. **Error boundary per section** -- Wrap each widget in an error boundary so one failed query doesn't take down the whole page.
3. **AI suggestion badges on hot leads** -- Small AI chip next to each hot lead with a suggested action ("Send follow-up SMS", "Schedule showing", "Share new listing").
4. **Deal forecast widget** -- Probability-weighted pipeline value: "Expected to close $X this month based on Y active deals."

### Priority 2 -- High Value
5. **Drip performance widget** -- Show active sequences count, emails sent today, SMS sent today, reply rate. Links to AutoTracks tab.
6. **SMS/Twilio balance display** -- Show remaining SMS credits or Twilio balance so Lorena never runs out mid-campaign.
7. **Extract Lorena's listings into a proper hook** -- `useMyListings()` in `hooks/useListings.ts` instead of inline query.
8. **Performance metrics skeleton** -- Show skeleton loading state instead of hiding the entire section.
9. **Consolidate realtime channels** -- Merge 5 channels into 1-2 multiplexed channels.

### Priority 3 -- Polish
10. **Scroll-to-top on mount** -- `window.scrollTo(0, 0)` or ref-based scroll on mount.
11. **Notification history** -- "View all" link to see past (read) notifications, not just unread.
12. **Activity label normalization** -- Deduplicate `form_submit`/`form_submission`, etc.
13. **Market Pulse trend indicators** -- Up/down arrows showing week-over-week changes.
14. **Quick-action floating button** -- "Add Lead", "Schedule Showing", "Send Message" FAB on mobile.

## Design System

### Colors Used
| Purpose | Value | Tailwind Class |
|---|---|---|
| Gold accent (borders, CTAs, links) | #C9A84C | `text-dashboard-gold`, `bg-dashboard-gold`, `border-dashboard-gold` |
| Hot lead/urgent | #DC2626 | `text-score-hot`, `bg-score-hot/10` |
| Warm lead | #EA580C | `text-score-warm` |
| Cool lead | #2563EB | `text-score-cool` |
| Cold lead | #9CA3AF | `text-score-cold` |
| Success/closed | #16A34A | `text-status-success` |
| Dashboard teal (pipeline, actions) | Custom | `text-dashboard-teal`, `bg-dashboard-teal-light` |
| Dashboard accent (deals, commission) | Custom | `text-dashboard-accent` |
| Surface/card bg | Custom | `bg-dashboard-surface` |
| Body text | #333333 | `text-dashboard-body` |
| Secondary text | #888888 | `text-dashboard-secondary` |

### Typography
| Context | Font | Class |
|---|---|---|
| Page title ("Buenos dias, Lorena") | Playfair Display | `font-playfair text-2xl md:text-3xl font-bold` |
| Section headers | Playfair Display | `font-playfair text-lg font-bold` |
| Stat values | Playfair Display | `font-playfair text-xl font-bold` or `text-2xl` |
| Body text, labels, timestamps | Lato | `font-lato text-sm` |
| Micro labels (uppercase) | Lato | `font-lato text-[10px] uppercase tracking-wide` |
| Micro timestamps | Lato | `font-lato text-[10px]` |

### Component Patterns
- **Cards:** `bg-white rounded-xl border border-dashboard-border` with `hover:border-dashboard-gold/40 hover:shadow-premium`
- **Stat cards:** 2-col mobile, 3-col tablet, 6-col desktop grid
- **Section headers:** Icon + Playfair title + optional count badge + "View All" link with `ChevronRight`
- **Loading:** Skeleton shimmer components (`SkeletonStats`, `SkeletonCard`, `SkeletonList`) -- never spinners, never blank
- **Empty states:** `EmptyState` component with icon + title + description + optional CTA
- **Priority borders:** `border-l-3` with red (urgent), amber (high), teal (normal)
- **Touch targets:** All interactive elements have `min-h-[44px]` or equivalent

### Responsive Breakpoints
| Breakpoint | Layout Changes |
|---|---|
| Mobile (< md) | Stats: 2 cols, Priority/Schedule: stacked, Pipeline/Deals: stacked, Leads/Activity: stacked, MLS: stacked, Quick pills hidden |
| Tablet (md) | Stats: 3 cols, some sections side-by-side |
| Desktop (lg) | Stats: 6 cols, Priority: 3/5 + Schedule: 2/5, Pipeline + Deals: 2 cols, Leads + Activity: 2 cols, MLS: 3 cols |

## Verification Checklist

1. [ ] Page loads with skeleton shimmer (not blank, not spinner) for stats, cards, and lists
2. [ ] Greeting shows correct time-of-day phrase
3. [ ] Daily Briefing card shows fallback message when Edge Function is not deployed (no error crash)
4. [ ] Stats grid shows 6 cards with correct values and each links to the right tab
5. [ ] Priority Queue shows items sorted by urgency (urgent -> high -> normal)
6. [ ] Today's Schedule shows showings for today only, sorted by time
7. [ ] Pipeline donut chart renders with correct status colors and interactive tooltip
8. [ ] Active Deals shows volume and commission summary with correct formatting
9. [ ] Hot Leads widget shows only leads with score >= 80, with correct color badge
10. [ ] Activity Feed shows recent activities with correct icons, labels, and point values
11. [ ] Performance Metrics shows 4 stats: Hot Lead Rate, Closed This Month, Closed Volume, Active Sequences
12. [ ] My Listings shows Lorena's active/pending properties with photos
13. [ ] Market Pulse shows active count, median price, avg DOM from snapshot data
14. [ ] Notifications panel appears only when unread > 0, with "Mark All Read" working
15. [ ] All text uses Playfair Display for headlines and Lato for body
16. [ ] Gold accent (#C9A84C) used consistently for links, borders, CTAs, and active states
17. [ ] Mobile layout (375px) is scrollable, no horizontal overflow, all touch targets >= 44px
18. [ ] Realtime updates reflect within seconds when leads/messages/notifications change in Supabase
19. [ ] No TypeScript errors (`npm run type-check`)
20. [ ] No ESLint warnings (`npm run lint`)
