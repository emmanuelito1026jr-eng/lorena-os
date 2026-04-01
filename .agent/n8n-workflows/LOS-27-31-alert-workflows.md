# LOS-27 through LOS-31: MLS Alert Workflows

## Overview

These five workflows form the alert and notification layer for the MLS integration. They are triggered by LOS-26 (MLS Sync Engine) and by schedule triggers, and they route listing alerts to leads based on their saved searches, interaction history, and preferences.

**Workflow Index:**

| ID | Name | Trigger | Purpose |
|----|------|---------|---------|
| LOS-27 | New Listing Alert Engine | Webhook from LOS-26 | Match new listings to saved searches, send instant/queue alerts |
| LOS-28 | Price Change Alert Engine | Webhook from LOS-26 | Notify interested leads about price decreases |
| LOS-29 | Status Change Alert Engine | Webhook from LOS-26 | Handle pending/sold/back-on-market notifications |
| LOS-30 | Daily/Weekly Digest Compiler | Schedule (daily 8AM, weekly Mon) | Compile and send queued alerts as digest emails |
| LOS-31 | AI Listing Matcher | Schedule (daily 10AM MST) | Claude AI matches top buyer leads with personalized listings |

**Shared Dependencies:**

| Table | Used By |
|-------|---------|
| `saved_searches` | LOS-27, LOS-28, LOS-31 |
| `leads` | All |
| `listings` | All |
| `lead_listing_interactions` | LOS-27, LOS-28, LOS-29, LOS-31 |
| `listing_alert_queue` | LOS-27, LOS-28, LOS-30 |
| `market_snapshots` | LOS-30, LOS-31 |
| `favorites` | LOS-28, LOS-29 |
| `messages` | LOS-31 |
| `showings` | LOS-31 |

---

## LOS-27: New Listing Alert Engine

### Trigger

**n8n Node Type:** `n8n-nodes-base.webhook`

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "los-27-new-listing",
    "options": {
      "responseMode": "onReceived"
    }
  },
  "name": "New Listing Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "webhookId": "los-27-new-listing"
}
```

**Webhook URL:** `{{N8N_BASE_URL}}/webhook/los-27-new-listing`

**Expected Payload (from LOS-26 Node 7, Branch A):**

```json
{
  "listing_id": "uuid",
  "spark_id": "20260225123456789012",
  "mls_id": "EP2026-9999",
  "address": "1234 Mesa Hills Dr",
  "city": "El Paso",
  "state": "TX",
  "zip_code": "79912",
  "list_price": 325000,
  "beds": 4,
  "baths": 3,
  "sqft": 2200,
  "property_type": "single_family",
  "property_subtype": "Single Family Residence",
  "subdivision": "Mesa Hills",
  "primary_photo_url": "https://photos.sparkapi.com/...",
  "listing_agent_name": "Lorena Ontiveros-Ortega",
  "is_lorenas_listing": true,
  "list_date": "2026-02-25",
  "timestamp": "2026-02-25T14:30:00Z"
}
```

---

### Node 2: Find Matching Saved Searches

**n8n Node Type:** `n8n-nodes-base.code` (with Supabase query)

Find all saved searches that match this new listing. A saved search matches if the listing satisfies the search criteria (price range, beds, baths, zip, property type).

**SQL Query:**

```sql
SELECT
  ss.id as saved_search_id,
  ss.lead_id,
  ss.name as search_name,
  ss.criteria,
  ss.alert_enabled,
  COALESCE(ss.alert_frequency, 'instant') as alert_frequency,
  l.first_name,
  l.last_name,
  l.email,
  l.phone,
  l.preferred_language,
  l.score,
  l.temperature,
  l.status as lead_status
FROM saved_searches ss
JOIN leads l ON l.id = ss.lead_id
WHERE ss.alert_enabled = true
  AND l.status NOT IN ('lost', 'past_client')
  AND l.verification_status != 'do_not_contact';
```

**Matching Logic (Code Node):**

```javascript
const listing = $json; // incoming webhook payload
const savedSearches = $node["Get Saved Searches"].json; // from Supabase query

const matches = [];

for (const search of savedSearches) {
  const criteria = typeof search.criteria === 'string'
    ? JSON.parse(search.criteria)
    : search.criteria;

  let isMatch = true;

  // Price range check
  if (criteria.minPrice && listing.list_price < criteria.minPrice) isMatch = false;
  if (criteria.maxPrice && listing.list_price > criteria.maxPrice) isMatch = false;

  // Beds/baths minimum
  if (criteria.minBeds && listing.beds < criteria.minBeds) isMatch = false;
  if (criteria.minBaths && listing.baths < criteria.minBaths) isMatch = false;
  if (criteria.beds && listing.beds < criteria.beds) isMatch = false;
  if (criteria.baths && listing.baths < criteria.baths) isMatch = false;

  // ZIP code match
  if (criteria.zip_code && criteria.zip_code !== listing.zip_code) isMatch = false;
  if (criteria.zipCodes && criteria.zipCodes.length > 0) {
    if (!criteria.zipCodes.includes(listing.zip_code)) isMatch = false;
  }

  // Property type match
  if (criteria.propertyType && criteria.propertyType !== listing.property_type) isMatch = false;
  if (criteria.propertyTypes && criteria.propertyTypes.length > 0) {
    if (!criteria.propertyTypes.includes(listing.property_type) &&
        !criteria.propertyTypes.includes(listing.property_subtype)) isMatch = false;
  }

  // Subdivision/neighborhood match
  if (criteria.subdivision && criteria.subdivision !== listing.subdivision) isMatch = false;
  if (criteria.neighborhoods && criteria.neighborhoods.length > 0) {
    if (!criteria.neighborhoods.includes(listing.subdivision)) isMatch = false;
  }

  // Sqft range
  if (criteria.minSqft && listing.sqft < criteria.minSqft) isMatch = false;
  if (criteria.maxSqft && listing.sqft > criteria.maxSqft) isMatch = false;

  // Pool requirement
  if (criteria.pool === true && !listing.pool) isMatch = false;

  if (isMatch) {
    matches.push({
      ...search,
      listing,
    });
  }
}

return matches.map(m => ({ json: m }));
```

---

### Node 3: Route by Alert Frequency

**n8n Node Type:** `n8n-nodes-base.switch`

Split matched leads into two groups based on `alert_frequency`:

| Frequency | Action |
|-----------|--------|
| `instant` | Send alert immediately (email + SMS) |
| `daily` | Queue in `listing_alert_queue` for LOS-30 |
| `weekly` | Queue in `listing_alert_queue` for LOS-30 |

```json
{
  "parameters": {
    "rules": {
      "values": [
        {
          "conditions": {
            "options": { "caseSensitive": true },
            "conditions": [
              { "leftValue": "={{ $json.alert_frequency }}", "rightValue": "instant", "operator": { "type": "string", "operation": "equals" } }
            ]
          },
          "renameOutput": true,
          "outputKey": "instant"
        },
        {
          "conditions": {
            "options": { "caseSensitive": true },
            "conditions": [
              { "leftValue": "={{ $json.alert_frequency }}", "rightValue": "instant", "operator": { "type": "string", "operation": "notEquals" } }
            ]
          },
          "renameOutput": true,
          "outputKey": "queue"
        }
      ]
    }
  },
  "name": "Route by Frequency",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3
}
```

---

### Node 4a: Instant Alert - Send Email (via LOS-25 Email Engine)

**n8n Node Type:** `n8n-nodes-base.httpRequest`

POST to the LOS-25 Email Engine webhook to send a branded new listing alert email.

```
URL: {{N8N_BASE_URL}}/webhook/los-25-send-email
Method: POST
Headers:
  Content-Type: application/json
  X-Workflow-Source: LOS-27
