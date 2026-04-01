# Skill: MLS Specialist

> Spark API integration, MLS data pipeline, IDX compliance, and property display for GEPAR MLS.
> **Read before:** modifying any file in `lib/mls/`, `components/mls/`, MLS-related hooks, sync workflows, or property display components.

---

## Overview

The Casas En El Paso platform integrates with the Greater El Paso Association of REALTORS (GEPAR) MLS via the Spark API. Lorena's Spark API access is approved with IDX role permissions, allowing the platform to display active and pending listings to consumers on the public site and client portal.

The MLS pipeline has three layers: (1) the Spark API client that fetches raw listing data, (2) an adapter that transforms Spark responses into a consumer-safe display format, and (3) a sync service that upserts listings into Supabase on a 15-minute schedule via n8n. Compliance with GEPAR IDX rules is mandatory — every listing display must include proper attribution, and certain statuses (Closed, Expired, Withdrawn) must never appear on public-facing pages.

This is a server-side pipeline. The Spark API client (`sparkApi.ts`) must NEVER be imported in frontend code — API credentials would be exposed. Frontend components consume listings from Supabase via hooks (`useListings`, `useClientListings`).

---

## Key Files

| File | Purpose | Runtime |
|------|---------|---------|
| `lib/mls/sparkApi.ts` | Spark API client: fetch, paginate, transform to Supabase row shape | Server (n8n / Edge Functions) |
| `lib/mls/adapter.ts` | Transform Supabase rows to consumer-safe `PropertyDisplayData` | Frontend |
| `lib/mls/syncService.ts` | Incremental sync engine, price/status change tracking, alerts | Server (n8n) |
| `lib/mls/compliance.ts` | GEPAR IDX compliance: displayable status check, disclaimer text | Frontend + Server |
| `lib/mls/types.ts` | TypeScript interfaces: `MLSListing`, `PropertyDisplayData`, `PropertyFilters` | Shared |
| `components/mls/PropertyCard.tsx` | Listing card with photo, price, address, beds/baths/sqft, attribution | Frontend |
| `components/mls/PropertyMap.tsx` | Leaflet map with listing markers | Frontend |
| `components/mls/IDXCompliance.tsx` | GEPAR disclaimer footer component | Frontend |
| `components/mls/ListingAttribution.tsx` | Per-listing "Listed by" attribution line | Frontend |
| `components/mls/StaleDataBanner.tsx` | Warning banner when data is >24h old | Frontend |
| `hooks/useListings.ts` | Fetch listings from Supabase with filters, pagination | Frontend |
| `hooks/useMarketData.ts` | Market snapshots, trends, neighborhood stats | Frontend |
| `hooks/useComparableSales.ts` | CMA comparables query | Frontend |
| `scripts/pull-mls.mjs` | Manual one-off MLS pull script | CLI |
| `scripts/gen-snapshots.mjs` | Generate market snapshot data | CLI |

---

## Spark API Credentials

| Field | Value |
|-------|-------|
| Feed ID | `bslgx50w59ms8w6qyza2tpmjl` |
| Account | Lorena Ontiveros-Ortega (`gep.8809`) |
| MLS | Greater El Paso Association of REALTORS (GEPAR) |
| Role | IDX |
| Base URL | `https://sparkapi.com/v1` |
| Auth Header | `Authorization: OAuth <SPARK_API_TOKEN>` |
| User-Agent | `LorenaRealtorOS/1.0` |
| Rate Limit | 1,500 requests per 5-minute window |
| Token Env Var | `SPARK_API_TOKEN` |

### Rate Limiting
- The client respects rate limits with configurable `pageDelay` (default 200ms between paginated requests)
- On HTTP 429, the client waits 60 seconds and retries automatically
- Pagination: 200 results per page, ordered by `ModificationTimestamp asc`

---

## Data Pipeline

### Sync Flow
```
Spark API (every 15 min)
  |
  v
fetchModifiedListings(sinceTimestamp)
  |
  v
transformSparkToSupabase(sparkListing) — for each listing
  |
  v
upsertListing(supabase, transformed)
  |-- New listing? → INSERT + log initial price/status + alert
  |-- Price changed? → UPDATE + log to listing_price_history + alert
  |-- Status changed? → UPDATE + log to listing_status_history + alert
  |-- No change? → UPDATE last_synced_at only
  |
  v
completeSyncRecord(supabase, result) — update mls_sync_metadata
```

