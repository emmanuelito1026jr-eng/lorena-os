---
name: design-system
description: Visual identity enforcement for the Lorena Realtor OS. Read this before any UI component work.
---

# Design System

> Read this skill before modifying any UI component, page, or style.
> Source of truth: `BRANDING.md` (full guidelines), `tailwind.config.js` (Tailwind tokens)

---

## Color Tokens

### Primary Palette
| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| Gold | `#C9A84C` | `text-dashboard-gold`, `bg-dashboard-gold` | CTAs, highlights, borders, active states |
| Black | `#0A0A0A` | `text-dashboard-black`, `bg-dashboard-black` | Headlines, nav backgrounds |
| Off-White | `#FAFAF5` | `bg-dashboard-bg` | Page backgrounds, card backgrounds |
| Dark Gray | `#333333` | `text-dashboard-body` | Body text |
| Medium Gray | `#888888` | `text-dashboard-secondary` | Labels, placeholders, timestamps |
| Light Gray | `#F5F5F0` | `bg-dashboard-surface` | Card backgrounds, section dividers |
| Border | `#E5E5E0` | `border-dashboard-border` | Borders, separators |

### Score Temperature Colors
| Score Range | Temp | Hex | Tailwind | Emoji |
|-------------|------|-----|----------|-------|
| 80-100 | Hot | `#DC2626` | `bg-score-hot` | Fire |
| 50-79 | Warm | `#EA580C` | `bg-score-warm` | — |
| 20-49 | Cool | `#2563EB` | `bg-score-cool` | — |
| 0-19 | Cold | `#9CA3AF` | `bg-score-cold` | — |

### Status Colors
| Status | Hex | Usage |
|--------|-----|-------|
| Success | `#16A34A` | Confirmations, completed, positive |
| Error | `#DC2626` | Errors, validation failures |
| Warning | `#F59E0B` | Warnings, pending states |
| Info | `#2563EB` | Informational badges, links |

### Color Rules
- Gold is NEVER used for body text — accents, CTAs, active states, borders ONLY
- Black (#0A0A0A) for headlines with Playfair Display ONLY
- Score colors are ONLY for score-related UI — never decorative
- Off-white (#FAFAF5) preferred over pure white (#FFFFFF) for backgrounds
- Pure black (#000000) is never used for text — always #0A0A0A or #333333

---

## Typography

### Fonts
| Role | Font | Tailwind Class | Weights |
|------|------|----------------|---------|
| Headlines | Playfair Display | `font-playfair` | 400, 600, 700 |
| Body | Lato | `font-lato` | 300, 400, 500, 700 |

### Font Scale
| Element | Tailwind | Font |
|---------|----------|------|
| Page titles | `text-2xl md:text-3xl` | Playfair Display Bold |
| Section headers | `text-xl md:text-2xl` | Playfair Display SemiBold |
| Card titles | `text-lg` | Playfair Display SemiBold |
| Body text | `text-sm md:text-base` | Lato Regular |
| Labels | `text-xs md:text-sm` | Lato Regular, color #888888 |
| Button text | `text-sm` | Lato Medium |

### Typography Rules
- NEVER use Lato for headings
- NEVER use Playfair Display for body text, buttons, or inputs
- NEVER use decorative, script, or handwritten fonts
- Line height: 1.5 for body, 1.2 for headlines

---

## Layout Rules

### Mobile (< 768px)
- Bottom nav: 5 tabs (Home, Leads, Messages, Showings, More)
- No sidebar — screen real estate too precious
- No logo in bottom nav
- 375px minimum supported width
- Touch targets: 44px minimum on all interactive elements

### Desktop (>= 768px)
- Sidebar: 240px fixed, collapsible
- Logo at top of sidebar, 180px max width
- Main content scrolls independently

### Dashboard Layout
- File: `components/dashboard/DashboardLayout.tsx`
- Sidebar: `components/dashboard/Sidebar.tsx`
- Bottom Nav: `components/dashboard/BottomNav.tsx`
- All dashboard routes wrapped in `ProtectedRoute`

### Public Site Layout
- Navbar: `components/Navbar.tsx`
- Footer: `components/Footer.tsx`
- Lead capture overlays: StickyMobileCTA, ExitIntentPopup, FloatingChatButton

---

## Loading States

### RULE: Skeleton shimmer ONLY. Never spinners. Never blank screens.

Available skeleton components (`components/shared/Skeleton.tsx`):
| Component | Usage |
|-----------|-------|
| `Skeleton` | Generic shimmer bar (base) |
| `SkeletonText` | Two-line text placeholder |
| `SkeletonCard` | Card with avatar + text |
| `SkeletonList` | Repeated list rows (configurable count) |
| `SkeletonStats` | Grid of stat cards (2-col mobile, 4-col desktop) |
| `SkeletonPropertyCard` | Property listing card with image area |
| `SkeletonPropertyGrid` | Grid of property cards (configurable count) |

### Implementation Pattern
```tsx
const { data, isLoading } = useLeads();
if (isLoading) return <SkeletonList count={8} />;
if (!data?.length) return <EmptyState icon={Users} title="No leads yet" ... />;
return <LeadList data={data} />;
```

---

## Empty States

### RULE: Every screen must have a branded empty state. Never a blank page.

Component: `components/shared/EmptyState.tsx`

Props:
- `icon: LucideIcon` — descriptive icon
- `title: string` — Playfair Display heading
- `description: string` — Lato body text
- `actionLabel?: string` — gold CTA button text
- `onAction?: () => void` — CTA handler

Empty states use gold accent circle around the icon and gold CTA button.

---

## Dark Mode

### Implementation
- CSS variable overrides via `[data-theme="dark"]` selector in `index.css`
- Toggle managed by `hooks/useTheme.ts`
- Gold (#C9A84C) stays exactly the same in dark mode — it's stunning on dark

### Override Map
| Light Value | Dark Override |
|-------------|-------------|
| #FAFAF5 (bg) | #0A0A0A |
| #0A0A0A (text) | #FAFAF5 |
| #333333 (body) | #E5E5E0 |
| #F5F5F0 (surface) | #1A1A1A |
| #E5E5E0 (border) | #333333 |

---

## Verification Checklist

Before marking any UI task complete, verify:

- [ ] Correct fonts: Playfair Display for ALL headings, Lato for ALL body/buttons/inputs
- [ ] Gold accent (#C9A84C) used for CTAs, borders, active states — never body text
- [ ] Off-white (#FAFAF5) backgrounds — never pure white (#FFFFFF)
- [ ] Score badges use correct temperature colors (hot=red, warm=orange, cool=blue, cold=gray)
- [ ] Skeleton loading on every data-fetching screen — never blank, never spinners
- [ ] Branded empty state on every screen that can be empty
- [ ] 44px minimum touch targets on mobile
- [ ] Responsive at 375px (mobile) and 1024px+ (desktop)
- [ ] Dark mode overrides work correctly (test with `[data-theme="dark"]`)
- [ ] No framework branding anywhere in UI
