# Analytics & Reporting Agent Skill

> Domain-specific knowledge for the Analytics dashboard tab.
> Read this skill before modifying or building any reporting, stats, or data visualization feature.

---

## Purpose

Data-driven reporting and performance analytics dashboard that lets Lorena track her pipeline health, lead sources, temperature distribution, and automation effectiveness. This tab answers the question: "Is what I'm doing actually working?" Currently at ~60% completeness — 3 of 5 planned tabs are built, and the existing tabs lack time-series trends and conversion analysis. Needs significant enhancement to justify the CINC switch for data-oriented agents.

---

## Files

- **Primary:** `pages/dashboard/Analytics.tsx` (267 lines)
- **Hooks:**
  - `hooks/useAnalytics.ts` — `useOverviewStats()`, `useLeadSourceStats(dateRange)`, `useAutomationStats()`
  - `hooks/useLeads.ts` — `useLeads()` (used for local temperature/status computation)
- **Components:**
  - `components/shared/Skeleton.tsx` — `SkeletonStats`, `SkeletonCard`
  - `components/shared/EmptyState.tsx`
- **Charts:** Recharts — `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `PieChart`, `Pie`, `Cell`

---

## Data Sources

### Supabase Tables Queried

| Table | Purpose | Columns Used |
|-------|---------|-------------|
| `leads` | Lead counts, score distribution, source breakdown | `score`, `status`, `source`, `created_at` |
| `messages` | Unread inbound message count | `read`, `direction` |
| `showings` | Today's showing count | `date` |
| `drip_sequences` | Total sequence count | (count only) |
| `drip_enrollments` | Active enrollment count | `status` |

### Hook Details

| Hook | Query Key | What It Returns |
|------|-----------|-----------------|
| `useOverviewStats()` | `['overview-stats']` | `{ newLeadsToday, hotLeads (score>=80), unreadMessages (inbound+unread), showingsToday }` — uses 4 parallel Supabase count queries |
| `useLeadSourceStats(dateRange)` | `['lead-source-stats', dateRange]` | `LeadSourceStat[]` — `{ source, count, hotCount }` grouped by source field. Filters by date range if provided. |
| `useAutomationStats()` | `['automation-stats']` | `{ totalSequences, activeEnrollments }` — 2 count queries on drip tables |
| `useLeads()` | `['leads']` | Full lead array used client-side for temperature and status distribution charts |

### Date Range Logic

```typescript
type RangePreset = 'today' | '7d' | '30d' | 'all';

// 'today' → { start: today, end: today }
// '7d' → { start: today-7, end: today }
// '30d' → { start: today-30, end: today }
// 'all' → null (no date filter)
```

Date range only affects the Leads tab's source breakdown. Overview stats and Automation stats are always "all time."

---

## Current Features

### Date Range Presets
- 4 pill buttons: Today, 7 Days, 30 Days, All Time
- Default: "All Time"
- Active state: gold background, white text
- Inactive state: white background, bordered, gray text

### Tab: Overview (default)

**4 Stat Cards:**

| Stat | Icon | Color Class | Data Source |
|------|------|-------------|-------------|
| Total Leads | Users | `text-blue-600 bg-blue-50` | `allLeads.length` (client-side count) |
| Hot Leads | TrendingUp | `text-red-600 bg-red-50` | `stats.hotLeads` (server count, score >= 80) |
| Unread Messages | MessageSquare | `text-green-600 bg-green-50` | `stats.unreadMessages` |
| Showings Today | Calendar | `text-purple-600 bg-purple-50` | `stats.showingsToday` |

**Lead Temperature Pie Chart:**
- 4 segments: Hot (>= 80), Warm (50-79), Cool (20-49), Cold (< 20)
- Colors: Hot `#DC2626`, Warm `#EA580C`, Cool `#2563EB`, Cold `#9CA3AF`
- Computed client-side from `allLeads` array with `.filter()` on score ranges
- PieChart with innerRadius=30, outerRadius=60, paddingAngle=2
- Legend with color dots and counts

**Lead Status Bar Chart:**
- Horizontal bar chart (`layout="vertical"`)
- Bars filled with gold `#C9A84C`, rounded right side `[0, 4, 4, 0]`
- Status names on Y-axis, counts on X-axis
- Computed client-side: groups `allLeads` by `.status`, sorted by count descending

### Tab: Leads

**Leads by Source Bar Chart:**
- Vertical bar chart with two series: Total (gold `#C9A84C`) and Hot (red `#DC2626`)
- X-axis labels rotated -30 degrees
- Source names from `useLeadSourceStats()`, sorted by total descending
- Respects the active date range preset

**Source Breakdown Table:**
- 4 columns: Source, Total, Hot, Conversion (hot/total percentage)
- Source names capitalized
- Hot count in `text-score-hot` color
- Shows "-" for conversion when total is 0

### Tab: Automations

