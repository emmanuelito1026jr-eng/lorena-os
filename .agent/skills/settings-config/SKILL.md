# Settings & Configuration Agent Skill

> Domain-specific knowledge for the Settings dashboard tab.
> Read this skill before modifying or building any profile, notification, integration, template, or data management feature.

---

## Purpose

Agent configuration, integrations, and data management hub. This is where Lorena manages her profile, notification preferences, email templates, and data import/export. Currently the most "incomplete" dashboard tab — the Integrations sub-tab is entirely placeholder ("Coming soon" for all 5 providers), and several critical features are missing (password change, photo upload, quiet hours, bilingual UI). However, the Data tab with CSV export/import is functional and critical for the CINC migration path.

---

## Files

- **Primary:** `pages/dashboard/DashboardSettings.tsx` (300 lines)
- **Hooks:**
  - `hooks/useProfile.ts` — `useUpdateProfile()` (mutation only; profile data comes from `useAuth()`)
  - `hooks/useEmailTemplates.ts` — `useEmailTemplates()`, `useCreateEmailTemplate()`, `useUpdateEmailTemplate()`, `useDeleteEmailTemplate()`
  - `hooks/useLeads.ts` — `useLeads()` (for CSV export data)
  - `hooks/useAuth.ts` — `useAuth()` (provides `profile`, `user`, `refreshProfile`)
- **Modals:**
  - `components/dashboard/modals/CreateEmailTemplateModal.tsx` — Create/edit email templates with name, subject, body, category, language
  - `components/dashboard/modals/ImportLeadsModal.tsx` — CSV file upload + column mapping for lead import
- **Shared:**
  - `components/shared/Modal.tsx` — `inputClass` CSS class export used for form inputs
  - `components/shared/Toast.tsx` — `showToast()`
  - `components/shared/EmptyState.tsx`

---

## Data Sources

### Supabase Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Agent profile data | `id` (matches auth user ID), `full_name`, `phone`, `role` ('agent'\|'client'), `avatar_url`, `preferences` (JSONB), `created_at` |
| `email_templates` | Reusable email templates | `id`, `name`, `subject`, `subject_es`, `body_html`, `body_html_es`, `body_text`, `body_text_es`, `category`, `language` ('en'\|'es'), `created_at` |
| `leads` | Used for CSV export | All lead fields |

### Profile Preferences Schema (JSONB)

The `profiles.preferences` field stores user settings as nested JSONB:

```typescript
{
  notifications: {
    new_lead_alerts: boolean;      // Default: true
    hot_lead_alerts: boolean;      // Default: true
    message_notifications: boolean; // Default: true
    showing_reminders: boolean;    // Default: true
    weekly_summary: boolean;       // Default: true
  }
  // Future: quiet_hours, theme, language, etc.
}
```

### Hook Details

| Hook | Query Key / Type | What It Does |
|------|-----------------|--------------|
| `useAuth()` | Context | Returns `{ profile, user, refreshProfile }` from AuthProvider |
| `useUpdateProfile()` | mutation | Updates `profiles` table by ID. Takes `{ id, updates }`. |
| `useEmailTemplates()` | `['email-templates']` | Fetches all templates sorted by created_at desc |
| `useCreateEmailTemplate()` | mutation, invalidates `['email-templates']` | Inserts new template |
| `useUpdateEmailTemplate()` | mutation, invalidates `['email-templates']` | Updates template by ID |
| `useDeleteEmailTemplate()` | mutation, invalidates `['email-templates']` | Deletes template by ID |
| `useLeads()` | `['leads']` | Fetches all leads for CSV export |

---

## Current Features

### Sub-tab: Profile

- **Avatar circle** — Shows initials from `profile.full_name` (gold background tint). No photo upload.
- **Display info** — Name and role shown below avatar
- **Editable fields:**
  - Full Name — text input, pre-populated from `profile.full_name`
  - Email — disabled input, shows `user.email`, gray background indicating non-editable
  - Phone — tel input, pre-populated from `profile.phone`
- **Save button** — "Save Changes" (gold), disabled while pending
- **Profile sync** — Uses `useEffect` to sync profile data into local form state when profile loads

### Sub-tab: Notifications

- **5 notification toggles:**

| Toggle | Label | Description | Default |
|--------|-------|-------------|---------|
| `new_lead_alerts` | New Lead Alerts | Get notified when a new lead comes in | true |
| `hot_lead_alerts` | Hot Lead Alerts | Alert when a lead score crosses 80+ | true |
| `message_notifications` | Message Notifications | Notify on new inbound messages | true |
| `showing_reminders` | Showing Reminders | Reminders before upcoming showings | true |
| `weekly_summary` | Weekly Summary | Weekly email with pipeline stats | true |

