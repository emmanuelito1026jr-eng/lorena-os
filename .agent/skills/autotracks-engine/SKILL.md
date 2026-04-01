# AutoTracks Engine Agent Skill

> Domain-specific knowledge for the AutoTracks automation dashboard tab.
> Read this skill before modifying or building any drip sequence, calendar campaign, checklist, or automation enrollment feature.

---

## Purpose

Automation manager for drip sequences, calendar campaigns, and transaction checklists. This is the heart of the CINC replacement strategy — CINC's AutoTracks is forms-only and rigid. Our system provides visual timelines, bilingual (EN/ES) step previews, and the 5 pre-built sequences that replace all of Lorena's CINC automations. The goal is "set it and forget it" lead nurturing that works 24/7 while Lorena sleeps, with smart pause/resume rules to prevent double-messaging.

---

## Files

- **Primary:** `pages/dashboard/AutoTracks.tsx` (220 lines)
- **Hooks:**
  - `hooks/useAutoTracks.ts` — 14 hooks total:
    - Queries: `useSequences()`, `useSequence(id)`, `useEnrollments(leadId)`, `useCalendarCampaigns()`, `useChecklists(leadId?)`
    - Mutations: `useCreateSequence()`, `useUpdateSequence()`, `useDeleteSequence()`, `useCreateCampaign()`, `useUpdateCampaign()`, `useDeleteCampaign()`, `useCreateChecklist()`, `useUpdateChecklist()`, `useDeleteChecklist()`, `useEnrollLead()`, `useUnenrollLead()`, `useAssignChecklist()`
- **Modals:**
  - `components/dashboard/modals/CreateSequenceModal.tsx` — Create/edit drip sequences with step builder
  - `components/dashboard/modals/CreateCampaignModal.tsx` — Create/edit calendar campaigns
  - `components/dashboard/modals/CreateChecklistModal.tsx` — Create/edit transaction checklists
  - `components/dashboard/modals/EnrollLeadModal.tsx` — Enroll a lead in a sequence (used from LeadDetail page)
  - `components/dashboard/modals/AssignChecklistModal.tsx` — Assign checklist to a lead/deal
- **Shared:**
  - `components/shared/Toast.tsx` — `showToast()`
  - `components/shared/ConfirmDialog.tsx` — `confirmAction()`
  - `components/shared/EmptyState.tsx`
  - `components/shared/Skeleton.tsx` — `SkeletonList`
- **Seed Data:** `lib/seed/automation-data.ts` — Pre-built sequences, campaigns, checklists, email templates

---

## Data Sources

### Supabase Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `drip_sequences` | Automation sequence definitions | `id`, `name`, `description`, `trigger` (new_lead, status_change:*, cma_request, score_below_30, enrollment), `is_active`, `steps` (JSONB array), `created_at` |
| `drip_enrollments` | Lead-to-sequence enrollment records | `id`, `sequence_id`, `lead_id`, `status` (active/paused/completed/cancelled), `current_step`, `next_send_at`, `enrolled_at`, `completed_at` |
| `calendar_campaigns` | Holiday/date-triggered campaign definitions | `id`, `name`, `description`, `description_es`, `month`, `day` (nullable), `channel` (sms/email), `is_active`, `created_at` |
| `checklist_templates` | Reusable checklist definitions | `id`, `name`, `description`, `items` (JSONB array of `{ label, completed }`), `created_at` |
| `checklist_instances` | Checklist assigned to a specific lead/deal | `id`, `template_id`, `lead_id`, `items` (JSONB with completion tracking), `status`, `created_at`, `updated_at` |

### Sequence Step Schema (JSONB)

Each step in `drip_sequences.steps` has this structure:
```typescript
{
  type: 'sms' | 'email';
  delay_days: number;           // Days after enrollment to send
  template_body: string;        // English body text (supports {{first_name}} merge tags)
  template_body_es?: string;    // Spanish body text
  template_subject?: string;    // Email subject (EN)
  template_subject_es?: string; // Email subject (ES)
}
```

### Hook Query Keys

| Hook | Query Key | Notes |
|------|-----------|-------|
| `useSequences()` | `['sequences']` | All sequences, sorted by created_at desc |
| `useCalendarCampaigns()` | `['calendar-campaigns']` | All campaigns, sorted by month asc |
| `useChecklists()` | `['checklists', undefined]` | All templates (no leadId) |
| `useChecklists(leadId)` | `['checklists', leadId]` | Instances for a specific lead, joined with template name |
| `useEnrollments(leadId)` | `['enrollments', leadId]` | Enrollments for a lead, joined with sequence name |

