# Deals Tracker Agent Skill
> Domain-specific knowledge for the Deals Pipeline dashboard tab

## Purpose

The Deals tab tracks Lorena's active real estate transactions through a multi-stage pipeline from Pre-Listing to Closed. It provides kanban (board) and list views of all deals, each linked to a client (lead) with property address, price, commission estimate, deal type (buyer/seller/dual), and close date. This is Lorena's revenue visibility screen -- she needs to know at a glance how much is in the pipeline, what stage each deal is at, and what commissions to expect.

## Files

- **Primary:** `pages/dashboard/Deals.tsx` (288 lines)
- **Hooks:**
  - `hooks/useDeals.ts` -- `useDeals(filters)`, `useDealsByStage()`, `useCreateDeal()`, `useUpdateDeal()`, `useDeleteDeal()`
  - `hooks/usePageTitle.ts` -- sets document title to "Deals Pipeline"
- **Components:**
  - `components/shared/Skeleton.tsx` -- `SkeletonCard`, `SkeletonList`
  - `components/shared/EmptyState.tsx` -- branded empty state
- **External Libraries:**
  - `date-fns` -- `format`, `parseISO`
  - `lucide-react` -- `DollarSign`, `Plus`, `Search`, `LayoutGrid`, `List`, `ChevronRight`, `Calendar`, `User`, `MapPin`, `ArrowRight`, `Filter`

## Data Sources

### Supabase Tables
| Table | Hook | Query Details |
|---|---|---|
| `deals` | `useDeals(filters)` | `select('*, leads(first_name, last_name, phone, email)')`, ordered by `updated_at` desc. Supports stage, deal_type, and search (ilike on property_address) filters. |
| `deals` | `useDealsByStage()` | Same select as above, but groups results client-side into a `Record<DealStage, DealWithLead[]>`. |

### DealWithLead Type
```typescript
interface DealWithLead extends Deal {
  leads: {
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  } | null;
}
```

### Query Invalidation on Mutations
- `useCreateDeal()` -- invalidates `['deals']`, `['deals-by-stage']`, `['deals-summary']`
- `useUpdateDeal()` -- invalidates `['deals']`, `['deals-by-stage']`, `['deals-summary']`
- `useDeleteDeal()` -- invalidates `['deals']`, `['deals-by-stage']`, `['deals-summary']`

## Current Features

### Page Header
- Title: "Deals Pipeline" (Playfair Display)
- Subtitle: "{N} active deals -- {$X} volume -- {$Y} commission"
- View toggle: Board (kanban) | List with icon labels

### Search Bar
- Single input: "Search deals by address..." with Search icon
- Max width: `max-w-sm`
- Searches against `property_address` via Supabase `ilike`

### Kanban (Board) View -- `KanbanView` component
- **5 visible columns:** Pre-Listing, Active Listing, Under Contract, Pending, Closed
  - (`fallen_through` stage exists in the type but is NOT rendered as a column)
- Each column has:
  - Colored header with stage label, count, and total volume
  - Dashed border empty state ("No deals") when column is empty
  - `DealCard` components for each deal
- Horizontal scroll on mobile (`overflow-x-auto`, min-width 280px per column)
- On desktop, columns flex equally (`md:flex-1`)

### Deal Card -- `DealCard` component
- **Deal type badge:** buyer (blue), seller (green), dual (purple)
- **Price:** formatted as currency (sale_price or list_price fallback)
- **Address:** with MapPin icon
- **Client name:** with User icon (from joined leads table)
- **Footer:** estimated close date + estimated commission
- Links to `/dashboard/leads/{deal.lead_id}` (goes to lead detail, NOT a deal detail page)

### List View -- `ListView` component
- **Desktop:** Grid table with columns: Property, Client, Type, Price, Stage, Close Date
- **Mobile:** Simplified card layout (address + price, then client + stage badge)
- Dual rendering: separate `md:hidden` and `hidden md:grid` blocks for mobile vs desktop

### Stage Configuration
| Stage | Label | Text Color | Background |
|---|---|---|---|
| `pre_listing` | Pre-Listing | `text-blue-700` | `bg-blue-50 border-blue-200` |
| `active_listing` | Active Listing | `text-purple-700` | `bg-purple-50 border-purple-200` |
| `under_contract` | Under Contract | `text-dashboard-accent` | `bg-amber-50 border-amber-200` |
| `pending` | Pending | `text-orange-700` | `bg-orange-50 border-orange-200` |
| `closed` | Closed | `text-status-success` | `bg-green-50 border-green-200` |
| `fallen_through` | Fallen Through | `text-dashboard-secondary` | `bg-gray-50 border-gray-200` |

### Deal Types
| Type | Badge Color |
|---|---|
| `buyer` | `bg-blue-50 text-blue-700` |
| `seller` | `bg-emerald-50 text-emerald-700` |
| `dual` | `bg-purple-50 text-purple-700` |

### Summary Stats (calculated client-side)
- **Active deals count:** All deals NOT in `closed` or `fallen_through` stage
- **Total volume:** Sum of (sale_price or list_price) for active deals
- **Total commission:** Sum of (price * commission_rate / 100) for active deals, defaulting commission_rate to 3%