### Supabase Tables

| Table | Purpose |
|-------|---------|
| `listings` | All MLS listings (upserted on `spark_id`) |
| `listing_price_history` | Price change audit trail |
| `listing_status_history` | Status change audit trail |
| `mls_sync_metadata` | Sync run logs (started_at, completed_at, counts, errors) |
| `market_snapshots` | Daily market stats (city-wide + per-zip) |
| `favorites` | Client saved listings (lead_id + property_id) |
| `saved_searches` | Client saved search criteria with alert toggles |

### Key Columns in `listings`

| Column | Type | Notes |
|--------|------|-------|
| `spark_id` | TEXT UNIQUE | Spark API resource ID (primary upsert key) |
| `mls_id` | TEXT | MLS listing number (display to users) |
| `status` | TEXT | Mapped: active, pending, sold, withdrawn, expired, canceled |
| `is_lorenas_listing` | BOOLEAN | True if agent name contains "Ontiveros" or "Lorena" |
| `photos` | JSONB | Array of `{ url, thumb, large, caption, primary, order }` |
| `raw_spark_data` | JSONB | Full Spark response (NEVER exposed to frontend) |
| `display_compliance` | JSONB | Spark display compliance flags (NEVER exposed to frontend) |
| `last_synced_at` | TIMESTAMPTZ | Last successful sync timestamp |

---

## Adapter Layer

The adapter (`lib/mls/adapter.ts`) is the boundary between database rows and frontend components.

### Safe Fields Selection
```typescript
// LISTING_PUBLIC_FIELDS — explicitly excludes raw_spark_data and display_compliance
export const LISTING_PUBLIC_FIELDS = `id, spark_id, mls_id, address, ...`;
```

### Sanitization Rules
1. **Never expose `raw_spark_data`** — deleted before frontend use
2. **Never expose `display_compliance`** — deleted before frontend use
3. **Strip phone numbers** from `public_remarks` and `description` (GEPAR compliance)
4. **Strip email addresses** from `public_remarks` and `description` (GEPAR compliance)
5. **Map status codes** to consumer-friendly labels: `active` -> "For Sale", `pending` -> "Pending", `sold` -> "Sold"

### Transform Function
```typescript
transformListingToDisplay(row: ListingRow): PropertyDisplayData
// Converts a Supabase row into the consumer-safe type that all components consume.
// Handles: photo JSONB parsing, feature array merging, null coalescing, sanitization.
```

---

## GEPAR IDX Compliance

### Displayable Statuses (Public IDX)
- **Allowed:** Active, Pending
- **Prohibited:** Closed, Expired, Withdrawn, Canceled
- Closed data may ONLY appear in the private agent dashboard (CMA tool, market stats)

### Required Attribution
Every listing display MUST include:
1. **Listing office name** — "Listed by [Office Name]"
2. **Listing agent name** — visible on detail pages
3. **MLS disclaimer** — GEPAR copyright + non-commercial use notice

### Opt-Out Flags
Respect these Spark API flags:
- `InternetEntireListingDisplay: false` — Do NOT display the listing at all
- `InternetAddressDisplay: false` — Do NOT show the address (show "Address Withheld")
- `VOWAddressDisplay: false` — Same as above for Virtual Office Website context

### Disclaimer Text
```
Full: "Based on information from the Greater El Paso Association of REALTORS MLS. IDX information is provided exclusively for consumers' personal, non-commercial use, and may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing. Information Is Believed To Be Accurate But Not Guaranteed. Copyright 2026 Greater El Paso Association of Realtors Multiple Listing Service. All Rights Reserved."

Compact: "Based on information from the Greater El Paso Association of REALTORS MLS. Information deemed reliable but not guaranteed."
```

### Compliance Component Placement
- **IDXCompliance** footer: on every page that displays MLS data (search results, property detail, favorites)
- **ListingAttribution**: on every PropertyCard and property detail page
- **StaleDataBanner**: shown when `last_synced_at` for any displayed listing is older than 24 hours

---

## Stale Data Handling

When the MLS sync has not run in over 24 hours:
1. `StaleDataBanner` appears at the top of property-related pages
2. Banner shows: "Listing data may be outdated. Last updated: [timestamp]"
3. The `getLastRefreshTimeFormatted()` helper reads from localStorage
4. Never show stale data without the warning — compliance risk

