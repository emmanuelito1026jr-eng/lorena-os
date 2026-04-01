# Skill: QA Ops

> Quality assurance, build verification, and the iron law of evidence-based completion claims.
> **Read before:** marking ANY task as complete, running verification, or reviewing someone else's work.

---

## Overview

Every task in the Casas En El Paso platform must pass a rigorous verification loop before it can be marked complete. This is not optional — it is the foundation of shipping quality work. Lorena's livelihood depends on this system working correctly, and her clients interact with it daily on their phones.

The QA process has three layers: (1) automated checks (TypeScript, ESLint, build), (2) visual verification (mobile + desktop viewports, loading states, empty states), and (3) design system compliance (fonts, colors, touch targets, dark mode). All three layers must pass.

**THE IRON LAW:** "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE." If you say a task is done, you must show the evidence — terminal output, screenshots, or specific test results from THIS session. Stale evidence from a previous session is not valid.

---

## Key Files

| File | Purpose |
|------|---------|
| `package.json` | Build scripts: `build`, `dev`, `test`, `preview` |
| `vite.config.ts` | Vite config: port 3000, manual chunks, chunk size limits |
| `tsconfig.json` | TypeScript strict config |
| `tailwind.config.js` | Tailwind tokens, custom colors, fonts |
| `index.css` | Global CSS variables, dark mode overrides |
| `components/shared/Skeleton.tsx` | All skeleton loading components |
| `components/shared/EmptyState.tsx` | Branded empty state component |

---

## Build Verification Commands

Run these in order. All must pass with zero errors/warnings.

### 1. TypeScript Strict Check
```bash
npm run type-check
# OR: npx tsc --noEmit
```
**Expected:** Exit code 0, zero errors.

**Banned patterns:**
- `any` type — NEVER, anywhere, for any reason
- `as unknown as SomeType` — fix the actual type instead of casting through unknown
- `@ts-ignore` / `@ts-expect-error` — fix the error, do not suppress it
- Implicit `any` from untyped function parameters

### 2. ESLint
```bash
npm run lint
```
**Expected:** Zero warnings, zero errors.

**Note:** If `npm run lint` is not configured, run `npx eslint . --ext .ts,.tsx` instead.

### 3. Production Build
```bash
npm run build
```
**Expected:** Exit code 0. Watch for:
- Bundle size warnings (Vite warns for chunks >1000KB per `vite.config.ts`)
- No single chunk should exceed 500KB except `react-pdf` (lazy-loaded)
- Manual chunks configured: gsap, lenis, vendor, supabase, react-query, recharts, leaflet

### 4. Dev Server Smoke Test
```bash
npm run dev
```
**Expected:** Server starts on `localhost:3000`. Check:
- Home page loads without white screen
- No console errors in browser DevTools
- Navigation between routes works (React Router lazy loading)

---

## Visual QA Checklist

### Viewport Testing

| Viewport | Width | What to Check |
|----------|-------|---------------|
| Mobile | 375px | Bottom nav visible, no horizontal scroll, touch targets 44px+ |
| Tablet | 768px | Layout adapts, sidebar may appear, cards reflow to 2-col |
| Desktop | 1440px | Full sidebar, 3+ column grids, max-w-7xl centered content |

### Loading States

**RULE:** Skeleton shimmer on EVERY screen that fetches data. NEVER spinners. NEVER blank screens.

Available skeleton components in `components/shared/Skeleton.tsx`:

| Component | Use Case |
|-----------|----------|
| `Skeleton` | Generic shimmer bar |
| `SkeletonText` | Two-line text placeholder |
| `SkeletonCard` | Card with avatar + text |
| `SkeletonList` | Repeated list rows |
| `SkeletonStats` | Grid of stat cards |
| `SkeletonPropertyCard` | Property listing card with image area |
| `SkeletonPropertyGrid` | Grid of property cards |

**Verification pattern:**
```tsx
const { data, isLoading } = useSomeHook();
if (isLoading) return <SkeletonList count={8} />;
if (!data?.length) return <EmptyState icon={Icon} title="..." />;
return <ActualContent data={data} />;
```

