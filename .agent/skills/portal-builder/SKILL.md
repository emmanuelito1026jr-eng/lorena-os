# Skill: Portal Builder

> Client portal specification — the concierge experience that replaces CINC's Etta app.
> **Read before:** building or modifying any `/portal/*` route, portal layout, portal hooks, or client-facing portal components.

---

## Overview

The client portal is the buyer/seller-facing section of the Casas En El Paso platform. It lives at `/portal/*` and is gated by `PortalRoute` (requires Supabase auth + `role='client'`). The portal replaces CINC's Etta app, which most of Lorena's clients ignore because it is clunky and impersonal.

The portal must feel like a premium concierge experience — not a CRM. Clients open it on their phones at the kitchen table. Every screen must load instantly, show exactly what matters, and require zero training. If a client has to think about how to use it, we failed.

The portal shares the same design system as the agent dashboard (gold accent, Playfair Display headlines, Lato body, skeleton loading, branded empty states) but has its own layout (`PortalLayout`), its own bottom nav, and its own set of hooks (`hooks/portal/`). All client-facing text must be bilingual via `useTranslation()`.

---

## Key Files

| File | Purpose |
|------|---------|
| `components/portal/PortalLayout.tsx` | Shell layout: sidebar (desktop), bottom nav (mobile), top bar, Outlet |
| `pages/portal/PortalHome.tsx` | Dashboard: greeting, stat cards, transaction tracker, quick actions, saved homes preview |
| `pages/portal/PropertySearch.tsx` | MLS property search with filters, map, grid/list toggle |
| `pages/portal/SavedHomes.tsx` | Favorited listings grid with remove/alert toggle |
| `pages/portal/ClientMessages.tsx` | Thread with Lorena (real-time via Supabase Realtime) |
| `pages/portal/MyShowings.tsx` | Upcoming + past showings, request new showing |
| `pages/portal/HomeValueEstimate.tsx` | Address input, instant home value estimate (comps-based) |
| `pages/portal/MortgageCalculator.tsx` | Interactive mortgage/affordability calculator |
| `pages/portal/ClientProfile.tsx` | Name, email, phone, language preference, notification settings |
| `pages/portal/TransactionTracker.tsx` | Deal stage pipeline, documents, milestones, closing countdown |
| `pages/portal/PortalLogin.tsx` | Client-specific login page (styled for portal, not agent dashboard) |
| `hooks/portal/useClientListings.ts` | Favorites, saved searches, search alert toggles |
| `hooks/portal/useClientMessages.ts` | Message thread with Lorena, unread count |
| `hooks/portal/useClientNotifications.ts` | Bell notifications, unread count |
| `hooks/portal/useClientProfile.ts` | Profile data, lead record lookup |
| `hooks/portal/useClientShowings.ts` | Showings list, request mutation |
| `hooks/portal/useClientTransaction.ts` | Active deal, stage progression, documents |

---

## Portal Layout

### Desktop (>= 1024px / `lg:`)
- **Sidebar:** 240px fixed left, black background (`bg-dashboard-black`)
- **Logo:** "Casas En El Paso" in Playfair Display, subtitle "Client Portal"
- **Nav items:** All 9 routes listed vertically with Lucide icons
- **Bottom section:** Profile name, theme toggle, sign out
- **Main content:** Scrolls independently, `lg:ml-60`, max-w-7xl centered

### Mobile (< 1024px)
- **Top bar:** Sticky, brand name left, bell icon right with unread badge
- **Bottom nav:** 5 slots — Home, Search, Favorites, Messages, More
- **More menu:** Flyout panel above bottom nav with remaining routes + sign out
- **Touch targets:** 44px minimum everywhere (`min-h-[44px]`, `min-w-[56px]`)
- **Content:** `pb-20` to account for bottom nav height

### Navigation Structure

| Bottom Nav Slot | Route | Icon | i18n Key |
|-----------------|-------|------|----------|
| Home | `/portal` | LayoutDashboard | `portal.nav.home` |
| Search | `/portal/search` | Search | `portal.nav.search` |
| Favorites | `/portal/favorites` | Heart | `portal.nav.favorites` |
| Messages | `/portal/messages` | MessageSquare | `portal.nav.messages` |
| More | (flyout) | Menu | `portal.nav.more` |

| More Menu Item | Route | Icon | i18n Key |
|----------------|-------|------|----------|
| Transaction | `/portal/transaction` | ClipboardList | `portal.nav.transaction` |
| Showings | `/portal/showings` | Calendar | `portal.nav.showings` |
| Home Value | `/portal/home-value` | TrendingUp | `portal.nav.homeValue` |
| Calculator | `/portal/calculator` | Calculator | `portal.nav.calculator` |
| Profile | `/portal/profile` | User | `portal.nav.profile` |

