# HomePulse (Market) Agent Skill

> Domain-specific knowledge for the HomePulse market intelligence dashboard tab.
> Read this skill before modifying or building any market data visualization, MLS snapshot, or neighborhood analytics feature.

---

## Purpose

Real-time El Paso real estate market intelligence dashboard that gives Lorena a single-screen view of active listings, pricing trends, neighborhood breakdowns, and CMA report history. This is the data backbone that powers her seller conversations and listing presentations — she needs to open this on her phone and instantly know what the market is doing.

---

## Files

- **Primary:** `pages/dashboard/Market.tsx` (493 lines)
- **Hooks:**
  - `hooks/useMarketSnapshots.ts` — `useMarketSnapshot(area, areaType)`, `useMarketTrend(area, days)`, `useZipBreakdown()`
  - `hooks/useMarketData.ts` — `usePropertyStats()`, `useMarketSnapshots(area)`, `useHomepulseReports()`
  - `hooks/useListings.ts` — `useFeaturedListings(limit)`, `useMLSSyncStatus()`
  - `hooks/useCMAReports.ts` — `useCMAReports()`
- **Components:**
  - `components/shared/Skeleton.tsx` — `SkeletonCard`, `SkeletonStats`
  - `components/shared/EmptyState.tsx` — branded empty states with gold CTA
- **Related Pages:** `pages/dashboard/CMA.tsx` (linked via "Generate CMA" button)

---

## Data Sources

### Supabase Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `market_snapshots` | Daily market snapshots by area (city-level and ZIP-level) | `area`, `area_type` (city/zip), `snapshot_date`, `active_count`, `median_price`, `avg_dom`, `months_of_inventory`, `new_count_7d`, `pending_count`, `avg_price_per_sqft`, `absorption_rate`, `list_to_sold_ratio` |
| `listings` | MLS property data synced from Spark API (GEPAR) | `list_price`, `beds`, `baths`, `sqft`, `subdivision`, `property_type`, `status`, `days_on_market`, `zip_code`, `images`, `list_date`, `photo_count`, `is_lorenas_listing` |
| `cma_reports` | Generated CMA reports | `address`, `estimated_value`, `status`, `created_at`, `pdf_url` |

### External APIs

- **Spark API (GEPAR)** — MLS data source, Feed ID: `bs1gx50w59ms8w6qyza2tpmjl`
- Sync engine in `lib/mls/` (adapter, sparkApi, syncService)

### Hook Details