**2 Stat Cards:**
- Active Sequences count (from `automationStats.totalSequences`)
- Active Enrollments count (from `automationStats.activeEnrollments`)
- Both use `font-playfair text-3xl font-bold`
- EmptyState if totalSequences is 0

### MISSING Tabs (planned but not built)

**Tab: Deals** (NOT IMPLEMENTED)
- Pipeline value by stage
- Close rates
- Average days per stage
- Revenue tracking

**Tab: Marketing** (NOT IMPLEMENTED)
- Email open/click rates
- SMS reply rates
- Campaign performance
- ROI per channel

---

## Business Rules

### Score Temperature Thresholds (CRITICAL — must match everywhere)
- **Hot:** score >= 80 — color `#DC2626` (red)
- **Warm:** score >= 50 AND < 80 — color `#EA580C` (orange)
- **Cool:** score >= 20 AND < 50 — color `#2563EB` (blue)
- **Cold:** score < 20 — color `#9CA3AF` (gray)

These thresholds and colors MUST match the values in `lib/scoring/constants.ts`, `components/shared/LeadScoreBadge.tsx`, and all other places scores are displayed.

### Date Range Filtering
- Date range presets filter the `created_at` field on leads
- Format: `YYYY-MM-DDT00:00:00` to `YYYY-MM-DDT23:59:59`
- "All Time" passes `null` which skips date filtering entirely

### Overview Stats Are Real-Time
- `useOverviewStats()` uses `count: 'exact'` with `head: true` (efficient count-only queries)
- No staleTime configured — re-fetches on mount and window focus
- "Today" calculations use client timezone (could be wrong if user travels)

---

## Known Issues