---

## Screen Specifications

### 1. PortalHome (`/portal`)

**Data sources:** `useClientProfile`, `useClientLeadRecord`, `useClientFavorites`, `useClientShowings`, `useClientUnreadCount`, `useClientTransaction`

**Layout:**
- Welcome card: time-of-day greeting + first name + today's date
- Transaction tracker (if active deal): stage pipeline with gold/green indicators
- Stat cards (3-col grid): Saved homes count, upcoming showings count, unread messages
- Quick actions (3-col): Browse Homes, Message Lorena, Home Value
- Saved homes preview: first 3 favorites with photo, price, address, beds/baths/sqft
- Start journey CTA (if no deal and no lead record): gold gradient card with Browse Homes button

**Loading state:** Skeleton pulse for welcome, `SkeletonStats` count=3, `SkeletonCard`

### 2. PropertySearch (`/portal/search`)

**Data sources:** `useListings` (shared hook with public site), `useClientSavedSearches`, `useSaveSearch`

**Layout:**
- Search bar with text input
- Filter row: price range, beds, baths, property type, neighborhood
- Results: grid (mobile 1-col, tablet 2-col, desktop 3-col) of PropertyCard components
- Map toggle: switch between grid and Leaflet map view
- Save search: button to save current filters as a named saved search with alert toggle
- IDX compliance: attribution footer on every search results page

**Empty state:** "No homes match your search" with gold accent, suggest broadening filters

### 3. SavedHomes (`/portal/favorites`)

**Data sources:** `useClientFavorites`, `useToggleFavorite`

**Layout:**
- Grid of favorited listings (same PropertyCard as search)
- Heart icon on each card to unfavorite
- Saved searches list with alert on/off toggles

**Empty state:** "No saved homes yet" with heart icon, CTA to browse homes

### 4. ClientMessages (`/portal/messages`)

**Data sources:** `useClientMessages`, `useClientUnreadCount`

**Layout:**
- Single thread with Lorena (no multi-thread — clients message only their agent)
- Messages displayed chronologically, newest at bottom
- Input bar fixed at bottom with send button
- Real-time updates via Supabase Realtime subscription
- Unread badge on bottom nav tab

**Empty state:** "Start a conversation" with message icon, pre-fill suggestion bubbles

### 5. MyShowings (`/portal/showings`)

**Data sources:** `useClientShowings`

**Layout:**
- Upcoming showings: cards with date/time, address, status (confirmed/pending/cancelled)
- Past showings: collapsed section
- Request showing: button opens modal with property selector + preferred date/time

**Empty state:** "No showings scheduled" with calendar icon, CTA to browse homes

### 6. HomeValueEstimate (`/portal/home-value`)

**Data sources:** Supabase `listings` (comparables query)

**Layout:**
- Address input with autocomplete
- Results: estimated value range (low/mid/high), comparable sales grid (3-5 comps)
- Each comp shows: address, sold price, sold date, beds/baths/sqft, distance

**Empty state:** Address input form with explanatory text

### 7. MortgageCalculator (`/portal/calculator`)

**Data sources:** Client-side calculation (no API needed)

**Layout:**
- Inputs: home price, down payment ($ and %), interest rate, loan term (15/30), property tax, HOA, insurance
- Live calculation: monthly payment breakdown (principal+interest, tax, insurance, HOA)
- Pie chart: payment breakdown visualization
- Affordability note: what income is needed for this payment (28% rule)

### 8. ClientProfile (`/portal/profile`)

**Data sources:** `useClientProfile`

**Layout:**
- Editable fields: full name, email, phone, preferred language (EN/ES toggle)
- Notification preferences: email alerts, SMS alerts, property alert frequency
- Password change (via Supabase Auth)
- Sign out button

### 9. TransactionTracker (`/portal/transaction`)

**Data sources:** `useClientTransaction`

**Layout:**
- Stage pipeline: visual progress bar through deal stages (Offer Submitted, Under Contract, Inspection, Appraisal, Clear to Close, Closing Day)
- Current stage highlighted in gold, completed in green, future in gray
- Stage details: what's happening now, what's next, estimated dates
- Documents section: uploaded docs with download links
- Closing countdown: days remaining to close

**Empty state:** "No active transaction" with CTA to contact Lorena

### 10. PortalLogin (`/portal/login`)

**Data sources:** Supabase Auth

**Layout:**
- Email + password login form
- "Forgot password" link
- Portal-branded header (not agent dashboard branding)
- After login: redirect to `/portal`

---

## Portal vs. Dashboard

