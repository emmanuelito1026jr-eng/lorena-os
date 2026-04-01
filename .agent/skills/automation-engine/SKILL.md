---
name: automation-engine
description: Behavioral scoring engine, AutoTracks, drip sequences, n8n workflows, and notifications. Read this before any scoring or automation work.
---

# Automation Engine

> Read this skill before modifying scoring logic, AutoTracks, drip sequences, or n8n workflows.
> Scoring engine: `lib/scoring/` (6 files). AutoTracks: `pages/dashboard/AutoTracks.tsx`.

---

## Behavioral Scoring Engine

### Overview
23 tracked actions across 5 categories. Score range: 0-100. Stored in `leads.score` column. Every action logged to `lead_activity` table.

### Scoring Table (`lib/scoring/constants.ts`)

#### Engagement Actions (+)
| Action | Points | Trigger |
|--------|--------|---------|
| `login` | +5 | Portal login |
| `property_view` | +2 | Views a listing (+5 bonus if same property 3x) |
| `property_favorite` | +5 | Favorites a listing |
| `search_save` | +10 | Saves a property search |
| `session_5_plus` | +10 | Session > 5 minutes |
| `return_visit` | +8 | Returns within 7 days |
| `email_open` | +2 | Opens an email |
| `email_click` | +5 | Clicks link in email |

#### Intent Actions (+)
| Action | Points | Trigger |
|--------|--------|---------|
| `showing_request` | +20 | Requests a showing |
| `message_sent` | +10 | Sends a message to Lorena |
| `home_valuation` | +15 | Requests home value estimate |
| `ai_sms_reply` | +15 | Replies to AI SMS |
| `chatbot_complete` | +15 | Completes chatbot conversation |
| `chatbot_handoff` | +20 | Chatbot escalates to Lorena |
| `ai_sms_handoff` | +20 | AI SMS escalates to Lorena |
| `showing_attended` | +15 | Attends a showing |

#### Decay Actions (-)
| Action | Points | Trigger |
|--------|--------|---------|
| `inactive_7d` | -10 | No activity for 7 days |
| `inactive_14d` | -15 | No activity for 14 days |
| `inactive_30d` | -25 | No activity for 30 days |

#### Risk Actions (-)
| Action | Points | Trigger |
|--------|--------|---------|
| `showing_missed` | -5 | Missed a scheduled showing |
| `email_bounce` | -5 | Email bounced |
| `sms_opt_out` | -15 | Opted out of SMS |

### Temperature Thresholds
| Temperature | Score Range | Color | Hex | Behavior |
|-------------|------------|-------|-----|----------|
| Hot | 80-100 | Red | #DC2626 | Immediate SMS + push notification to Lorena |
| Warm | 50-79 | Orange | #EA580C | Active nurture sequences |
| Cool | 20-49 | Blue | #2563EB | Drip sequences, monitoring |
| Cold | 0-19 | Gray | #9CA3AF | Auto-enrolled in re-engagement |

### Alert Thresholds
| Threshold | Value | Action |
|-----------|-------|--------|
| `ALERT_THRESHOLD` | 70 | Score crosses 70 → SMS/push alert to Lorena |
| `REENGAGE_THRESHOLD` | 30 | Score drops below 30 → auto-enroll in re-engagement sequence |

### Scoring Files
| File | Purpose |
|------|---------|
| `lib/scoring/constants.ts` | Action types, point values, thresholds, categories |
| `lib/scoring/calculate.ts` | Calculate new score from current + action |
| `lib/scoring/log-activity.ts` | Log action to `lead_activity` table + update `leads.score` |
| `lib/scoring/recalculate.ts` | Full score recalculation from activity history |
| `lib/scoring/triggers.ts` | Check thresholds and fire alerts/enrollments |
| `lib/scoring/breakdown.ts` | Generate score breakdown by category for UI display |

### Score Categories
| Category | Actions |
|----------|---------|
| Engagement | login, property_view, session_5_plus, return_visit, email_open, email_click |
| Interest | property_favorite, search_save, chatbot_complete |
| Intent | showing_request, message_sent, home_valuation, ai_sms_reply, chatbot_handoff, ai_sms_handoff, showing_attended |
| Decay | inactive_7d, inactive_14d, inactive_30d |
| Risk | showing_missed, email_bounce, sms_opt_out |

---

## AutoTracks System

### Overview
AutoTracks has 3 types, managed in `pages/dashboard/AutoTracks.tsx` with `hooks/useAutoTracks.ts`.