1. **Only 3 of 5 planned tabs built** — Deals and Marketing tabs are listed in the spec (dashboard-builder skill) but not implemented. The tabs array only contains `['Overview', 'Leads', 'Automations']`.
2. **No time-series trend charts** — There are no line charts showing how metrics change over time. All data is point-in-time snapshots. Cannot answer "are things getting better or worse?"
3. **Temperature computed client-side** — The pie chart filters all leads in memory. For 100 leads this is fine (Lorena's scale), but at 1,000+ leads this would need server-side aggregation.
4. **Date range only affects Leads tab** — The Overview stat cards and Automations stats ignore the date range preset. This is confusing because the date range pills are visible on all tabs.
5. **No conversion funnel** — Cannot see lead-to-deal conversion rates, or how leads move through statuses over time.
6. **No comparison to previous period** — Cannot see "this week vs last week" or "this month vs last month" trends.
7. **Automation stats are minimal** — Only shows total sequences and active enrollments. No per-sequence metrics, no send/open/reply rates.
8. **No export** — Cannot export analytics data as CSV or PDF for external reporting.
9. **Chart tooltips are unstyled** — The Recharts default `<Tooltip />` is used on some charts without the custom contentStyle that other pages apply.
10. **PIE_COLORS constant unused for temp chart** — The `PIE_COLORS` array is defined but the temperature chart uses inline colors from the `tempData` array. The constant is only used if you add new chart types.
11. **No benchmarking** — No way to compare performance against market averages or industry benchmarks.

---

## CINC Pro Comparison

| Feature | CINC Pro | Our System |
|---------|----------|------------|
| Overview stats | Basic lead counts | 4 stat cards + temperature pie + status bar chart |
| Lead source breakdown | Basic source attribution | Source table with total/hot/conversion + bar chart |
| Date range filtering | Limited | 4 presets (Today, 7d, 30d, All) |
| Automation analytics | Email open rates per campaign | Only total sequences + enrollments (needs expansion) |
| Pipeline/deal analytics | Basic deal tracking | NOT IMPLEMENTED (Deals tab missing) |
| Marketing ROI | Not available | NOT IMPLEMENTED (Marketing tab missing) |
| Time-series trends | Not available | NOT IMPLEMENTED (no line charts) |
| Export | CSV export | NOT IMPLEMENTED |

**Where we're better:** Temperature distribution visualization, source-to-hot conversion rate, clean date range UX.

**Where we're worse:** CINC has per-campaign email open/click rates. We have zero email/SMS performance metrics. CINC has basic deal tracking; we don't show deals analytics at all.

**To justify the switch, we MUST build:** Deals pipeline analytics, per-sequence performance metrics, and time-series trend charts. Without these, a data-driven agent would hesitate to leave CINC.

---

## Improvement Roadmap

### Priority 1 — Complete the Tab Set
1. **Build Deals tab** — Pipeline value by stage, close rate (deals closed / deals started), average days per stage, revenue per month chart, deal count by type (buyer/seller).
2. **Build Marketing tab** — Email metrics (open rate, click rate, unsubscribe rate per template), SMS metrics (delivery rate, reply rate per sequence), overall channel comparison.
3. **Add time-series trend charts** — Line chart showing leads per week, hot leads per week, and deals per month over the last 90 days.

### Priority 2 — Deeper Insights
4. **Conversion funnel** — Visual funnel: New Lead -> Contacted -> Showing -> Under Contract -> Closed. Show counts and drop-off rates at each stage.
5. **Period comparison** — "This week vs last week", "This month vs last month" with delta indicators (up/down arrows with percentage change).
6. **Per-sequence metrics** — Enrollment count, completion rate, average time to complete, reply rate per step.
7. **Source ROI** — Cost per lead and cost per close by source (requires ad spend data input).
8. **Response time analytics** — Average time from new lead to first contact (Speed-to-Lead metric).

### Priority 3 — Export and Sharing
9. **CSV export** — Download any analytics view as CSV.
10. **PDF report** — Generate a branded monthly performance report PDF (similar to CMA PDF approach).
11. **Dashboard sharing** — Generate a read-only link for Lorena's broker or team lead.
12. **Scheduled reports** — Auto-email weekly/monthly summary to Lorena.

### Priority 4 — Advanced Analytics
13. **Predictive scoring insights** — Show which scoring signals most correlate with conversions.
14. **Cohort analysis** — Compare leads by month of acquisition to see which cohorts convert best.
15. **A/B test results** — Display sequence A/B test winners and statistical significance.

---

## Design System

### Colors Used on This Page
- **Gold:** `#C9A84C` — bar chart fill (status distribution, source total), active date range button, active tab indicator
- **Score colors:**
  - Hot: `#DC2626` — pie slice, source hot bar, "Hot" stat card icon background
  - Warm: `#EA580C` — pie slice
  - Cool: `#2563EB` — pie slice
  - Cold: `#9CA3AF` — pie slice
- **Stat card icon backgrounds:** Blue (`bg-blue-50`), Red (`bg-red-50`), Green (`bg-green-50`), Purple (`bg-purple-50`)
- **PIE_COLORS array:** `['#C9A84C', '#DC2626', '#EA580C', '#2563EB', '#9CA3AF', '#16A34A', '#7C3AED', '#F59E0B']` — available for additional charts

### Typography
- **Page title:** `font-playfair text-2xl md:text-3xl font-bold` — "Analytics"
- **Stat card labels:** `font-lato text-xs text-dashboard-secondary`
- **Stat card values:** `font-playfair text-2xl font-bold` (overview) or `font-playfair text-3xl font-bold` (automations)
- **Section headers:** `font-playfair text-base font-bold`
- **Chart tick labels:** `fontSize: 12` (default Recharts)
- **Table headers:** `font-lato text-xs font-medium text-dashboard-secondary uppercase`
- **Table cells:** `font-lato text-sm`

### Layout Patterns
- Tabs: border-bottom style with `border-b-2` gold active indicator, `min-h-[44px]`, `overflow-x-auto` for mobile
- Date range pills: `flex gap-2` with rounded-lg buttons, `min-h-[36px]`
- Stat cards: `grid grid-cols-2 md:grid-cols-4 gap-4` (overview), `grid grid-cols-2 gap-4` (automations)
- Chart containers: `bg-white rounded-xl border border-dashboard-border p-5`
- Chart rows: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Charts: `h-48` (status bar) or `h-64` (source bar), `h-40` (pie)
- Table: `w-full` with `divide-y` rows, hover: `bg-dashboard-surface/30`
- ARIA: `role="tablist"`, `role="tab"`, `role="tabpanel"` with proper IDs

---

## Verification Checklist

- [ ] Page loads with skeleton shimmer while data fetches
- [ ] All 3 tabs render correctly (Overview, Leads, Automations)
- [ ] Tab switching preserves the selected date range preset
- [ ] Date range presets toggle correctly (gold active, gray inactive)
- [ ] Overview: 4 stat cards show correct values with icons
- [ ] Overview: Temperature pie chart renders with correct colors (Hot=red, Warm=orange, Cool=blue, Cold=gray)
- [ ] Overview: Temperature legend shows names and counts matching the pie
- [ ] Overview: Status bar chart renders horizontally with gold bars and correct status labels
- [ ] Leads: Source bar chart shows Total (gold) and Hot (red) bars per source
- [ ] Leads: Source table shows all sources with Total, Hot, and Conversion columns
- [ ] Leads: Conversion shows correct percentage or "-" for zero totals
- [ ] Automations: Shows sequence count and enrollment count
- [ ] Automations: Empty state renders if no sequences exist
- [ ] Mobile (375px): tabs scroll horizontally, charts stack vertically, stat cards stack 2-wide
- [ ] Desktop (1440px): full layout with side-by-side charts
- [ ] Score colors match the canonical values in all charts and displays
- [ ] Empty states show branded EmptyState with BarChart3 icon
- [ ] No console errors when any data is empty/null
- [ ] Fonts: Playfair Display for titles and stat values, Lato for everything else