- **Toggle UI** — Custom CSS toggle (not native checkbox). Uses `peer-checked:bg-dashboard-gold` for active state. 44px-wide toggle track with 20px round knob.
- **Immediate persistence** — Each toggle change triggers an immediate `updateProfile.mutate()` call that merges the new notification preference into the existing `preferences` JSONB.
- **Merge strategy** — Spreads existing preferences, then overrides notifications: `{ ...(profile?.preferences || {}), notifications: newPrefs }`

### Sub-tab: Integrations

- **5 integration items** (ALL placeholder):

| Integration | Description | Status |
|-------------|-------------|--------|
| Twilio SMS | Send/receive SMS messages | Coming soon |
| SendGrid Email | Email campaigns and transactional emails | Coming soon |
| Zillow | Import leads from Zillow | Coming soon |
| CINC | Sync leads from CINC platform | Coming soon |
| Google Calendar | Sync showings with Google Calendar | Coming soon |

- **Connect button** — All buttons show "Connect" with "Soon" badge. Clicking any shows `showToast('Coming soon')`.
- **No actual integration logic** — This is purely UI placeholder.

### Sub-tab: Templates

- **Template list** — Cards with: name, subject line, category badge, language badge (English/Spanish)
- **CRUD operations:**
  - Create: "New Template" button opens CreateEmailTemplateModal
  - Edit: Pencil icon opens modal pre-populated with template data
  - Delete: Trash icon with immediate delete (no confirmation dialog!)
- **Template fields:** name, subject, subject_es, body_html, body_html_es, body_text, body_text_es, category, language

### Sub-tab: Data

- **Export Leads as CSV** — Button showing lead count. Generates CSV with columns: First Name, Last Name, Email, Phone, Source, Status, Score, Tags, Created. Auto-downloads as `leads-export-YYYY-MM-DD.csv`.
- **Import Leads from CSV** — Button opens ImportLeadsModal for file upload + column mapping.
- **CSV generation** — Client-side: builds header row + data rows, wraps all values in double quotes, creates Blob, creates download link via `URL.createObjectURL`.

---

## Business Rules

### Notification Preferences
- **Hot Lead Alerts** — When a lead score crosses 80+, Lorena gets SMS + push notification. This toggle controls whether she receives these.
- **New Lead Alerts** — Triggered by new lead insert into `leads` table.
- **Message Notifications** — Triggered by new inbound message.
- **Showing Reminders** — Triggered before scheduled showing times.
- **Weekly Summary** — n8n workflow sends aggregated stats email every Monday.
- **These are PREFERENCES only** — The actual notification delivery is handled by n8n workflows and Supabase Edge Functions. This UI just stores the boolean flags.

### Quiet Hours (NOT IMPLEMENTED)
- **10 PM - 7 AM CST** — No SMS sent during this window except critical alerts.
- **Must be configurable** — Should be editable inputs in Notifications tab (start time, end time, timezone).
- **Currently hardcoded** — The quiet hours window is a business rule but has no UI settings for it.

### Email Template Compliance
- **CAN-SPAM** — Every email template should include unsubscribe link. The templates don't enforce this currently.
- **Bilingual requirement** — Every client-facing template MUST have both EN and ES versions. The language badge helps identify which templates are missing translations.

### Data Export
- **CSV format** — Standard comma-separated with quoted values. Compatible with Excel, Google Sheets, CINC import.
- **No PII protection** — Export includes email, phone, name. No access control beyond auth.

### Data Import
- **CINC migration path** — The ImportLeadsModal is specifically designed for importing Lorena's <100 leads from CINC CSV export.
- **Column mapping** — User maps CSV columns to system fields (first_name, last_name, email, phone, source, status, tags).

---

## Known Issues