Body:
```

```json
{
  "template": "new_listing_alert",
  "to_email": "{{ $json.email }}",
  "to_name": "{{ $json.first_name }} {{ $json.last_name }}",
  "language": "{{ $json.preferred_language || 'en' }}",
  "subject_en": "New Listing Alert: {{ $json.listing.address }}",
  "subject_es": "Nueva Propiedad: {{ $json.listing.address }}",
  "data": {
    "first_name": "{{ $json.first_name }}",
    "listing_address": "{{ $json.listing.address }}, {{ $json.listing.city }}, {{ $json.listing.state }} {{ $json.listing.zip_code }}",
    "listing_price": "{{ $json.listing.list_price }}",
    "listing_beds": "{{ $json.listing.beds }}",
    "listing_baths": "{{ $json.listing.baths }}",
    "listing_sqft": "{{ $json.listing.sqft }}",
    "listing_photo": "{{ $json.listing.primary_photo_url }}",
    "listing_url": "https://casasenelpasotx.com/#/properties/{{ $json.listing.listing_id }}",
    "search_name": "{{ $json.search_name }}",
    "is_lorenas_listing": "{{ $json.listing.is_lorenas_listing }}"
  }
}
```

---

### Node 4b: Instant Alert - Send SMS (via LOS-06 SMS Engine)

**n8n Node Type:** `n8n-nodes-base.httpRequest`

POST to the LOS-06 SMS engine (or directly use Twilio node) for instant SMS alerts.

**Bilingual SMS templates:**

English (`preferred_language === 'en'`):
```
New listing matching your search "{{ search_name }}"!
{{ beds }}bd/{{ baths }}ba {{ sqft }}sqft - ${{ list_price.toLocaleString() }}
{{ address }}, {{ city }}
View: https://casasenelpasotx.com/#/properties/{{ listing_id }}
- Lorena O.
```

Spanish (`preferred_language === 'es'`):
```
Nueva propiedad que coincide con "{{ search_name }}"!
{{ beds }}rec/{{ baths }}ba {{ sqft }}sqft - ${{ list_price.toLocaleString() }}
{{ address }}, {{ city }}
Ver: https://casasenelpasotx.com/#/properties/{{ listing_id }}
- Lorena O.
```

**Code Node for SMS body:**

```javascript
const lead = $json;
const listing = lead.listing;
const lang = lead.preferred_language || 'en';
const priceFormatted = Number(listing.list_price).toLocaleString('en-US');

let smsBody;
if (lang === 'es') {
  smsBody = `Nueva propiedad que coincide con "${lead.search_name}"!\n` +
    `${listing.beds}rec/${listing.baths}ba ${listing.sqft}sqft - $${priceFormatted}\n` +
    `${listing.address}, ${listing.city}\n` +
    `Ver: https://casasenelpasotx.com/#/properties/${listing.listing_id}\n` +
    `- Lorena O.`;
} else {
  smsBody = `New listing matching your search "${lead.search_name}"!\n` +
    `${listing.beds}bd/${listing.baths}ba ${listing.sqft}sqft - $${priceFormatted}\n` +
    `${listing.address}, ${listing.city}\n` +
    `View: https://casasenelpasotx.com/#/properties/${listing.listing_id}\n` +
    `- Lorena O.`;
}

return [{ json: { ...lead, smsBody, phone: lead.phone } }];
```

**Twilio SMS Node:**

```json
{
  "parameters": {
    "from": "={{ $credentials.twilioApi.phoneNumber }}",
    "to": "={{ $json.phone }}",
    "message": "={{ $json.smsBody }}"
  },
  "name": "Send SMS Alert",
  "type": "n8n-nodes-base.twilio",
  "typeVersion": 1,
  "credentials": {
    "twilioApi": { "id": "PENDING", "name": "Twilio - Lorena SMS" }
  }
}
```

**Guard:** Only send SMS if `lead.phone` exists and is not null. Use an IF node before the Twilio node.

**Quiet hours check:** Do NOT send SMS between 10 PM - 7 AM CST. If within quiet hours, queue the alert for 7 AM delivery.

```javascript
// Quiet hours check
const now = new Date();
const cstHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' })).getHours();
const isQuietHours = cstHour >= 22 || cstHour < 7;

if (isQuietHours) {
  // Queue for 7 AM CST delivery instead
  return [{ json: { ...lead, queueForMorning: true } }];
}
return [{ json: { ...lead, queueForMorning: false } }];
```

---

### Node 4c: Queue for Daily/Weekly Digest

**n8n Node Type:** `n8n-nodes-base.supabase`

Insert into `listing_alert_queue` for non-instant alerts.

```json
{
  "parameters": {
    "operation": "create",
    "tableId": "listing_alert_queue",
    "fieldsUi": {
      "fieldValues": [
        { "fieldId": "saved_search_id", "fieldValue": "={{ $json.saved_search_id }}" },
        { "fieldId": "listing_id", "fieldValue": "={{ $json.listing.listing_id }}" },
        { "fieldId": "lead_id", "fieldValue": "={{ $json.lead_id }}" },
        { "fieldId": "alert_type", "fieldValue": "new_listing" },
        { "fieldId": "frequency", "fieldValue": "={{ $json.alert_frequency }}" },
        { "fieldId": "status", "fieldValue": "pending" },
        { "fieldId": "sent", "fieldValue": false }
      ]
    },
    "resource": "row"
  },
  "name": "Queue Alert",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2,
  "credentials": {
    "supabaseApi": { "id": "37rJREccSDhKtIGi", "name": "Supabase Service Role" }
  }
}
```

---

### Node 5: Log Interactions

**n8n Node Type:** `n8n-nodes-base.supabase`

For every alert sent (instant) or queued, log the interaction in `lead_listing_interactions`.

```json
{
  "parameters": {
    "operation": "create",
    "tableId": "lead_listing_interactions",
    "fieldsUi": {
      "fieldValues": [
        { "fieldId": "lead_id", "fieldValue": "={{ $json.lead_id }}" },
        { "fieldId": "listing_id", "fieldValue": "={{ $json.listing.listing_id }}" },
        { "fieldId": "spark_id", "fieldValue": "={{ $json.listing.spark_id }}" },
        { "fieldId": "mls_id", "fieldValue": "={{ $json.listing.mls_id }}" },
        { "fieldId": "interaction_type", "fieldValue": "alerted" },
        { "fieldId": "source", "fieldValue": "LOS-27" },
        { "fieldId": "notes", "fieldValue": "=Matched saved search: {{ $json.search_name }}" },
        {
          "fieldId": "metadata",
          "fieldValue": "={{ JSON.stringify({ search_id: $json.saved_search_id, frequency: $json.alert_frequency, channel: $json.alert_frequency === 'instant' ? 'email+sms' : 'queued' }) }}"
        }
      ]
    },
    "resource": "row"
  },
  "name": "Log Interaction",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2,
  "credentials": {
    "supabaseApi": { "id": "37rJREccSDhKtIGi", "name": "Supabase Service Role" }
  }
}
```

**Also log behavioral event for scoring (via LOS-05 webhook):**

```
POST {{N8N_BASE_URL}}/webhook/lead-activity
{
  "lead_id": "{{ $json.lead_id }}",
  "event_type": "listing_alert_sent",
  "metadata": {
    "listing_id": "{{ $json.listing.listing_id }}",
    "mls_id": "{{ $json.listing.mls_id }}",
    "alert_type": "new_listing"
  }
}
```

---

### LOS-27 Flow Diagram

```
[Webhook: POST /los-27-new-listing]
    |