## Business Rules

- **Commission defaults to 3%** when `deal.commission_rate` is null -- this is a silent default in the `DealCard` component (line 33: `deal.commission_rate ?? 3`). El Paso typical range is 2-3.5%.
- **Price fallback:** Uses `sale_price` first, falls back to `list_price`, then 0.
- **Active deals:** Any deal NOT in `closed` or `fallen_through` stage.
- **Deal links to lead** -- All deal navigation goes to `/dashboard/leads/{deal.lead_id}`, not a separate deal detail page. Deals are always in the context of a lead.
- **Stage = "Under Contract" or "Closed"** -- Should cancel all drip sequence enrollments for the associated lead (business rule from CLAUDE.md, not yet enforced in Deals.tsx code).
- **Deal type determines Lorena's role** -- buyer (representing buyer), seller (representing seller), dual (representing both).

### El Paso Market Context
- **Median home price:** ~$230K
- **Range:** $120K (Central) to $600K+ (Upper Valley/Country Club)
- **Common deal types:** Single family primary (most common), VA loans (Fort Bliss), FHA (first-time buyers)
- **Commission rates:** Typically 2-3.5% per side in El Paso market

## Known Issues

1. **Commission rate defaults to 3% silently** -- The `DealCard` component (line 33) and summary calculation (line 224) use `deal.commission_rate ?? 3` without any UI indication. Lorena might not know what commission rate is being used for an estimate.
2. **No deal creation UI** -- There is a `useCreateDeal()` hook but NO "Add Deal" button or modal on the Deals page. The `Plus` icon is imported but never rendered in a button. Deals can only be created via direct Supabase inserts or seed data.
3. **No deal-to-lead validation** -- A deal can reference a `lead_id` that doesn't exist or has been deleted. No FK constraint validation in the UI.
4. **Duplicate rendering logic for mobile/desktop** -- The `ListView` component renders both a `md:hidden` mobile layout AND a `hidden md:grid` desktop layout for every deal row. This means the DOM has 2x the elements needed.
5. **No deal detail page** -- All deal cards link to the lead detail page (`/dashboard/leads/{deal.lead_id}`), not a dedicated deal detail page. There's no way to view deal-specific details like documents, timeline, or commission breakdown.
6. **`fallen_through` stage is NOT shown in kanban** -- The `activeStages` array (line 82) explicitly excludes `fallen_through`, but it exists as a valid `DealStage` type. Fallen-through deals are invisible in the kanban view.
7. **No realtime subscription** -- Unlike leads and messages, the Deals page has no `useRealtimeDeals()` subscription. Changes made externally won't reflect until a manual refresh or navigation.
8. **Search only works on address** -- Cannot search by client name, deal type, or stage in the search input.
9. **No filters beyond search** -- No dropdown filters for stage, deal type, or date range.
10. **Summary stats include closed deals from all time in list view** -- `allDealsList` on line 219 uses `allDeals ?? Object.values(dealsByStage ?? {}).flat()` which may include closed deals in the flat list, but the `activeDeals` filter on line 220 correctly excludes them.

## CINC Pro Comparison

### What CINC Has That We Don't
- **Deal creation flow** -- CINC has a proper "Create Deal" wizard with property selection, client association, and deal terms
- **Document uploads** -- CINC allows attaching contracts, disclosures, and inspection reports to deals
- **Timeline/milestone tracking** -- CINC shows key dates (inspection, appraisal, closing) with countdown timers
- **Stage duration alerts** -- CINC flags deals stuck in a stage too long
- **Commission splits** -- CINC handles commission splits between listing agent, buyer agent, and brokerage
- **Deal notes/activity log** -- CINC has a deal-specific activity log separate from the lead activity
- **Probability-weighted forecasting** -- CINC assigns close probability per stage for revenue forecasting
- **Closing countdown** -- CINC shows days until estimated close with visual progress bar

### What We Do BETTER Than CINC
- **Clean visual pipeline** -- Our kanban view with color-coded stage headers is more scannable than CINC's cluttered deal list
- **Volume and commission at a glance** -- Summary stats in the header give instant financial overview without drilling into reports
- **Deal type badges** -- Clear visual distinction between buyer/seller/dual deals
- **Mobile-friendly list view** -- Responsive layout that works well on phone. CINC's deal view is desktop-only
- **Empty state guidance** -- Branded empty states with helpful messaging vs CINC's generic "No records"

## Improvement Roadmap

### Priority 1 -- Critical
1. **Add Deal creation modal** -- Build `AddDealModal` with fields: lead selection (dropdown), property address, list price, sale price, commission rate, deal type (buyer/seller/dual), stage, estimated close date, notes. Wire to `useCreateDeal()`.
2. **Document uploads per deal** -- Use Supabase Storage to attach PDFs (contracts, disclosures, inspection reports). Show document list on a deal detail view.
3. **Deal detail page** -- Create `/dashboard/deals/:id` with: deal header, stage progress bar, key dates timeline, associated lead info, documents, notes, activity log.

