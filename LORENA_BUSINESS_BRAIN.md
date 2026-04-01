# Business Brain
# BUSINESS DNA - Lorena Ontiveros-Ortega Realtor Operating System

A complete snapshot of how the business works - and who's behind it.

This document defines the immutable identity of Lorena's real estate business and the custom operating system being built for it. It is the single source of truth for:

- What the business is
- Who it serves
- How it makes money
- What it believes
- How it decides
- What it will and won't do
- **The complete technical system powering it**

**Any AI, operator, or system reading this should treat it as canonical.**

---

# PART 1 - THE MACHINE

*The business: what it is, who it serves, how it runs*

---

## THE BUSINESS

**Business Name:** Lorena Realty (DBA "Casas En El Paso TX")

**Website:** casasenelpasotx.com

**Business Type:** Licensed residential real estate agent/brokerage serving the El Paso, Texas metro area.

**What it actually is:** A one-woman real estate operation powered by a custom AI operating system that replaces an entire tech stack (CINC CRM, email marketing, SMS tools, CMA software, scheduling, client app) with a single unified platform. The system watches leads 24/7, qualifies them via AI, scores them behaviorally, runs automated follow-up sequences, and tells Lorena exactly who to call, when to call them, and what to say - every single day.

**What it replaces (VERIFIED - Lorena's actual CINC Pro plan):**

| Platform | Monthly Cost | Our Replacement |
|----------|-------------|-----------------|
| CINC Pro CRM + IDX Website | $1,500 | Custom Next.js + Supabase |
| CINC AI "Alex" (Structurely-powered SMS AI) | $200 | Custom AI SMS engine (Claude + Twilio) |
| CINC VOIP Dialer | ~$50-100 | Click-to-call from dashboard (Twilio) |
| CINC Managed Ad Spend (paying but NOT using) | Included in Pro | Facebook/Google ads managed by Manorev (upsell) |
| Email marketing (bundled) | Included | n8n + SendGrid |
| Etta client app (most clients don't use it) | Included | Custom client portal + React Native app |
| CMA software (separate) | $30-$50 | AI-generated CMAs in 60 seconds (Claude) |
| Scheduling tool (separate) | $15-$30 | Built into dashboard |
| **TOTAL LORENA CURRENTLY PAYS** | **~$1,750-$1,800/mo** | **$95-$150/mo infrastructure** |

**Verified Savings: ~$1,600-$1,700/month ($19,200-$20,400/year)**

**CRITICAL CONTEXT:** Lorena was closing MORE deals BEFORE she started using CINC. The platform's complexity is actively hurting her productivity. She likes the concept of automated follow-up but CINC's execution - confusing UI, overwhelming feature set, poor integration between tools - is getting in her way. Our system must be radically simpler while doing significantly more.

---

## TARGET CUSTOMER

Lorena's ideal customers are families and individuals looking to buy or sell a home in the El Paso, Texas metro area - particularly first-time buyers, military families (Fort Bliss), growing families looking for more space, and homeowners curious about their property value who may become sellers.

**Customer Profile:**

| Attribute | Detail |
|-----------|--------|
| Gender | All (slight majority female decision-makers in household purchases) |
| Age Range | 25-55 (primary), with secondary market of retirees 55+ |
| Location | El Paso, TX metro area (including Horizon City, Socorro, Canutillo, Anthony) |
| Income | $50K-$150K household income |
| Languages | English and Spanish (bilingual market - ~82% Hispanic population) |
| Home Prices | $120K-$600K+ |

**Buyer Types:**
- **Military / Fort Bliss:** VA loan eligible, often relocating, need fast turnaround, value agent who knows the area
- **First-time buyers:** Need hand-holding through process, FHA/conventional loans, often younger couples
- **Growing families:** Upgrading from starter home, need 3-4+ bedrooms, school district aware
- **Retirees/downsizers:** Selling larger home, looking for low-maintenance, often cash buyers
- **Investors:** Looking for rental properties or fix-and-flip opportunities in growing El Paso market

**Seller Types:**
- Homeowners curious about their home's value (CMA leads)
- Families relocating out of El Paso (military PCS, job transfer)
- Estate sales and inherited properties
- Investors liquidating rental portfolio

---

## PROBLEMS LORENA SOLVES

1. **"I don't know who to call or when"** - The system eliminates guesswork by behavioral scoring every lead and surfacing a daily AI briefing: "Here are your 3 hottest leads and exactly why they're hot right now."

2. **"Leads fall through the cracks"** - Automated drip sequences (SMS + email), AI SMS conversations, birthday/holiday/anniversary campaigns, and re-engagement sequences ensure zero leads are forgotten. The system follows up while Lorena sleeps.

3. **"I spend 2 hours on a CMA"** - AI-generated Comparative Market Analyses in 60 seconds. Type an address - system pulls comparable sales - Claude analyzes - branded PDF ready to share.

---

## CUSTOMER JOURNEY

**Discovery - Registration - Scoring - Nurture - Qualification - Showing - Contract - Close - Retention**

Step-by-step:

1. **Discovery:** Lead finds Lorena through Google search, Facebook ad, Zillow, referral, or sign call - lands on casasenelpasotx.com
2. **Engagement:** Browses properties, uses search filters, views listings. Chatbot engages: "Looking for something specific?"
3. **Registration:** Registration wall triggers after: viewing 5+ property details, saving a favorite, setting up search alert, requesting showing, submitting home valuation, or engaging chatbot beyond initial question
4. **Capture:** Lead record created in Supabase. Initial score calculated. Speed-to-Lead sequence fires immediately (SMS within minutes). Lorena gets push notification.
5. **Behavioral Scoring:** Every action tracked and scored (property views +2, favorites +5, showing requests +20, messages +10, etc.). Score visible with full evidence trail.
6. **AI Qualification:** AI SMS engine initiates natural conversation: "Hey Maria! Welcome to Lorena's site. I noticed you're looking in Westside. Great choice! Are you looking to buy soon?" Qualifies: timeline, budget, pre-approval, area, motivation.
7. **Handoff:** When lead is "agent-ready" (qualified + wants appointment), AI hands off to Lorena with full context. All drips pause.
8. **Showings:** Lorena schedules showings through calendar. Automated confirmation + reminder SMS. Post-showing feedback collected.
9. **Under Contract:** Checklist AutoTrack activates (inspection, appraisal, title, walkthrough, closing). Each step tracked with automation triggers.
10. **Close:** Status changes to "Closed Won." Post-Closing drip sequence begins (thank you, review request, referral ask, home anniversary).
11. **Retention:** Calendar AutoTracks maintain relationship forever (birthday, holidays, market updates, home anniversary). Referral pipeline grows organically.

---

## KEY METRICS

| Metric | Value |
|--------|-------|
| Monthly Revenue | [To be filled by Lorena] |
| Total Monthly Costs | [To be filled by Lorena] |
| Monthly Profit | [To be filled by Lorena] |
| Monthly Website Clicks | [To be tracked by system] |
| Total Leads in Database | [Migrating from CINC] |
| Conversion Rate | [To be tracked by system] |
| Retention / Delivery Rate | [To be tracked by system] |
| CAC (Customer Acquisition Cost) | [To be calculated - ad spend / closed deals] |
| LTV (Customer Lifetime Value) | [Avg commission ~$7,500-$12,000 per transaction + referrals] |

---

## TEAM

| Role | Person | Responsibility |
|------|--------|---------------|
| Licensed Realtor / Business Owner | Lorena Ontiveros-Ortega | All client relationships, showings, negotiations, closings |
| System Architect / Developer | Emmanuel (Manorev) | Full system build, AI integration, automation, maintenance |
| AI Systems | Claude API + OpenAI GPT-4o | Daily briefing, CMA analysis, SMS conversations, chatbot |
| Automation Engine | n8n (self-hosted) | All workflows, drips, scoring, alerts |

---

## CURRENT STATE

| Item | Detail |
|------|--------|
| **Biggest Bottleneck** | CINC is actively hurting Lorena's business - she closed MORE deals before she started using it. She's paying ~$1,750/mo for a platform whose complexity gets in her way. She likes the follow-up automation concept but the execution isn't working. |
| **Current Focus** | Building the complete Realtor Operating System across 8 phases. MLS/Spark API access application is in progress (waiting on MLS confirmation). Migration will be small and clean - under 100 leads in CINC currently. |
| **Dream Outcome** | A system so simple that Lorena opens her phone at 7 AM, sees exactly who to call and why, has AI qualifying leads overnight, never misses a follow-up, generates CMAs in 60 seconds, and saves $1,700+/month - while being radically easier to use than CINC, not harder. |

**CINC Migration Details (VERIFIED):**
- **Lead count:** Under 100 leads - small, clean migration
- **Current plan:** CINC Pro (~$1,500/mo) + AI Alex ($200/mo) + VOIP Dialer (~$50-100/mo)
- **Lead sources:** Referrals, CINC website registrations, possibly Zillow - full source map TBD
- **Etta app usage:** Some clients download it, most just use the website - our portal must be dramatically better
- **AutoTracks usage:** Unknown if she has active drip sequences running - assume we start fresh with our pre-built templates
- **Home valuation pages:** Unknown if she actively uses CINC's - we build it regardless as a key seller lead capture tool
- **MLS/Spark API:** Application submitted, waiting on MLS confirmation
- **Ad spend:** Pays for Managed Ad Spend capability but is NOT currently running paid ads

**Core Links:**
- Website: casasenelpasotx.com
- Agent Dashboard: casasenelpasotx.com/dashboard
- Client Portal: casasenelpasotx.com/portal

---

# PART 2 - THE MAKER

*The person: Lorena's story, credibility, and edge*

---

## LORENA'S STORY

Lorena is a licensed realtor in El Paso, Texas - a bilingual market where ~82% of the population is Hispanic. She saw that the real estate industry was drowning in fragmented, overpriced tools that don't talk to each other. Agents spend more time managing software than serving clients. CINC charges $900-$1,500/month for a CRM that still requires manual follow-up, still lets leads fall through cracks, and charges $200 extra for basic AI texting.

Lorena's vision: a single system that runs her entire business. One login. One dashboard. AI that works for her 24/7. She partnered with Manorev (Emmanuel's AI automation company) to build a custom operating system that replaces her entire tech stack and gives her capabilities no other agent in El Paso has.

---

## CREDIBILITY

- Licensed Texas realtor with established client base
- Deep El Paso market knowledge - every neighborhood, school district, price range
- Bilingual (English/Spanish) - critical advantage in El Paso's predominantly Hispanic market
- Migrating existing CINC database with established lead pipeline
- First realtor in El Paso with a fully custom AI-powered operating system
- System designed to match and exceed CINC, Follow Up Boss, KvCORE, BoomTown, LionDesk, and Sierra Interactive - combined

---

## LORENA'S EDGE - 6 FEATURES NO COMPETITOR HAS

1. **AI Daily Briefing (Nobody Has This):** Every morning at 7 AM, an AI-generated briefing tells Lorena exactly who to call and why: "Maria Gonzalez (Score: 92) viewed 8 properties yesterday, all in Westside between $350-400K. She's been on your site 4 days in a row. She's ready to buy."

2. **Full AI SMS Conversations (CINC Charges $200/mo Extra):** Custom AI SMS engine that qualifies leads 24/7 through natural conversation. Reads full behavioral context before messaging. Bilingual. Hands off to Lorena when ready. Included free (CINC's "Alex" is $200/mo add-on).

3. **Behavioral Lead Scoring with Evidence (Not a Black Box):** Every score shows exactly why: "Viewed 34 properties in 7 days, saved 6 favorites in Westside, requested 2 showings, responded to SMS drip." 30+ action types scored. Unlike KvCORE's opaque scoring.

4. **AI-Generated CMAs in 60 Seconds (Nobody Does This):** Address input - comparable sales pulled - Claude API analyzes - branded PDF generated. 60 seconds vs. 1-2 hours manually.

5. **Three AutoTrack Types (Matching + Beating CINC):** Sequence (time-based drip), Calendar (birthday/holiday/anniversary), Checklist (under-contract tasks with automation triggers). Visual builder. Bilingual templates. Auto-enrollment based on score changes.

6. **Full Client Portal + Native App (CINC's Etta Replacement):** Property search, favorites, saved searches with alerts, showings, messaging, home valuation, mortgage calculator - all branded for Lorena.

---

## AUDIENCE AWARENESS

**Lorena's clients:** Beginner to Intermediate. Most are first-time or infrequent homebuyers/sellers. They need guidance, reassurance, and simple interfaces. The client portal must be intuitive - no real estate jargon. Bilingual everything.

**Lorena herself:** Intermediate tech user. She uses her phone primarily. The dashboard must be mobile-first, with clear actions and zero learning curve. She should never have to configure automation rules - the system should work intelligently out of the box.

---

# PART 3 - TECHNICAL SYSTEM SPECIFICATION

*Everything needed to code this system*

---

## SYSTEM ARCHITECTURE

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend (Web) | Next.js 14+ App Router, TypeScript, Tailwind CSS | Public website, Agent Dashboard, Client Portal |
| Mobile App | React Native + Expo | Agent App + Client App (iOS/Android) |
| Database + Auth | Supabase (PostgreSQL, Auth, Realtime, Storage, RLS) | All data, authentication, real-time subscriptions |
| Automation Engine | n8n (self-hosted) | All workflows, drips, scoring, alerts |
| AI Layer | Claude API (Sonnet) + OpenAI GPT-4o | Briefing + CMA + SMS (Claude), Chatbot (OpenAI) |
| MLS Data | Spark API (GEPAR/RESO) | Property listings, comparable sales, IDX compliance |
| SMS/Voice | Twilio | SMS drips, AI SMS conversations, notifications |
| Email | SendGrid | Email drips, property alerts, CMA delivery |
| Hosting | Vercel | Web app deployment |
| App Distribution | Apple App Store + Google Play | Mobile app publishing |

---

## DESIGN SYSTEM

| Element | Value | Usage |
|---------|-------|-------|
| Primary Gold | #C9A84C | Accents, CTAs, highlights, borders, active states |
| Primary Black | #0A0A0A | Headlines, text, nav backgrounds |
| Primary White | #FAFAF5 | Backgrounds, cards, clean space |
| Dark Gray | #333333 | Body text |
| Medium Gray | #888888 | Secondary text, labels |
| Light Gray | #F5F5F0 | Card backgrounds, section dividers |
| Border Gray | #E5E5E0 | Borders, separators |
| Hot (Score 80-100) | #DC2626 | Red glow, fire emoji |
| Warm (Score 50-79) | #EA580C | Orange indicators |
| Cool (Score 20-49) | #2563EB | Blue indicators |
| Cold (Score 0-19) | #9CA3AF | Gray indicators |
| Success | #16A34A | Green confirmations |
| Headline Font | Playfair Display | All h1, h2, h3, page titles, section headers, logo |
| Body Font | Lato | All body text, buttons, inputs, labels, paragraphs |
| Design Style | Compass-inspired luxury minimalism | Clean, spacious, editorial |
| UI Library | shadcn/ui | Component foundation |

**UI Principles:**
- Professional, not "AI-looking." No neon gradients, no glassmorphism.
- Compass luxury meets Bloomberg Terminal data density.
- 2-click rule for any action.
- Mobile-first responsive. Bottom nav on mobile. Touch-friendly (44px min targets).
- Skeleton loading (shimmer), never spinners.
- Zero empty states - every screen has branded empty state with clear CTA.
- Gold on dark mode = stunning.
- No framework branding anywhere. This is Lorena's system.

---

## APPLICATION ROUTES

### Agent Dashboard (Protected - agent role only)
```
/dashboard                      - AI Command Center (home)
/dashboard/leads                - Smart Lead Pipeline (table + kanban)
/dashboard/leads/[id]           - Lead Detail (7 tabs: Overview, Activity, Properties, Messages, Showings, Drip Status, Checklists)
/dashboard/messages             - Messages Hub (split-pane, all channels)
/dashboard/showings             - Showings Calendar (day/week/month/list)
/dashboard/cma                  - CMA Generator (address - AI analysis - PDF)
/dashboard/autotracks           - AutoTracks Manager (sequences, calendar, checklists)
/dashboard/analytics            - Analytics (5 tabs: Overview, Leads, Campaigns, Sources, Performance)
/dashboard/settings             - Settings (5 tabs: Profile, Notifications, Integrations, Templates, Data)
```

### Client Portal (Protected - authenticated clients)
```
/portal                         - Client Dashboard (personalized feed, recommendations)
/portal/search                  - Property Search (MLS, filters, map + list view)
/portal/favorites               - Saved Favorites (heart-saved, organized by lists)
/portal/searches                - Saved Searches (criteria, alert toggles, match counts)
/portal/messages                - Messages with Lorena
/portal/showings                - Showings (request, view, manage, feedback)
/portal/home-value              - Home Valuation Form (submit for free CMA)
/portal/calculator              - Mortgage Calculator (interactive, sliders, donut chart)
/portal/profile                 - Profile (contact, preferences, language EN/ES, notifications)
```

### Public Website (Unauthenticated)
```
/                               - Homepage (hero, featured listings, neighborhoods, CMA CTA, testimonials)
/properties                     - Property Search (public, registration wall after 5+ views)
/properties/[id]                - Property Detail (gallery, details, map, calculator, similar)
/home-value                     - Home Valuation Landing Page (lead capture form)
/login                          - Login (centered card, gold accents)
/signup                         - Client Signup (creates lead record + redirects to /portal)
```

---

## DATABASE SCHEMA (SUPABASE / POSTGRESQL)

### Core Tables
```sql
-- PROFILES (extends Supabase auth.users)
profiles: id, email, full_name, phone, role ('agent'|'client'), avatar_url, language ('en'|'es'), created_at

-- LEADS (the heart of the system)
leads: id, profile_id (nullable), full_name, email, phone, type ('buyer'|'seller'|'both'|'investor'|'renter'),
  status ('new'|'contacted'|'qualified'|'active'|'under_contract'|'closed_won'|'closed_lost'|'nurture'),
  source, score (0-100), temperature ('hot'|'warm'|'cool'|'cold'),
  preferences (JSONB: areas, price_min, price_max, beds, baths, property_type),
  budget_min, budget_max, is_pre_approved, timeline,
  birthday, home_anniversary_date, tags (JSONB), notes (TEXT),
  last_active_at, created_at, updated_at

-- LEAD ACTIVITY (behavioral tracking - feeds scoring engine)
lead_activity: id, lead_id, action (TEXT), metadata (JSONB), points (INTEGER), page_url, created_at
-- Actions: login, property_view, property_favorite, search_save, showing_request, message_sent,
--          home_valuation_submit, email_open, email_click, sms_reply, chatbot_message, return_visit,
--          registration, showing_attended, showing_missed, link_click

-- PROPERTIES (mock + MLS via Spark API)
properties: id, mls_number, address, neighborhood, city, state, zip, lat, lng,
  price, beds, baths, sqft, lot_sqft, year_built, property_type, status,
  description, features (JSONB), photos (TEXT[]), virtual_tour_url,
  days_on_market, price_per_sqft, hoa_fee, listed_at, created_at

-- MESSAGES (all channels unified)
messages: id, lead_id, sender_type ('agent'|'client'|'ai_chatbot'|'ai_sms'|'system'),
  channel ('sms'|'email'|'direct'|'chatbot'), content, attachments (JSONB),
  is_read, created_at

-- SHOWINGS
showings: id, lead_id, property_id, showing_date, showing_time, duration_minutes,
  status ('requested'|'confirmed'|'completed'|'cancelled'|'no_show'),
  notes, feedback, created_at

-- SAVED SEARCHES
saved_searches: id, lead_id, name, criteria (JSONB), alerts_enabled, last_alert_sent, created_at

-- FAVORITES
favorites: id, lead_id, property_id, notes, created_at

-- DAILY BRIEFINGS (AI-generated)
daily_briefings: id, briefing_date, content (JSONB), hot_leads (JSONB), summary, created_at

-- NOTIFICATIONS
notifications: id, profile_id, type, title, body, data (JSONB), is_read, action_url, created_at
```

### Automation Tables
```sql
-- DRIP SEQUENCES (AutoTracks - sequence, calendar, checklist types)
drip_sequences: id, name, type ('sequence'|'calendar'|'checklist'),
  lead_type, score_range_min, score_range_max, steps (JSONB), is_active, created_at

-- DRIP ENROLLMENTS
drip_enrollments: id, lead_id, sequence_id, current_step,
  status ('active'|'paused'|'completed'|'cancelled'),
  enrolled_at, next_send_at, paused_at, completed_at

-- DRIP MESSAGES SENT
drip_messages_sent: id, enrollment_id, lead_id, channel, content,
  status ('queued'|'sent'|'delivered'|'opened'|'clicked'|'bounced'|'failed'),
  sent_at, opened_at, clicked_at

-- CHECKLIST TEMPLATES
checklist_templates: id, name, items (JSONB), created_at

-- CHECKLIST INSTANCES (assigned to leads)
checklist_instances: id, template_id, lead_id, items_status (JSONB), completed_at, created_at

-- CALENDAR CAMPAIGNS
calendar_campaigns: id, name, campaign_date, sms_template, email_template, target_filter (JSONB), created_at

-- EMAIL TEMPLATES
email_templates: id, name, category ('drip'|'alert'|'transactional'|'marketing'|'calendar'),
  subject_en, subject_es, body_html_en, body_html_es, variables (TEXT[]), is_active, created_at

-- NOTIFICATION PREFERENCES
notification_preferences: id, profile_id (UNIQUE), sms_enabled, email_enabled,
  quiet_hours_start, quiet_hours_end, hot_lead_sms, new_lead_sms,
  showing_request_sms, chatbot_handoff_sms, daily_summary_email, created_at
```

### AI Tables
```sql
-- CHATBOT CONVERSATIONS
chatbot_conversations: id, session_id, lead_id, messages (JSONB), qualification (JSONB),
  status ('active'|'completed'|'handed_off'|'abandoned'), handoff_at, language, page_url, created_at

-- SMS CONVERSATIONS (AI-powered)
sms_conversations: id, lead_id, phone_number, trigger_event, messages (JSONB),
  qualification (JSONB), status ('qualifying'|'agent_ready'|'completed'|'no_response'|'opted_out'),
  handoff_at, message_count, created_at

-- CMA REPORTS
cma_reports: id, profile_id, subject_address, subject_details (JSONB), comparables (JSONB),
  ai_analysis (JSONB), suggested_price_low, suggested_price_recommended, suggested_price_high,
  purpose ('listing'|'buyer_offer'|'general'), pdf_url, lead_id, created_at

-- SOLD PROPERTIES (for CMA comparisons)
sold_properties: id, address, neighborhood, zip, lat, lng, beds, baths, sqft, lot_sqft,
  year_built, sold_price, sold_date, days_on_market, features (JSONB), property_type, created_at
```

**Row Level Security:** Agent sees everything. Clients see only their own data (profile, messages, favorites, searches, showings).

**Realtime:** Enabled on leads, lead_activity, messages, notifications.

---

## BEHAVIORAL SCORING ENGINE

| Action | Points |
|--------|--------|
| Login to portal/app | +5 |
| View property listing | +2 (+5 if same 3+ times) |
| Save/favorite property | +5 |
| Save a search | +10 |
| Request showing | +20 |
| Send message | +10 |
| Submit home valuation | +15 |
| Open email from drip | +2 |
| Click link in email/SMS | +5 |
| View 5+ properties/session | +10 |
| Return visit (24+ hrs gap) | +8 |
| Respond to AI SMS | +15 |
| Attend showing | +15 |
| Complete chatbot qualification | +15 |
| Chatbot handoff | +20 |
| SMS handoff | +20 |
| Inactive 7+ days | -10 |
| Inactive 14+ days | -15 |
| Inactive 30+ days | -25 |
| Miss showing | -5 |
| Email bounce | -5 |
| SMS opt-out | -15 |

**Temperature Mapping:** Hot = 80-100 (red), Warm = 50-79 (orange), Cool = 20-49 (blue), Cold = 0-19 (gray)

**Score Triggers:**
- Crosses 70 - Alert Lorena immediately (SMS + push)
- Drops below 30 - Auto-enroll in Re-engagement drip
- Changes to "Under Contract" - Cancel all sequences, activate Closing checklist

---

## EL PASO MARKET KNOWLEDGE

**Neighborhoods & Price Ranges:**

| Neighborhood | Area | Price Range | Character |
|-------------|------|-------------|-----------|
| Mesa Hills | Westside | $280-$450K | Established, near UTEP, family-friendly |
| Coronado Hills | Westside | $300-$500K | Premium, near Coronado HS, mountain views |
| Kern Place | Westside | $200-$400K | Historic, walkable, near UTEP |
| Pebble Hills | Northeast | $250-$450K | Newer development, master-planned |
| Horizon City | Northeast | $180-$320K | Affordable, growing, families |
| Montwood | East | $180-$300K | Large area, schools, shopping |
| Eastlake | East | $200-$350K | Master-planned, amenities, lakes |
| Socorro | East | $150-$280K | Affordable, growing, space |
| Sunset Heights | Central | $120-$250K | Historic, revitalizing, investment |
| Manhattan Heights | Central | $130-$220K | Central location, diverse |
| Canutillo | Upper Valley | $200-$400K | Rural feel, larger lots |
| Country Club | Upper Valley | $350-$600K+ | Luxury, golf course, established |

**Key Market Facts:**
- El Paso population: ~700,000 (metro ~870,000)
- ~82% Hispanic population - bilingual everything is non-negotiable
- Fort Bliss military base - constant inflow/outflow of military families
- Median home price: ~$230,000 (well below national average)
- Strong seller's market with limited inventory
- Growing construction and industrial development
- Lower cost of living attracts remote workers and retirees

---

## 8-PHASE IMPLEMENTATION ROADMAP

| Phase | Name | What Gets Built |
|-------|------|-----------------|
| 1 | Foundation | Database, auth, all dashboard screens, all portal screens, lead capture, seed data, design system |
| 2 | Intelligence | Behavioral scoring engine, real-time tracking, smart lists, live activity feed, analytics charts |
| 3 | AI Layer | Website chatbot (OpenAI GPT-4o), daily briefing (Claude), AI SMS engine (Twilio+Claude), CMA generator (Claude) |
| 4 | Automation | All drip sequences, Twilio SMS sending, SendGrid email, property alerts, notification batching, AutoTracks execution engine |
| 5 | Mobile App | React Native + Expo, Agent App, Client App, push notifications, App Store submission |
| 6 | Migration + MLS | CINC data import, Spark MLS API integration, GEPAR compliance, IDX |
| 7 | Polish | Performance optimization, edge cases, testing, bug fixes, security audit |
| 8 | Open House | QR code lead capture, mobile sign-in kiosk, auto-lead creation at open houses |

---

## PRE-BUILT AUTOTRACK SEQUENCES

**1. Speed-to-Lead (3 steps, same day)** - Fires IMMEDIATELY on new registration
**2. New Buyer Welcome (8 steps, 30 days)** - SMS intro - Email welcome + listings - SMS new listing - Email value content - SMS showing offer - Blocking reminder - Email market update - Email "What's New"
**3. Seller CMA Nurture (5 steps, 14 days)** - SMS analysis ready - Email "What's Your Home Worth?" - SMS market stats - Blocking call reminder - Email next steps
**4. Re-engagement (4 steps, 30 days)** - Email "We miss you" - SMS market teaser - Email price drops - SMS final check
**5. Post-Closing (6 steps, 365 days)** - SMS thank you - Email homeowner tips - SMS review request - Email referral ask - Email equity update - SMS home-iversary

**Calendar Campaigns (10 holidays + per-lead):**
New Year, Valentine's, Easter, Mother's Day, July 4th, Halloween, Thanksgiving, Christmas, Birthday (per-lead), Home Anniversary (per-lead) - all bilingual EN/ES

**Checklists:**
Buyer Under Contract (18 items across 4 categories with automation triggers)
Seller Listing (15 items across 4 categories with automation triggers)

---

## COMPETITIVE ANALYSIS - WHAT WE BEAT

| Feature | CINC | Follow Up Boss | KvCORE | Lorena's System |
|---------|------|---------------|--------|-----------------|
| AI Daily Briefing | No | No | No | Yes |
| AI SMS (included) | $200/mo extra | No | No | Yes Free |
| Behavioral Scoring with Evidence | Opaque | Basic | Opaque | Full evidence |
| AI CMA Generation | No | No | No | 60 seconds |
| Bilingual (EN/ES) throughout | Partial | No | No | Everything |
| Visual AutoTrack Builder | Forms only | No | No | Timeline + drag |
| Website Chatbot (included) | No | No | Basic | GPT-4o powered |
| Client Portal + App | Etta (basic, low adoption) | No | Basic | Full-featured |
| Monthly Cost | $1,750+ (verified) | $400-$800 | $500-$1,200 | $95-$150 infra |

---

## CINC FEATURE-BY-FEATURE REPLACEMENT MAP

*This is exactly what CINC does and exactly how our system replaces each feature - so the system knows the target for every feature it builds.*

### CINC CRM Core
| CINC Feature | How It Works in CINC | Our Replacement | Our Advantage |
|-------------|---------------------|-----------------|---------------|
| Lead Pipeline | Manual pipeline stages, drag leads between columns | Smart Lead Pipeline with AI-ranked "who to call next" sorting | AI ranks by behavioral score + evidence, not just manual stages |
| Lead Detail | Contact info, activity feed, notes, tags, pipeline stage | 7-tab lead detail (Overview, Activity, Properties, Messages, Showings, Drip Status, Checklists) | Richer data model, score breakdown visible, all channels unified |
| Lead Scoring | Tracks 1,287+ behaviors but score is opaque (no explanation) | Transparent scoring - every point shows the action that earned it | Lorena sees "WHY" a lead is hot, not just a number |
| Lead Routing / Switchboard Sarah | Auto-assigns leads to agents based on rules, weighting, caps | Not needed (solo agent) - all leads go to Lorena | Simpler. If she grows a team later, we add routing |
| RealVerified Leads | 2FA phone verification via SMS code at registration | Phone verification at registration (Twilio) | Same capability, no extra cost |
| Labels / Tags | Categorize leads with custom labels | Tags (JSONB array), filterable, bulk-editable | More flexible, searchable |
| Notes | Text notes on lead record | Rich notes on lead detail + activity timeline | Notes + full activity context in one view |

### CINC AI "Alex" (Structurely-powered - $200/mo add-on)
| CINC Feature | How It Works in CINC | Our Replacement | Our Advantage |
|-------------|---------------------|-----------------|---------------|
| AI SMS Conversations | "Alex" texts leads pretending to be human assistant. Intentionally misspells words. Uses emojis. Qualifies: timeframe, criteria, price, situation, motivation. | Claude-powered AI SMS engine with full behavioral context | Our AI reads lead's actual browsing behavior before messaging. Claude reasons better than Structurely. No fake misspellings - just natural conversation. |
| Agent Ready Handoff | When lead is qualified (location, beds, baths, price, financing identified), marks "Agent Ready" and notifies agent | Same - handoff when qualified + wants appointment, with full context summary | We also auto-update lead details/pipeline (CINC can't do this automatically) |
| Drip Pause During AI | Skips AutoTrack text messages while AI conversation is active | Same - all drip enrollments pause when AI SMS is active | Identical behavior, prevents double-messaging |
| Behavioral Message Triggers | When existing leads trigger website activity, Alex picks up conversation | Same - AI SMS triggers on: 5+ property session, first search save, return after 7+ day gap, drip reply, score change | More trigger types, more context per trigger |
| 24/7/365 Availability | Alex responds any time | Same - Claude API has no hours | Identical |
| Mass Text Compatibility | Mass texts sent to AI engine so Alex can respond in context | We don't do mass texting - all messages are personalized | Better for deliverability and client experience |

### CINC AutoTracks (3 Types)
| CINC Feature | How It Works in CINC | Our Replacement | Our Advantage |
|-------------|---------------------|-----------------|---------------|
| Sequence AutoTracks | Time-based drip: Day 1 email, Day 3 text, Day 7 reminder, etc. | Identical - sequence engine with day/time steps, SMS + email + blocking reminders | Visual timeline builder (CINC uses forms). Auto-enrollment on score changes. Holiday skip logic. Bilingual templates. |
| Calendar AutoTracks | Date-specific: holidays, birthdays, anniversaries on set calendar dates | Identical - calendar campaign engine processing daily at 7 AM | Auto-generates next year's campaigns (CINC requires manual year-by-year setup). Bilingual. Per-lead birthdays + home anniversaries. |
| Checklist AutoTracks | Task lists attached to leads (under contract items, etc.) | Identical - checklist templates with dependency chains and automation triggers | Checking an item can auto-fire SMS, email, notification, or status change. Visual progress bars. Dependency chains (item B requires item A). |
| AutoTrack Triggers | Start trigger based on: new lead, pipeline change, manual enrollment | Same + more: score crosses threshold, score drops below threshold, status change, manual enrollment | Score-based auto-enrollment is unique to our system |

### CINC Website / IDX
| CINC Feature | How It Works in CINC | Our Replacement | Our Advantage |
|-------------|---------------------|-----------------|---------------|
| IDX Property Search | MLS-connected property search on CINC website | Spark API-powered property search on casasenelpasotx.com | Custom design (Compass-level), not CINC template. Bilingual. |
| Registration Wall | Forces registration after browsing X properties | Same - registration wall after 5+ property views, saving favorite, search alert, showing request, valuation, or extended chatbot | More trigger points, smoother UX |
| Home Valuation Landing Page | Seller lead capture: "What's your home worth?" form | `/home-value` page with address form - auto-creates lead - triggers CMA generation - enrolls in Seller Nurture sequence - notifies Lorena | Full automation chain on submit (CINC just captures the form, agent does the rest manually) |
| Property Alerts | Email alerts when new listings match saved search criteria | Same - 6-hour cron matching saved_searches against new listings, email + optional SMS + in-app notification | Also checks price drops on favorited properties (CINC doesn't) |
| Agent Subdomains | Each team agent gets their own website subdomain | Not needed (solo) - single branded domain | Cleaner, more professional |

### CINC Etta (Client App)
| CINC Feature | How It Works in CINC | Our Replacement | Our Advantage |
|-------------|---------------------|-----------------|---------------|
| Property Search | Clients search listings on mobile app | Client portal web + React Native app with full MLS search, filters, map view | Better UX, bilingual, branded for Lorena specifically |
| Saved Favorites | Heart properties to save | Same - favorites with lists, notes, sharing | Can compare 2-3 side-by-side |
| Saved Searches + Alerts | Set criteria, get notified on new matches | Same - saved searches with alert toggles, new match counts | Also alerts on price drops for favorited properties |
| Messaging | Message agent through app | Same - direct messaging + attach properties | Unified with all other channels (SMS, email, chatbot, AI SMS) |
| Showing Requests | Request a showing from app | Same - request showing, view upcoming, leave feedback | Auto-confirmation SMS, 2hr reminder, post-showing feedback + task creation |

### CINC VOIP Dialer (Add-on)
| CINC Feature | How It Works in CINC | Our Replacement | Our Advantage |
|-------------|---------------------|-----------------|---------------|
| Click-to-Call | Call leads from CRM without physical phone | Click-to-call from lead detail (Twilio) | Same capability. Also: calls logged to activity timeline. AI can suggest optimal call times. |
| Call Filtering | Filter leads by pipeline/labels before calling | Same - filter by score, status, tags, then click to call | Score-based priority (call hottest leads first) |

### CINC Reporting
| CINC Feature | How It Works in CINC | Our Replacement | Our Advantage |
|-------------|---------------------|-----------------|---------------|
| Drip Campaign Stats | Open rates, click rates per AutoTrack | Same - sent, delivered, opened, clicked, replied, conversion per sequence | Also shows reply rate and actual conversion to showing/close |
| Lead Source Performance | Which sources produce leads | Same - source breakdown with leads, conversion %, avg score, pipeline $, ROI | ROI calculation per source |
| Agent Activity Reports | Track agent follow-up, calls, emails | Response time tracking, AI automation stats, speed-to-lead timer | AI does most of the follow-up - reports show human + AI combined performance |

### WHAT CINC DOESN'T HAVE (Our Exclusive Features)
| Feature | Why It Matters |
|---------|---------------|
| **AI Daily Briefing** | "Good morning, Lorena. Maria Gonzalez viewed 8 properties yesterday. She's ready to buy." - No competitor has this. |
| **AI CMA Generation** | 60-second branded CMAs from an address. No competitor has this. |
| **Transparent Score Evidence** | Every score shows exactly which actions earned points. CINC's score is a black box. |
| **Website Chatbot (included)** | GPT-4o powered, bilingual, qualifies leads on-site. CINC doesn't have a chatbot. |
| **Bilingual Everything** | EN/ES on every screen, every template, every AI conversation. CINC has partial Spanish support at best. |
| **Price Drop Alerts** | Notifies clients when favorited properties drop in price. CINC only alerts on new matches. |
| **Post-Showing Auto-Tasks** | After a showing, system auto-creates "Get feedback from Maria on 123 Mesa St." CINC doesn't. |
| **Mortgage Calculator** | Interactive calculator in client portal. CINC/Etta doesn't have this. |
| **Dark Mode** | Gold on dark = stunning. CINC has no dark mode. |

---

## ENVIRONMENT VARIABLES REQUIRED

```
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
OPENAI_API_KEY=          (Chatbot - GPT-4o for speed + streaming + function calling)
ANTHROPIC_API_KEY=       (Briefing + SMS + CMA - Claude Sonnet for quality reasoning)

# Communications
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_URL=
SENDGRID_API_KEY=

# MLS
SPARK_API_KEY=           (Phase 6)
SPARK_API_SECRET=        (Phase 6)

# Feature Flags
NEXT_PUBLIC_CHATBOT_ENABLED=true
NEXT_PUBLIC_AI_SMS_ENABLED=true
```

---

## PRICING MODEL (FOR MANOREV / EMMANUEL)

| Item | Amount |
|------|--------|
| Project Fee | $20,000-$25,000 |
| Monthly Recurring | $1,200-$1,500/mo |
| Infrastructure Cost | $225-$490/mo |
| Monthly Margin | $710-$1,275/mo |

**Upsells:** Facebook/Google ads (+$500-$1,500/mo), social content (+$500/mo), AI voice agent (+$300/mo), additional landing pages ($500-$1K each), additional agent seats (+$200/mo each).

**White-Label Opportunity:** Build once for Lorena - template for every realtor. At 5 clients: $6,000-$7,500/mo recurring + $100K-$125K project fees. From one niche, one city.

---

## CODING PRINCIPLES FOR THIS PROJECT

1. **Production code only.** No TODO placeholders in visible features.
2. **TypeScript strict mode.** No `any` types.
3. **All Supabase queries in custom hooks.** Reusable, testable.
4. **Mobile-first responsive.** Test at 375px width minimum.
5. **Skeleton loading always.** Shimmer placeholders matching actual content layout.
6. **Every loading state = skeleton shimmer, NOT spinner.**
7. **Performance:** Lazy load images, virtualize long lists, code-split dashboard vs portal.
8. **Accessibility:** ARIA labels, keyboard navigation, sufficient contrast.
9. **Zero empty states.** Every screen has branded empty state with clear CTA.
10. **Bilingual support.** Language toggle, templates in EN and ES.
11. **Gold on dark = stunning.** Dark mode support with CSS variables.
12. **No framework branding anywhere.** This is Lorena's system, period.

---

*This Business Brain was compiled from the complete 4-phase system specification for Lorena's Realtor Operating System, built by Manorev (Emmanuel) - an AI-powered business operating systems company based in El Paso, Texas.*

*Last Updated: February 2026*
*Document Version: 1.0*
*Total System Specification: ~5,500+ lines across 4 phase prompts*
