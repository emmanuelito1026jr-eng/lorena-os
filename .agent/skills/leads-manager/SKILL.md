# Leads Manager Agent Skill
> Domain-specific knowledge for the Leads (Prospecting Launchpad) dashboard tab

## Purpose

The Leads tab is Lorena's primary lead pipeline management screen. It provides a filterable, sortable view of all leads with temperature-based tabs (Hot/Warm/Cool/Cold), a toggle between list and pipeline (kanban) views, search, status filtering, and quick actions (call, delete, status change). Each lead links to a comprehensive LeadDetail page with contact info, preferences, notes, score breakdown, activity timeline, messages, showings, sequences, and checklists. This is where Lorena spends the most time managing her under-100-lead pipeline.

## Files

- **Primary:** `pages/dashboard/Leads.tsx` (298 lines)
- **Detail page:** `pages/dashboard/LeadDetail.tsx` (517 lines)
- **Hooks:**
  - `hooks/useLeads.ts` -- `useLeads(filters)`, `useLead(id)`, `useHotLeads(limit)`, `useCreateLead()`, `useUpdateLead()`, `useDeleteLead()`, `useLeadActivity(leadId, filters)`
  - `hooks/useMessages.ts` -- `useMessages(leadId)` (used in LeadDetail)
  - `hooks/useShowings.ts` -- `useLeadShowings(leadId)` (used in LeadDetail)
  - `hooks/useAutoTracks.ts` -- `useEnrollments(leadId)`, `useChecklists(leadId)` (used in LeadDetail)
  - `hooks/useRealtime.ts` -- `useRealtimeLeads()`
  - `hooks/usePageTitle.ts` -- sets document title
- **Modals:**
  - `components/dashboard/modals/AddLeadModal.tsx` (180 lines) -- Full lead creation form (name, email, phone, source, status, language, budget, areas, tags, notes)
  - `components/dashboard/modals/EnrollLeadModal.tsx` -- Enroll lead in a drip sequence (used in LeadDetail)
  - `components/dashboard/modals/AssignChecklistModal.tsx` -- Assign transaction checklist (used in LeadDetail)
  - `components/dashboard/modals/AddShowingModal.tsx` -- Schedule showing with preselected lead (used in LeadDetail)
- **Components:**
  - `components/shared/LeadScoreBadge.tsx` -- Color-coded score badge with optional label
  - `components/shared/EmptyState.tsx` -- Branded empty state
  - `components/shared/Skeleton.tsx` -- `SkeletonList` for loading
  - `components/shared/Toast.tsx` -- `showToast()` for success/error feedback
  - `components/shared/ConfirmDialog.tsx` -- `confirmAction()` for delete confirmation

## Data Sources

### Supabase Tables
| Table | Hook | Usage |
|---|---|---|
| `leads` | `useLeads(filters)` | Main leads list, filtered by temperature/status/search/sort |
| `leads` | `useLead(id)` | Single lead detail (`.single()`) |
| `leads` | `useHotLeads(limit)` | Leads with score >= 80 |
| `lead_activity` | `useLeadActivity(leadId)` | Activity timeline on LeadDetail |
| `messages` | `useMessages(leadId)` | Message thread on LeadDetail |
| `showings` | `useLeadShowings(leadId)` | Showings list on LeadDetail |
| `drip_enrollments` | `useEnrollments(leadId)` | Active sequence enrollments on LeadDetail |
| `checklist_instances` | `useChecklists(leadId)` | Assigned checklists on LeadDetail |

### Lead Filters Interface
```typescript
interface LeadFilters {
  temperature?: 'hot' | 'warm' | 'cool' | 'cold';
  status?: LeadStatus;  // 9 possible values
  source?: LeadSource;  // 8 possible values
  search?: string;      // ilike on first_name, last_name, email, phone
  sortBy?: 'score' | 'last_activity' | 'created_at' | 'first_name';
  sortOrder?: 'asc' | 'desc';
}
```

### Realtime
- `useRealtimeLeads()` -- Subscribes to `leads` table changes, invalidates `leads` and `overview-stats` query caches

### Query Invalidation on Mutations
- `useCreateLead()` -- invalidates `['leads']`
- `useUpdateLead()` -- invalidates `['leads']`, `['lead', id]`, `['overview-stats']`
- `useDeleteLead()` -- invalidates `['leads']`, `['overview-stats']`

## Current Features

### Leads List Page (`Leads.tsx`)
- **Page title:** "Prospecting Launchpad"
- **Quick Stats bar:** 4 cards -- Hot count, Warm count, New Today count, Total count
- **Temperature Tabs:** All | Hot | Warm | Cool | Cold -- with counts when "All" is selected
- **Search input:** Text search across first_name, last_name, email, phone
- **Filter button:** Toggles expanded filter panel with Status dropdown, Sort By dropdown, "Clear All" link
- **View toggle:** List | Pipeline buttons
- **Add Lead button:** Opens `AddLeadModal`

