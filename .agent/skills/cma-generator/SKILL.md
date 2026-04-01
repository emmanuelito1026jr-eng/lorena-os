# CMA Generator Agent Skill

> Domain-specific knowledge for the CMA (Comparative Market Analysis) dashboard tab.
> Read this skill before modifying or building any CMA feature, comparable sales logic, or PDF generation.

---

## Purpose

60-second Comparative Market Analysis generator that lets Lorena create professional, branded CMA reports with comparable sales data and instant PDF export. This is one of the system's biggest competitive advantages over CINC — CINC has NO built-in CMA tool. Lorena currently has to use separate tools or manually compile data. Our wizard gives her a polished, client-ready report in under a minute.

---

## Files

- **Primary:** `pages/dashboard/CMA.tsx` (430 lines)
- **Hooks:**
  - `hooks/useCMAReports.ts` — `useCMAReports()`, `useCreateCMAReport()`
  - `hooks/useComparableSales.ts` — `useComparableSales(criteria)`, `useSaveComparableSales()`
- **Components:**
  - `components/dashboard/cma/CMAPdfDocument.tsx` (577 lines) — 4-page PDF document with @react-pdf/renderer
  - `components/dashboard/cma/CMAPdfButton.tsx` (35 lines) — PDFDownloadLink wrapper button
- **Shared:**
  - `components/shared/Skeleton.tsx` — `SkeletonList`
  - `components/shared/EmptyState.tsx`
  - `components/shared/Toast.tsx` — `showToast()`

---

## Data Sources

### Supabase Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `cma_reports` | Stored CMA reports | `id`, `agent_id`, `lead_id`, `address`, `status` ('generating'\|'complete'\|'error'), `estimated_value`, `report_data` (JSONB), `pdf_url`, `created_at` |
| `comparable_sales` | Saved comps linked to CMA reports | `cma_report_id`, `listing_id`, `address`, `sold_price`, `close_date`, `beds`, `baths`, `sqft`, `price_per_sqft`, `days_on_market`, `similarity_score`, `included_in_calc` |
| `listings` | MLS property data (source of comparable sales) | `status`, `zip_code`, `beds`, `sqft`, `year_built`, `sold_price`, `close_date`, `list_price`, `days_on_market` |

### Hook Details

| Hook | Query Key | What It Does |
|------|-----------|--------------|
| `useCMAReports()` | `['cma-reports']` | Fetches all CMA reports, sorted by created_at desc |
| `useCreateCMAReport()` | mutation, invalidates `['cma-reports']` | Inserts new report with `status: 'generating'` and basic `report_data` JSONB |
| `useComparableSales(criteria)` | `['comparable-sales', zip, beds, sqft]` | Queries sold listings matching criteria. 10 min staleTime. Enabled only when criteria is non-null. |
| `useSaveComparableSales()` | mutation, invalidates `['comparable-sales']` and `['cma-reports']` | Bulk-inserts comp rows linked to a CMA report |

---

## Current Features

### 3-Step Wizard Flow

#### Step 1: Input (default view)
- **Address field** — Text input with MapPin icon, placeholder: "Enter property address in El Paso, TX..."
- **Property details** — 4-column grid: Beds (number, 1-10), Baths (number, 1-10, step 0.5), SqFt (number, 200-20000, step 100), Year Built (number, 1900-current year)
- **Default values:** 3 beds, 2 baths, 1800 sqft, year 2000
- **Two buttons:**
  - "Generate CMA" (gold bg) — Creates a report record in Supabase (status: 'generating')
  - "Find Comparable Sales" (gold border/outline) — Triggers comp search and advances to Step 2

#### Step 2: Comparables
- **Comp search criteria extraction:**
  - ZIP code: regex extracted from address (`/\b\d{5}\b/`), fallback to `79912` if not found
  - Beds: user input value
  - SqFt: user input value
  - Year Built: user input value (optional filter)
- **Comparable filtering logic** (in `useComparableSales`):
  - Status: `sold` only
  - Same ZIP code as subject
  - Beds: subject +/- 1 (minimum 1)
  - SqFt: subject * 0.8 (or subject - 300, whichever is larger) to subject * 1.2
  - Year Built: subject +/- 15 years (only applied if yearBuilt provided)
  - Must have `sold_price` (not null)
  - Close date within last 6 months
  - Max 10 results, ordered by close_date desc
- **Comp table** — 7 columns: Include (checkbox), Address, Price, Bd/Ba, SqFt, $/SqFt, DOM
  - Selected rows highlighted with `bg-dashboard-gold/5`
  - Checkbox accent color: `#C9A84C`
- **Selection summary bar** — Shows count selected + estimated value preview
- **"View Results" button** — Advances to Step 3

#### Step 3: Result
- **Subject property summary** — Address, beds, baths, sqft, year built
- **Estimated Market Value** — Large gold number, centered
  - Calculation: avg $/sqft of selected comps * subject sqft
  - Range: +/- 5% of estimate
  - Shows comp count and avg $/sqft
