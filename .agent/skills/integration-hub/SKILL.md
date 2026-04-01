# Skill: Integration Hub

> External service integrations — Twilio, SendGrid, Zillow, Meta, Apollo, and Instantly.
> **Read before:** adding or modifying any external API integration, webhook handler, or n8n workflow that calls a third-party service.

---

## Overview

The Casas En El Paso platform integrates with multiple external services to power its automation engine. These integrations live primarily in n8n workflows (server-side) rather than in frontend code — API keys must never be exposed to the client.

The integration philosophy is: use the right tool for each job, handle failures gracefully, and always respect rate limits and compliance rules. Every integration has a corresponding n8n workflow (LOS-XX) that handles the orchestration, retry logic, and error reporting.

All API credentials are stored as n8n credentials or environment variables. They are NEVER hardcoded in workflow JSON files, never committed to git, and never sent to the frontend.

---

## Key Files

| File | Purpose |
|------|---------|
| `.agent/workflows/n8n_json/LOS-11_Speed_to_Lead.json` | Twilio SMS: first-touch within 60 seconds |
| `.agent/workflows/n8n_json/LOS-12_AI_SMS_Engine.json` | Twilio SMS: AI-powered qualification conversations |
| `.agent/workflows/n8n_json/LOS-13_Zillow_Parser.json` | Zillow lead parsing and import |
| `.agent/workflows/n8n_json/LOS-14_Meta_Lead_Sync.json` | Facebook/Meta lead form webhook sync |
| `.agent/workflows/n8n_json/LOS-15_Drip_Orchestrator.json` | SendGrid email + Twilio SMS drip execution |
| `.agent/workflows/n8n_json/LOS-06_Daily_Briefing.json` | AI briefing delivered via SendGrid email |
| `hooks/useMessages.ts` | Frontend message display (reads from Supabase, not Twilio directly) |
| `lib/supabase/client.ts` | Supabase client (frontend) |

---

## Twilio (SMS + Voice)

### Configuration

| Setting | Value |
|---------|-------|
| Env: Account SID | `TWILIO_ACCOUNT_SID` |
| Env: Auth Token | `TWILIO_AUTH_TOKEN` |
| Env: Phone Number | `TWILIO_PHONE_NUMBER` |
| Area Code | 915 (El Paso local — builds trust) |
| Quiet Hours | 10:00 PM - 7:00 AM CST — no SMS except critical alerts |
| Send Window | 8:00 AM - 9:00 PM CST for marketing/drip messages |

### SMS Business Rules

| Rule | Implementation |
|------|---------------|
| Speed-to-Lead | First SMS within 60 seconds of lead capture (LOS-11) |
| AI SMS limit | Max 1 AI conversation per lead per 7 days |
| Unanswered limit | Stop after 2 unanswered AI SMS messages |
| Lead replies | Pause ALL drip enrollments immediately, notify Lorena |
| Under Contract/Closed | Cancel all sequence enrollments |
| Double-message guard | Never send drip + AI SMS to same lead simultaneously |
| Opt-out | Honor STOP/UNSUBSCRIBE keywords, update `leads.sms_consent` |

### SMS Message Flow
```
Lead action (form submit, property view, etc.)
  |
  v
n8n workflow triggered (webhook or schedule)
  |
  v
Check quiet hours → if quiet, queue for 8 AM next day
  |
  v
Check drip pause status → if AI SMS active, skip drip
  |
  v
Send via Twilio API
  |
  v
Log to Supabase messages table (direction='outbound', channel='sms')
  |
  v
Update lead_activity for scoring
```

### Inbound SMS Handling
- Twilio webhook posts to n8n
- Message logged to Supabase `messages` table (direction='inbound')
- Lead score updated (+15 points for reply)
- All drip sequences paused for this lead
- Lorena notified via SMS + push: "Take over — [lead name] replied"

---

## SendGrid (Email)

### Configuration

| Setting | Value |
|---------|-------|
| Env: API Key | `SENDGRID_API_KEY` |
| From Address | Lorena's branded email |
| From Name | "Lorena Ontiveros-Ortega" |

### Compliance Requirements