1. **Integrations tab is 100% placeholder** — All 5 integrations show "Coming soon". No API key inputs, no OAuth flows, no connection status.
2. **No password change** — Email is disabled (correct — managed by Supabase Auth) but there's no "Change Password" button that triggers `supabase.auth.updateUser({ password })`.
3. **No profile photo upload** — Avatar shows initials only. No camera/upload icon. Supabase Storage is available but not wired. The `profiles.avatar_url` column exists but is never set.
4. **Missing quiet hours setting** — Notifications tab has 5 toggles but no quiet hours time inputs. This is a critical business rule with no UI.
5. **No bilingual settings UI** — The settings page itself is English-only. Labels, descriptions, and buttons should have EN/ES support for consistency.
6. **Delete template has no confirmation** — Templates are deleted immediately on click without `confirmAction()` dialog. This differs from AutoTracks which uses confirmation. Inconsistent UX.
7. **No template preview** — Can't preview how an email template will look when rendered. Only raw HTML/text view.
8. **Missing notification toggle: deal_updates** — No toggle for deal status change notifications (e.g., "deal moved to Under Contract").
9. **Profile form doesn't validate** — No validation on phone format, no max length on name, no empty name prevention.
10. **CSV export doesn't include all fields** — Missing: language_preference, lead_type (buyer/seller), last_activity_at, birthday, assigned_agent. These fields exist in the leads table but aren't exported.
11. **No data deletion** — No "Delete All Data" or "Delete My Account" option. No GDPR/privacy controls.
12. **Notification toggles have no debounce** — Each toggle immediately fires a Supabase update. Rapidly toggling could cause race conditions with the JSONB merge.

---

## CINC Pro Comparison

| Feature | CINC Pro | Our System |
|---------|----------|------------|
| Profile editing | Full profile with photo | Name + phone only, no photo upload |
| Password change | Yes | NOT IMPLEMENTED |
| Notification preferences | Email digest settings | 5 toggle types (more granular) |
| Integrations | Built-in (Zillow, etc.) | All "Coming soon" |
| Email templates | CINC Templates module | Full CRUD with bilingual support |
| CSV import | CINC data export format | ImportLeadsModal with column mapping |
| CSV export | Available | Available (9 columns) |
| Quiet hours | Not configurable by user | NOT IMPLEMENTED (should be) |
| Calendar sync | Google Calendar sync | NOT IMPLEMENTED |
| SMS settings | Twilio built-in | NOT IMPLEMENTED |

**Where we're better:** Bilingual template support (EN/ES), granular notification toggles, clean CSV import/export for migration.

**Where we're worse:** No integrations wired, no profile photo, no password change, no quiet hours UI. This is the weakest tab and needs the most work.

---

## Improvement Roadmap

### Priority 1 — Critical Missing Features
1. **Wire Twilio integration** — Add phone number input, verify number, test SMS send, store credentials in `profiles.preferences.integrations.twilio`. Must use local El Paso area code (915).
2. **Wire SendGrid integration** — API key input, sender verification, test email send. Required for drip sequences and campaigns to actually send.
3. **Add quiet hours settings** — Two time pickers (start, end) + timezone selector in Notifications tab. Store in `profiles.preferences.quiet_hours: { start: '22:00', end: '07:00', timezone: 'America/Chicago' }`.
4. **Add password change** — "Change Password" button that opens a modal with current password + new password + confirm fields. Uses `supabase.auth.updateUser({ password })`.
5. **Add profile photo upload** — Camera icon on avatar. Upload to Supabase Storage bucket `avatars/{user_id}.jpg`. Update `profiles.avatar_url`. Display in Sidebar, BottomNav, and CMA PDF.

### Priority 2 — Integration Wiring
6. **Google Calendar OAuth** — Sync showings with Google Calendar. See `.agent/skills/oauth/SKILL.md` for implementation pattern.
7. **Zillow lead import** — API integration or webhook for Zillow lead capture.
8. **CINC lead sync** — One-time CSV import is primary path. Optional: CINC API webhook if available.

### Priority 3 — UX Improvements
9. **Add confirmation to template delete** — Use `confirmAction()` from ConfirmDialog for consistency with AutoTracks.
10. **Add template preview** — Render email HTML in an iframe or sanitized div for visual preview.
11. **Bilingual settings UI** — Add EN/ES labels on all settings fields using i18n system.
12. **Form validation** — Phone format validation (accept (915) XXX-XXXX and variants), required name field, max lengths.
13. **Add deal_updates notification toggle** — "Deal Updates: Notify when deal status changes."
14. **Debounce notification toggles** — Batch rapid toggle changes with a 500ms debounce before saving.
15. **Expand CSV export** — Include all lead fields, add date range filter, add format options (CSV, Excel).

### Priority 4 — Advanced Settings
16. **Custom branding** — Let agent upload logo, set brand colors, customize email footer. Enables white-label for future clients beyond Lorena.
17. **Team management** — Add/remove team members with role-based access (for when Lorena hires an assistant).
18. **Audit log** — Show last 50 settings changes with timestamps and descriptions.
19. **Data backup/restore** — Schedule automatic backups, allow restore to previous state.
20. **API keys management** — Self-service API key generation for third-party integrations.

---