[Find Matching Saved Searches] ──> (no matches) ──> [End]
    |
[For Each Match]
    |
[Route by Frequency]
    ├── instant ──> [Quiet Hours Check]
    |                   ├── (ok) ──> [Send Email] + [Send SMS]
    |                   └── (quiet) ──> [Queue for 7 AM]
    └── daily/weekly ──> [Queue in listing_alert_queue]
    |
[Log Interaction in lead_listing_interactions]
[Fire LOS-05 Behavioral Event]
```

---

---

## LOS-28: Price Change Alert Engine

### Trigger

**n8n Node Type:** `n8n-nodes-base.webhook`

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "los-28-price-change",
    "options": {
      "responseMode": "onReceived"
    }
  },
  "name": "Price Change Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "webhookId": "los-28-price-change"
}
```

**Webhook URL:** `{{N8N_BASE_URL}}/webhook/los-28-price-change`

**Expected Payload (from LOS-26 Node 7, Branch B):**

```json
{
  "listing_id": "uuid",
  "spark_id": "20260225123456789012",
  "mls_id": "EP2026-9999",
  "address": "1234 Mesa Hills Dr",
  "city": "El Paso",
  "zip_code": "79912",
  "old_price": 350000,
  "new_price": 325000,
  "change_amount": -25000,
  "change_percent": -7.14,
  "change_type": "decrease",
  "beds": 4,
  "baths": 3,
  "sqft": 2200,
  "primary_photo_url": "https://photos.sparkapi.com/...",
  "listing_agent_name": "Lorena Ontiveros-Ortega",
  "is_lorenas_listing": true,
  "timestamp": "2026-02-25T14:30:00Z"
}
```

---

### Node 2: Check If Price Decreased

**n8n Node Type:** `n8n-nodes-base.if`

**CRITICAL RULE:** Only alert leads on price DECREASES. Price increases are tracked in history but do NOT trigger alerts.

```json
{
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.change_type }}",
          "value2": "decrease",
          "operation": "equals"
        }
      ]
    }
  },
  "name": "Is Price Decrease?",
  "type": "n8n-nodes-base.if",
  "typeVersion": 1
}
```

If `change_type !== 'decrease'`, end workflow (no alerts for increases).

---

### Node 3: Find Interested Leads

**n8n Node Type:** `n8n-nodes-base.code` (with Supabase queries)

Find leads who should be notified, in two groups:

**Group A: Previously Interacted Leads**

Leads who have previously viewed, favorited, or been alerted about this specific listing.

```sql
SELECT DISTINCT
  lli.lead_id,
  l.first_name,
  l.last_name,
  l.email,
  l.phone,
  l.preferred_language,
  l.score,
  l.temperature,
  'interacted' as interest_source
FROM lead_listing_interactions lli
JOIN leads l ON l.id = lli.lead_id
WHERE lli.listing_id = $1  -- the listing that changed price
  AND lli.interaction_type IN ('viewed', 'favorited', 'alerted', 'email_clicked', 'showing_requested')
  AND l.status NOT IN ('lost', 'past_client')
  AND l.verification_status != 'do_not_contact';
```

**Group B: Budget-Match Leads**

Leads whose saved search budget NOW includes this listing (i.e., the price drop brought it into range).

```sql
SELECT DISTINCT
  ss.lead_id,
  l.first_name,
  l.last_name,
  l.email,
  l.phone,
  l.preferred_language,
  l.score,
  l.temperature,
  'budget_match' as interest_source
FROM saved_searches ss
JOIN leads l ON l.id = ss.lead_id
WHERE ss.alert_enabled = true
  AND l.status NOT IN ('lost', 'past_client')
  AND l.verification_status != 'do_not_contact'
  -- The old price was ABOVE their max, but the new price is WITHIN range
  -- This is checked in the Code node below
;
```

**Code Node (budget match filter):**

```javascript
const listing = $json; // webhook payload
const savedSearches = $node["Get Saved Searches"].json;

const budgetMatches = [];

for (const search of savedSearches) {
  const criteria = typeof search.criteria === 'string'
    ? JSON.parse(search.criteria)
    : search.criteria;

  const maxBudget = criteria.maxPrice || criteria.budget_max;
  if (!maxBudget) continue;

  // The old price was above budget, but new price is within budget
  if (listing.old_price > maxBudget && listing.new_price <= maxBudget) {
    // Also check other criteria match
    let otherMatch = true;
    if (criteria.minBeds && listing.beds < criteria.minBeds) otherMatch = false;
    if (criteria.zip_code && criteria.zip_code !== listing.zip_code) otherMatch = false;

    if (otherMatch) {
      budgetMatches.push({
        lead_id: search.lead_id,
        first_name: search.first_name,
        last_name: search.last_name,
        email: search.email,
        phone: search.phone,
        preferred_language: search.preferred_language,
        interest_source: 'budget_match',
        search_name: search.name,
      });
    }
  }
}

return budgetMatches.map(m => ({ json: m }));
```

**Deduplicate:** Merge Group A and Group B, deduplicating by `lead_id`. If a lead appears in both groups, prefer Group A (interacted).

---

### Node 4: Check Favorites for Priority

**n8n Node Type:** `n8n-nodes-base.supabase`

Check if the listing is favorited by any of the matched leads for elevated priority.

```sql
SELECT lead_id
FROM favorites
WHERE property_id = $1  -- listing_id
  AND lead_id = ANY($2);  -- array of matched lead_ids
```

Leads who favorited this listing get both email AND SMS. Others get email only.

---

### Node 5: Send Price Drop Alerts

**Bilingual SMS Templates:**

English:
```
Price drop alert! ${{ old_price.toLocaleString() }} -> ${{ new_price.toLocaleString() }} (-{{ Math.abs(change_percent) }}%)
{{ address }}, {{ city }}
{{ beds }}bd/{{ baths }}ba {{ sqft }}sqft
View: https://casasenelpasotx.com/#/properties/{{ listing_id }}
- Lorena O.
```