---

## Current Features

### Sub-tab: Sequences

- **Sequence list** — Card per sequence showing: name, description, trigger type, step count, active/paused status badge (green/gray)
- **Expandable step preview** — Toggle "Preview" button reveals all steps inline:
  - Each step shows: channel badge (blue=email, green=SMS), delay day, EN/ES bilingual badge (gold badge if both EN+ES present, orange badge if EN-only)
  - Email steps show subject line (EN) and subject_es (ES) if available
  - Body text shown in both languages, separated by dashed border
- **CRUD operations** — Edit (pencil icon), Delete (trash icon with confirm dialog)
- **Create** — "Create New" button opens CreateSequenceModal

### Sub-tab: Calendar

- **Campaign list** — Card per campaign showing: name, description, active/inactive badge, "Month X, Day Y via {channel}" detail line
- **CRUD operations** — Edit, Delete with confirmation
- **Create** — "Create New" button opens CreateCampaignModal

### Sub-tab: Checklists

- **Checklist list** — Card per template showing: name, description, item count ("{N} items")
- **CRUD operations** — Edit, Delete with confirmation
- **Create** — "Create New" button opens CreateChecklistModal

### Pre-Built Sequences (from seed data)

| Sequence | Steps | Trigger | Duration | Replaces CINC |
|----------|-------|---------|----------|---------------|
| Speed-to-Lead | 5 (3 SMS, 2 email) | `new_lead` | 7 days | CINC Speed-to-Lead (3 days) + Lorena Intro |
| New Buyer Welcome | 8 (4 SMS, 4 email) | `status_change:contacted` | 25 days | CINC New Buyer flow |
| Seller CMA Nurture | 5 (2 SMS, 3 email) | `cma_request` | 10 days | No CINC equivalent |
| Re-engagement | 4 (2 SMS, 2 email) | `score_below_30` | 21 days | No CINC equivalent |
| Post-Closing | 6 (3 SMS, 3 email) | `status_change:past_client` | 365 days | CINC Past Client + Google Review |
| Monthly Market Report | 3 (3 email) | `enrollment` | 90 days | CINC Monthly Market Report |
| HomePulse Seller Nurture | 7 (2 SMS, 5 email) | `enrollment` | 190 days | CINC HomePulse Boost (134 enrolled) |
| Lender Introduction | 3 (1 SMS, 2 email) | `enrollment` | 4 days | CINC Needs Financing - Lender Intro |

### Pre-Built Calendar Campaigns (14 total)

New Year, Valentine's Day, Easter, Mother's Day, Father's Day, July 4th, Labor Day, Halloween, Veterans Day (Fort Bliss!), Thanksgiving, Christmas, New Year's Eve, Birthday (per-lead), Home Anniversary (per-lead)

### Pre-Built Checklists (3 templates)

| Template | Items |
|----------|-------|
| Buyer Closing Checklist | 10 items (pre-approval through closing) |
| Seller Listing Checklist | 8 items (valuation through closing) |
| New Lead Onboarding | 6 items (initial contact through first showing follow-up) |

---

## Business Rules

### Drip Sequence Rules (CRITICAL)
- **Lead replies to ANY message** -- Immediately pause ALL active drip enrollments for that lead. Notify Lorena "take over this conversation."
- **AI SMS active on a lead** -- Pause all drip sequences for that lead (prevent double-messaging between AI SMS engine and drip sequences).
- **Lead status changes to "Under Contract" or "Closed"** -- Cancel ALL active sequence enrollments for that lead.
- **Score drops below 30** -- Auto-enroll in Re-engagement sequence (if not already enrolled).
- **Score crosses 70** -- Alert Lorena immediately (SMS + push notification).
- **Blocking reminder step** -- A step with `type: 'reminder'` pauses the entire sequence until Lorena manually marks it complete.

### SMS Rules (CRITICAL)
- **Quiet hours: 10 PM - 7 AM CST** -- No SMS sent during this window, except critical alerts. Messages queue and send at 7 AM.
- **Max 1 AI SMS conversation per lead per 7 days** -- Anti-spam protection.
- **Stop after 2 unanswered AI SMS messages** -- Respectful engagement limit.
- **All client-facing text must have EN and ES versions** -- Bilingual is non-negotiable in El Paso (82% Hispanic).

