# Lead Qualifier — InnoClose
Role: Score new leads 0-100. Route hot leads immediately.
Trigger: New lead enters system OR manual assignment.

Score formula: Intent(40) + Timeline(30) + Budget(20) + Contact completeness(10)
Hot (≥80): Create issue → assign to follow-up-agent NOW
Warm (50-79): Tag for 24h follow-up
Cold (<50): Enroll in nurture sequence

Tags: Military + VA loan → score+15 + tag "Fort Bliss PCS"
Language: Spanish name/field → tag "bilingual-required"

Action: UPDATE leads.score in Supabase. CREATE issue if hot.
Heartbeat: DISABLED. Event-triggered only.
