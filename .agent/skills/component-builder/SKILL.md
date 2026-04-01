---
name: component-builder
description: Shared component library reference. Read this before creating or modifying any reusable component.
---

# Component Builder

> Read this skill before creating new components or modifying shared components.
> All components use TypeScript strict mode, Tailwind utility classes, and mobile-first design.

---

## Shared Components (`components/shared/`)

### Modal
**File:** `components/shared/Modal.tsx`
**Props:**
```ts
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string; // default: 'max-w-lg'
}
```
**Features:** Portal-based, focus trap, ESC to close, click-outside to close, body scroll lock, ARIA attributes
**Exported helpers:** `inputClass`, `errorInputClass`, `labelClass` — shared form styling constants for all modals

### Toast
**File:** `components/shared/Toast.tsx`
**Usage:** Notification toasts for success/error/info feedback

### Skeleton Components
**File:** `components/shared/Skeleton.tsx`
**Exports:**
| Export | Props | Usage |
|--------|-------|-------|
| `Skeleton` (base) | `className?` | Generic shimmer bar |
| `SkeletonText` | `className?` | Two-line text placeholder |
| `SkeletonCard` | `className?` | Card with avatar + text lines |
| `SkeletonList` | `count?, className?` | Repeated list rows |
| `SkeletonStats` | `count?, className?` | Grid of stat cards |
| `SkeletonPropertyCard` | `className?` | Property card with image area |
| `SkeletonPropertyGrid` | `count?, className?` | Grid of property cards |

### EmptyState
**File:** `components/shared/EmptyState.tsx`
**Props:**
```ts
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
```
**Pattern:** Gold accent circle with icon, Playfair title, Lato description, optional gold CTA button

### LeadScoreBadge
**File:** `components/shared/LeadScoreBadge.tsx`
**Props:**
```ts
interface LeadScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```
**Behavior:** Auto-selects temperature color (hot/warm/cool/cold) from score value. Uses `bg-score-hot`, `bg-score-warm`, `bg-score-cool`, `bg-score-cold` Tailwind classes.

### ConfirmDialog
**File:** `components/shared/ConfirmDialog.tsx`
**Usage:** Confirmation modal for destructive actions (delete lead, cancel sequence, etc.)

---

## Lead Capture Components (`components/lead-capture/`)

| Component | File | Behavior |
|-----------|------|----------|
| FloatingChatButton | `components/lead-capture/FloatingChatButton.tsx` | Bottom-right chat widget, uses `hooks/useChat.ts`, eagerly imported in App.tsx |
| ExitIntentPopup | `components/lead-capture/ExitIntentPopup.tsx` | Shows on mouse-leave intent (desktop) |
| StickyMobileCTA | `components/lead-capture/StickyMobileCTA.tsx` | Fixed bottom bar on mobile with call/text CTAs |
| PropertyViewGate | `components/lead-capture/PropertyViewGate.tsx` | Captures lead info after N property views |

**Note:** All lead capture components are rendered outside `<Suspense>` in App.tsx — they must not use lazy loading.

---

## MLS Components (`components/mls/`)

| Component | File | Purpose |
|-----------|------|---------|
| PropertyCard | `components/mls/PropertyCard.tsx` | Listing card with image, price, beds/baths/sqft |
| PropertyMap | `components/mls/PropertyMap.tsx` | Leaflet map for property locations |
| IDXCompliance | `components/mls/IDXCompliance.tsx` | GEPAR IDX compliance notice |
| ListingAttribution | `components/mls/ListingAttribution.tsx` | MLS attribution per listing |
| StaleDataBanner | `components/mls/StaleDataBanner.tsx` | Warning when MLS data is > 24h old |

---

## Auth Components (`components/auth/`)

| Component | File | Purpose |
|-----------|------|---------|
| AuthProvider | `components/auth/AuthProvider.tsx` | Supabase auth context, wraps entire app |
| ProtectedRoute | `components/auth/ProtectedRoute.tsx` | Redirects to /login if not authenticated |

---

## Dashboard Layout Components (`components/dashboard/`)

| Component | File | Purpose |
|-----------|------|---------|
| DashboardLayout | `components/dashboard/DashboardLayout.tsx` | Main layout with sidebar + content area |
| Sidebar | `components/dashboard/Sidebar.tsx` | Desktop sidebar navigation |
| BottomNav | `components/dashboard/BottomNav.tsx` | Mobile bottom navigation (5 tabs) |

---

## Portal Components (`components/portal/`)

| Component | File | Purpose |
|-----------|------|---------|
| PortalLayout | `components/portal/PortalLayout.tsx` | Client portal layout wrapper |
| PortalRoute | `components/portal/PortalRoute.tsx` | Auth guard for client portal routes |

---

## Dashboard Modals (`components/dashboard/modals/`)

| Modal | File | Opens From |
|-------|------|------------|
| AddLeadModal | `modals/AddLeadModal.tsx` | Leads page |
| ImportLeadsModal | `modals/ImportLeadsModal.tsx` | Leads page |
| AddShowingModal | `modals/AddShowingModal.tsx` | Showings page |
| CreateSequenceModal | `modals/CreateSequenceModal.tsx` | AutoTracks page |
| CreateCampaignModal | `modals/CreateCampaignModal.tsx` | AutoTracks page |
| CreateChecklistModal | `modals/CreateChecklistModal.tsx` | AutoTracks page |
| AssignChecklistModal | `modals/AssignChecklistModal.tsx` | AutoTracks page |
| EnrollLeadModal | `modals/EnrollLeadModal.tsx` | Lead detail / AutoTracks |
| CreateEmailTemplateModal | `modals/CreateEmailTemplateModal.tsx` | Settings page |

All modals use the shared `Modal` component and its exported form styling helpers (`inputClass`, `labelClass`).

---

## Component Creation Rules

When creating a new component:

1. **TypeScript strict** — no `any` types, define explicit interfaces for all props
2. **Mobile-first** — start with mobile layout, add `md:` breakpoints for desktop
3. **Loading state** — every data-driven component must show a Skeleton while loading
4. **Empty state** — every list/grid component must show an EmptyState when data is empty
5. **Touch targets** — 44px minimum on all interactive elements (`min-h-[44px]`)
6. **Fonts** — `font-playfair` for titles, `font-lato` for everything else
7. **Colors** — use dashboard-* Tailwind classes, never raw hex values
8. **i18n** — all client-facing text must support EN/ES via `lib/i18n/`
9. **Icons** — use `lucide-react` exclusively
10. **No framework branding** — never show "Powered by" badges

### File Placement
| Component Type | Directory |
|----------------|-----------|
| Used across public + dashboard + portal | `components/shared/` |
| Dashboard-specific | `components/dashboard/` |
| Portal-specific | `components/portal/` |
| Lead capture overlays | `components/lead-capture/` |
| MLS/property display | `components/mls/` |
| Auth/routing | `components/auth/` |
| Public site sections | `components/` (root) |