| Hook | Query Key | Stale Time | What It Returns |
|------|-----------|------------|-----------------|
| `useMarketSnapshot('El Paso', 'city')` | `['market-snapshot', area, areaType]` | 5 min | `{ current: MarketSnapshot, previous: MarketSnapshot (30d ago), hasTrend }` |
| `useMarketTrend('El Paso', 90)` | `['market-trend', area, days]` | 10 min | `MarketSnapshot[]` (sorted by date ascending, last 90 days) |
| `useZipBreakdown()` | `['market-zip-breakdown']` | 10 min | `MarketSnapshot[]` (latest date, area_type='zip', sorted by active_count desc) |
| `usePropertyStats()` | `['property-stats']` | default | `{ totalActive, avgPrice, avgDom, avgSqft, priceRanges[], byNeighborhood[], byType[] }` |
| `useFeaturedListings(10)` | `['featured-listings', limit]` | 5 min | `PropertyDisplayData[]` (prioritizes Lorena's listings with 5+ photos) |
| `useCMAReports()` | `['cma-reports']` | default | `CmaReport[]` (sorted by created_at desc) |

---

## Current Features

### Tab: Market Overview (default)

- **4 Stat Cards** — Active Listings (teal icon), Avg Price (gold icon), Avg Sq Ft (purple icon), Property Types count (blue icon)
- **Price Distribution Bar Chart** — Recharts `BarChart`, 5 ranges: Under $150K, $150K-$250K, $250K-$350K, $350K-$500K, Over $500K. Fill color: `#0D9488` (teal). CartesianGrid with `#E5E5E0` dashes.
- **Property Types Donut Chart** — Recharts `PieChart` with inner/outer radius (35/65), 6 chart colors: `['#0D9488', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981']`. Legend with color dots + count.
- **MLS Market Snapshot Grid** — 6 key stats: Active, Median Price, Avg DOM, Inventory (months), New (7d), Pending. Includes seller's/buyer's/balanced market badge based on months_of_inventory (<4 = Seller's, 4-6 = Balanced, >6 = Buyer's).
- **90-Day Market Trend ComposedChart** — Dual-axis: left Y = median price (gold line, `#C9A84C`), right Y = active listings (gray area, `#888` stroke, `#E5E5E0` fill at 30% opacity). X-axis shows MM-DD formatted dates.
- **Latest Listings Carousel** — Horizontal scrollable row of up to 10 listing cards (w-48 each) with image, price, beds/baths/address, days on market.

### Tab: Neighborhoods

- **ZIP Breakdown Table** — Columns: ZIP Code, Active count, Median price, $/SqFt, Avg DOM. Responsive: desktop shows 5-column grid, mobile shows simplified 2-column view. Max-height 300px with overflow scroll.
- **Neighborhood Table** — From `byNeighborhood` data (subdivision field). Columns: Neighborhood name (with MapPin icon), Avg Price, Listings count, Market Share (visual progress bar + percentage). Mobile/desktop responsive layouts.

### Tab: CMA Reports

- **Report Count** — "X reports generated" label
- **New CMA Button** — Links to `/dashboard/cma`
- **Report List** — Card per report with FileText icon, address, estimated value (gold), date (MMM d, yyyy), status badge (green=complete, blue=generating, red=error), PDF link if available.

---

## Business Rules

- Market snapshot data should refresh every 5-10 minutes (staleTime config)
- Months of inventory determines market type: <4 months = Seller's Market (red badge), 4-6 = Balanced (yellow badge), >6 = Buyer's Market (blue badge)
- Featured listings prioritize Lorena's own listings (`is_lorenas_listing` flag) and require 5+ photos
- MLS data must comply with GEPAR rules (see `lib/mls/compliance.ts`)
- GEPAR Rule 18.2.5: Data older than 12 hours should show staleness warning (useMLSSyncStatus hook exists but is NOT used on this page yet)
- Price formatting: $1M+ shows as "$X.XM", $1K+ shows as "$XXXK", under $1K shows as "$XXX"
- All chart tooltips use Lato font, 12px, rounded 8px border with `#E5E5E0`

---

## Known Issues

1. **Chart colors invisible on dark mode** — The 90-day trend chart uses `stroke="#888"` for the active listings area, which is invisible on dark backgrounds. The CartesianGrid uses `#E5E5E0` which is also invisible on dark mode. Need to use CSS variable-aware colors or conditional colors based on theme.
2. **No "data last synced" indicator** — There is no visible timestamp showing when MLS data was last synced. The `useMLSSyncStatus()` hook exists in `useListings.ts` but is not imported or used on the Market page. Users have no way to know if data is fresh.
3. **No GEPAR staleness warning** — Per GEPAR Rule 18.2.5, data older than 12 hours should show a warning banner. The `StaleDataBanner` component exists at `components/mls/StaleDataBanner.tsx` but is not rendered on this page.
4. **CMA status never transitions** — Reports created via `useCreateCMAReport` are always inserted with `status: 'generating'` and never updated to `'complete'`. There is no background process or edge function to transition the status.
5. **No trend arrows on stat cards** — The MLS Market Snapshot section fetches `previous` snapshot data for comparison but the code that renders trend arrows (ArrowUpRight, ArrowDownRight, Minus icons) is imported but never used.
6. **Empty state on Neighborhoods tab is fragile** — If `byNeighborhood` array is empty but `zipData` has data, the neighborhood table shows EmptyState while the ZIP table above it has data. This is confusing.
7. **Listing carousel links use `target="_blank"`** — Links open property detail in a new tab, breaking the SPA navigation flow. Should use `<Link>` from React Router.
8. **formatCurrency inconsistency** — The local `formatCurrency()` function differs from any global formatter. It rounds $150K-$999K to nearest $1K (no decimals) but shows $1M+ with 1 decimal.

---

## CINC Pro Comparison

| Feature | CINC Pro | Our System |
|---------|----------|------------|
| Market dashboard | Basic (limited to CINC's data feed) | Full MLS Spark API integration with GEPAR compliance |
| Price trend charts | Not available | 90-day ComposedChart with dual-axis (price + inventory) |
| Neighborhood breakdown | Not available | ZIP-level and subdivision-level tables with avg price, DOM, share |
| Market type indicator | Not available | Automatic seller's/balanced/buyer's market badge |
| CMA report history | No built-in CMA | Full CMA list with status, value, and PDF link |
| MLS data freshness | Unknown | Sync status tracking (needs to be surfaced in UI) |
| Listing feed | Limited to CINC website | Horizontal carousel of latest listings with images |

**We do BETTER:** Comprehensive market intelligence in a single screen. CINC has no equivalent market dashboard — agents have to use external MLS portals or third-party tools.

**We're MISSING:** Real-time market alerts (price drops, new listings matching criteria), neighborhood-level trend charts, export/share functionality.

---

## Improvement Roadmap

### Priority 1 — Critical Fixes
1. **Surface MLS sync status** — Import `useMLSSyncStatus()` and show "Last synced X hours ago" in the header. If stale (>12h), render `StaleDataBanner`.
2. **Fix dark mode chart colors** — Replace hardcoded stroke/fill colors with theme-aware values. Use `var(--chart-line)` or conditional colors from `useTheme()`.
3. **Fix CMA status lifecycle** — Either transition status to 'complete' after insert, or add a Supabase Edge Function / n8n workflow to process and update.
4. **Wire trend arrows** — Compare `current` vs `previous` snapshot values and show ArrowUpRight (green), ArrowDownRight (red), or Minus (gray) icons on MLS snapshot stats.

### Priority 2 — Feature Enhancements
5. **Market trend alerts** — Notify Lorena when median price changes >5% month-over-month, or when inventory drops below 3 months.
6. **Neighborhood price trend mini-charts** — Sparkline per neighborhood showing 30-day price direction.
7. **Absorption rate display** — Already in `market_snapshots` table, just not rendered.
8. **Sold-to-list ratio** — Already in `market_snapshots.list_to_sold_ratio`, not shown in UI.
9. **DOM by neighborhood** — Add average days-on-market column to the neighborhood table.
10. **PDF export** — "Download Market Report" button that generates a branded PDF summary.

### Priority 3 — Future Features
11. **Heatmap** — Interactive map with PropertyMap component showing price density by area.
12. **Inventory comparison** — Year-over-year inventory trends.
13. **Custom date range** — Allow selecting specific date ranges for trend analysis (currently hardcoded to 90 days).
14. **Market alerts configuration** — Let Lorena set thresholds for price/inventory alerts.
15. **Share with clients** — Generate a client-friendly market summary link for the portal.

---

## Design System

### Colors Used on This Page
- **Teal:** `#0D9488` (`text-dashboard-teal`, `bg-dashboard-teal`) — stat card icons, bar chart fills, neighborhood MapPin icons, progress bars
- **Gold:** `#C9A84C` (`text-dashboard-gold`, `bg-dashboard-gold`) — CTA buttons, trend line stroke, active tab, listing DOM text
- **Chart palette:** `['#0D9488', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981']` — pie chart cells
- **Surface:** `bg-dashboard-surface` — stat card backgrounds in MLS snapshot, tab background
- **Border:** `#E5E5E0` (`border-dashboard-border`) — card borders, grid lines, table dividers

### Typography
- **Page title:** `font-playfair text-2xl md:text-3xl font-bold` — "HomePulse"
- **Section headers:** `font-playfair text-lg font-bold` — chart titles
- **Stat labels:** `font-lato text-[11px] text-dashboard-secondary uppercase tracking-wide`
- **Stat values:** `font-playfair text-2xl font-bold`
- **Table cells:** `font-lato text-sm`
- **Chart ticks:** `fontSize: 11, fontFamily: 'Lato, sans-serif', fill: '#888888'`

### Layout Patterns
- Main container: `space-y-6`
- Stat cards: `grid grid-cols-2 md:grid-cols-4 gap-4`
- Chart row: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- MLS snapshot: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`
- Cards: `bg-white rounded-xl border border-dashboard-border p-4`
- Tab pills: `flex gap-1 bg-dashboard-surface rounded-lg p-1` with active state `bg-white shadow-sm`

### Chart Configuration
- All charts use `<ResponsiveContainer width="100%" height="100%">`
- Chart containers: `h-64` (256px)
- Tooltip style: `{ fontSize: '12px', fontFamily: 'Lato, sans-serif', borderRadius: '8px', border: '1px solid #E5E5E0' }`
- Grid: `strokeDasharray="3 3" stroke="#E5E5E0"`
- Axis lines: `axisLine={{ stroke: '#E5E5E0' }}` or `axisLine={false}`

---

## Verification Checklist

- [ ] Page loads with skeleton shimmer (not blank, not spinner) while data fetches
- [ ] All 4 stat cards show real data from `usePropertyStats()` or 0 if empty
- [ ] Price distribution bar chart renders with teal bars and correct range labels
- [ ] Property types donut chart renders with legend colors matching pie slices
- [ ] MLS Market Snapshot shows 6 stats and correct market type badge
- [ ] 90-Day trend chart renders with gold line (median) and gray area (active)
- [ ] Latest listings carousel scrolls horizontally and shows images
- [ ] Neighborhoods tab shows ZIP breakdown table with real data
- [ ] Neighborhoods tab shows subdivision table sorted by listing count
- [ ] CMA Reports tab shows previous reports with status badges
- [ ] "Generate CMA" button navigates to `/dashboard/cma`
- [ ] Mobile (375px): stat cards stack 2-wide, charts stack vertically, tables show simplified view
- [ ] Desktop (1440px): full layout with all columns visible
- [ ] Empty states show branded EmptyState component with MapPin icon
- [ ] Fonts: Playfair Display for titles and stat values, Lato for everything else
- [ ] Tab switching works correctly between Overview, Neighborhoods, and CMA Reports