| Requirement | Implementation |
|-------------|---------------|
| CAN-SPAM unsubscribe | Every email includes unsubscribe link in footer |
| Physical address | Lorena's business address in email footer |
| Unsubscribe processing | Webhook updates `leads.email_unsubscribed` within 10 days |
| Honest subject lines | No deceptive subjects (FTC requirement) |

### Email Types

| Type | Workflow | Template |
|------|----------|----------|
| Daily Briefing | LOS-06 | AI-generated summary of leads, market, tasks |
| Drip Sequences | LOS-15 | 5 pre-built sequences with EN/ES variants |
| Property Alerts | LOS-26 (sync alerts) | New listing matching saved search criteria |
| CMA Report | LOS-08 | PDF attachment with comparable analysis |
| Showing Confirmation | LOS-18 | Date, time, address, prep notes |
| Post-Close Nurture | LOS-21 | Anniversary, maintenance reminders, referral asks |

---

## Zillow (Lead Parsing)

### Configuration

| Setting | Value |
|---------|-------|
| Workflow | LOS-13 |
| Trigger | Schedule-based (check inbox periodically) |
| Source field | `source = 'zillow'` in leads table |

### Flow
```
Zillow lead notification email
  |
  v
n8n LOS-13: Parse email for lead data
  |
  v
Extract: name, email, phone, property of interest
  |
  v
Check for duplicates in Supabase (email match)
  |
  v
Insert/update lead with source='zillow'
  |
  v
Trigger Speed-to-Lead (LOS-11)
```

### Parsing Notes
- Zillow sends lead notifications via email — no official API for small agents
- Parse structured data from the email body (name, contact, property URL)
- Map Zillow property URL to MLS listing if possible (address match)
- De-duplicate by email address before inserting

---

## Meta / Facebook (Lead Sync)

### Configuration

| Setting | Value |
|---------|-------|
| Workflow | LOS-14 |
| Trigger | Webhook (Meta sends lead form submissions) |
| Source field | `source = 'facebook'` in leads table |

### Flow
```
Facebook Lead Ad form submitted
  |
  v
Meta webhook → n8n LOS-14
  |
  v
Extract: name, email, phone, ad campaign, form answers
  |
  v
Check for duplicates in Supabase (email match)
  |
  v
Insert lead with source='facebook', metadata includes campaign info
  |
  v
Trigger Speed-to-Lead (LOS-11)
```

### Webhook Security
- Verify webhook signature using Meta's app secret
- HMAC-SHA256 signature in `X-Hub-Signature-256` header
- Reject requests with invalid or missing signatures

---

## Apollo (Contact Enrichment)

### Configuration

| Setting | Value |
|---------|-------|
| Env: API Key | `APOLLO_API_KEY` |
| Source field | `source = 'apollo'` or enrichment stored in `leads.metadata` |

### Use Cases
- Enrich existing leads with additional data (company, title, social profiles)
- Prospect for referral partners (loan officers, title companies)
- Stored in `leads.metadata` JSONB field under `apollo_enrichment` key

### Data Mapping
```json
{
  "apollo_enrichment": {
    "company": "...",
    "title": "...",
    "linkedin_url": "...",
    "enriched_at": "2026-03-25T..."
  }
}
```

---

## Instantly (Cold Email)

### Configuration

| Setting | Value |
|---------|-------|
| Source field | `source = 'instantly'` in leads table |

### Handling Rules
- Cold email responses that convert to leads get `source='instantly'`
- Bounce detection: if email bounces, apply -5 score adjustment
- Hard bounces: mark `leads.email_valid = false`
- Do NOT auto-enroll Instantly leads in SMS sequences (cold leads need email warming first)

---

## Error Handling Patterns

### Retry with Exponential Backoff
All external API calls in n8n workflows must implement retry:

```
Attempt 1: immediate
Attempt 2: wait 5 seconds
Attempt 3: wait 15 seconds
Attempt 4: wait 60 seconds
After 4 failures: log to dead letter queue, alert Lorena
```

### Dead Letter Queue
Failed operations that exhaust retries are logged to the `integration_errors` table:

