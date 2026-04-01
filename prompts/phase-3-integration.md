# Phase 3: Integration Weaver — Task Prompt

> All Phase 2 agents must be COMPLETE before running this.

---

```
READ FIRST: CLAUDE.md, LORENA_BUSINESS_BRAIN.md, BRANDING.md

You are the INTEGRATION WEAVER. Dashboard UI, data hooks, and scoring engine are all built
separately. Your job: connect everything so the dashboard is a living, breathing system.

## TASK 3.1: Wire Dashboard Pages ↔ Data Hooks
- Connect every page to its data hooks
- Replace mock data with real Supabase queries
- Verify skeleton loading shows during fetch
- Verify empty states show when no data
- VERIFY: every page loads real data, no mock/placeholder text remains

## TASK 3.2: Wire Scoring ↔ UI
- Lead card score badges update from real scores
- Score breakdown on lead detail shows real activity
- Hot lead strip sorts by actual score
- Score changes reflect in real-time via subscriptions
- VERIFY: change a score in DB → UI updates within 2 seconds

## TASK 3.3: Wire Messages ↔ Channels
- SMS messages use Twilio config (send ready for Phase 5)
- Email messages use SendGrid config
- AI SMS conversations properly threaded
- Channel indicators show correct icons
- VERIFY: messages display with correct channel badges

## TASK 3.4: Wire AutoTracks ↔ Leads
- Sequence enrollments link to lead detail drip tab
- Checklist assignments link to lead detail checklists tab
- Calendar campaigns show on calendar view
- VERIFY: enroll a lead → shows on their detail page

## TASK 3.5: Wire Notifications ↔ Dashboard
- Hot lead alert creates in-app notification
- Unread badge shows correct count
- Notification list is accessible
- VERIFY: trigger hot lead → notification appears, badge increments

## TASK 3.6: Full Flow Test
- Create new lead → Score activities → Watch score update →
  See hot lead alert → Open lead detail → View score breakdown →
  Send message → See in messages hub → Create showing →
  See on calendar
- VERIFY: complete flow works end-to-end

## COMPLETION PROTOCOL
After all 6 tasks complete:
1. npm run build → 0 errors
2. npm run type-check → 0 errors
3. Full flow test passes end-to-end
4. No mock data remains in any page
5. Realtime updates work across all subscribed tables

Report results with actual command output.
```