- **Selected comps summary table** — Address, Sold Price, $/SqFt, Bd/Ba, SqFt
- **Download PDF button** — Lazy-loaded `CMAPdfButton` with Suspense fallback

### PDF Document (4 pages)
- **Page 1 — Cover:** Title "Comparative Market Analysis", client name, property address, date, agent info (Lorena Ontiveros-Ortega, (915) 500-0573, lorena@casasenelpasotx.com), optional agent photo, gold top bar
- **Page 2 — Subject Property:** Property details grid (6 cells: address, beds, baths, sqft, year, optional list price), estimated value box (gold border, light gold tint background), range, body text
- **Page 3 — Comps Table:** 8-column table (Address, Beds, Baths, SqFt, Sale Price, $/SqFt, Sold Date, DOM) with gold header, alternating row tint, summary row with averages
- **Page 4 — Market Snapshot:** 3 stat boxes (Avg Sale Price, Avg DOM, Avg $/SqFt), body text, disclaimer paragraph
- **PDF Fonts:** Playfair Display (headings, 400/700) + Lato (body, 400/700), registered from Google Fonts CDN
- **PDF Colors:** Gold `#C9A84C`, Near-black `#1a1a1a`, Gray `#666666`, Light gray `#888888`, Light gold tint `#FBF8F0`
- **Filename format:** `CMA-{sanitized-address}-{YYYY-MM-DD}.pdf`

### Previous Reports Section
- Shows all CMA reports from `useCMAReports()` below the wizard
- Cards display: address, generation date (MMM d, yyyy h:mm a), status badge, estimated value

---

## Business Rules

- CMA is agent-only (dashboard, not portal) — only authenticated agents can generate
- Reports are linked to `agent_id` from current auth user
- Optional `lead_id` parameter allows linking a CMA to a specific lead
- Comparable sales must be from the same ZIP code (strict geographic constraint)
- Only sold properties within 6 months qualify as comps
- Maximum 10 comparable sales returned per search
- Estimate uses simple $/sqft averaging — no distance weighting, no adjustment factors
- The +/- 5% range is hardcoded (not statistically derived)
- Lorena's agent info is hardcoded in the PDF data assembly (line 279-282)
- Client name defaults to "Valued Client" (no client selection yet)

---

## Known Issues