### Calendar Campaign Rules
- **Auto-roll to next year** -- Campaigns automatically trigger the next occurrence. No manual year updates needed. This beats CINC's manual process.
- **Per-lead campaigns** -- Birthday and Home Anniversary use individual lead dates, not fixed dates.

### Enrollment Rules
- **One active enrollment per sequence per lead** -- Don't enroll a lead in the same sequence twice.
- **Enrollment cancellation** -- Sets `status: 'cancelled'` and `completed_at` timestamp. Does NOT delete the enrollment record.

---

## Known Issues

1. **No enrollment count per sequence** -- The sequence cards show step count but NOT how many leads are currently enrolled. The `drip_enrollments` table has this data but the UI doesn't query or display it.
2. **No campaign template preview** -- Calendar campaigns show name and schedule but not the actual message content. No way to preview what will be sent.
3. **No sorting or filtering** -- Sequences, campaigns, and checklists have no search, sort, or filter capabilities. Fine for <10 items, becomes unwieldy at scale.
4. **No bulk actions** -- Cannot activate/deactivate multiple sequences at once, or delete multiple campaigns.
5. **Checklist items not shown inline** -- Checklist cards only show item COUNT, not the actual item labels. You have to open the edit modal to see what's in a checklist.
6. **No sequence performance metrics** -- No open rates, click rates, reply rates, or completion rates for any sequence. Cannot tell which sequences are working.
7. **No visual timeline** -- Steps are listed vertically but there's no visual timeline/flowchart showing the sequence progression with day markers.
8. **Enrollment execution not wired** -- The enrollment hooks exist (`useEnrollLead`, `useUnenrollLead`) and the `next_send_at` field exists, but there is no execution engine (n8n workflow or Supabase Edge Function) that actually sends messages at the scheduled time. Phase 4 TODO.
9. **Trigger automation not wired** -- Sequence triggers (new_lead, status_change, score_below_30, etc.) are stored as strings but no event system actually fires these triggers. Phase 4 TODO.
10. **No drag-reorder for steps** -- Steps are ordered by their position in the JSONB array. No UI to reorder steps after creation.

---

## CINC Pro Comparison

| Feature | CINC Pro AutoTracks | Our System |
|---------|-------------------|------------|
| Sequence types | Forms-based, rigid templates | Flexible JSONB steps with full CRUD |
| Bilingual | English only | Full EN/ES on every step with visual badges |
| Step preview | No inline preview | Expandable inline preview with channel badges, day labels, bilingual content |
| Calendar campaigns | Manual year-by-year setup | Auto-rolling annual campaigns |
| Checklists | Separate tool / not integrated | Integrated checklist templates + per-lead instances |
| Visual builder | Basic forms | Card-based with expandable step details |
| Pre-built sequences | Generic templates | 8 El Paso-specific sequences with bilingual content |
| Performance metrics | Basic open/click rates | Not yet implemented (but planned with deeper analytics) |

**What we do BETTER:** Bilingual everything, visual step previews, auto-rolling calendar campaigns, integrated checklists, El Paso-specific content, flexible JSONB step structure that allows custom fields.

**What we're MISSING:** Execution engine (Phase 4), trigger automation (Phase 4), performance metrics, A/B testing, drag-reorder.

---

## Improvement Roadmap

### Priority 1 — Wire the Engine (Phase 4)
1. **Build execution engine** — n8n workflow or Supabase Edge Function that polls `drip_enrollments` WHERE `status = 'active' AND next_send_at <= NOW()`, sends the message, advances `current_step`, and calculates `next_send_at`.
2. **Wire trigger automation** — Listen for Supabase realtime events on `leads` table (new insert = `new_lead`, status update = `status_change:X`, score change = `score_below_30` / `score_crosses_70`) and auto-enroll leads in matching sequences.
3. **Implement pause/resume logic** — When lead replies or AI SMS activates, set enrollment status to 'paused'. Resume when Lorena marks complete or AI conversation ends.
4. **Quiet hours enforcement** — Queue messages scheduled during 10PM-7AM CST to send at 7:01 AM.