### List View
- Lead rows with: avatar initials (gold bg), full name, ES badge (if Spanish), status label, tags (max 2), source, phone call button, delete button, score badge with label, last activity date
- Each row links to `/dashboard/leads/:id`
- Delete has confirmation dialog
- Phone button opens `tel:` link

### Pipeline (Kanban) View
- Columns grouped by `LeadStatus` (9 possible statuses, only shows non-empty ones)
- Each card: name, score badge, phone, tags (max 2), status dropdown (inline change)
- Status dropdown triggers `useUpdateLead` mutation with toast feedback
- Horizontal scroll on mobile (`overflow-x-auto`)
- Minimum column width: 280px

### Lead Detail Page (`LeadDetail.tsx`)
- **Header:** Avatar, full name, score badge, Spanish badge, status dropdown (inline editable), source, timeline
- **Action buttons:** Call (tel: link), Email (mailto: link)
- **6 tabbed panels:**
  1. **Overview:** Contact info (phone, email, language), preferences (budget, property type, areas, timeline), editable tags, inline-editable notes, score breakdown (grouped by category: Intent, Interest, Engagement, Decay, Risk with point-per-action detail and grand total)
  2. **Activity:** Chronological list of all `lead_activity` entries with action label, timestamp, point value
  3. **Messages:** Bubble-style message thread (outbound = gold bg, inbound = gray bg) with channel label and timestamp
  4. **Showings:** List of showings with address, date/time, status badge, notes. Empty state has "Schedule Showing" CTA.
  5. **Sequences:** Active drip enrollments showing sequence name, current step, enrollment date, status badge. Empty state has "Enroll in Sequence" CTA.
  6. **Checklists:** Assigned checklist instances with template name and description. Empty state has "Assign Checklist" CTA.

### AddLeadModal
- Fields: First Name*, Last Name*, Email (validated), Phone (validated), Source (8 options), Status (9 options), Language (EN/ES), Budget Min/Max, Preferred Areas (comma-separated), Tags (comma-separated), Notes
- Validation: email regex, phone regex (digits/dashes/parens/spaces only)
- Creates lead with `score: 0` and `agent_id: user.id`

## Business Rules

### Lead Scoring (from `lib/scoring/constants.ts`)
| Temperature | Score Range | Color | Hex | CSS Class |
|---|---|---|---|---|
| Hot | 80-100 | Red | #DC2626 | `text-score-hot` |
| Warm | 50-79 | Orange | #EA580C | `text-score-warm` |
| Cool | 20-49 | Blue | #2563EB | `text-score-cool` |
| Cold | 0-19 | Gray | #9CA3AF | `text-score-cold` |

### Score Thresholds (from constants.ts)
| Constant | Value | Effect |
|---|---|---|
| `SCORE_MIN` | 0 | Floor for lead score |
| `SCORE_MAX` | 100 | Ceiling for lead score |
| `HOT_THRESHOLD` | 80 | Leads >= 80 are "hot" |
| `WARM_THRESHOLD` | 50 | Leads >= 50 are "warm" |
| `COOL_THRESHOLD` | 20 | Leads >= 20 are "cool" |
| `ALERT_THRESHOLD` | 70 | Crossing 70 triggers Lorena notification |
| `REENGAGE_THRESHOLD` | 30 | Dropping below 30 triggers re-engagement sequence |

### Scoring Table (22 action types)
**Positive (Engagement/Interest/Intent):**
- login: +5, property_view: +2, property_favorite: +5, search_save: +10, session_5_plus: +10, return_visit: +8, email_open: +2, email_click: +5
- showing_request: +20, message_sent: +10, home_valuation: +15, ai_sms_reply: +15, chatbot_complete: +15, chatbot_handoff: +20, ai_sms_handoff: +20, showing_attended: +15

**Negative (Decay/Risk):**
- inactive_7d: -10, inactive_14d: -15, inactive_30d: -25
- showing_missed: -5, email_bounce: -5, sms_opt_out: -15

### Lead Statuses (pipeline order)
1. `new_lead` -- New Lead
2. `attempted_contact` -- Attempted Contact
3. `contacted` -- Contacted
4. `appointment_set` -- Appointment Set
5. `appointment_met` -- Appointment Met
6. `active_client` -- Active Client
7. `pending_client` -- Pending Client
8. `past_client` -- Past Client
9. `lost` -- Lost

### Lead Sources
`website`, `referral`, `zillow`, `cinc`, `social`, `open_house`, `cold_call`, `other`