Spanish:
```
Baja de precio! ${{ old_price.toLocaleString() }} -> ${{ new_price.toLocaleString() }} (-{{ Math.abs(change_percent) }}%)
{{ address }}, {{ city }}
{{ beds }}rec/{{ baths }}ba {{ sqft }}sqft
Ver: https://casasenelpasotx.com/#/properties/{{ listing_id }}
- Lorena O.
```

**Email via LOS-25:**

```json
{
  "template": "price_change_alert",
  "to_email": "{{ $json.email }}",
  "to_name": "{{ $json.first_name }} {{ $json.last_name }}",
  "language": "{{ $json.preferred_language || 'en' }}",
  "subject_en": "Price Drop: {{ listing.address }} now ${{ listing.new_price.toLocaleString() }}",
  "subject_es": "Baja de Precio: {{ listing.address }} ahora ${{ listing.new_price.toLocaleString() }}",
  "data": {
    "first_name": "{{ $json.first_name }}",
    "listing_address": "{{ listing.address }}",
    "old_price": "{{ listing.old_price }}",
    "new_price": "{{ listing.new_price }}",
    "change_percent": "{{ listing.change_percent }}",
    "listing_beds": "{{ listing.beds }}",
    "listing_baths": "{{ listing.baths }}",
    "listing_sqft": "{{ listing.sqft }}",
    "listing_photo": "{{ listing.primary_photo_url }}",
    "listing_url": "https://casasenelpasotx.com/#/properties/{{ listing.listing_id }}",
    "interest_source": "{{ $json.interest_source }}"
  }
}
```

---

### Node 6: Log Interactions

Same pattern as LOS-27 Node 5. Log `interaction_type: 'price_drop_alerted'` in `lead_listing_interactions`.

```json
{
  "lead_id": "uuid",
  "listing_id": "uuid",
  "interaction_type": "price_drop_alerted",
  "source": "LOS-28",
  "notes": "Price decreased from $350,000 to $325,000 (-7.14%)",
  "metadata": {
    "old_price": 350000,
    "new_price": 325000,
    "change_percent": -7.14,
    "interest_source": "interacted"
  }
}
```

---

### LOS-28 Flow Diagram

```
[Webhook: POST /los-28-price-change]
    |
[Is Price Decrease?]
    ├── NO ──> [End - no alerts for increases]
    └── YES
         |
    [Find Group A: Previously Interacted Leads]
    [Find Group B: Budget-Match Leads]
         |
    [Deduplicate by lead_id]
         |
    [Check Favorites for Priority]
         |
    [For Each Lead]
         ├── (favorited) ──> [Send Email + SMS]
         └── (not favorited) ──> [Send Email Only]
         |
    [Log Interactions]
```

---

---

## LOS-29: Status Change Alert Engine

### Trigger

**n8n Node Type:** `n8n-nodes-base.webhook`

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "los-29-status-change",
    "options": {
      "responseMode": "onReceived"
    }
  },
  "name": "Status Change Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "webhookId": "los-29-status-change"
}
```

**Webhook URL:** `{{N8N_BASE_URL}}/webhook/los-29-status-change`

**Expected Payload (from LOS-26 Node 7, Branch C):**

```json
{
  "listing_id": "uuid",
  "spark_id": "20260225123456789012",
  "mls_id": "EP2026-9999",
  "address": "1234 Mesa Hills Dr",
  "city": "El Paso",
  "zip_code": "79912",
  "list_price": 325000,
  "old_status": "active",
  "new_status": "pending",
  "beds": 4,
  "baths": 3,
  "sqft": 2200,
  "primary_photo_url": "https://photos.sparkapi.com/...",
  "listing_agent_name": "Lorena Ontiveros-Ortega",
  "is_lorenas_listing": true,
  "timestamp": "2026-02-25T14:30:00Z"
}
```

---

### Node 2: Route by Status Transition

**n8n Node Type:** `n8n-nodes-base.switch`

Different status transitions require different actions:

| Old Status | New Status | Action |
|-----------|------------|--------|
| active | pending | "Listing Gone" alert + find similar alternatives |
| active | sold | "Listing Sold" alert + find similar alternatives |
| pending | sold | "Listing Closed" - log only, no alert (lead already knows) |
| pending/sold | active | "Back on Market!" - HIGH URGENCY alert |
| withdrawn/sold | active | "Back on Market!" - HIGH URGENCY alert |
| any | withdrawn | Log only, no alert |
| any | expired | Log only, no alert |
| any | canceled | Log only, no alert |

```json
{
  "parameters": {
    "rules": {
      "values": [
        {
          "conditions": {
            "conditions": [
              { "leftValue": "={{ $json.new_status }}", "rightValue": "pending", "operator": { "type": "string", "operation": "equals" } },
              { "leftValue": "={{ $json.old_status }}", "rightValue": "active", "operator": { "type": "string", "operation": "equals" } }
            ],
            "combinator": "and"
          },
          "renameOutput": true,
          "outputKey": "listing_gone"
        },
        {
          "conditions": {
            "conditions": [
              { "leftValue": "={{ $json.new_status }}", "rightValue": "sold", "operator": { "type": "string", "operation": "equals" } },
              { "leftValue": "={{ $json.old_status }}", "rightValue": "active", "operator": { "type": "string", "operation": "equals" } }
            ],
            "combinator": "and"
          },
          "renameOutput": true,
          "outputKey": "listing_gone"
        },
        {
          "conditions": {
            "conditions": [
              { "leftValue": "={{ $json.new_status }}", "rightValue": "active", "operator": { "type": "string", "operation": "equals" } },
              { "leftValue": "={{ $json.old_status }}", "rightValue": "active", "operator": { "type": "string", "operation": "notEquals" } }
            ],
            "combinator": "and"
          },
          "renameOutput": true,
          "outputKey": "back_on_market"
        },
        {
          "conditions": {
            "conditions": [
              { "leftValue": "={{ $json.new_status }}", "rightValue": "withdrawn", "operator": { "type": "string", "operation": "equals" } }
            ]
          },
          "renameOutput": true,
          "outputKey": "log_only"
        },
        {
          "conditions": {
            "conditions": [
              { "leftValue": "={{ $json.new_status }}", "rightValue": "expired", "operator": { "type": "string", "operation": "equals" } }
            ]
          },
          "renameOutput": true,
          "outputKey": "log_only"
        },
        {
          "conditions": {
            "conditions": [
              { "leftValue": "={{ $json.new_status }}", "rightValue": "canceled", "operator": { "type": "string", "operation": "equals" } }
            ]
          },
          "renameOutput": true,
          "outputKey": "log_only"
        }
      ],
      "fallbackOutput": "log_only"
    }
  },
  "name": "Route by Status",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3
}
```

---

### Node 3a: "Listing Gone" Path (active -> pending/sold)

**Step 1: Find interested leads** (same SQL as LOS-28 Group A - leads who interacted with this listing):

```sql
SELECT DISTINCT
  lli.lead_id,
  l.first_name,
  l.last_name,
  l.email,
  l.phone,
  l.preferred_language