| Aspect | Portal (`/portal/*`) | Dashboard (`/dashboard/*`) |
|--------|---------------------|---------------------------|
| Audience | Clients (buyers/sellers) | Lorena (agent) |
| Auth role | `role='client'` | `role='agent'` |
| Route guard | `PortalRoute` | `ProtectedRoute` |
| Layout | `PortalLayout` | `DashboardLayout` |
| Hooks | `hooks/portal/useClient*` | `hooks/use*` (25 hooks) |
| Bilingual | REQUIRED on all text | English only (Lorena preference) |
| Data access | Own data only (RLS) | All leads, all data |
| Complexity | Zero learning curve | Power user features OK |

---

## UX Principles

1. **"7 AM phone check" test** — Can a client open this on their phone at 7 AM and instantly see what matters? If not, simplify.
2. **Premium concierge feel** — This is Lorena's brand extension. It should feel like having a personal real estate concierge, not using a CRM.
3. **2-click rule** — Any action should take at most 2 taps from the home screen.
4. **Push usage via SMS** — SMS alerts ("New listing in your search!") link directly into portal pages. This drives adoption.
5. **No dead ends** — Every empty state has a CTA that leads somewhere useful.
6. **Real-time everything** — Messages, showings, and transaction updates appear instantly via Supabase Realtime.

---

## Data Patterns

### Lead-Client Mapping
- Client auth user (`auth.users`) links to `profiles` table (role='client')
- `profiles.id` maps to `leads.user_id` to find the client's lead record
- All portal queries filter by the client's lead ID
- RLS policies enforce: clients can only read/write their own data

### Hook Pattern
```tsx
// All portal hooks follow this pattern:
const { data: lead } = useClientLeadRecord(); // Get lead from profile
const { data, isLoading } = useQuery({
  queryKey: ['client-something', lead?.id],
  queryFn: async () => {
    if (!lead) return [];
    const { data } = await supabase
      .from('table')
      .select('*')
      .eq('lead_id', lead.id);
    return data ?? [];
  },
  enabled: !!lead, // Only run when lead is resolved
});
```

### Bilingual Pattern
```tsx
const { t } = useTranslation();
// All visible text uses t() with keys from lib/i18n/messages/
<h1>{t('portal.home.goodMorning')}, {firstName}</h1>
```

---

## Dark Mode

The portal uses the same dark mode system as the dashboard:
- CSS variable overrides via `[data-theme="dark"]` in `index.css`
- Toggle in sidebar footer (desktop) and profile page
- `useTheme()` hook manages state, persists to localStorage
- Gold (#C9A84C) stays the same in both themes — it looks stunning on dark backgrounds

---

## Verification Checklist

Before marking any portal task complete:

- [ ] Route is gated by `PortalRoute` (auth + client role required)
- [ ] All text uses `t()` from `useTranslation()` (bilingual required)
- [ ] Skeleton loading state (never blank, never spinner)
- [ ] Branded empty state with gold accent and CTA
- [ ] Mobile layout correct at 375px with bottom nav visible
- [ ] Desktop layout correct at 1440px with sidebar visible
- [ ] 44px minimum touch targets on all interactive elements
- [ ] Fonts correct: Playfair Display headings, Lato body
- [ ] Gold accent used correctly for CTAs, active states, borders
- [ ] Dark mode renders properly (toggle and verify)
- [ ] No agent-only data leaking to client view (RLS enforced)
- [ ] No framework branding visible anywhere

---

## Common Mistakes

1. **Using dashboard hooks in portal pages** — Portal hooks (`hooks/portal/useClient*`) enforce RLS scoping. Never use `useLeads` or `useMessages` from the main hooks in portal pages.
2. **Forgetting bilingual text** — Every visible string must use `t()`. Hardcoded English strings in portal pages are bugs.
3. **Skipping the lead record lookup** — Portal data flows through the lead record. If `useClientLeadRecord()` returns null, the page should show an appropriate empty/loading state, not crash.
4. **Breaking bottom nav on mobile** — The bottom nav must always be visible on mobile portal pages. Check that `pb-20` is on main content to prevent overlap.
5. **Exposing agent data** — Portal pages must never show lead scores, internal notes, pipeline stages from the agent perspective, or other leads' data.
6. **Missing IDX compliance** — Property search and listing display must include GEPAR attribution text.
7. **Not testing the More menu** — The flyout More menu on mobile is easy to break. Test it opens, closes, and navigates correctly.
8. **Ignoring real-time** — Messages and notifications must update in real-time. If you see stale data after sending a message, the Realtime subscription is broken.
9. **Heavy images without lazy loading** — Property images in search/favorites should use `loading="lazy"` to avoid slow initial loads.
10. **Forgetting PortalLogin vs Login** — The portal has its own login page (`/portal/login`) styled for clients. Do not redirect clients to the agent login at `/login`.