### Key Business Logic
- **Lead replies to ANY message** -- Pause all drip enrollments, notify Lorena "take over"
- **AI SMS active** -- Pause drip sequences (prevent double-messaging)
- **Status = "Under Contract" or "Closed"** -- Cancel all sequence enrollments
- **Score crosses 70 upward** -- Alert Lorena immediately
- **Score drops below 30** -- Auto-enroll in re-engagement sequence
- **Max 1 AI SMS conversation per lead per 7 days** (anti-spam)
- **Stop after 2 unanswered AI SMS messages** (respectful)
- **All client-facing text must have EN and ES versions**

## Known Issues

1. **No pagination** -- `useLeads()` calls `supabase.from('leads').select('*')` which loads ALL leads in one query. With Lorena's ~100 leads this is fine, but not scalable for the white-label template.
2. **Search is not debounced** -- Every keystroke triggers a new Supabase query. Should debounce by 300ms.
3. **Kanban view is NOT drag-and-drop** -- Status changes require using the dropdown on each card. No drag-to-column interaction.
4. **Score range thresholds are hardcoded in `tempCounts` useMemo** -- Lines 62-69 use magic numbers (80, 50, 20) instead of importing `HOT_THRESHOLD`, `WARM_THRESHOLD`, `COOL_THRESHOLD` from `lib/scoring/constants.ts`.
5. **Temperature filter uses Supabase `temperature` column** -- But `tempCounts` is calculated client-side from score ranges. If the `temperature` column is stale, filter results will disagree with tab counts.
6. **Pipeline columns filter out empty statuses** -- `.filter(g => g.leads.length > 0)` means if a status has 0 leads, the column disappears. This makes the kanban visually unstable.
7. **No bulk actions** -- Cannot select multiple leads and perform batch operations (enroll in sequence, change status, add tags).
8. **Delete button is prominent** -- Delete is as visible as the call button. Should be less prominent or behind a "more actions" menu.
9. **LeadDetail score breakdown only shows activities that have occurred** -- Doesn't show the full scoring table for reference (what actions are worth).
10. **LeadDetail has no "Send Message" input** -- Messages tab shows history but cannot send from the detail page. Must go to Messages tab.
11. **No lead merge/duplicate detection** -- If the same person registers via website and gets added manually, there's no dedup.
12. **Pipeline view has no visual separator between status groups** -- All columns look identical except the header.

## CINC Pro Comparison

### What CINC Has That We Don't
- **Drag-and-drop pipeline** -- CINC's kanban allows dragging leads between status columns
- **Lead health trends** -- CINC shows score history over time (line graph per lead)
- **Smart routing** -- CINC can auto-assign leads to agents in a team (not needed for Lorena solo, but needed for template)
- **Lead import from CSV** -- CINC has a CSV import wizard for bulk migration
- **Duplicate detection** -- CINC flags potential duplicate leads
- **Lead website activity tracking** -- CINC shows which pages a lead visited on the website in real-time
- **Saved smart filters** -- CINC lets you save filter combinations as named views
- **Auto-tagging rules** -- CINC can auto-tag leads based on behavior or source

### What We Do BETTER Than CINC
- **Transparent score breakdown** -- CINC's scoring is a black box. We show every action, its point value, category, and total. Lorena can see exactly WHY a lead is hot.
- **Bilingual ES badge** -- Instant visibility of Spanish-speaking leads. CINC has no equivalent.
- **Score categories** -- Intent, Interest, Engagement, Decay, Risk grouping makes the score intuitive. CINC just shows a number.
- **Quick Stats bar on leads page** -- Hot/Warm/New Today/Total counts without navigating elsewhere.
- **Inline status change in kanban** -- Dropdown right on the card. CINC requires clicking into the lead.
- **Beautiful empty states** -- Branded, helpful, with gold accent. CINC shows generic "No results."
- **Notes inline-editable** -- Click to edit, blur to save. CINC requires opening a modal.
- **Tag management on detail page** -- Add/remove tags with keyboard (Enter to add). CINC makes tagging clunky.

## Improvement Roadmap

### Priority 1 -- Critical
1. **Debounce search** -- Add 300ms debounce to search input to reduce Supabase query load. Use `useDeferredValue` or a custom `useDebounce` hook.
2. **Import score thresholds from constants** -- Replace hardcoded 80/50/20 in `tempCounts` with `HOT_THRESHOLD`, `WARM_THRESHOLD`, `COOL_THRESHOLD` from `lib/scoring/constants.ts`.
3. **CSV lead import** -- Build `ImportLeadsModal` with CSV upload, column mapping, preview, and batch insert. Critical for CINC migration.
4. **Drag-and-drop kanban** -- Use `@dnd-kit/core` or `react-beautiful-dnd` to allow dragging leads between pipeline columns with optimistic status updates.