FROM lead_listing_interactions lli
JOIN leads l ON l.id = lli.lead_id
WHERE lli.listing_id = $1
  AND lli.interaction_type IN ('viewed', 'favorited', 'alerted', 'email_clicked', 'showing_requested')
  AND l.status NOT IN ('lost', 'past_client')
  AND l.verification_status != 'do_not_contact';
```

**Step 2: Find similar alternatives** (same zip, similar price/beds, still active):

```sql
SELECT
  id, address, city, zip_code, list_price, beds, baths, sqft,
  primary_photo_url, property_type, subdivision
FROM listings
WHERE status = 'active'
  AND zip_code = $1  -- same zip as the gone listing
  AND list_price BETWEEN $2 * 0.8 AND $2 * 1.2  -- +/- 20% of listing price
  AND beds >= $3 - 1  -- similar beds (allow 1 less)
  AND id != $4  -- not the same listing
ORDER BY list_price ASC
LIMIT 3;
```

**Step 3: Send "Listing Gone + Alternatives" email:**

```json
{
  "template": "listing_gone",
  "to_email": "{{ $json.email }}",
  "language": "{{ $json.preferred_language || 'en' }}",
  "subject_en": "{{ listing.address }} is now {{ new_status === 'pending' ? 'Under Contract' : 'Sold' }}",
  "subject_es": "{{ listing.address }} ahora esta {{ new_status === 'pending' ? 'En Contrato' : 'Vendida' }}",
  "data": {
    "first_name": "{{ $json.first_name }}",
    "listing_address": "{{ listing.address }}",
    "listing_price": "{{ listing.list_price }}",
    "listing_photo": "{{ listing.primary_photo_url }}",
    "new_status": "{{ listing.new_status }}",
    "alternatives": [
      {
        "address": "...",
        "price": "...",
        "beds": "...",
        "baths": "...",
        "photo": "...",
        "url": "https://casasenelpasotx.com/#/properties/..."
      }
    ]
  }
}
```

---

### Node 3b: "Back on Market" Path (pending/sold/withdrawn -> active)

**HIGH URGENCY ALERT.** This is a rare and exciting event for leads.

**Step 1: Find leads who previously interacted:**

Same SQL as 3a Step 1.

**Step 2: Send urgent "Back on Market" alert via Email + SMS:**

English SMS:
```
BACK ON MARKET! The property at {{ address }} (${{ list_price.toLocaleString() }}) is available again!
{{ beds }}bd/{{ baths }}ba {{ sqft }}sqft
Act fast: https://casasenelpasotx.com/#/properties/{{ listing_id }}
- Lorena O.
```

Spanish SMS:
```
DE VUELTA AL MERCADO! La propiedad en {{ address }} (${{ list_price.toLocaleString() }}) esta disponible otra vez!
{{ beds }}rec/{{ baths }}ba {{ sqft }}sqft
Actua rapido: https://casasenelpasotx.com/#/properties/{{ listing_id }}
- Lorena O.
```

**Email template:** `back_on_market` via LOS-25.

---

### Node 3c: "Log Only" Path (withdrawn/expired/canceled)

**n8n Node Type:** `n8n-nodes-base.supabase`

No alert sent. Just log the status change for internal tracking.

```json
{
  "parameters": {
    "operation": "create",
    "tableId": "lead_listing_interactions",
    "fieldsUi": {
      "fieldValues": [
        { "fieldId": "lead_id", "fieldValue": "=system" },
        { "fieldId": "listing_id", "fieldValue": "={{ $json.listing_id }}" },
        { "fieldId": "interaction_type", "fieldValue": "status_changed" },
        { "fieldId": "source", "fieldValue": "LOS-29" },
        { "fieldId": "notes", "fieldValue": "=Status changed: {{ $json.old_status }} -> {{ $json.new_status }} (no alert sent)" }
      ]
    },
    "resource": "row"
  },
  "name": "Log Status Change (No Alert)",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2
}
```

---

### LOS-29 Flow Diagram

```
[Webhook: POST /los-29-status-change]
    |
[Route by Status Transition]
    |
    ├── listing_gone (active -> pending/sold)
    |       |
    |   [Find Interested Leads]
    |   [Find Similar Alternatives]
    |   [Send "Listing Gone + Alternatives" Email]
    |   [Log Interaction]
    |
    ├── back_on_market (pending/sold/withdrawn -> active)
    |       |
    |   [Find Interested Leads]
    |   [Send HIGH URGENCY Email + SMS]
    |   [Log Interaction]
    |
    └── log_only (withdrawn/expired/canceled)
            |
        [Log Status Change - No Alert]
```

---

---

## LOS-30: Daily/Weekly Digest Compiler

### Triggers

This workflow has TWO schedule triggers.

**Trigger A: Daily Digest (Mon-Sat at 8 AM MST)**

```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 15 * * 1-6"
        }
      ]
    }
  },
  "name": "Daily 8AM MST (Mon-Sat)",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.1
}
```

Note: 8 AM MST = 15:00 UTC.

**Trigger B: Weekly Digest (Monday at 8 AM MST)**

```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 15 * * 1"
        }
      ]
    }
  },
  "name": "Weekly 8AM MST (Monday)",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.1
}
```

**How they work together:**
- The Daily trigger runs Mon-Sat and processes alerts with `frequency = 'daily'`.
- The Weekly trigger runs only on Monday and processes alerts with `frequency = 'weekly'`.
- Both triggers feed into the same processing pipeline, just with different frequency filters.

---

### Node 2: Determine Digest Type

**n8n Node Type:** `n8n-nodes-base.code`

```javascript
// Determine which frequency to process based on which trigger fired
const triggerName = $executionData?.triggerName || '';
const isWeekly = triggerName.includes('Weekly') || new Date().getDay() === 1;

// On Monday, process BOTH daily and weekly
// Other days, process only daily
const frequencies = isWeekly ? ['daily', 'weekly'] : ['daily'];

return [{ json: { frequencies, digestDate: new Date().toISOString().slice(0, 10) } }];
```

---

### Node 3: Get Queued Alerts

**n8n Node Type:** `n8n-nodes-base.supabase`

Fetch all unsent queued alerts grouped by lead.

```sql
SELECT
  laq.id as queue_id,
  laq.saved_search_id,
  laq.listing_id,
  laq.lead_id,
  laq.alert_type,
  laq.frequency,
  l.first_name,
  l.last_name,
  l.email,
  l.phone,
  l.preferred_language,
  ss.name as search_name,
  li.address,
  li.city,
  li.zip_code,
  li.list_price,
  li.beds,
  li.baths,
  li.sqft,
  li.primary_photo_url,
  li.property_type,
  li.status as listing_status
FROM listing_alert_queue laq
JOIN leads l ON l.id = laq.lead_id
JOIN saved_searches ss ON ss.id = laq.saved_search_id
JOIN listings li ON li.id = laq.listing_id
WHERE laq.sent = false
  AND laq.status = 'pending'
  AND laq.frequency = ANY($1)  -- ['daily'] or ['daily', 'weekly']
  AND l.status NOT IN ('lost', 'past_client')
  AND l.verification_status != 'do_not_contact'