### 1. Drip Sequences
Pre-built sequences stored in `drip_sequences` table:
| Sequence | Steps | Trigger |
|----------|-------|---------|
| Speed-to-Lead | 5 | New lead registration (1 min, 5 min, 1 hr, 24 hr, 72 hr) |
| New Buyer Nurture | 7 | Lead marked as buyer |
| Seller CMA Follow-up | 5 | CMA report generated |
| Re-engagement | 4 | Score drops below 30 |
| Post-Closing | 6 | Deal status → Closed |

**Enrollment:** `drip_enrollments` table tracks lead_id, sequence_id, current_step, next_send_at, status

### 2. Calendar Campaigns
Holiday/date-based campaigns stored in `calendar_campaigns` table:
- New Year, Valentine's Day, Homeownership Month, 4th of July, Labor Day, Halloween, Thanksgiving, Christmas
- Auto-roll to next year (no manual date updates)
- Send via SendGrid (email) or Twilio (SMS)

### 3. Transaction Checklists
Stored in `checklists` table with JSONB `items` column:
| Checklist | Type | Items |
|-----------|------|-------|
| Buyer Closing | buyer | 12 steps (offer → keys) |
| Seller Listing | seller | 10 steps (listing → close) |
| Listing Prep | listing | 8 steps (photos → MLS upload) |

Assignments tracked in `checklist_assignments` with `completed_items` array.

---

## Business Rules

### Drip Pause Rules
- **Lead replies to ANY message** → pause all drip enrollments, notify Lorena "take over"
- **AI SMS active** → pause drip sequences (prevent double-messaging)
- **Status = "Under Contract" or "Closed"** → cancel all sequence enrollments
- **Blocking reminder step** → pauses entire sequence until Lorena marks complete

### SMS Rules
- No SMS during quiet hours (10 PM - 7 AM CST) except critical alerts
- Max 1 AI SMS conversation per lead per 7 days (anti-spam)
- Stop after 2 unanswered AI SMS messages (respectful)
- Local El Paso area code (915) for Twilio number

### Email Rules
- Unsubscribe link in every email (CAN-SPAM compliance)
- Both EN and ES versions for all client-facing emails

---

## n8n Workflow Registry

22 workflows in `.agent/workflows/n8n_json/`:

### Lead Capture
| ID | Name | Trigger |
|----|------|---------|
| LOS-01 | Contact Form | Webhook |
| LOS-02 | Home Estimate | Webhook |
| LOS-03 | CINC Import | Webhook |
| LOS-04 | Open House | Webhook |
| LOS-13 | Zillow Parser | Schedule |
| LOS-14 | Meta Lead Sync | Webhook |

### Scoring & Triggers
| ID | Name | Trigger |
|----|------|---------|
| LOS-05 | Behavioral Scoring | Webhook |
| LOS-17 | Behavioral Triggers | Schedule |

### AI
| ID | Name | Trigger |
|----|------|---------|
| LOS-06 | Daily Briefing | Schedule (7 AM) |
| LOS-08 | CMA Generator | Webhook |
| LOS-12 | AI SMS Engine | Webhook |

### Automation
| ID | Name | Trigger |
|----|------|---------|
| LOS-09 | Checklist Automator | Webhook |
| LOS-11 | Speed to Lead | Schedule |
| LOS-15 | Drip Orchestrator | Schedule |
| LOS-16 | Lead Reactivation | Schedule |

### Coordination
| ID | Name | Trigger |
|----|------|---------|
| LOS-18 | Showing Coordinator | Webhook |
| LOS-19 | Pre-Showing Brief | Schedule |
| LOS-20 | Post-Showing | Webhook |

### Other
| ID | Name | Trigger |
|----|------|---------|
| LOS-07 | ROI Tracker | Schedule |
| LOS-10 | System Monitor | Schedule |
| LOS-21 | Post-Close Nurture | Webhook |
| LOS-22 | Social Content | Schedule |

Deploy: `python3 .agent/workflows/deploy_v2.py`
Docs: `.agent/n8n-workflows/LOS-26-mls-sync-engine.md`, `LOS-27-31-alert-workflows.md`

---

## Notification System

### Types
| Type | Channel | Trigger |
|------|---------|---------|
| hot_lead | SMS + Push | Score crosses 80 |
| score_alert | Push | Score crosses 70 |
| new_message | Push | Incoming message |
| showing_reminder | SMS + Push | 1 hour before showing |
| deal_update | Push | Deal stage change |

### Database
Table: `notifications` (id, user_id, type, title, body, read, metadata, created_at)
Hook: `hooks/useNotifications.ts`
Realtime: INSERT events via Supabase subscription
