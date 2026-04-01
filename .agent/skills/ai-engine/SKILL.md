---
name: ai-engine
description: AI feature specifications — chatbot, daily briefing, AI SMS, CMA generator. Read this before any AI feature work.
---

# AI Engine

> Read this skill before working on chatbot, daily briefing, AI SMS, or CMA features.
> Architecture: Chatbot = OpenAI GPT-4o (streaming), Briefing/CMA/SMS = Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`).

---

## Architecture Overview

| Feature | AI Provider | Delivery | Status |
|---------|-------------|----------|--------|
| Website Chatbot | Rule-based → OpenAI GPT-4o | Real-time in browser | Rule-based WORKING, GPT-4o PENDING |
| Daily Briefing | Claude Sonnet 4.5 | Dashboard card + SMS | PENDING |
| AI SMS Engine | Claude Sonnet 4.5 | Twilio SMS | PENDING |
| CMA Generator | Claude Sonnet 4.5 | Dashboard wizard + PDF | Wizard DONE, AI analysis PENDING |

---

## 1. Website Chatbot

### Current State: Rule-Based (WORKING)

**Files:**
| File | Purpose |
|------|---------|
| `lib/chat/chatService.ts` | Pattern-matching response engine with neighborhood facts |
| `lib/chat/leadScoring.ts` | Chat-based lead scoring (buying/selling intent detection) |
| `lib/chat/leadCapture.ts` | Captures lead info from chat → inserts to `leads` + `chat_lead_captures` |
| `lib/chat/webhookTriggers.ts` | Fires n8n webhooks on chat events |
| `hooks/useChat.ts` | React hook managing chat state, sessions, message history |
| `components/lead-capture/FloatingChatButton.tsx` | Chat widget UI (bottom-right) |

**Database Tables:**
- `chat_sessions` — visitor_id, status, lead_id, metadata
- `chat_messages` — session_id, role (user/assistant), content, metadata
- `chat_lead_captures` — session_id, lead_id, capture_type, captured_data

**Behavior:**
- Pattern matching for greetings, buying intent, selling intent, neighborhoods, military/VA, pricing, showing requests
- Captures lead info when buying/selling intent detected
- El Paso neighborhood facts for contextual responses
- Bilingual (detects Spanish input, responds in Spanish)
- `FloatingChatButton` is eagerly imported in App.tsx (not lazy-loaded)

### Target State: OpenAI GPT-4o Streaming (TODO)

**Requirements:**
- Supabase Edge Function for OpenAI streaming (never expose API key to client)
- System prompt with Lorena's business context, El Paso market knowledge
- Function calling tools:
  - `schedule_showing(property_id, date, time)` — create showing request
  - `capture_info(name, email, phone)` — capture lead contact info
  - `get_property(criteria)` — search available listings
  - `get_neighborhood_info(name)` — return neighborhood details
- Streaming responses for real-time feel
- Fallback to rule-based if OpenAI is unavailable
- All conversations saved to `chat_messages` table

---

## 2. Daily Briefing (PENDING)

### Concept
Every morning at 7 AM CST, Claude Sonnet analyzes overnight data and generates a personalized briefing for Lorena.

### Implementation Plan
- **n8n Workflow:** LOS-06 (Daily Briefing) — Schedule trigger at 7 AM
- **Data Inputs:**
  - New leads (last 24h)
  - Score changes (who went hot? who dropped?)
  - Upcoming showings (today)
  - Messages needing response
  - Deals needing attention
  - Market changes (if significant)
- **AI Analysis:** Claude Sonnet generates narrative briefing
  - "Call Maria — she viewed the same home 3 times yesterday"
  - "Follow up with Carlos — he went from 45 to 72 overnight"
  - "You have 3 showings today, starting at 10 AM on Mesa Hills"
- **Delivery:**
  - Dashboard card on DashboardHome (priority placement)
  - SMS summary to Lorena's phone
- **UI:** Briefing card on DashboardHome with expandable sections

### Files to Create
- `supabase/functions/daily-briefing/index.ts` — Edge Function
- Update `pages/dashboard/DashboardHome.tsx` — add briefing card

---

## 3. AI SMS Engine (PENDING)

### Concept
Claude Sonnet-powered conversational SMS that qualifies leads, answers questions, and escalates to Lorena when the lead is ready.

### Implementation Plan
- **n8n Workflow:** LOS-12 (AI SMS Engine) — Webhook trigger on incoming SMS
- **Integration:** Twilio (local 915 area code)
- **AI Provider:** Claude Sonnet for reasoning quality
- **Conversation Flow:**
  1. Lead texts in (or system initiates based on trigger)
  2. Claude Sonnet generates contextual response using lead history
  3. Response sent via Twilio
  4. If lead shows high intent → handoff to Lorena (score +20, alert)

### Business Rules (CRITICAL)
| Rule | Value |
|------|-------|
| Quiet hours | 10 PM - 7 AM CST (no sends except critical) |
| Max frequency | 1 AI conversation per lead per 7 days |
| Give up after | 2 unanswered messages |
| Reply detection | Pause drips, notify Lorena |
| Handoff trigger | Lead asks for appointment, pricing, or says "talk to agent" |
| Language | Auto-detect and match lead's language (EN/ES) |

### Files to Create
- `supabase/functions/ai-sms/index.ts` — Edge Function
- Twilio webhook endpoint configuration

---

## 4. CMA Generator

### Current State (WORKING)

**Files:**
| File | Purpose |
|------|---------|
| `pages/dashboard/CMA.tsx` | CMA wizard UI (4-step flow) |
| `components/dashboard/cma/CMAPdfDocument.tsx` | PDF layout for CMA report |
| `components/dashboard/cma/CMAPdfButton.tsx` | Download PDF button |
| `hooks/useCMAReports.ts` | CRUD for cma_reports table |
| `hooks/useComparableSales.ts` | Fetch comparable sales data |

**Wizard Steps:**
1. Subject Property — enter address, property details
2. Comparables — select comparable sales (auto-suggested + manual add)
3. Adjustments — adjust comparable values for differences
4. Report — generate PDF with analysis

**Database Tables:**
- `cma_reports` — subject property, comparable IDs, adjustments, suggested price, PDF URL
- `comparable_sales` — address, sale price, sale date, beds, baths, sqft, proximity

### Target State: AI Analysis (TODO)

**Requirements:**
- Claude Sonnet endpoint to analyze comparables and generate:
  - Suggested listing price range with confidence level
  - Market condition narrative (buyer's/seller's market)
  - Key differentiators for the subject property
  - Recommended pricing strategy
- Integrate AI analysis into Step 4 of the wizard
- Include AI narrative in generated PDF

### Files to Create
- `supabase/functions/cma-analysis/index.ts` — Edge Function

---

## Implementation Priority

| Priority | Feature | Business Value | Effort |
|----------|---------|---------------|--------|
| 1 | CMA AI Analysis | Lorena generates CMAs weekly — immediate ROI | Low (endpoint only) |
| 2 | Daily Briefing | Replaces manual morning review — daily time savings | Medium |
| 3 | AI SMS Engine | Replaces CINC AI Alex ($200/mo) — direct cost savings | High |
| 4 | GPT-4o Chatbot | Better lead capture — gradual conversion improvement | High |

---

## API Keys Required

```
OPENAI_API_KEY      — For GPT-4o chatbot streaming (Edge Function)
ANTHROPIC_API_KEY   — For Claude Sonnet briefing/CMA/SMS (Edge Function)
TWILIO_ACCOUNT_SID  — For SMS send/receive
TWILIO_AUTH_TOKEN   — For SMS send/receive
TWILIO_PHONE_NUMBER — Local 915 area code
```

All keys stored in Supabase Edge Function secrets — never exposed to the client.