ORDER BY laq.lead_id, laq.created_at;
```

---

### Node 4: Group Alerts by Lead

**n8n Node Type:** `n8n-nodes-base.code`

```javascript
const alerts = $json; // array of queued alerts
const grouped = {};

for (const alert of alerts) {
  if (!grouped[alert.lead_id]) {
    grouped[alert.lead_id] = {
      lead_id: alert.lead_id,
      first_name: alert.first_name,
      last_name: alert.last_name,
      email: alert.email,
      phone: alert.phone,
      preferred_language: alert.preferred_language,
      listings: [],
      queue_ids: [],
    };
  }
  grouped[alert.lead_id].listings.push({
    queue_id: alert.queue_id,
    listing_id: alert.listing_id,
    address: alert.address,
    city: alert.city,
    zip_code: alert.zip_code,
    list_price: alert.list_price,
    beds: alert.beds,
    baths: alert.baths,
    sqft: alert.sqft,
    primary_photo_url: alert.primary_photo_url,
    property_type: alert.property_type,
    listing_status: alert.listing_status,
    alert_type: alert.alert_type,
    search_name: alert.search_name,
  });
  grouped[alert.lead_id].queue_ids.push(alert.queue_id);
}

return Object.values(grouped).map(g => ({ json: g }));
```

---

### Node 5: Get Market Context

**n8n Node Type:** `n8n-nodes-base.supabase`

Fetch the latest city-wide market snapshot for inclusion in the digest.

```sql
SELECT
  active_count,
  median_price,
  avg_dom,
  months_of_inventory,
  price_trend,
  price_change_30d_pct,
  new_count_7d,
  sold_count_30d
FROM market_snapshots
WHERE area = 'El Paso'
  AND area_type = 'city'
ORDER BY snapshot_date DESC
LIMIT 1;
```

---

### Node 6: Compose & Send Digest Email

**n8n Node Type:** `n8n-nodes-base.httpRequest`

For each lead group, compose a digest email via LOS-25.

```json
{
  "template": "listing_digest",
  "to_email": "{{ $json.email }}",
  "to_name": "{{ $json.first_name }} {{ $json.last_name }}",
  "language": "{{ $json.preferred_language || 'en' }}",
  "subject_en": "{{ $json.listings.length }} new listings matching your searches",
  "subject_es": "{{ $json.listings.length }} nuevas propiedades para ti",
  "data": {
    "first_name": "{{ $json.first_name }}",
    "listing_count": "{{ $json.listings.length }}",
    "listings": "{{ $json.listings }}",
    "market_snapshot": {
      "active_count": "{{ market.active_count }}",
      "median_price": "{{ market.median_price }}",
      "avg_dom": "{{ market.avg_dom }}",
      "price_trend": "{{ market.price_trend }}",
      "price_change_30d_pct": "{{ market.price_change_30d_pct }}"
    },
    "cta_url": "https://casasenelpasotx.com/#/properties"
  }
}
```

---

### Node 7: Mark Queue as Sent

**n8n Node Type:** `n8n-nodes-base.supabase`

Update all processed queue entries.

```sql
UPDATE listing_alert_queue
SET sent = true,
    sent_at = NOW(),
    status = 'sent'
WHERE id = ANY($1);  -- array of queue_ids from this lead's group
```

```json
{
  "parameters": {
    "operation": "update",
    "tableId": "listing_alert_queue",
    "matchingColumns": ["id"],
    "fieldsUi": {
      "fieldValues": [
        { "fieldId": "sent", "fieldValue": true },
        { "fieldId": "sent_at", "fieldValue": "={{ new Date().toISOString() }}" },
        { "fieldId": "status", "fieldValue": "sent" }
      ]
    },
    "resource": "row"
  },
  "name": "Mark Queue Sent",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2,
  "credentials": {
    "supabaseApi": { "id": "37rJREccSDhKtIGi", "name": "Supabase Service Role" }
  }
}
```

---

### LOS-30 Flow Diagram

```
[Daily Trigger: 8AM MST Mon-Sat] ──┐
                                     ├──> [Determine Digest Type]
[Weekly Trigger: 8AM MST Monday] ──┘         |
                                      [Get Queued Alerts (by frequency)]
                                              |
                                      [Group by Lead]
                                              |
                                      [Get Market Context from market_snapshots]
                                              |
                                      [For Each Lead Group]
                                              |
                                      [Compose Digest Email via LOS-25]
                                              |
                                      [Mark Queue Entries as Sent]
```

---

---

## LOS-31: AI Listing Matcher (Daily)

### Trigger

**n8n Node Type:** `n8n-nodes-base.scheduleTrigger`

Runs daily at 10 AM MST (17:00 UTC) to give time for the morning sync and digest to complete first.

```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 17 * * *"
        }
      ]
    }
  },
  "name": "Daily 10AM MST",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.1
}
```

---

### Node 2: Get Top 20 Active Buyer Leads

**n8n Node Type:** `n8n-nodes-base.supabase`

```sql
SELECT
  l.id,
  l.first_name,
  l.last_name,
  l.email,
  l.phone,
  l.preferred_language,
  l.score,
  l.temperature,
  l.budget_min,
  l.budget_max,
  l.preferred_areas,
  l.property_type as preferred_property_type,
  l.timeline,
  l.pre_approved,
  l.pre_approval_amount,
  l.deal_type,
  l.tags
FROM leads l
WHERE l.status IN ('new_lead', 'attempted_contact', 'contacted', 'appointment_set', 'appointment_met', 'active_client')
  AND l.temperature IN ('hot', 'warm')
  AND l.verification_status != 'do_not_contact'
  AND l.nurture_paused = false
  AND (l.deal_type = 'buyer' OR l.deal_type IS NULL)
ORDER BY l.score DESC, l.last_activity DESC
LIMIT 20;
```

---

### Node 3: Gather Context for Each Lead

**n8n Node Type:** `n8n-nodes-base.code` (with multiple Supabase queries per lead)

For each of the top 20 leads, gather:

**A. Saved Searches:**

```sql
SELECT name, criteria, filter_json
FROM saved_searches
WHERE lead_id = $1
  AND alert_enabled = true
ORDER BY created_at DESC
LIMIT 5;
```

**B. Recent Messages (last 30 days):**

```sql
SELECT content, direction, channel, created_at
FROM messages
WHERE lead_id = $1
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 10;
```

**C. Showing Feedback (last 60 days):**

```sql
SELECT address, feedback, status, date
FROM showings
WHERE lead_id = $1
  AND created_at > NOW() - INTERVAL '60 days'
ORDER BY date DESC
LIMIT 5;
```

**D. Previous Listing Interactions:**

```sql
SELECT
  lli.interaction_type,
  lli.created_at,
  li.address,
  li.list_price,
  li.beds,
  li.baths,
  li.sqft,
  li.subdivision
FROM lead_listing_interactions lli
JOIN listings li ON li.id = lli.listing_id
WHERE lli.lead_id = $1
ORDER BY lli.created_at DESC
LIMIT 15;
```

**E. Matching Active Listings (based on lead preferences):**

```sql
SELECT
  id, address, city, zip_code, list_price, beds, baths, sqft,
  primary_photo_url, property_type, subdivision, days_on_market,
  pool, garage_spaces, year_built, public_remarks
