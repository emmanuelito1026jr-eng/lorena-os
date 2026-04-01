# Showings Calendar Agent Skill
> Domain-specific knowledge for the Showings dashboard tab

## Purpose

The Showings tab is Lorena's scheduling hub for property showings. It provides three views (list, week, month) to manage upcoming and past showings, each linked to a lead with address, time, status, and notes. Showings are a critical pipeline milestone -- a lead who attends a showing is significantly more likely to convert. This screen must make it effortless for Lorena to see her schedule at a glance, create new showings, and track which leads actually showed up.

## Files

- **Primary:** `pages/dashboard/Showings.tsx` (230 lines)
- **Hooks:**
  - `hooks/useShowings.ts` -- `useShowings(dateRange?)`, `useLeadShowings(leadId)`, `useCreateShowing()`, `useUpdateShowing()`, `useDeleteShowing()`
  - `hooks/usePageTitle.ts` -- sets document title to "Showings"
- **Modals:**
  - `components/dashboard/modals/AddShowingModal.tsx` (127 lines) -- Create/edit showing form with lead selection, address, date, time range, notes
- **Components:**
  - `components/shared/EmptyState.tsx` -- branded empty state
  - `components/shared/Skeleton.tsx` -- `SkeletonList`
  - `components/shared/Toast.tsx` -- `showToast()` for success/error feedback
  - `components/shared/ConfirmDialog.tsx` -- `confirmAction()` for delete confirmation
- **Types:**
  - `lib/supabase/database.types.ts` -- `Showing`, `Tables<'showings'>`, `ShowingWithLead`