### Priority 2 -- High Value
4. **Timeline/milestone tracking** -- Add key dates to the `deals` table: `inspection_date`, `appraisal_date`, `title_date`, `closing_date`. Show as a visual timeline on deal detail.
5. **Stage duration alerts** -- Calculate days in current stage. If > threshold (e.g., Pre-Listing > 14 days, Under Contract > 30 days), show warning badge.
6. **Commission rate display** -- Show the commission rate used in the estimate on each DealCard. Add an edit option.
7. **Commission splits** -- Add `agent_split_pct` and `brokerage_split_pct` fields. Show net commission to Lorena.
8. **Drag-and-drop kanban** -- Allow dragging deals between stage columns with optimistic stage update.
9. **Add realtime subscription** -- Create `useRealtimeDeals()` to subscribe to `deals` table changes.

### Priority 3 -- Polish
10. **Bulk stage moves** -- Select multiple deals and move them to a new stage at once.
11. **Deal filters** -- Add dropdown filters for stage, deal type, and date range.
12. **Search by client name** -- Extend search to query `leads.first_name` and `leads.last_name` in addition to `property_address`.
13. **Revenue forecast widget** -- Probability-weighted pipeline: Pre-Listing (10%), Active (25%), Under Contract (75%), Pending (90%), Closed (100%).
14. **Show `fallen_through` deals** -- Add an optional toggle to show fallen-through deals in the kanban, perhaps as a collapsed/muted column.
15. **Eliminate duplicate mobile/desktop DOM** -- Use responsive Tailwind classes on a single element instead of rendering two separate elements.
16. **Closing countdown** -- Show "X days until estimated close" on each deal card.

## Design System

### Colors Used
| Element | Class |
|---|---|
| Page title | `font-playfair text-2xl md:text-3xl font-bold text-dashboard-black` |
| Volume/commission in subtitle | `font-lato text-sm text-dashboard-secondary` |
| View toggle active | `bg-white text-dashboard-black shadow-sm` |
| View toggle inactive | `text-dashboard-secondary hover:text-dashboard-body` |
| Deal card | `bg-white rounded-lg border border-dashboard-border hover:border-dashboard-gold/40 hover:shadow-premium` |
| Deal price | `font-lato text-sm font-bold text-dashboard-black` |
| Deal commission | `font-lato text-xs font-medium text-dashboard-accent` |
| Address text | `font-lato text-xs text-dashboard-body` |
| Client name | `font-lato text-xs text-dashboard-body` |
| Close date | `font-lato text-[10px] text-dashboard-secondary` |
| Empty column | `border-2 border-dashed border-dashboard-border` |
| Search input focus | `focus:border-dashboard-gold/60 focus:ring-dashboard-gold/20` |

### Typography
| Context | Font/Class |
|---|---|
| Page title | `font-playfair text-2xl md:text-3xl font-bold` |
| Column headers | `font-lato text-xs font-bold uppercase tracking-wide` |
| Table headers | `font-lato text-xs font-bold text-dashboard-secondary uppercase tracking-wide` |
| Deal price | `font-lato text-sm font-bold` |
| Commission estimate | `font-lato text-xs font-medium` |

### Layout
- View toggle: `bg-dashboard-surface rounded-lg border border-dashboard-border p-0.5` segmented control
- Kanban: `flex gap-4 overflow-x-auto`, mobile uses `min-w-[280px]` columns, desktop uses `md:flex-1`
- List: `bg-white rounded-xl border`, desktop grid `grid-cols-[1fr_120px_100px_120px_100px_80px]`
- Search: `relative flex-1 max-w-sm` with icon overlay

### Currency Formatting
```typescript
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
```
Note: This is different from the Command Center's `formatCurrency` which uses shorthand ($350K, $1.2M). The Deals page always shows full dollar amounts.

## Verification Checklist

1. [ ] Page loads with skeleton cards during data fetch
2. [ ] Kanban view shows 5 stage columns (Pre-Listing through Closed) with correct colors
3. [ ] Empty stage columns show dashed border "No deals" placeholder
4. [ ] Deal cards show: deal type badge, price, address, client name, close date, commission estimate
5. [ ] Deal cards link to `/dashboard/leads/{lead_id}`
6. [ ] List view shows tabular layout on desktop with all columns
7. [ ] List view shows card layout on mobile (stacked)
8. [ ] Search filters deals by property address
9. [ ] Summary stats in header show correct active count, volume, and commission
10. [ ] Commission calculation uses `commission_rate` from deal, falling back to 3%
11. [ ] View toggle switches between Board and List views
12. [ ] Stage colors match the configured `stageConfig` map
13. [ ] Deal type badges use correct colors (buyer=blue, seller=green, dual=purple)
14. [ ] Currency formatting shows full dollar amounts (not shorthand)
15. [ ] Mobile kanban scrolls horizontally without breaking layout
16. [ ] Empty state shows when no deals exist
17. [ ] All text uses correct fonts (Playfair for title, Lato for everything else)
18. [ ] Gold accent used on search focus, card hover, and links
19. [ ] No TypeScript errors (`npm run type-check`)
20. [ ] No ESLint warnings (`npm run lint`)