FROM listings
WHERE status = 'active'
  AND list_price BETWEEN COALESCE($1, 0) AND COALESCE($2, 9999999)  -- budget_min, budget_max
  AND beds >= COALESCE($3, 0)  -- minimum beds from preferences
  AND (
    $4 IS NULL  -- no preferred areas
    OR subdivision = ANY($4)  -- preferred_areas
    OR zip_code = ANY($5)  -- zips derived from preferred_areas
  )
ORDER BY list_date DESC
LIMIT 20;
```

---

### Node 4: Claude AI Matching

**n8n Node Type:** `n8n-nodes-base.httpRequest`

For each lead, send context to Claude API for intelligent matching.

```
URL: https://api.anthropic.com/v1/messages
Method: POST
Headers:
  x-api-key: {{ $credentials.anthropicApi.apiKey }}
  anthropic-version: 2023-06-01
  Content-Type: application/json
Body:
```

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 1024,
  "system": "You are Lorena's AI assistant for matching El Paso real estate buyers with perfect properties. You know the El Paso market deeply: Westside is premium ($300K-$800K+), Northeast is affordable ($150K-$300K), East/Horizon is growing new construction, Upper Valley is luxury with land. Fort Bliss military buyers need proximity to base and often use VA loans. First-time buyers favor FHA and need low-cost options.\n\nAnalyze the buyer's profile, behavior, messages, and showing feedback to identify the SINGLE BEST listing match. Explain WHY this listing is perfect for THIS specific buyer. Be specific, personal, and conversational. Write as Lorena would speak - warm, knowledgeable, bilingual-friendly.\n\nRespond in JSON: { \"listing_id\": \"uuid\", \"match_score\": 0-100, \"reason_en\": \"...\", \"reason_es\": \"...\", \"personalized_note_en\": \"...\", \"personalized_note_es\": \"...\" }",
  "messages": [
    {
      "role": "user",
      "content": "Find the best listing match for this buyer:\n\n## Buyer Profile\nName: {{ lead.first_name }} {{ lead.last_name }}\nScore: {{ lead.score }}/100 ({{ lead.temperature }})\nBudget: ${{ lead.budget_min || 'unknown' }} - ${{ lead.budget_max || 'unknown' }}\nPreferred Areas: {{ lead.preferred_areas.join(', ') || 'Not specified' }}\nProperty Type: {{ lead.preferred_property_type || 'Not specified' }}\nTimeline: {{ lead.timeline || 'Not specified' }}\nPre-approved: {{ lead.pre_approved ? 'Yes ($' + lead.pre_approval_amount + ')' : 'No' }}\nTags: {{ lead.tags.join(', ') || 'None' }}\n\n## Saved Searches\n{{ JSON.stringify(savedSearches, null, 2) }}\n\n## Recent Messages (last 30 days)\n{{ messages.map(m => `[${m.direction}] ${m.content}`).join('\\n') }}\n\n## Showing Feedback\n{{ showings.map(s => `${s.address} (${s.status}): ${JSON.stringify(s.feedback)}`).join('\\n') }}\n\n## Previous Interactions\n{{ interactions.map(i => `${i.interaction_type}: ${i.address} $${i.list_price} ${i.beds}bd/${i.baths}ba`).join('\\n') }}\n\n## Available Listings\n{{ listings.map(l => `ID:${l.id} | ${l.address} | $${l.list_price} | ${l.beds}bd/${l.baths}ba ${l.sqft}sqft | ${l.subdivision} | DOM:${l.days_on_market} | Pool:${l.pool} | Garage:${l.garage_spaces} | Built:${l.year_built}`).join('\\n') }}\n\nPick the SINGLE best match and explain why it's perfect for {{ lead.first_name }}."
    }
  ]
}
```

**Parse AI response:**

```javascript
const aiResponse = JSON.parse($json.content[0].text);
const lead = $node["Get Lead Context"].json;

return [{
  json: {
    lead_id: lead.id,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    preferred_language: lead.preferred_language,
    matched_listing_id: aiResponse.listing_id,
    match_score: aiResponse.match_score,
    reason_en: aiResponse.reason_en,
    reason_es: aiResponse.reason_es,
    personalized_note_en: aiResponse.personalized_note_en,
    personalized_note_es: aiResponse.personalized_note_es,
  }
}];
```

---

### Node 5: Filter Top Matches (Score >= 70)

**n8n Node Type:** `n8n-nodes-base.if`

Only send alerts for matches with a score of 70 or higher. Below that, the AI is not confident enough.

```json
{
  "parameters": {
    "conditions": {
      "number": [
        {
          "value1": "={{ $json.match_score }}",
          "operation": "largerEqual",
          "value2": 70
        }
      ]
    }
  },
  "name": "Match Score >= 70?",
  "type": "n8n-nodes-base.if",
  "typeVersion": 1
}
```

---

### Node 6: Get Matched Listing Details

**n8n Node Type:** `n8n-nodes-base.supabase`

Fetch full listing details for the matched property.

```sql
SELECT
  id, address, city, state, zip_code, list_price, beds, baths, sqft,
  primary_photo_url, property_type, subdivision, days_on_market,
  listing_agent_name, is_lorenas_listing, virtual_tour_url
FROM listings
WHERE id = $1;
```

---

### Node 7: Send Personalized "Lorena Found This For You" Alert

**Email via LOS-25:**

```json
{
  "template": "ai_listing_match",
  "to_email": "{{ $json.email }}",
  "to_name": "{{ $json.first_name }} {{ $json.last_name }}",
  "language": "{{ $json.preferred_language || 'en' }}",
  "subject_en": "{{ $json.first_name }}, I found a home you'll love",
  "subject_es": "{{ $json.first_name }}, encontre una casa que te va a encantar",
  "data": {
    "first_name": "{{ $json.first_name }}",
    "personalized_note": "={{ $json.preferred_language === 'es' ? $json.personalized_note_es : $json.personalized_note_en }}",
    "match_reason": "={{ $json.preferred_language === 'es' ? $json.reason_es : $json.reason_en }}",
    "listing_address": "{{ listing.address }}, {{ listing.city }}",
    "listing_price": "{{ listing.list_price }}",
    "listing_beds": "{{ listing.beds }}",
    "listing_baths": "{{ listing.baths }}",
    "listing_sqft": "{{ listing.sqft }}",
    "listing_photo": "{{ listing.primary_photo_url }}",
    "listing_url": "https://casasenelpasotx.com/#/properties/{{ listing.id }}",
    "virtual_tour_url": "{{ listing.virtual_tour_url }}",
    "is_lorenas_listing": "{{ listing.is_lorenas_listing }}"
  }
}
```

**SMS (for hot leads with score >= 80):**

English:
```
Hi {{ first_name }}! I found a property I think is perfect for you - {{ listing.address }}, ${{ listing.list_price.toLocaleString() }}. {{ personalized_note_en }} Want to see it? - Lorena
```