---

## n8n Sync Workflow (LOS-26)

| Aspect | Detail |
|--------|--------|
| Workflow | `LOS-26: MLS Sync Engine` |
| Schedule | Every 15 minutes |
| Logic | Calls `runIncrementalSync()` from `syncService.ts` |
| Outputs | Sync metadata logged, alerts dispatched for new/price/status changes |
| Error handling | Failed syncs marked in `mls_sync_metadata`, retried next cycle |

---

## Market Snapshots

Generated daily by `scripts/gen-snapshots.mjs` or n8n workflow:

- **City-wide snapshot:** Active count, new 7d/30d, pending, sold 30d/90d, median price, avg price, avg DOM, months of inventory
- **Per-zip snapshots:** Same metrics grouped by `zip_code`
- **Trends:** 30-day price trend (up/down/flat), inventory trend (increasing/decreasing/stable)
- Stored in `market_snapshots` table with unique constraint on `(area, area_type, snapshot_date)`

---

## Property Type Mapping

Spark API uses letter codes that map to readable types:

| Spark Code | Local Type |
|------------|-----------|
| A | single_family |
| B | commercial |
| C | land |
| D | multi_family |
| E | condo |
| (other) | other |

---

## Lorena Detection

The `isLorenas()` function flags listings where Lorena is the listing agent:
```typescript
function isLorenas(agentName: string | null | undefined): boolean {
  if (!agentName) return false;
  const name = agentName.toLowerCase();
  return name.includes('ontiveros') || name.includes('lorena');
}
```
Lorena's listings get `is_lorenas_listing: true` — used to highlight "My Listings" in the dashboard.

---

## Verification Checklist

Before marking any MLS task complete:

- [ ] Spark API token never appears in frontend code (server-side only)
- [ ] `raw_spark_data` and `display_compliance` stripped from all frontend-consumed data
- [ ] Phone numbers and emails sanitized from public remarks
- [ ] Only Active and Pending listings shown on public/portal pages
- [ ] IDXCompliance footer present on all listing display pages
- [ ] ListingAttribution present on every PropertyCard
- [ ] StaleDataBanner appears when data is >24h old
- [ ] Opt-out flags respected (`InternetEntireListingDisplay`, `InternetAddressDisplay`)
- [ ] Photos render correctly (JSONB parsing handles string, array, and null cases)
- [ ] Status labels are consumer-friendly ("For Sale", not "active")
- [ ] Lorena's listings correctly flagged via `isLorenas()`
- [ ] Market snapshots use `ON CONFLICT` upsert (no duplicates)

---

## Common Mistakes

1. **Importing `sparkApi.ts` in frontend code** — This file uses `process.env.SPARK_API_TOKEN`. It runs in n8n/Edge Functions only. Frontend gets data from Supabase via hooks.
2. **Showing Closed/Expired listings on public pages** — Only Active and Pending are IDX-legal for consumer display. Closed data is for CMA/dashboard only.
3. **Missing attribution** — Every listing display needs "Listed by [Office Name]". GEPAR can revoke IDX access for non-compliance.
4. **Not handling photo JSONB variations** — The `photos` column can be a JSON string, a parsed array, or contain null entries. The adapter handles all cases — always use `transformListingToDisplay()`.
5. **Exposing raw Spark data** — Never send `raw_spark_data` to the frontend. Always use `sanitizeForPublicDisplay()` or `LISTING_PUBLIC_FIELDS` select.
6. **Ignoring rate limits** — The Spark API allows 1,500 requests per 5-minute window. Aggressive polling or unbounded pagination will trigger 429s.
7. **Breaking the upsert key** — Listings upsert on `spark_id`. If you change the column name or constraint, the entire sync pipeline breaks.
8. **Not logging price/status changes** — The sync service tracks all price and status changes to `listing_price_history` and `listing_status_history`. Skipping this breaks CMA comparables and market analysis.
9. **Hardcoding El Paso assumptions** — While this is an El Paso MLS, the code should handle edge cases (missing city, missing zip) gracefully with fallback defaults.
10. **Forgetting market snapshot deduplication** — Snapshots have a unique constraint on `(area, area_type, snapshot_date)`. Always use `ON CONFLICT DO UPDATE`.