1. **CMA status stuck on 'generating'** — `useCreateCMAReport()` inserts with `status: 'generating'` and `report_data: { address, generated_at, note: 'Full CMA generation requires API integration' }`. There is NO code path that ever updates the status to `'complete'`. The report record serves as a placeholder only.
2. **No AI analysis** — Phase 3 TODO: Claude Sonnet should generate a narrative market analysis paragraph for the CMA. The `marketNotes` prop exists on `CMAPdfDocument` but is never passed real data.
3. **Hardcoded 79912 ZIP fallback** — If the address text doesn't contain a 5-digit ZIP code, the comp search defaults to ZIP `79912` (west El Paso). This could give completely wrong comps for other areas.
4. **Estimate not saved to database** — The calculated estimate (from Step 3) is never written back to the `cma_reports` row. The `estimated_value` column stays null for wizard-generated CMAs (only the "Generate CMA" button path creates a record, and it doesn't have an estimate).
5. **Two separate CMA creation paths** — "Generate CMA" creates a DB record without comps. "Find Comparable Sales" does a comp search without creating a DB record. These paths are disconnected.
6. **`useSaveComparableSales()` hook exists but is never called** — The hook in `useComparableSales.ts` can save selected comps to the `comparable_sales` table, but the CMA page never invokes it.
7. **No property photo in comps** — Comparable properties show no images in the table or PDF.
8. **PDF generation happens client-side** — `@react-pdf/renderer` is a large dependency (~1MB). It's lazy-loaded via `React.lazy()` which helps, but PDF generation blocks the main thread.
9. **No duplicate CMA prevention** — Same address can generate unlimited reports.
10. **Agent info hardcoded** — Lorena's name, phone, email are hardcoded in `CMA.tsx` line 279-282. Should pull from auth profile.

---

## CINC Pro Comparison

| Feature | CINC Pro | Our System |
|---------|----------|------------|
| Built-in CMA | **NO** — CINC has no CMA tool | Full 3-step wizard with comp filtering |
| PDF export | N/A | Professional 4-page branded PDF with Playfair Display typography |
| Comparable sales search | N/A | Filtered by ZIP, beds, sqft, year built, 6-month lookback |
| AI market narrative | N/A | Planned (Claude Sonnet) — not yet implemented |
| Client presentation | N/A | Branded cover page with agent photo, tagline |
| Report history | N/A | Full list of generated reports |

**This is a MASSIVE competitive advantage.** CINC agents have to use external CMA tools (RPR, CloudCMA, etc.) that cost extra and don't integrate. Our CMA uses the same MLS data already in the system and generates a polished PDF in seconds. When selling Lorena on the switch, lead with this.

---

## Improvement Roadmap

### Priority 1 — Critical Fixes
1. **Unify the two creation paths** — "Find Comparable Sales" should also create a DB record. When the user completes Step 3, save the estimate and comps to the database (call `useSaveComparableSales`).
2. **Fix status lifecycle** — After estimate is calculated and comps are saved, update report status to `'complete'` with the estimated_value.
3. **Pull agent info from profile** — Replace hardcoded Lorena data with `useAuth().profile` values (name, phone, email).
4. **Fix ZIP fallback** — Show a validation error if no ZIP is detected in the address, rather than silently defaulting to 79912.

### Priority 2 — AI Integration (Phase 3)
5. **Claude Sonnet AI narrative** — After comps are selected, send subject + comps to Claude API and get a 2-3 paragraph market analysis. Pass to `CMAPdfDocument` via `marketNotes` prop.
6. **AI-powered comp scoring** — Use similarity scoring (distance, age diff, size diff, condition adjustments) to rank comps beyond simple filtering.
7. **Auto-suggest adjustments** — AI recommends price adjustments for comp differences (e.g., pool +$10K, garage +$5K, newer by 10 years +$15K).

### Priority 3 — Feature Enhancements
8. **Manual price adjustments** — Let Lorena add/subtract value for specific features (pool, garage, lot size, condition) on each comp.
9. **Distance weighting** — Weight comps by geographic proximity to subject (closer = more weight).
10. **Property photos in comps** — Show listing images in the comp table and PDF.
11. **Client selection** — Dropdown to select a lead/client for the CMA. Auto-populate client name in PDF.
12. **Email to client** — One-click email the PDF to the client directly from the result page.
13. **Revision history** — Track multiple estimates for the same address over time.
14. **Signature fields** — Add digital signature area to the PDF for formal presentations.
15. **Comp map** — Show subject + comps on a map using PropertyMap component.

---

## Design System

### Colors Used on This Page
- **Gold:** `#C9A84C` (`bg-dashboard-gold`, `text-dashboard-gold`) — primary CTA, estimate value, selected comp highlight (`bg-dashboard-gold/5`), checkbox accent
- **Gold hover:** `#B8952F` — button hover state
- **Teal:** used in previous reports section for icon backgrounds (`bg-dashboard-teal/10`, `text-dashboard-teal`)
- **Surface:** `bg-dashboard-surface` — subject property summary background
- **Status badges:** green (`bg-green-50 text-green-700`) = complete, yellow (`bg-yellow-50 text-yellow-700`) = generating, blue (`bg-blue-50 text-blue-700`) for Market page variant

### Typography
- **Page title:** `font-playfair text-2xl md:text-3xl font-bold` — "CMA Generator"
- **Section headers:** `font-playfair text-lg font-bold`
- **Input labels:** `font-lato text-xs text-dashboard-secondary`
- **Table headers:** `font-lato text-xs text-dashboard-secondary uppercase`
- **Estimate value:** `font-playfair text-4xl font-bold text-dashboard-gold`
- **Range text:** `font-lato text-sm text-dashboard-secondary`

### Layout Patterns
- Wizard container: `bg-white rounded-xl border border-dashboard-border p-6 max-w-2xl`
- Input grid: `grid grid-cols-2 md:grid-cols-4 gap-3`
- All inputs: `min-h-[44px]` touch targets, gold focus ring (`focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20`)
- Buttons: `min-h-[44px]` with gold variants (filled and outline)
- Previous reports: `space-y-3` with individual card items

### PDF Design Tokens
- Gold top bar: 8px height across full page width
- Page footer: agent name, "Casas En El Paso TX", page number
- Section header: Playfair Display 18px bold + 50px gold underline (2px height)
- Estimate box: gold border, `#FBF8F0` background, Playfair Display 30px value
- Comps table header: gold background, white text, uppercase
- Alternating rows: `#FBF8F0` tint
- Disclaimer: 7px Lato, `#888888` color

---

## Verification Checklist

- [ ] Step 1 renders with all input fields and correct default values (3 bed, 2 bath, 1800 sqft, 2000 year)
- [ ] "Generate CMA" button creates a toast and clears the address field
- [ ] "Find Comparable Sales" button advances to Step 2 with comp results
- [ ] Comp table shows sold properties with correct columns and checkbox selection
- [ ] Selected comps are highlighted with gold tint
- [ ] Selection summary shows count and estimated value preview
- [ ] "View Results" button advances to Step 3 with calculated estimate
- [ ] Estimate shows large gold number with +/- 5% range
- [ ] "Download PDF" button generates and downloads a PDF file
- [ ] PDF has 4 pages with correct content on each page
- [ ] PDF fonts render correctly (Playfair Display headings, Lato body)
- [ ] "Back to Search" and "Back to Comps" navigation works correctly
- [ ] Previous Reports section shows stored CMA reports with status badges
- [ ] Empty state shows when no previous reports exist
- [ ] Mobile (375px): input grid stacks to 2 columns, comp table scrolls horizontally
- [ ] Desktop (1440px): full 4-column input grid, full table visible
- [ ] Loading states use SkeletonList (not blank, not spinner)
- [ ] All touch targets are 44px minimum height