### Priority 2 -- High Value
5. **Bulk actions** -- Add multi-select checkboxes on list view. Actions: "Enroll in Sequence", "Change Status", "Add Tag", "Delete". Show action bar when leads are selected.
6. **Scoring breakdown tooltip on list view** -- Hover over the score badge to see a mini breakdown without opening the detail page.
7. **Duplicate detection** -- On lead create, check for matching email or phone in existing leads. Show warning with "Merge" option.
8. **Send message from LeadDetail** -- Add a message compose input on the Messages tab within LeadDetail.
9. **Infinite scroll or pagination** -- Replace full-load with cursor-based pagination (`.range(offset, offset + limit)`) for white-label scalability.

### Priority 3 -- Polish
10. **Smart filters / saved views** -- Allow saving filter combinations as named views (e.g., "Hot + Eastlake", "New This Week").
11. **Lead score history graph** -- Show a sparkline or mini chart on LeadDetail showing score over time.
12. **Show all pipeline columns always** -- Empty columns should still render with a "No leads" placeholder, not disappear.
13. **Move delete behind overflow menu** -- Replace the prominent delete button with a "..." menu containing Edit, Delete, Merge.
14. **Optimistic updates for status changes** -- Update the UI immediately on status change, revert on error.

## Design System

### Colors Used
| Element | Class |
|---|---|
| Score Hot badge | `text-score-hot` (red #DC2626) |
| Score Warm badge | `text-score-warm` (orange #EA580C) |
| Score Cool badge | `text-score-cool` (blue #2563EB) |
| Score Cold badge | `text-score-cold` (gray #9CA3AF) |
| Avatar initials background | `bg-dashboard-gold/10` |
| Avatar initials text | `text-dashboard-gold` |
| ES language badge | `bg-blue-50 text-blue-600` |
| Add Lead button | `bg-dashboard-gold hover:bg-[#B8952F] text-white` |
| Active view toggle | `bg-dashboard-gold text-white` |
| Active temperature tab | `bg-white shadow-sm text-dashboard-black` |
| Status dropdown border focus | `focus:border-dashboard-gold/50 focus:ring-dashboard-gold/20` |

### Typography
| Context | Class |
|---|---|
| Page title "Prospecting Launchpad" | `font-playfair text-2xl md:text-3xl font-bold` |
| Quick stat numbers | `font-playfair text-lg font-bold` |
| Quick stat labels | `font-lato text-[10px] uppercase tracking-wide` |
| Lead name in list | `font-lato text-sm font-medium` |
| Status/source labels | `font-lato text-xs text-dashboard-secondary capitalize` |

### Layout
- Quick stats: 4-column grid (no responsive breakpoint change -- may overflow on tiny screens)
- Temperature tabs: flex with equal-width buttons, `bg-dashboard-surface rounded-lg p-1`
- List view: `bg-white rounded-xl border border-dashboard-border divide-y`
- Pipeline view: horizontal scroll (`flex gap-4 overflow-x-auto pb-4`), min-width 280px per column
- Touch targets: all buttons, inputs, tabs are `min-h-[44px]`

## Verification Checklist

1. [ ] Leads list loads with skeleton shimmer, then shows lead data
2. [ ] Temperature tabs filter correctly (Hot shows only score >= 80, etc.)
3. [ ] Search filters leads by name, email, or phone
4. [ ] Status filter dropdown works and combines with temperature filter
5. [ ] Sort options change the order (score, last activity, date added, name)
6. [ ] "Clear All" button resets all filters and tabs
7. [ ] List view shows all expected data: name, ES badge, status, tags, source, score badge
8. [ ] Pipeline view shows leads grouped by status with horizontal scroll
9. [ ] Pipeline status dropdown changes lead status with toast confirmation
10. [ ] "Add Lead" button opens modal with all fields working
11. [ ] AddLeadModal validates email and phone formats
12. [ ] Delete lead shows confirmation dialog and removes lead on confirm
13. [ ] Phone call button opens tel: link (does not navigate away)
14. [ ] LeadDetail page loads correctly with all 6 tabs
15. [ ] Score breakdown groups actions by category with correct point values
16. [ ] Inline notes editing works (click to edit, blur to save)
17. [ ] Tag add (Enter key) and remove (X button) work correctly
18. [ ] Realtime updates reflect within seconds (add lead in Supabase -> appears in list)
19. [ ] Mobile layout (375px) shows list view cleanly, pipeline scrolls horizontally
20. [ ] All colors match design system (score colors, gold accent, etc.)