| Column | Purpose |
|--------|---------|
| `service` | 'twilio', 'sendgrid', 'zillow', 'meta', 'apollo', 'instantly' |
| `operation` | Description of what failed |
| `payload` | JSONB of the request that failed |
| `error_message` | Error details |
| `retry_count` | Number of attempts |
| `resolved` | Boolean, manually marked when fixed |

### Webhook Security

| Service | Verification Method |
|---------|-------------------|
| Meta/Facebook | HMAC-SHA256 via `X-Hub-Signature-256` header |
| Twilio | Request signature validation via auth token |
| SendGrid | Event webhook signed with verification key |
| Zillow | N/A (email parsing, not webhook) |

---

## Environment Variables (Complete List)

| Variable | Service | Required |
|----------|---------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio | Yes (for SMS) |
| `TWILIO_AUTH_TOKEN` | Twilio | Yes (for SMS) |
| `TWILIO_PHONE_NUMBER` | Twilio | Yes (for SMS) |
| `SENDGRID_API_KEY` | SendGrid | Yes (for email) |
| `APOLLO_API_KEY` | Apollo | Optional (enrichment) |
| `SPARK_API_TOKEN` | Spark MLS | Yes (for MLS sync) |
| `META_APP_SECRET` | Facebook | Optional (lead sync) |
| `VITE_SUPABASE_URL` | Supabase | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (server) | Yes (n8n/Edge Functions) |
| `N8N_API_KEY` | n8n | Yes (workflow management) |
| `OPENAI_API_KEY` | OpenAI | Yes (chatbot) |
| `ANTHROPIC_API_KEY` | Anthropic | Yes (briefing/CMA/SMS AI) |

**CRITICAL:** All variables with `VITE_` prefix are exposed to the frontend via Vite's env system. NEVER prefix server-side secrets with `VITE_`.

---

## Verification Checklist

Before marking any integration task complete:

- [ ] API keys stored in environment variables (never hardcoded)
- [ ] No `VITE_` prefix on server-side-only secrets
- [ ] Retry logic implemented with exponential backoff
- [ ] Dead letter queue logging on final failure
- [ ] Webhook signature verification enabled where supported
- [ ] Quiet hours respected for SMS (10 PM - 7 AM CST)
- [ ] CAN-SPAM compliance on all emails (unsubscribe link, physical address)
- [ ] Opt-out keywords honored for SMS (STOP/UNSUBSCRIBE)
- [ ] Double-message guard active (no drip + AI SMS simultaneously)
- [ ] Lead source correctly set in Supabase (zillow, facebook, apollo, instantly, referral, website)
- [ ] De-duplication by email address before inserting new leads

---

## Common Mistakes

1. **Hardcoding API keys in n8n workflow JSON** — Use n8n credential references, not raw keys. The JSON files in `.agent/workflows/n8n_json/` must use credential IDs, not secrets.
2. **Sending SMS during quiet hours** — Check CST time before every send. Queue for 8 AM if outside window.
3. **Missing CAN-SPAM unsubscribe** — Every marketing email must have an unsubscribe link. No exceptions. FTC fines are $50K+ per violation.
4. **Not pausing drips on lead reply** — When a lead replies to ANY message (SMS or email), all drip sequences must pause immediately. This is a core business rule.
5. **Prefixing server secrets with `VITE_`** — Vite exposes all `VITE_*` env vars to the client bundle. `TWILIO_AUTH_TOKEN` must NOT be `VITE_TWILIO_AUTH_TOKEN`.
6. **Ignoring webhook signature verification** — Unverified webhooks are attack vectors. Always validate Meta and Twilio signatures.
7. **Not de-duplicating leads** — Zillow and Meta can send duplicate notifications. Always check for existing lead by email before inserting.
8. **Sending AI SMS to unresponsive leads** — Stop after 2 unanswered AI messages. Continuing is spam and damages Lorena's reputation.
9. **Forgetting to log to `messages` table** — Every SMS and email sent must be logged to Supabase so it appears in the dashboard and portal message threads.
10. **Not handling Twilio 429s** — Twilio rate limits concurrent API calls. Use sequential processing with delays for bulk sends.