## Design System

### Colors Used on This Page
- **Gold:** `#C9A84C` (`bg-dashboard-gold`) — save button, create template button, active tab indicator, notification toggle active state (`peer-checked:bg-dashboard-gold`)
- **Gold hover:** `#B8952F` — button hover
- **Avatar background:** `bg-dashboard-gold/10` with `text-dashboard-gold` initials
- **Disabled input:** `text-dashboard-secondary bg-dashboard-surface` — email field
- **Toggle track:** `bg-dashboard-border` (inactive) → `bg-dashboard-gold` (active), 44px wide, 24px tall
- **Toggle knob:** white circle, 20px diameter, slides on toggle
- **Integration "Soon" badge:** `bg-dashboard-surface text-dashboard-secondary text-[10px]`
- **Template category/language badges:** `bg-dashboard-surface rounded text-[10px]`
- **Delete hover:** `hover:text-red-500`
- **Edit hover:** `hover:text-dashboard-gold`

### Typography
- **Page title:** `font-playfair text-2xl md:text-3xl font-bold` — "Settings"
- **Section headers:** `font-playfair text-lg font-bold` — within each tab panel
- **Tab labels:** `font-lato text-sm font-medium` with icon + label
- **Input labels:** `font-lato text-xs text-dashboard-secondary`
- **Profile name:** `font-lato text-base font-medium`
- **Profile role:** `font-lato text-sm text-dashboard-secondary`
- **Toggle labels:** `font-lato text-sm font-medium` (title) + `font-lato text-xs text-dashboard-secondary` (description)
- **Template names:** `font-lato text-sm font-medium`
- **Data buttons:** `font-lato text-sm text-dashboard-body`

### Layout Patterns
- Tabs: 5 tabs with icons (User, Bell, Puzzle, FileText, Database), border-bottom style, gold active indicator, `overflow-x-auto` for mobile, `min-h-[44px]`
- Content panels: `bg-white rounded-xl border border-dashboard-border p-6 max-w-2xl`
- Form fields: vertical stack with `space-y-4`
- Input class: imported from `components/shared/Modal.tsx` as `inputClass`
- Notification rows: `flex items-center justify-between py-3 border-b border-dashboard-border last:border-b-0`
- Integration rows: same layout as notification rows
- Template cards: `border border-dashboard-border rounded-lg p-4`
- Data buttons: `w-full py-3 border border-dashboard-border rounded-lg hover:border-dashboard-gold`
- ARIA: `role="tablist"`, `role="tab"`, `role="tabpanel"` with IDs, `aria-selected`, `aria-controls`
- Labels use `htmlFor` properly linked to input `id` attributes

---

## Verification Checklist

- [ ] All 5 sub-tabs render correctly (Profile, Notifications, Integrations, Templates, Data)
- [ ] Tab switching works and shows correct content panel
- [ ] Each tab icon renders (User, Bell, Puzzle, FileText, Database)
- [ ] Profile: Avatar shows initials from profile name
- [ ] Profile: Name and phone fields pre-populate from profile data
- [ ] Profile: Email field is disabled with gray background
- [ ] Profile: Save button triggers update and shows toast on success/error
- [ ] Profile: Save button shows "Saving..." while pending
- [ ] Notifications: All 5 toggles render with correct labels and descriptions
- [ ] Notifications: Toggle state reflects saved preferences (not always default on)
- [ ] Notifications: Toggling immediately saves to Supabase without explicit save button
- [ ] Notifications: Toggle visual state changes (gray track -> gold track)
- [ ] Integrations: All 5 providers listed with "Connect" + "Soon" badge
- [ ] Integrations: Clicking "Connect" shows "Coming soon" toast
- [ ] Templates: Template list shows cards with name, subject, category, language
- [ ] Templates: "New Template" opens CreateEmailTemplateModal
- [ ] Templates: Edit icon opens modal pre-populated with template data
- [ ] Templates: Delete icon removes template and shows toast
- [ ] Templates: Empty state shows when no templates exist
- [ ] Data: "Export Leads as CSV" shows lead count and downloads file
- [ ] Data: "Import Leads from CSV" opens ImportLeadsModal
- [ ] Data: CSV filename format is `leads-export-YYYY-MM-DD.csv`
- [ ] Mobile (375px): tabs scroll horizontally, form panels are full-width
- [ ] Desktop (1440px): tabs fit in one row, panels are max-w-2xl
- [ ] All touch targets are 44px minimum
- [ ] ARIA attributes present on tabs and panels
- [ ] Fonts: Playfair Display for titles, Lato for all form elements
