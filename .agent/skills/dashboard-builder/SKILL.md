---
name: dashboard-builder
description: Specification for all 11 dashboard screens and 9 modals. Read this before any dashboard page work.
---

# Dashboard Builder

> Read this skill before modifying or creating any dashboard screen.
> All dashboard pages are lazy-loaded via `React.lazy()` in `App.tsx`.
> All dashboard routes are wrapped in `ProtectedRoute` and rendered inside `DashboardLayout`.

---

## Layout Architecture

### DashboardLayout (`components/dashboard/DashboardLayout.tsx`)
- Wraps all `/dashboard/*` routes
- Renders Sidebar (desktop) + BottomNav (mobile) + content area
- Content area uses `<Outlet />` from React Router

### Sidebar (`components/dashboard/Sidebar.tsx`)
- Desktop only (hidden on mobile)
- 240px fixed width, collapsible
- Logo at top, nav links, user profile at bottom
- Gold accent on active link

### BottomNav (`components/dashboard/BottomNav.tsx`)
- Mobile only (hidden on desktop)
- 5 tabs: Home, Leads, Messages, Showings, More
- 44px min touch targets, gold active indicator

---

## Route Map

All routes are under `/dashboard` and wrapped in `ProtectedRoute`:

| Route | Page Component | File |
|-------|---------------|------|
| `/dashboard` | DashboardHome | `pages/dashboard/DashboardHome.tsx` |
| `/dashboard/leads` | Leads | `pages/dashboard/Leads.tsx` |
| `/dashboard/leads/:id` | LeadDetail | `pages/dashboard/LeadDetail.tsx` |
| `/dashboard/deals` | Deals | `pages/dashboard/Deals.tsx` |
| `/dashboard/messages` | Messages | `pages/dashboard/Messages.tsx` |
| `/dashboard/showings` | Showings | `pages/dashboard/Showings.tsx` |
| `/dashboard/market` | Market | `pages/dashboard/Market.tsx` |
| `/dashboard/cma` | CMA | `pages/dashboard/CMA.tsx` |
| `/dashboard/autotracks` | AutoTracks | `pages/dashboard/AutoTracks.tsx` |
| `/dashboard/analytics` | Analytics | `pages/dashboard/Analytics.tsx` |
| `/dashboard/settings` | DashboardSettings | `pages/dashboard/DashboardSettings.tsx` |

---

## Screen Specifications

### 1. DashboardHome — AI Command Center
**Hook:** `useDashboardStats`
**Elements:**
- Stat cards: Active Leads, Showings This Week, Deals In Progress, Unread Messages
- Hot leads list (score >= 80) with LeadScoreBadge
- Today's showings
- Recent activity feed
- AI Daily Briefing card (Phase 3 — TODO: Claude Sonnet analysis)

### 2. Leads — Smart Lead Pipeline
**Hook:** `useLeads`
**Elements:**
- Search + filter bar (source, status, score range, date)
- Lead list with LeadScoreBadge, contact info, last activity
- Sort by: score (desc), name, date added, last active
- Bulk actions: assign tag, enroll in sequence
**Modals:** AddLeadModal, ImportLeadsModal

### 3. LeadDetail — Lead Deep Dive (7 tabs)
**Hook:** `useLeads` (single lead), `useMessages`, `useShowings`, `useDeals`
**Tabs:**
1. Overview — contact info, score breakdown, timeline
2. Activity — full behavioral activity log
3. Messages — conversation history (SMS, email, chat)
4. Showings — past and upcoming showings
5. Properties — viewed/favorited properties
6. Deals — associated transactions
7. Notes — agent notes and reminders

### 4. Deals — Transaction Pipeline
**Hook:** `useDeals`
**Elements:**
- Pipeline stages: New, Under Contract, Inspection, Appraisal, Clear to Close, Closed
- Deal cards with property info, lead info, stage, checklists
- Stage transition via drag or dropdown

### 5. Messages — Communication Hub
**Hook:** `useMessages`
**Elements:**
- Split-pane: conversation list (left), message thread (right)
- Channel filter: All, SMS, Email, Chat
- Compose new message
- Real-time updates via Supabase realtime