Spanish:
```
Hola {{ first_name }}! Encontre una propiedad perfecta para ti - {{ listing.address }}, ${{ listing.list_price.toLocaleString() }}. {{ personalized_note_es }} Quieres verla? - Lorena
```

**Guard:** Only send SMS for hot leads (score >= 80). All matched leads get email.

---

### Node 8: Log AI Match Interaction

**n8n Node Type:** `n8n-nodes-base.supabase`

```json
{
  "parameters": {
    "operation": "create",
    "tableId": "lead_listing_interactions",
    "fieldsUi": {
      "fieldValues": [
        { "fieldId": "lead_id", "fieldValue": "={{ $json.lead_id }}" },
        { "fieldId": "listing_id", "fieldValue": "={{ $json.matched_listing_id }}" },
        { "fieldId": "interaction_type", "fieldValue": "ai_matched" },
        { "fieldId": "source", "fieldValue": "LOS-31" },
        { "fieldId": "notes", "fieldValue": "=AI match score: {{ $json.match_score }}/100" },
        {
          "fieldId": "metadata",
          "fieldValue": "={{ JSON.stringify({ match_score: $json.match_score, reason: $json.reason_en, ai_model: 'claude-sonnet-4-5-20250929' }) }}"
        }
      ]
    },
    "resource": "row"
  },
  "name": "Log AI Match",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2,
  "credentials": {
    "supabaseApi": { "id": "37rJREccSDhKtIGi", "name": "Supabase Service Role" }
  }
}
```

**Also fire LOS-05 behavioral event:**

```json
{
  "lead_id": "{{ $json.lead_id }}",
  "event_type": "ai_listing_match",
  "metadata": {
    "listing_id": "{{ $json.matched_listing_id }}",
    "match_score": "{{ $json.match_score }}",
    "source": "LOS-31"
  }
}
```

---

### LOS-31 Flow Diagram

```
[Daily Trigger: 10AM MST]
    |
[Get Top 20 Active Buyer Leads (by score)]
    |
[For Each Lead]
    |
[Gather Context]
    ├── Saved Searches
    ├── Recent Messages (30 days)
    ├── Showing Feedback (60 days)
    ├── Previous Interactions
    └── Matching Active Listings
    |
[Claude AI: Find Best Match]
    |
[Parse AI Response]
    |
[Match Score >= 70?]
    ├── NO ──> [Skip - not confident enough]
    └── YES
         |
    [Get Matched Listing Details]
         |
    [Send "Lorena Found This" Email (all)]
    [Send SMS (hot leads score >= 80 only)]
         |
    [Log AI Match Interaction]
    [Fire LOS-05 Behavioral Event]
```

---

---

## Cross-Workflow Dependencies

```
                    ┌──────────────────────────────────────────┐
                    │         LOS-26: MLS Sync Engine          │
                    │    (Every 15 min + Daily midnight)       │
                    └──────┬──────────┬──────────┬─────────────┘
                           │          │          │
                  new_listing   price_change  status_change
                           │          │          │
                    ┌──────▼──┐ ┌─────▼───┐ ┌───▼──────┐
                    │ LOS-27  │ │ LOS-28  │ │ LOS-29   │
                    │ New List│ │ Price   │ │ Status   │
                    │ Alert   │ │ Change  │ │ Change   │
                    └──┬──┬──┘ └──┬──┬──┘ └──┬──┬───┘
                       │  │       │  │       │  │
                  instant queue  email sms  email sms
                       │  │       │  │       │  │
                       │  │       │  │       │  └──> LOS-06 (SMS Engine)
                       │  │       │  └──────────> LOS-25 (Email Engine)
                       │  │       └──────────────> LOS-05 (Scoring)
                       │  └──────────────────────> listing_alert_queue
                       │
                  ┌────▼──────────────┐
                  │     LOS-30        │
                  │ Daily/Weekly      │
                  │ Digest Compiler   │    ┌───────────────┐
                  │ (8AM MST)         │    │   LOS-31      │
                  └───────────────────┘    │ AI Matcher     │
                                           │ (10AM MST)    │
                                           └───────────────┘
```

---

## Environment Variables / n8n Credentials Required

| Credential | Type | Used By | Purpose |
|-----------|------|---------|---------|
| Supabase Service Role | Supabase API | All | Database read/write (bypasses RLS) |
| Twilio - Lorena SMS | Twilio API | LOS-27, LOS-28, LOS-29, LOS-31 | SMS alerts from 915 area code |
| Anthropic API | HTTP Header Auth | LOS-31 | Claude AI matching |
| N8N_BASE_URL | Environment Variable | All | Internal webhook URLs |
| LOS-25 Email Engine | Internal Webhook | LOS-27, LOS-28, LOS-29, LOS-30, LOS-31 | Branded email sending |
| LOS-05 Scoring | Internal Webhook | LOS-27, LOS-28, LOS-31 | Behavioral event logging |
| LOS-06 SMS Engine | Internal Webhook | LOS-27 | SMS sending (alternative to direct Twilio) |

---

## Business Rules Enforced

1. **No SMS during quiet hours (10 PM - 7 AM CST)** - LOS-27 and LOS-29 check quiet hours before sending SMS. If quiet, queue for 7 AM delivery.
2. **Only alert on price DECREASES** - LOS-28 explicitly filters out price increases.
3. **Bilingual everything** - All SMS and email templates have EN and ES versions, selected by `lead.preferred_language`.
4. **No alerts to lost/past_client/do_not_contact leads** - All queries filter by `lead.status` and `verification_status`.
5. **Favorites get priority** - Leads who favorited a listing get both email and SMS on price drops (LOS-28).
6. **Back on market = high urgency** - LOS-29 treats back-on-market as the highest priority alert type.
7. **Withdrawn/expired = log only** - LOS-29 does not alert leads about withdrawn or expired listings.
8. **AI matching threshold** - LOS-31 only sends alerts for match scores >= 70/100.
9. **Hot leads get SMS from AI matcher** - LOS-31 only sends SMS to leads with score >= 80.
10. **Max 1 AI SMS per lead per 7 days** - LOS-31 should check `messages` table to avoid over-contacting.

---

## Source Code References

| File | Purpose |
|------|---------|
| `lib/mls/sparkApi.ts` | `transformSparkToSupabase()`, field mapping helpers |
| `lib/mls/syncService.ts` | `SyncAlert` types, `runIncrementalSync()` logic |
| `lib/mls/adapter.ts` | `transformListingToDisplay()` for display formatting |
| `lib/supabase/database.types.ts` | All table types (`saved_searches`, `listing_alert_queue`, `lead_listing_interactions`, etc.) |
| `hooks/useSavedSearches.ts` | Saved search CRUD patterns, criteria shape |
| `hooks/useListingInteractions.ts` | Interaction logging patterns, `InteractionType` values |
| `hooks/useMarketSnapshots.ts` | Market snapshot consumption patterns |
| `hooks/useListings.ts` | `ListingFilters` interface, query patterns |
| `lib/scoring/constants.ts` | Scoring point values for behavioral events |
| `.agent/workflows/n8n_json/LOS-05_Behavioral_Scoring.json` | Scoring webhook pattern to follow |