- **External Libraries:**
  - `date-fns` -- `format`, `startOfWeek`, `endOfWeek`, `addWeeks`, `subWeeks`, `isToday`, `isTomorrow`, `parseISO`, `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `isSameDay`, `isSameMonth`, `addMonths`, `subMonths`
  - `lucide-react` -- `Calendar`, `MapPin`, `User`, `Clock`, `Plus`, `ChevronLeft`, `ChevronRight`, `Trash2`, `Pencil`

## Data Sources

### Supabase Tables
| Table | Hook | Query Details |
|---|---|---|
| `showings` | `useShowings(dateRange?)` | `select('*, leads(first_name, last_name)')`, ordered by `date` asc then `start_time` asc. When `dateRange` provided, filters `date >= start AND date <= end`. |
| `showings` | `useLeadShowings(leadId)` | `select('*')` filtered by `lead_id`, ordered by `date` desc. Used on LeadDetail page. |
| `showings` | `useCreateShowing()` | Inserts new showing. On success: invalidates all `['showings']` queries + `['overview-stats']`. Also fires `logActivity('showing_request')` for the associated lead. |
| `showings` | `useUpdateShowing()` | Updates showing by ID. On success: invalidates all `['showings']` queries + `['overview-stats']`. |
| `showings` | `useDeleteShowing()` | Deletes showing by ID. On success: invalidates all `['showings']` queries + `['overview-stats']`. |
| `leads` | Used by `AddShowingModal` | `useLeads()` to populate the lead selection dropdown. |

### ShowingWithLead Type
```typescript
interface ShowingWithLead extends Showing {
  leads: {
    first_name: string;
    last_name: string;
  } | null;
}
```

### Showing Fields
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `agent_id` | UUID | FK to profiles |
| `lead_id` | UUID | FK to leads |
| `address` | TEXT | Full property address |
| `date` | DATE | `yyyy-MM-dd` format |
| `start_time` | TIME | `HH:mm` format |
| `end_time` | TIME | `HH:mm` format |
| `status` | ENUM | `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show` |
| `notes` | TEXT | Optional notes/instructions |
| `created_at` | TIMESTAMPTZ | Auto-generated |

### Behavioral Scoring Integration
- `useCreateShowing()` fires `logActivity(supabase, { leadId, action: 'showing_request' })` on success
- `showing_request` is worth **+20 points** (highest-value action in the Intent category)
- `showing_attended` is worth **+15 points** (logged separately when status changes to completed)
- `showing_missed` is worth **-5 points** (Risk category)

## Current Features

### Page Header
- Title: "Showings" (Playfair Display)
- Subtitle: "{N} showings" or "{N} showings this week/month" depending on view
- "New Showing" button (gold, top-right)

### View Mode Toggle
- Three buttons: List | Week | Month
- Active button: `bg-dashboard-gold text-white`
- Inactive button: `text-dashboard-secondary hover:bg-dashboard-surface`
- All views min-height 36px touch targets

### Navigation Controls (Week and Month views only)
- Left/right chevron buttons for previous/next period
- Center label: "Mar 23 - Mar 29, 2026" (week) or "March 2026" (month)
- Today button not present (missing feature)

### List View
- **Grouped by date** -- Showings are grouped by date with section headers
- **Date labels:** "Today", "Tomorrow", or "EEEE, MMM d" (e.g., "Monday, Mar 30")
- **Each showing card:**
  - Time range: `start_time - end_time` with Clock icon
  - Address with MapPin icon
  - Lead name with User icon (from joined leads data)
  - Status badge (rounded pill)
  - Edit button (Pencil icon) -- opens `AddShowingModal` in edit mode
  - Delete button (Trash2 icon) -- opens confirmation dialog
- All interactive elements have `min-h-[44px] min-w-[44px]`

### Week View
- **7 day rows** (Sunday through Saturday)
- **Day header:** "Tue, Mar 25" with showing count, highlighted bg for today (`bg-dashboard-gold/5`)
- **Showing rows within each day:** time range, address, lead name, status badge
- Shows all 7 days even if no showings (empty days show header only)

### Month View
- **7-column calendar grid** with Sun-Sat headers
- **Day cells:** minimum height 80px
  - Day number (today has gold circle badge)
  - Up to 2 showing pills per day (time + first part of address)
  - "+N more" indicator if > 2 showings on a day
  - Days outside current month have muted background (`bg-dashboard-surface/30`)

### Status Colors
| Status | Class |
|---|---|
| `confirmed` | `bg-green-50 text-green-700 border-green-200` |
| `scheduled` | `bg-yellow-50 text-yellow-700 border-yellow-200` |
| `completed` | `bg-blue-50 text-blue-700 border-blue-200` |
| `cancelled` | `bg-red-50 text-red-700 border-red-200` |
| `no_show` | `bg-gray-50 text-gray-700 border-gray-200` |

### AddShowingModal
- **Fields:** Lead (dropdown from all leads), Address (text input, placeholder: "123 Main St, El Paso, TX 79901"), Date (date picker), Start Time (time picker, default 10:00), End Time (time picker, default 11:00), Notes (textarea)
- **Required:** Lead, Address, Date
- **Edit mode:** Pre-fills all fields from `editItem` prop. Shows "Edit Showing" title and "Update Showing" button.
- **Create mode:** Shows "Schedule Showing" title and "Schedule Showing" button.
- **Validation:** Only checks that leadId, address, and date are non-empty. No time range validation.

### Date Range Queries
- **List view:** No date range filter (loads ALL showings)
- **Week view:** `startOfWeek(currentDate)` to `endOfWeek(currentDate)`, week starts on Sunday
- **Month view:** `startOfMonth(currentDate)` to `endOfMonth(currentDate)`

## Business Rules

- **Showing request = +20 points** -- Creating a showing fires `logActivity('showing_request')`, the highest-value action. This is a major intent signal.
- **Showing attended = +15 points** -- Logged when status changes to `completed` (NOT implemented in the current Showings.tsx UI -- must be triggered separately or via n8n).
- **Showing missed = -5 points** -- Logged when status changes to `no_show` (NOT implemented in current UI).
- **Pre-showing brief** -- Before each showing, Lorena should receive a summary of the lead's preferences, budget, and score (NOT implemented -- roadmap item).
- **Post-showing feedback** -- After each showing, Lorena should capture feedback (interested/not interested, next steps) (NOT implemented -- roadmap item).
- **No quiet hours for showings** -- Unlike SMS, showing scheduling has no time restrictions in the UI.
- **Lead association required** -- Every showing must be linked to a lead (required field in modal).
- **El Paso market context** -- Showings are typically scheduled Mon-Sat, 9 AM - 6 PM. Sunday showings are less common but happen for military families with tight schedules.

## Known Issues

1. **No double-booking prevention** -- Lorena can schedule overlapping showings at the same time. No conflict detection between showings.
2. **No quiet hours check on showing creation** -- While SMS has quiet hours (10 PM - 7 AM), the showing modal allows scheduling at any time. Should warn if scheduling outside typical showing hours (8 AM - 7 PM).
3. **No realtime updates** -- Unlike leads and messages, the Showings page has NO `useRealtimeShowings()` subscription. If a showing is created via another method (API, seed, n8n), it won't appear until navigation or manual refresh.
4. **List view loads ALL showings** -- When `viewMode === 'list'`, `useShowings()` is called with `undefined` date range, which returns every showing ever created. Should default to upcoming showings only.
5. **No "Today" quick-nav button** -- Week and month views have prev/next navigation but no way to jump back to today's week/month.
6. **Status change requires edit modal** -- To mark a showing as confirmed, completed, cancelled, or no_show, Lorena must open the edit modal and change the status (but status is NOT even a field in the AddShowingModal -- it can only be changed via direct Supabase update or API).
7. **No scoring trigger on status change** -- The `useUpdateShowing()` hook does NOT call `logActivity('showing_attended')` or `logActivity('showing_missed')` when the status changes. Scoring is only triggered on creation.
8. **No SMS reminders** -- No automated reminder sent to the lead or Lorena before a showing.
9. **No Google Maps link** -- The address is displayed as plain text. Should link to Google Maps for navigation.
10. **No iCal/Google Calendar export** -- Cannot export showings to external calendar apps.
11. **AddShowingModal has no status field** -- The modal does not include a status dropdown. New showings are created with whatever default the database sets. Edit mode also doesn't expose the status field.
12. **Time picker uses 24h format in some browsers** -- `<input type="time">` renders differently across browsers. Some show 24h format, others show AM/PM.
13. **Week view doesn't highlight current time** -- No visual indicator of "now" on the week timeline.
14. **Month view showing pills are very small** -- At 10px font size, the showing pills in the month calendar are difficult to read.

## CINC Pro Comparison

### What CINC Has That We Don't
- **Google Calendar integration** -- CINC syncs showings to Google Calendar (two-way sync)
- **iCal export** -- CINC generates `.ics` files for Apple Calendar
- **Automated SMS reminders** -- CINC sends reminders to both the agent and client before showings
- **Post-showing feedback form** -- CINC prompts the agent to rate lead interest after each showing
- **Pre-showing brief** -- CINC shows a lead summary before each showing (preferences, budget, previous properties viewed)
- **Route optimization** -- CINC suggests optimal order for multiple showings on the same day
- **Showing confirmation workflow** -- CINC sends the lead a confirmation request and tracks their response
- **Availability sharing** -- CINC allows sharing available time slots with leads for self-scheduling
- **MLS property link** -- CINC links each showing to the actual MLS listing

### What We Do BETTER Than CINC
- **Three calendar views** -- CINC only has list and month views. We also have a week view which is the most useful for daily planning.
- **Today highlighting** -- Our calendar highlights today's date with a gold circle in month view and gold background in week view. CINC's highlighting is subtle.
- **Inline edit/delete** -- Edit and delete buttons are directly on each showing card. CINC requires clicking into a showing to access these actions.
- **Date grouping in list view** -- "Today", "Tomorrow", and named days make the list immediately scannable. CINC shows flat date strings.
- **Score integration on create** -- Creating a showing automatically scores the lead +20 points. CINC doesn't have behavioral scoring tied to showings.
- **Beautiful empty states** -- Branded empty state with helpful text vs CINC's generic "No showings".

## Improvement Roadmap

### Priority 1 -- Critical
1. **Status field in AddShowingModal** -- Add a status dropdown to the create/edit modal so Lorena can mark showings as confirmed, completed, cancelled, or no_show without needing to edit Supabase directly.
2. **Score triggers on status change** -- When showing status changes to `completed`, fire `logActivity('showing_attended', +15pts)`. When status changes to `no_show`, fire `logActivity('showing_missed', -5pts)`.
3. **SMS reminders** -- Send automated SMS to both Lorena and the lead 2 hours before a confirmed showing. Use n8n workflow with Twilio integration.
4. **Double-booking detection** -- When creating or editing a showing, check for time overlaps with existing showings on the same date. Show warning with option to proceed.

### Priority 2 -- High Value
5. **Google Calendar export** -- Generate `.ics` download link for each showing. Add "Add to Google Calendar" button that opens the Google Calendar event creation URL with pre-filled fields.
6. **Pre-showing brief** -- When Lorena opens a showing, show a panel with: lead score, budget, preferred areas, property type, recent activity, previous showings, and the listing's key details.
7. **Post-showing feedback form** -- After a showing's scheduled time passes, prompt Lorena to record: interest level (1-5), next steps, notes. This triggers scoring and updates lead status.
8. **Google Maps link** -- Make the address clickable, opening Google Maps directions in a new tab.
9. **Realtime subscription** -- Create `useRealtimeShowings()` to subscribe to `showings` table changes.
10. **Default list view to upcoming only** -- When list view is active, filter to `date >= today` by default. Add a toggle to show past showings.

### Priority 3 -- Polish
11. **"Today" jump button** -- Add a "Today" button in the navigation bar for week/month views to quickly return to the current period.
12. **Route optimization** -- If Lorena has 3+ showings on the same day, suggest an optimal visit order based on address proximity.
13. **Availability sharing** -- Generate a shareable link where leads can pick from Lorena's available time slots.
14. **MLS listing link** -- Associate showings with listings from the `listings` table. Show property photo and details on the showing card.
15. **Showing confirmation workflow** -- When a showing is created, automatically send the lead a confirmation SMS. Track whether they confirm or cancel.
16. **Time validation** -- Ensure end_time > start_time in the modal. Warn if scheduling outside typical hours (8 AM - 7 PM).
17. **Drag to reschedule** -- In week view, allow dragging showings to different time slots to reschedule.
18. **Month view click-to-day** -- Clicking on a day in month view should switch to a day/list view filtered to that date.

## Design System

### Colors Used
| Element | Class |
|---|---|
| Page title | `font-playfair text-2xl md:text-3xl font-bold text-dashboard-black` |
| "New Showing" button | `bg-dashboard-gold hover:bg-[#B8952F] text-white` |
| Active view mode | `bg-dashboard-gold text-white` |
| Inactive view mode | `text-dashboard-secondary hover:bg-dashboard-surface` |
| Today's date circle (month) | `w-6 h-6 rounded-full bg-dashboard-gold text-white` |
| Today's row (week) | `bg-dashboard-gold/5` with `text-dashboard-gold` day label |
| Date section headers (list) | `font-lato text-xs font-medium text-dashboard-secondary uppercase tracking-wider` |
| Showing card | `bg-white rounded-xl border border-dashboard-border divide-y` |
| Edit button | `text-dashboard-secondary hover:text-dashboard-gold` |
| Delete button | `text-dashboard-secondary hover:text-red-500` |
| Navigation arrows | `w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg border border-dashboard-border` |
| Period label | `font-lato text-sm font-medium text-dashboard-black min-w-[140px] text-center` |

### Status Badge Colors
| Status | Background | Text | Border |
|---|---|---|---|
| confirmed | `bg-green-50` | `text-green-700` | `border-green-200` |
| scheduled | `bg-yellow-50` | `text-yellow-700` | `border-yellow-200` |
| completed | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| cancelled | `bg-red-50` | `text-red-700` | `border-red-200` |
| no_show | `bg-gray-50` | `text-gray-700` | `border-gray-200` |

### Typography
| Context | Class |
|---|---|
| Page title | `font-playfair text-2xl md:text-3xl font-bold` |
| Subtitle | `font-lato text-sm text-dashboard-secondary` |
| Time display | `font-lato text-sm font-medium text-dashboard-black` |
| Address | `font-lato text-sm text-dashboard-body` |
| Lead name | `font-lato text-sm text-dashboard-secondary` |
| Status badge | `text-xs font-lato font-medium` (list) or `text-[10px]` (week/month) |
| Week day header | `font-lato text-sm font-medium` |
| Month day number | `font-lato text-xs` |
| Showing pill (month) | `text-[10px] font-lato` |
| Calendar column header | `font-lato text-xs text-dashboard-secondary font-medium` |

### Layout
- **View mode toggle:** `flex border border-dashboard-border rounded-lg overflow-hidden`
- **List view:** `space-y-4` with date groups, each group has `bg-white rounded-xl border` card
- **Week view:** `bg-white rounded-xl border`, 7 rows with day headers and showing list
- **Month view:** `bg-white rounded-xl border`, 7-col grid with min-height 80px cells
- **Modal:** Uses shared `Modal` component with `inputClass`, `labelClass` from `components/shared/Modal.tsx`

## Verification Checklist

1. [ ] Page loads with skeleton shimmer during data fetch
2. [ ] List view groups showings by date with "Today"/"Tomorrow" labels
3. [ ] Week view shows 7 days with correct date range in header
4. [ ] Month view shows full calendar grid with day numbers and showing pills
5. [ ] View toggle switches correctly between list/week/month
6. [ ] Week/Month navigation (prev/next) updates the date range and re-fetches data
7. [ ] Today is highlighted in week (gold bg) and month (gold circle) views
8. [ ] Status badges show correct colors for all 5 statuses
9. [ ] "New Showing" button opens the modal
10. [ ] Modal validates required fields (lead, address, date)
11. [ ] Creating a showing appears in the list after query invalidation
12. [ ] Edit button opens modal in edit mode with pre-filled values
13. [ ] Delete button shows confirmation dialog and removes showing on confirm
14. [ ] Lead name appears on showing cards (from joined data)
15. [ ] Address, time range, and notes display correctly
16. [ ] Month view shows "+N more" when a day has > 2 showings
17. [ ] Mobile layout (375px) works for all three views
18. [ ] All interactive elements have minimum 44px touch targets
19. [ ] Empty states show for no showings in each view mode
20. [ ] No TypeScript errors (`npm run type-check`)