### Empty States

**RULE:** Every screen that can be empty MUST have a branded empty state. Never a blank page.

Empty states must include:
- Lucide icon with gold (#C9A84C) accent circle
- Playfair Display heading
- Lato body description
- Gold CTA button (if applicable)
- Bilingual text on client-facing pages

### Dark Mode

Toggle dark mode and verify:
- All `--dashboard-*` CSS variables have dark overrides in `index.css`
- Gold (#C9A84C) remains unchanged in dark mode
- Text is readable (light text on dark backgrounds)
- Borders and surfaces use dark variants
- No elements become invisible (same-color text on background)

---

## Design System Compliance

### Fonts
| Element | Required Font | Tailwind Class |
|---------|--------------|----------------|
| All headings (h1-h3) | Playfair Display | `font-playfair` |
| Page titles | Playfair Display Bold | `font-playfair font-bold` |
| Section headers | Playfair Display SemiBold | `font-playfair font-semibold` |
| Body text | Lato | `font-lato` |
| Buttons | Lato Medium | `font-lato font-medium` |
| Inputs | Lato | `font-lato` |
| Labels | Lato | `font-lato` |

**Violations to catch:**
- Headings using Lato (should be Playfair Display)
- Body text using Playfair Display (should be Lato)
- Missing `font-playfair` or `font-lato` class (falling back to system font)

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Gold | #C9A84C | CTAs, highlights, borders, active states — NEVER body text |
| Black | #0A0A0A | Headlines — never pure #000000 |
| Off-White | #FAFAF5 | Backgrounds — never pure #FFFFFF |
| Dark Gray | #333333 | Body text |
| Medium Gray | #888888 | Secondary text, labels |

### Score Badge Colors

| Score | Color | Hex | Tailwind |
|-------|-------|-----|----------|
| 80-100 | Hot (Red) | #DC2626 | `bg-score-hot` |
| 50-79 | Warm (Orange) | #EA580C | `bg-score-warm` |
| 20-49 | Cool (Blue) | #2563EB | `bg-score-cool` |
| 0-19 | Cold (Gray) | #9CA3AF | `bg-score-cold` |

### Touch Targets
- Minimum 44px height AND 44px width on ALL interactive elements
- Tailwind: `min-h-[44px]` on buttons, links, and tappable areas
- Bottom nav items: `min-w-[56px] min-h-[44px]`
- Spacing between tappable elements: at least 8px gap

---

## Code Quality Rules

### Banned Patterns
| Pattern | Why | Fix |
|---------|-----|-----|
| `any` type | Defeats TypeScript safety | Use proper types or generics |
| `as unknown as T` | Type laundering | Fix the source type |
| `@ts-ignore` | Hides real errors | Fix the error |
| `console.log` | Debug noise in production | Remove or use proper logging |
| Commented-out code | Dead code confuses readers | Delete it (git has history) |
| Hardcoded secrets | Security risk | Use environment variables |
| `style={{}}` inline | Breaks Tailwind consistency | Use Tailwind classes |
| Spinners/loading wheels | Design system violation | Use Skeleton components |
| Blank empty states | Design system violation | Use EmptyState component |
| Pure white (#FFFFFF) bg | Off-brand | Use #FAFAF5 (`bg-dashboard-bg`) |
| Pure black (#000000) text | Off-brand | Use #0A0A0A (`text-dashboard-black`) |

### Bundle Size Limits

| Chunk | Max Size | Notes |
|-------|----------|-------|
| vendor (react/react-dom/router) | ~200KB | Manual chunk in vite.config.ts |
| supabase | ~100KB | Manual chunk |
| gsap | ~100KB | Manual chunk |
| recharts | ~300KB | Manual chunk |
| leaflet | ~200KB | Manual chunk |
| react-pdf | Lazy-loaded | Excluded from main bundle |
| Any other chunk | <500KB | Alert if exceeded |

---

## The Verification Loop

After EVERY task, run this loop:

```
1. npm run type-check       → 0 errors
2. npm run lint              → 0 warnings
3. npm run build             → exit 0, no size warnings
4. Visual: mobile (375px)    → layout correct, bottom nav visible
5. Visual: desktop (1440px)  → sidebar visible, content centered
6. Loading states            → skeleton shimmer on data screens
7. Empty states              → branded with gold accent + CTA
8. Fonts                     → Playfair headings, Lato body
9. Colors                    → gold for CTAs, score colors correct
10. Dark mode                → toggle works, all elements visible
```

If ANY step fails, fix it before claiming completion.

---

## Evidence Requirements

When reporting task completion, include:

1. **Terminal output** from `type-check` and `build` (copy-paste the success output)
2. **Files changed** with brief description of each change
3. **What was tested** — specific pages/viewports/states checked
4. **Known limitations** — anything that could not be tested (e.g., "Supabase RLS not testable without auth")

**Bad completion report:**
> "Done. Updated the component."

**Good completion report:**
> "Updated `pages/portal/MyShowings.tsx` — added skeleton loading state and branded empty state. TypeScript: 0 errors. Build: clean. Tested at 375px (bottom nav visible, cards stack single-column) and 1440px (sidebar present, 3-column grid). Dark mode verified. Bilingual text uses `t()` for all 8 new strings (added to both en.json and es.json)."

---

## Verification Checklist (The Complete List)

- [ ] `npm run type-check` — 0 errors
- [ ] `npm run lint` — 0 warnings
- [ ] `npm run build` — exit code 0
- [ ] No `any` types in changed files
- [ ] No `console.log` in changed files
- [ ] No commented-out code in changed files
- [ ] No hardcoded secrets in changed files
- [ ] Mobile (375px): layout correct, bottom nav visible, no horizontal scroll
- [ ] Desktop (1440px): sidebar present, max-w-7xl centered, proper grid columns
- [ ] Skeleton loading on every data-fetching screen
- [ ] Branded empty state on every emptied-data screen
- [ ] Fonts: Playfair Display for headings, Lato for body/buttons/inputs
- [ ] Colors: gold for CTAs only, off-white backgrounds, correct score colors
- [ ] Touch targets: 44px minimum on all interactive elements
- [ ] Dark mode: toggle works, all elements visible and readable
- [ ] Bilingual: all client-facing text uses `t()` (portal + public site)
- [ ] No framework branding visible in UI
- [ ] Bundle: no unexpected large chunks

---

## Common Mistakes

1. **Claiming "done" without running `type-check`** — TypeScript errors are the #1 source of bugs. Always run it.
2. **Testing only desktop** — Most of Lorena's clients use phones. Mobile (375px) is the PRIMARY viewport.
3. **Forgetting loading states on new pages** — Every new page that fetches data needs a skeleton loading state. It is never acceptable to show a blank screen while data loads.
4. **Using spinners instead of skeletons** — The design system explicitly bans spinners. Use the `Skeleton*` components from `components/shared/Skeleton.tsx`.
5. **Not checking dark mode** — If you add a new component with hardcoded colors (e.g., `bg-white`), it will break in dark mode. Use dashboard tokens (`bg-dashboard-bg`, `text-dashboard-body`).
6. **Skipping the empty state** — Every screen that can have zero items must have a branded empty state. This includes: no leads, no messages, no showings, no favorites, no search results, no transactions.
7. **Using `any` to fix a type error** — `any` is a virus that spreads through the codebase. Fix the actual type. If you do not know the type, use `unknown` and narrow with type guards.
8. **Leaving `console.log` in production code** — Use the browser's DevTools for debugging. Remove all console statements before marking complete.
9. **Not testing with real-ish data** — A page that looks great with 3 items might break with 0, 1, 50, or 100 items. Test edge cases.
10. **Assuming the build will catch everything** — The build checks syntax and types, but not visual correctness. Visual QA is always required.