### 6. Showings — Calendar View
**Hook:** `useShowings`
**Elements:**
- Calendar view (week/day toggle)
- Showing cards with lead name, property, time, status
- Quick-add showing
**Modal:** AddShowingModal

### 7. Market — Market Intelligence
**Hooks:** `useMarketSnapshots`, `useMarketData`
**Elements:**
- City-level stats: median price, active count, days on market
- Trend charts (90-day line charts via Recharts)
- Zip-level breakdown table
- Price range distribution

### 8. CMA — Comparative Market Analysis Wizard
**Hooks:** `useCMAReports`, `useComparableSales`
**Elements:**
- Step wizard: Subject Property → Comparables → Adjustments → Report
- PDF generation (`components/dashboard/cma/CMAPdfDocument.tsx`, `CMAPdfButton.tsx`)
- AI analysis card (Phase 3 — TODO: Claude Sonnet endpoint)
**Current State:** Wizard UI DONE, PDF DONE, AI analysis PENDING

### 9. AutoTracks — Automation Hub (3 sub-tabs)
**Hook:** `useAutoTracks`
**Sub-tabs:**
1. **Sequences** — drip sequences (Speed-to-Lead, New Buyer, Seller CMA, Re-engagement, Post-Closing)
2. **Calendar** — holiday/date-triggered campaigns
3. **Checklists** — transaction checklists (Buyer, Seller, Listing)
**Modals:** CreateSequenceModal, CreateCampaignModal, CreateChecklistModal, AssignChecklistModal, EnrollLeadModal

### 10. Analytics — 5-Tab Reporting
**Hook:** `useAnalytics`
**Tabs:**
1. Overview — KPI cards, lead funnel, conversion rates
2. Leads — lead source breakdown, score distribution
3. Deals — pipeline value, close rates, average days
4. Marketing — email open/click rates, SMS response rates
5. ROI — cost per lead, cost per close, revenue tracking

### 11. DashboardSettings — 5-Tab Configuration
**Hooks:** `useProfile`, `useEmailTemplates`
**Tabs:**
1. Profile — agent info, photo, contact details
2. Notifications — push/email/SMS preferences
3. Integrations — API keys, connected services status
4. Templates — email templates (CreateEmailTemplateModal)
5. Billing — subscription info (future)

---

## Dashboard Modals

| Modal | File | Purpose |
|-------|------|---------|
| AddLeadModal | `modals/AddLeadModal.tsx` | Manually add a new lead |
| ImportLeadsModal | `modals/ImportLeadsModal.tsx` | CSV import (CINC migration) |
| AddShowingModal | `modals/AddShowingModal.tsx` | Schedule a showing |
| CreateSequenceModal | `modals/CreateSequenceModal.tsx` | Create drip sequence |
| CreateCampaignModal | `modals/CreateCampaignModal.tsx` | Create calendar campaign |
| CreateChecklistModal | `modals/CreateChecklistModal.tsx` | Create transaction checklist |
| AssignChecklistModal | `modals/AssignChecklistModal.tsx` | Assign checklist to deal |
| EnrollLeadModal | `modals/EnrollLeadModal.tsx` | Enroll lead in sequence |
| CreateEmailTemplateModal | `modals/CreateEmailTemplateModal.tsx` | Create/edit email template |

All modals use the shared `Modal` component from `components/shared/Modal.tsx`.

---

## Implementation Rules

1. **Lazy loading** — all dashboard pages use `React.lazy()` in App.tsx
2. **TanStack Query** — all data fetching via custom hooks with `useQuery`/`useMutation`
3. **ProtectedRoute wrapper** — redirects to `/login` if not authenticated
4. **Skeleton loading** — every page shows appropriate Skeleton variant while loading
5. **Empty states** — every list/grid shows branded EmptyState when empty
6. **Mobile-first** — bottom nav on mobile, sidebar on desktop
7. **Score badges** — always use `LeadScoreBadge` component with correct temperature colors
8. **"7 AM phone check" test** — can Lorena open this at 7 AM on her phone and instantly know what to do?