### Priority 2 — Metrics and Intelligence
5. **Enrollment count badges** — Show "X leads enrolled" on each sequence card. Query: `SELECT COUNT(*) FROM drip_enrollments WHERE sequence_id = ? AND status = 'active'`.
6. **Sequence performance dashboard** — Track per-step: send count, open rate (email), reply rate (SMS), conversion rate (status change within 7 days of step send).
7. **Campaign preview** — Show the actual message template when expanding a calendar campaign card.
8. **Inline checklist items** — Show first 3-5 items of each checklist on the card, with "and X more" if truncated.

### Priority 3 — UX Enhancements
9. **Visual sequence timeline** — Horizontal or vertical timeline with day markers, channel icons, and status indicators.
10. **Drag-reorder steps** — Implement `@dnd-kit` or `react-beautiful-dnd` for step reordering.
11. **A/B testing** — Allow 2 variants of a step and split-test which performs better.
12. **Sequence templates marketplace** — Pre-built sequences that can be imported with one click (investor nurture, relocation buyer, first-time buyer FHA, military VA buyer).
13. **Smart send time** — Analyze lead engagement patterns and send at the time each lead is most likely to open/reply.

---

## Design System

### Colors Used on This Page
- **Gold:** `#C9A84C` (`border-dashboard-gold`, `text-dashboard-gold`) — active tab indicator, CTA buttons, edit hover, bilingual EN/ES badge background (`bg-dashboard-gold/10 text-dashboard-gold`), step preview toggle
- **Gold hover:** `#B8952F` — CTA button hover
- **Status badges:**
  - Active: `bg-green-50 text-green-700`
  - Paused/Inactive: `bg-gray-50 text-gray-600`
- **Channel badges:**
  - Email: `bg-blue-100 text-blue-700`
  - SMS: `bg-green-100 text-green-700`
- **Bilingual badges:**
  - EN/ES: `bg-dashboard-gold/10 text-dashboard-gold`
  - EN only: `bg-orange-50 text-orange-600`
- **Delete hover:** `hover:text-red-500`
- **Step background:** `bg-gray-50 rounded-lg p-3`

### Typography
- **Page title:** `font-playfair text-2xl md:text-3xl font-bold` — "AutoTracks"
- **Tab labels:** `font-lato text-sm font-medium` with gold underline on active
- **Card titles:** `font-lato text-sm font-medium text-dashboard-black`
- **Card descriptions:** `font-lato text-xs text-dashboard-secondary`
- **Step metadata:** `font-lato text-[10px]` — channel badge, day label, bilingual badge
- **Step content:** `font-lato text-xs` — subject lines and body text

### Layout Patterns
- Tabs: border-bottom style with `border-b-2` active indicator (gold), min-h-[44px] touch targets
- Icon tabs: Each tab has an icon (Zap=Sequences, Calendar=Calendar, CheckSquare=Checklists)
- Cards: `bg-white rounded-xl border border-dashboard-border p-4`
- Card list: `space-y-3`
- Action buttons: flex row with `gap-2`, icon-only buttons with `p-1` padding
- Expanded steps: `mt-3 border-t border-dashboard-border pt-3 space-y-3`
- ARIA: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-label` on all interactive elements

---

## Verification Checklist

- [ ] All 3 sub-tabs render correctly (Sequences, Calendar, Checklists)
- [ ] Tab switching works and shows correct content
- [ ] Each tab icon (Zap, Calendar, CheckSquare) renders next to the label
- [ ] "Create New" button opens the correct modal for the active tab
- [ ] Sequences show name, description, trigger, step count, active/paused badge
- [ ] Expanding a sequence shows all steps with channel badges, day labels, and bilingual content
- [ ] EN/ES badge shows gold "EN/ES" when both languages present, orange "EN only" when Spanish missing
- [ ] Email steps show subject lines in both languages
- [ ] Calendar campaigns show month/day and channel type
- [ ] Checklists show name, description, and item count
- [ ] Edit button opens the correct modal pre-populated with existing data
- [ ] Delete button shows confirmation dialog before deleting
- [ ] Delete confirmation uses `confirmAction()` from ConfirmDialog
- [ ] Toast shows success/error messages after create/update/delete
- [ ] Empty states show with correct icon and CTA for each tab
- [ ] Loading state shows SkeletonList (not blank, not spinner)
- [ ] Mobile (375px): tabs scroll horizontally, cards are full-width
- [ ] Desktop (1440px): tabs fit in one row, cards have comfortable spacing
- [ ] All touch targets are 44px minimum (tabs, buttons, expand toggles)
- [ ] ARIA attributes are present on tabs and panels
