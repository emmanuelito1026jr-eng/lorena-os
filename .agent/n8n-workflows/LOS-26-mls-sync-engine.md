# LOS-26: MLS Sync Engine

## Overview

The MLS Sync Engine is the backbone of Lorena Realtor OS's live property data. It connects to the GEPAR (Greater El Paso Association of Realtors) MLS via the Spark API, keeps the Supabase `listings` table current, tracks price/status changes in history tables, generates daily market snapshots, and fires webhooks to downstream alert workflows (LOS-27 through LOS-31).

**Two execution paths run independently:**

| Path | Schedule | Purpose |
|------|----------|---------|
| **PATH A** - Incremental Sync | Every 15 minutes | Fetch modified listings, upsert to Supabase, fire alert webhooks |
| **PATH B** - Daily Market Snapshot | Daily at midnight MST (07:00 UTC) | Generate city-wide and per-zip market statistics, calculate 30-day trends |

---

## Spark API Credentials

| Field | Value |
|-------|-------|
| Base URL | `https://sparkapi.com/v1` |
| Auth Header | `Authorization: OAuth <SPARK_API_TOKEN>` |
| User-Agent | `LorenaRealtorOS/1.0` |
| X-SparkApi-User-Agent | `LorenaRealtorOS/1.0` |
| Feed ID | `bs1gx50w59ms8w6qyza2tpmjl` |
| Account | `Lorena Ontiveros-Ortega (gep.8809)` |
| MLS | Greater El Paso MLS (GEPAR) |
| Role | IDX |
| Rate Limit | 1,500 requests per 5-minute window |
| Max Results Per Page | 200 |

**IMPORTANT**: These credentials are server-side only. They must be stored in n8n credentials, never in frontend code. Reference `lib/mls/sparkApi.ts` lines 1-14 for documentation.

---

## Supabase Tables Involved

| Table | Purpose |
|-------|---------|
| `listings` | Primary listing data store. Upsert target keyed on `spark_id`. |
| `listing_price_history` | Append-only log of every price change. |
| `listing_status_history` | Append-only log of every status transition. |
| `mls_sync_metadata` | Sync run tracking (timestamps, counts, errors). |
| `market_snapshots` | Daily aggregate market statistics by area. |

---

## PATH A: Incremental Sync (Every 15 Minutes)

### Node 1: Schedule Trigger

**n8n Node Type:** `n8n-nodes-base.scheduleTrigger`

```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "minutes",
          "minutesInterval": 15
        }
      ]
    }
  },
  "name": "Every 15 Minutes",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.1
}
```

---

### Node 2: Get Last Sync Timestamp

**n8n Node Type:** `n8n-nodes-base.supabase`

Query the `mls_sync_metadata` table for the most recent successful incremental sync. Extract `last_modification_timestamp` to use as the "since" parameter for the Spark API.

```json
{
  "parameters": {
    "operation": "getAll",
    "tableId": "mls_sync_metadata",
    "filters": {
      "conditions": [
        { "keyName": "sync_type", "keyValue": "incremental_sync", "condition": "eq" },
        { "keyName": "status", "keyValue": "completed", "condition": "eq" }
      ]
    },
    "filterType": "manual",
    "matchType": "allFilters",
    "returnAll": false,
    "limit": 1,
    "sort": {
      "property": [{ "key": "completed_at", "direction": "desc" }]
    },
    "resource": "row"
  },
  "name": "Get Last Sync Timestamp",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2,
  "credentials": {
    "supabaseApi": { "id": "37rJREccSDhKtIGi", "name": "Supabase Service Role" }
  }
}
```

**Fallback logic (handled in the next Code node):** If no previous sync exists, use `2020-01-01T00:00:00Z` as the initial timestamp. This triggers a full initial sync. Expect approximately 3,000-5,000 active El Paso listings, requiring 15-25 paginated API calls at 200 results per page.

---

### Node 3: Create Sync Record

**n8n Node Type:** `n8n-nodes-base.supabase`

Insert a new row into `mls_sync_metadata` with `status: 'running'` to track this sync run.

```json
{
  "parameters": {
    "operation": "create",
    "tableId": "mls_sync_metadata",
    "fieldsUi": {
      "fieldValues": [
        { "fieldId": "sync_type", "fieldValue": "incremental_sync" },
        { "fieldId": "status", "fieldValue": "running" },
        { "fieldId": "started_at", "fieldValue": "={{ new Date().toISOString() }}" }
      ]
    },
    "resource": "row"
  },
  "name": "Create Sync Record",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2,
  "credentials": {
    "supabaseApi": { "id": "37rJREccSDhKtIGi", "name": "Supabase Service Role" }
  }
}
```

Store the returned `id` as `syncRecordId` for updating at the end.

---

### Node 4: Fetch Modified Listings (Paginated HTTP Requests)

**n8n Node Type:** `n8n-nodes-base.httpRequest` (inside a loop)

This node fetches all listings modified since the last sync timestamp using the Spark API. It handles pagination automatically.

**Code Node (pre-request setup):**

```javascript
// Determine the since timestamp
const lastSync = $node["Get Last Sync Timestamp"].json;
const sinceTimestamp = lastSync?.last_modification_timestamp || '2020-01-01T00:00:00Z';
const syncRecordId = $node["Create Sync Record"].json.id;

return [{
  json: {
    sinceTimestamp,
    syncRecordId,
    currentPage: 1,
    allListings: [],
    totalPages: 1,
    done: false,
  }
}];
```

**HTTP Request Node configuration:**

```
URL: https://sparkapi.com/v1/listings
Method: GET
Authentication: None (handled via headers)
Headers:
  - Authorization: OAuth <SPARK_API_TOKEN>
  - Accept: application/json
  - User-Agent: LorenaRealtorOS/1.0
  - X-SparkApi-User-Agent: LorenaRealtorOS/1.0
Query Parameters:
  - _filter: ModificationTimestamp Gt {{ $json.sinceTimestamp }}
  - _limit: 200
  - _page: {{ $json.currentPage }}
  - _orderby: ModificationTimestamp asc
  - _expand: Photos
  - _select: ListingId,MlsStatus,ListPrice,OriginalListPrice,ClosePrice,BedsTotal,BathsTotal,BathsHalf,BuildingAreaTotal,LotSizeArea,LotSizeAcres,YearBuilt,Stories,GarageSpaces,PoolFeatures,UnparsedAddress,UnitNumber,City,StateOrProvince,PostalCode,CountyOrParish,SubdivisionName,Latitude,Longitude,PropertyType,PropertySubType,PublicRemarks,ListingContractDate,PendingTimestamp,WithdrawnDate,ExpirationDate,CloseDate,DaysOnMarket,CumulativeDaysOnMarket,InteriorFeatures,ExteriorFeatures,Appliances,Heating,Cooling,ConstructionMaterials,Roof,FoundationDetails,ParkingFeatures,AssociationFee,AssociationFeeFrequency,TaxAnnualAmount,TaxYear,ElementarySchool,MiddleOrJuniorSchool,HighSchool,SchoolDistrict,VirtualTourURLUnbranded,ListAgentFullName,ListAgentPreferredPhone,ListAgentEmail,ListOfficeName,ListAgentId,ListOfficeId,CoListAgentFullName,BuyerAgentFullName,BuyerOfficeName,ModificationTimestamp,PhotosCount,PhotosChangeTimestamp

Response: JSON
Retry on Fail: Yes
  - Max Retries: 3
  - Wait Between Retries: 5000ms
  - On 429 (Rate Limited): Wait 60000ms then retry
```

**Pagination Loop (Code Node after HTTP Request):**

```javascript
const response = $json; // Spark API response
const pagination = response.D.Pagination;
const results = response.D.Results || [];

const prevData = $node["Setup Pagination"].json;
const allListings = [...(prevData.allListings || []), ...results];

if (pagination.CurrentPage < pagination.TotalPages) {
  // More pages — continue loop
  return [{
    json: {
      sinceTimestamp: prevData.sinceTimestamp,
      syncRecordId: prevData.syncRecordId,
      currentPage: pagination.CurrentPage + 1,
      allListings,
      totalPages: pagination.TotalPages,
      done: false,
    }
  }];
} else {
  // All pages fetched
  return [{
    json: {
      sinceTimestamp: prevData.sinceTimestamp,
      syncRecordId: prevData.syncRecordId,
      allListings,
      totalPages: pagination.TotalPages,
      totalFetched: allListings.length,
      done: true,
    }
  }];
}
```

Use n8n's loop-back connection: if `done === false`, route back to the HTTP Request node (with a 200ms wait node in between for rate limiting). If `done === true`, proceed to the processing step.

**Rate Limit Note:** With a 200ms delay between pages and 200 results per page, a full sync of 5,000 listings requires 25 pages = ~5 seconds of API calls. Well within the 1,500 requests per 5-minute window.

---

### Node 5: Process Each Listing (Code Node)

**n8n Node Type:** `n8n-nodes-base.code`

This is the core transformation step. It maps each Spark API listing to the Supabase `listings` table format using the same logic as `transformSparkToSupabase()` from `lib/mls/sparkApi.ts`.

```javascript
// Process all fetched listings
const sparkListings = $json.allListings || [];
const syncRecordId = $json.syncRecordId;

if (sparkListings.length === 0) {
  return [{
    json: {
      syncRecordId,
      batches: [],
      totalProcessed: 0,
    }
  }];
}

// ---- Helper functions (from lib/mls/sparkApi.ts) ----

function mapStatus(sparkStatus) {
  const map = {
    'Active': 'active',
    'Active Under Contract': 'pending',
    'Pending': 'pending',
    'Closed': 'sold',
    'Withdrawn': 'withdrawn',
    'Expired': 'expired',
    'Canceled': 'canceled',
    'Coming Soon': 'coming_soon',
  };
  return map[sparkStatus] || (sparkStatus ? sparkStatus.toLowerCase() : 'unknown');
}

function mapPropertyType(sparkType) {
  const map = {
    'A': 'single_family',
    'B': 'commercial',
    'C': 'land',
    'D': 'multi_family',
    'E': 'condo',
  };
  return map[sparkType] || 'other';
}

function mapPhotos(photosArray) {
  if (!photosArray || !Array.isArray(photosArray)) return [];
  return photosArray.map((p, index) => ({
    url: p.Uri1024 || p.Uri800 || p.Uri640 || p.Uri300 || p.UriThumb,
    thumb: p.UriThumb || p.Uri300,
    large: p.Uri1600 || p.Uri1024 || p.Uri800,
    caption: p.Caption || '',
    primary: index === 0,
    order: index,
  }));
}

function getPrimaryPhoto(photosArray) {
  if (!photosArray || !photosArray.length) return null;
  return photosArray[0].Uri800 || photosArray[0].Uri640 || photosArray[0].Uri300 || photosArray[0].UriThumb;
}

function parseFeatureArray(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return null;
}

function isLorenas(agentName) {
  if (!agentName) return false;
  const name = agentName.toLowerCase();
  return name.includes('ontiveros') || name.includes('lorena');
}

function transformSparkToSupabase(item) {
  const sf = item.StandardFields;
  return {
    spark_id: item.Id,
    mls_id: sf.ListingId,
    status: mapStatus(sf.MlsStatus),
    address: sf.UnparsedAddress,
    unit_number: sf.UnitNumber || null,
    city: sf.City || 'El Paso',
    state: sf.StateOrProvince || 'TX',
    zip_code: sf.PostalCode || '',
    county: sf.CountyOrParish || 'El Paso',
    subdivision: sf.SubdivisionName || null,
    latitude: sf.Latitude || null,
    longitude: sf.Longitude || null,
    property_type: mapPropertyType(sf.PropertyType || ''),
    property_subtype: sf.PropertySubType || null,
    beds: sf.BedsTotal || 0,
    baths: sf.BathsTotal || 0,
    half_baths: sf.BathsHalf || 0,
    sqft: sf.BuildingAreaTotal || null,
    lot_sqft: sf.LotSizeArea || null,
    lot_acres: sf.LotSizeAcres || null,
    year_built: sf.YearBuilt || null,
    stories: sf.Stories || null,
    garage_spaces: sf.GarageSpaces || null,
    pool: !!(sf.PoolFeatures),
    list_price: sf.ListPrice,
    original_list_price: sf.OriginalListPrice || sf.ListPrice,
    close_price: sf.ClosePrice || null,
    close_date: sf.CloseDate || null,
    list_date: sf.ListingContractDate || null,
    pending_date: sf.PendingTimestamp || null,
    withdrawn_date: sf.WithdrawnDate || null,
    expiration_date: sf.ExpirationDate || null,
    days_on_market: sf.DaysOnMarket || null,
    cumulative_dom: sf.CumulativeDaysOnMarket || null,
    description: sf.PublicRemarks || null,
    public_remarks: sf.PublicRemarks || null,
    interior_features: parseFeatureArray(sf.InteriorFeatures),
    exterior_features: parseFeatureArray(sf.ExteriorFeatures),
    appliances: parseFeatureArray(sf.Appliances),
    heating: sf.Heating || null,
    cooling: sf.Cooling || null,
    construction: parseFeatureArray(sf.ConstructionMaterials),
    roof: sf.Roof || null,
    foundation: sf.FoundationDetails || null,
    parking_description: sf.ParkingFeatures || null,
    hoa_fee: sf.AssociationFee || null,
    hoa_frequency: sf.AssociationFeeFrequency || null,
    tax_amount: sf.TaxAnnualAmount || null,
    tax_year: sf.TaxYear || null,
    school_district: sf.SchoolDistrict || null,
    elementary_school: sf.ElementarySchool || null,
    middle_school: sf.MiddleOrJuniorSchool || null,
    high_school: sf.HighSchool || null,
    photos: mapPhotos(sf.Photos),
    photo_count: sf.PhotosCount || 0,
    primary_photo_url: getPrimaryPhoto(sf.Photos),
    virtual_tour_url: sf.VirtualTourURLUnbranded || null,
    listing_agent_id: sf.ListAgentId || null,
    listing_agent_name: sf.ListAgentFullName || null,
    listing_agent_phone: sf.ListAgentPreferredPhone || null,
    listing_agent_email: sf.ListAgentEmail || null,
    listing_office_name: sf.ListOfficeName || null,
    listing_office_id: sf.ListOfficeId || null,
    co_listing_agent_name: sf.CoListAgentFullName || null,
    buyer_agent_name: sf.BuyerAgentFullName || null,
    buyer_office_name: sf.BuyerOfficeName || null,
    is_lorenas_listing: isLorenas(sf.ListAgentFullName),
    display_compliance: item.DisplayCompliance || null,
    raw_spark_data: item,
    spark_modification_timestamp: sf.ModificationTimestamp || new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };
}

// ---- Transform all listings ----

const transformed = sparkListings.map(item => transformSparkToSupabase(item));

// Split into batches of 25 for upsert
const BATCH_SIZE = 25;
const batches = [];
for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
  batches.push(transformed.slice(i, i + BATCH_SIZE));
}

return [{
  json: {
    syncRecordId,
    batches,
    batchCount: batches.length,
    totalProcessed: transformed.length,
    transformedListings: transformed,
  }
}];
```

---

### Node 6: Upsert Listings in Batches of 25

**n8n Node Type:** `n8n-nodes-base.code` + `n8n-nodes-base.supabase` (in a loop)

For each batch, the workflow must:

1. **Check existing listings** by `spark_id` to detect new vs. updated.
2. **Compare prices and statuses** to detect changes.
3. **Upsert the batch** into `listings`.
4. **Insert price history records** for any price changes.
5. **Insert status history records** for any status changes.
6. **Collect alerts** for downstream webhooks.

**Code Node (Batch Processor):**

```javascript
// This runs for each batch
const batches = $json.batches;
const syncRecordId = $json.syncRecordId;

const alerts = {
  new_listings: [],
  price_changes: [],
  status_changes: [],
};
const errors = [];
let newCount = 0;
let updatedCount = 0;
let priceChangedCount = 0;
let statusChangedCount = 0;
let maxModTimestamp = '';

for (const batch of batches) {
  // Get spark_ids for this batch
  const sparkIds = batch.map(l => l.spark_id);

  // Query existing listings (use Supabase node or inline fetch)
  // In n8n, this would be a Supabase query:
  //   SELECT id, spark_id, list_price, status
  //   FROM listings
  //   WHERE spark_id IN (sparkIds)
  const existingMap = {}; // populated by Supabase query

  for (const listing of batch) {
    const existing = existingMap[listing.spark_id];

    if (!existing) {
      // NEW listing
      newCount++;
      alerts.new_listings.push({
        type: 'new_listing',
        listing_id: null, // set after insert
        spark_id: listing.spark_id,
        mls_id: listing.mls_id,
        data: listing,
      });
    } else {
      // EXISTING listing - check for changes
      const priceChanged = Number(existing.list_price) !== Number(listing.list_price);
      const statusChanged = existing.status !== listing.status;

      if (priceChanged) {
        priceChangedCount++;
        const oldPrice = Number(existing.list_price);
        const newPrice = Number(listing.list_price);
        const changePercent = oldPrice > 0
          ? Math.round(((newPrice - oldPrice) / oldPrice) * 10000) / 100
          : 0;

        alerts.price_changes.push({
          type: 'price_change',
          listing_id: existing.id,
          spark_id: listing.spark_id,
          mls_id: listing.mls_id,
          old_price: oldPrice,
          new_price: newPrice,
          change_amount: newPrice - oldPrice,
          change_percent: changePercent,
          change_type: newPrice > oldPrice ? 'increase' : 'decrease',
          data: listing,
        });
      }

      if (statusChanged) {
        statusChangedCount++;
        alerts.status_changes.push({
          type: 'status_change',
          listing_id: existing.id,
          spark_id: listing.spark_id,
          mls_id: listing.mls_id,
          old_status: existing.status,
          new_status: listing.status,
          data: listing,
        });
      }

      updatedCount++;
    }

    // Track max modification timestamp
    if (listing.spark_modification_timestamp > maxModTimestamp) {
      maxModTimestamp = listing.spark_modification_timestamp;
    }
  }

  // UPSERT batch into listings table
  // Supabase upsert with onConflict: 'spark_id'
  // INSERT INTO listings (...) VALUES (...) ON CONFLICT (spark_id) DO UPDATE SET ...
}

return [{
  json: {
    syncRecordId,
    alerts,
    newCount,
    updatedCount,
    priceChangedCount,
    statusChangedCount,
    maxModTimestamp,
    totalProcessed: $json.totalProcessed,
    errors,
  }
}];
```

**Supabase Upsert Node (per batch):**

```json
{
  "parameters": {
    "operation": "upsert",
    "tableId": "listings",
    "matchingColumns": ["spark_id"],
    "fieldsUi": "={{ $json.batch }}"
  },
  "name": "Upsert Listing Batch",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2,
  "credentials": {
    "supabaseApi": { "id": "37rJREccSDhKtIGi", "name": "Supabase Service Role" }
  }
}
```

**Insert Price History (for each price change):**

```sql
INSERT INTO listing_price_history (listing_id, spark_id, mls_id, old_price, new_price, change_amount, change_percent, change_type)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
```

**Insert Status History (for each status change):**

```sql
INSERT INTO listing_status_history (listing_id, spark_id, mls_id, old_status, new_status)
VALUES ($1, $2, $3, $4, $5);
```

---

### Node 7: Trigger Alert Webhooks

**n8n Node Type:** `n8n-nodes-base.httpRequest` (3 parallel branches)

After processing all batches, fire webhooks to the alert workflows for each type of change detected.

**Branch A: New Listing Alerts (LOS-27)**

For each new listing, POST to the LOS-27 webhook:

```
URL: {{N8N_BASE_URL}}/webhook/los-27-new-listing
Method: POST
Headers:
  Content-Type: application/json
  X-Workflow-Source: LOS-26
Body:
```

```json
{
  "listing_id": "uuid-from-supabase",
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

**Branch B: Price Change Alerts (LOS-28)**

For each price change, POST to the LOS-28 webhook:

```
URL: {{N8N_BASE_URL}}/webhook/los-28-price-change
Method: POST
Headers:
  Content-Type: application/json
  X-Workflow-Source: LOS-26
Body:
```

```json
{
  "listing_id": "uuid-from-supabase",
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

**Branch C: Status Change Alerts (LOS-29)**

For each status change, POST to the LOS-29 webhook:

```
URL: {{N8N_BASE_URL}}/webhook/los-29-status-change
Method: POST
Headers:
  Content-Type: application/json
  X-Workflow-Source: LOS-26
Body:
```

```json
{
  "listing_id": "uuid-from-supabase",
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

**Implementation Note:** Use n8n's SplitInBatches node to iterate over the alerts arrays. If an array is empty, skip that branch. Use the IF node to check `alerts.new_listings.length > 0`, etc.

---

### Node 8: Update Sync Record with Counts

**n8n Node Type:** `n8n-nodes-base.supabase`

Update the sync record created in Node 3 with final counts.

```json
{
  "parameters": {
    "operation": "update",
    "tableId": "mls_sync_metadata",
    "matchingColumns": ["id"],
    "fieldsUi": {
      "fieldValues": [
        { "fieldId": "id", "fieldValue": "={{ $json.syncRecordId }}" },
        { "fieldId": "status", "fieldValue": "completed" },
        { "fieldId": "completed_at", "fieldValue": "={{ new Date().toISOString() }}" },
        { "fieldId": "records_processed", "fieldValue": "={{ $json.totalProcessed }}" },
        { "fieldId": "records_new", "fieldValue": "={{ $json.newCount }}" },
        { "fieldId": "records_updated", "fieldValue": "={{ $json.updatedCount }}" },
        { "fieldId": "records_price_changed", "fieldValue": "={{ $json.priceChangedCount }}" },
        { "fieldId": "records_status_changed", "fieldValue": "={{ $json.statusChangedCount }}" },
        { "fieldId": "last_modification_timestamp", "fieldValue": "={{ $json.maxModTimestamp }}" },
        { "fieldId": "records_failed", "fieldValue": "={{ $json.errors.length }}" },
        { "fieldId": "error_log", "fieldValue": "={{ JSON.stringify($json.errors) }}" }
      ]
    },
    "resource": "row"
  },
  "name": "Update Sync Record",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 2,
  "credentials": {
    "supabaseApi": { "id": "37rJREccSDhKtIGi", "name": "Supabase Service Role" }
  }
}
```

---

### Node 9: Error Handler

**n8n Node Type:** `n8n-nodes-base.errorTrigger` (attached to the entire workflow)

On any unhandled error, mark the sync record as failed and log the error.

```javascript
// Error handler Code node
const syncRecordId = $executionData?.syncRecordId || '';
const errorMessage = $json?.error?.message || 'Unknown error';

// Update sync record to failed status
// (Use Supabase node to update mls_sync_metadata)
return [{
  json: {
    syncRecordId,
    status: 'failed',
    completed_at: new Date().toISOString(),
    error_message: errorMessage,
  }
}];
```

**Error update SQL:**

```sql
UPDATE mls_sync_metadata
SET status = 'failed',
    completed_at = NOW(),
    error_message = $1
WHERE id = $2;
```

**Error handling strategy:**
- **HTTP 429 (Rate Limit):** Wait 60 seconds, then retry. Built into the HTTP Request node retry config.
- **HTTP 4xx/5xx:** Retry 3 times with 5-second delay between retries.
- **Individual listing transform errors:** Catch per-listing, log in `errors` array, continue processing remaining listings.
- **Fatal errors (Supabase down, auth expired):** Mark sync as `failed`, stop execution, alert via LOS-10 System Monitor.

---

## PATH B: Daily Market Snapshot (Midnight MST)

### Node 1: Schedule Trigger (Daily)

**n8n Node Type:** `n8n-nodes-base.scheduleTrigger`

```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 7 * * *"
        }
      ]
    }
  },
  "name": "Daily Midnight MST (07:00 UTC)",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.1
}
```

Note: MST (Mountain Standard Time) is UTC-7. Midnight MST = 07:00 UTC.

---

### Node 2: Generate City-Wide Snapshot

**n8n Node Type:** `n8n-nodes-base.supabase` (raw SQL via RPC or Code node with Supabase client)

Execute the `CITY_SNAPSHOT_SQL` from `lib/mls/syncService.ts`:

```sql
INSERT INTO market_snapshots (area, area_type, snapshot_date,
  active_count, new_count_7d, new_listings_30d, pending_count,
  sold_count_30d, sold_90d, median_price, avg_price, median_sold_price,
  avg_price_per_sqft, avg_dom, median_dom, months_of_inventory)
SELECT
  'El Paso' as area,
  'city' as area_type,
  CURRENT_DATE as snapshot_date,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'active' AND list_date >= CURRENT_DATE - 7) as new_count_7d,
  COUNT(*) FILTER (WHERE status = 'active' AND list_date >= CURRENT_DATE - 30) as new_listings_30d,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30) as sold_count_30d,
  COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 90) as sold_90d,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) FILTER (WHERE status = 'active') as median_price,
  AVG(list_price) FILTER (WHERE status = 'active') as avg_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 90) as median_sold_price,
  AVG(CASE WHEN sqft > 0 AND status = 'active' THEN list_price / sqft END) as avg_price_per_sqft,
  AVG(days_on_market) FILTER (WHERE status = 'active') as avg_dom,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) FILTER (WHERE status = 'active' AND days_on_market IS NOT NULL) as median_dom,
  CASE
    WHEN COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE status = 'active')::NUMERIC /
      COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30), 1
    )
    ELSE NULL
  END as months_of_inventory
FROM listings
ON CONFLICT (area, area_type, snapshot_date) DO UPDATE SET
  active_count = EXCLUDED.active_count,
  new_count_7d = EXCLUDED.new_count_7d,
  new_listings_30d = EXCLUDED.new_listings_30d,
  pending_count = EXCLUDED.pending_count,
  sold_count_30d = EXCLUDED.sold_count_30d,
  sold_90d = EXCLUDED.sold_90d,
  median_price = EXCLUDED.median_price,
  avg_price = EXCLUDED.avg_price,
  median_sold_price = EXCLUDED.median_sold_price,
  avg_price_per_sqft = EXCLUDED.avg_price_per_sqft,
  avg_dom = EXCLUDED.avg_dom,
  median_dom = EXCLUDED.median_dom,
  months_of_inventory = EXCLUDED.months_of_inventory;
```

**Implementation in n8n:** Use a Code node with the Supabase JS client to call `.rpc('run_sql', { query: CITY_SNAPSHOT_SQL })` or use a Postgres node if available. Alternatively, create a Supabase database function:

```sql
CREATE OR REPLACE FUNCTION generate_city_snapshot()
RETURNS void AS $$
BEGIN
  -- CITY_SNAPSHOT_SQL here
END;
$$ LANGUAGE plpgsql;
```

Then call via Supabase RPC node: `supabase.rpc('generate_city_snapshot')`.

---

### Node 3: Generate Per-Zip Snapshots

**n8n Node Type:** `n8n-nodes-base.supabase` (raw SQL)

Execute the `ZIP_SNAPSHOT_SQL` from `lib/mls/syncService.ts`:

```sql
INSERT INTO market_snapshots (area, area_type, snapshot_date,
  active_count, new_count_7d, new_listings_30d, pending_count,
  sold_count_30d, sold_90d, median_price, avg_price,
  avg_price_per_sqft, avg_dom, median_dom, months_of_inventory)
SELECT
  zip_code as area,
  'zip' as area_type,
  CURRENT_DATE as snapshot_date,
  COUNT(*) FILTER (WHERE status = 'active'),
  COUNT(*) FILTER (WHERE status = 'active' AND list_date >= CURRENT_DATE - 7),
  COUNT(*) FILTER (WHERE status = 'active' AND list_date >= CURRENT_DATE - 30),
  COUNT(*) FILTER (WHERE status = 'pending'),
  COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30),
  COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 90),
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) FILTER (WHERE status = 'active'),
  AVG(list_price) FILTER (WHERE status = 'active'),
  AVG(CASE WHEN sqft > 0 AND status = 'active' THEN list_price / sqft END),
  AVG(days_on_market) FILTER (WHERE status = 'active'),
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) FILTER (WHERE status = 'active' AND days_on_market IS NOT NULL),
  CASE
    WHEN COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE status = 'active')::NUMERIC /
      COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30), 1
    )
    ELSE NULL
  END
FROM listings
WHERE zip_code IS NOT NULL
GROUP BY zip_code
ON CONFLICT (area, area_type, snapshot_date) DO UPDATE SET
  active_count = EXCLUDED.active_count,
  new_count_7d = EXCLUDED.new_count_7d,
  new_listings_30d = EXCLUDED.new_listings_30d,
  pending_count = EXCLUDED.pending_count,
  sold_count_30d = EXCLUDED.sold_count_30d,
  sold_90d = EXCLUDED.sold_90d,
  median_price = EXCLUDED.median_price,
  avg_price = EXCLUDED.avg_price,
  avg_price_per_sqft = EXCLUDED.avg_price_per_sqft,
  avg_dom = EXCLUDED.avg_dom,
  median_dom = EXCLUDED.median_dom,
  months_of_inventory = EXCLUDED.months_of_inventory;
```

**Key El Paso ZIP codes covered:**
- 79901-79907 (Central/Downtown)
- 79911-79912 (Westside)
- 79922, 79924, 79925 (Mesa/Kern Place)
- 79928 (Horizon City)
- 79932 (Upper Valley)
- 79934 (Westside/Cimarron)
- 79935-79936 (East)
- 79938 (East/Far East)
- 79835 (Canutillo)
- 79927 (Socorro)

---

### Node 4: Calculate 30-Day Trends

**n8n Node Type:** `n8n-nodes-base.supabase` (raw SQL)

Execute the `TRENDS_SQL` from `lib/mls/syncService.ts`:

```sql
UPDATE market_snapshots ms SET
  price_trend = CASE
    WHEN ms.median_price > prev.median_price THEN 'up'
    WHEN ms.median_price < prev.median_price THEN 'down'
    ELSE 'flat'
  END,
  price_change_30d_pct = ROUND(
    (ms.median_price - prev.median_price) / NULLIF(prev.median_price, 0) * 100, 2
  ),
  inventory_trend = CASE
    WHEN ms.active_count > prev.active_count THEN 'increasing'
    WHEN ms.active_count < prev.active_count THEN 'decreasing'
    ELSE 'stable'
  END,
  inventory_change_30d_pct = ROUND(
    (ms.active_count - prev.active_count)::NUMERIC / NULLIF(prev.active_count, 0) * 100, 2
  )
FROM market_snapshots prev
WHERE ms.snapshot_date = CURRENT_DATE
  AND prev.area = ms.area
  AND prev.area_type = ms.area_type
  AND prev.snapshot_date = CURRENT_DATE - 30;
```

This compares today's snapshot to the one from 30 days ago. The `price_trend` and `inventory_trend` fields are used by the frontend `useMarketSnapshot()` hook and the LOS-06 Daily Briefing workflow.

**Note:** This UPDATE only affects rows where a 30-day-old comparison exists. On the first 30 days of operation, trend fields will remain NULL.

---

## Initial Full Sync Notes

The very first time LOS-26 runs, there is no previous sync timestamp. The fallback `2020-01-01T00:00:00Z` triggers a full pull of all GEPAR listings.

**Expected volumes:**
- Active El Paso metro listings: ~3,000-5,000
- Including pending/sold: ~8,000-12,000
- At 200 per page: 15-60 API calls
- At 200ms delay between pages: 3-12 seconds of API time
- Supabase upserts in batches of 25: 120-480 batch operations
- Total initial sync time: 2-5 minutes

**Recommendations for initial sync:**
1. Run during off-peak hours (e.g., 2 AM MST).
2. Consider temporarily increasing the batch size to 50 for the initial run.
3. Monitor the `mls_sync_metadata` table for the `records_processed` count.
4. After initial sync, verify data in Supabase: `SELECT COUNT(*), status FROM listings GROUP BY status;`

---

## n8n Workflow Connection Map

```
[Every 15 Min] ──> [Get Last Sync TS] ──> [Create Sync Record] ──> [Fetch Listings Loop]
                                                                         │
                                                                    [HTTP Request]
                                                                         │
                                                                    [Pagination Check]
                                                                    ├── (more pages) ──> [Wait 200ms] ──> [HTTP Request]
                                                                    └── (done) ──> [Process Listings]
                                                                                        │
                                                                                   [Batch Upsert Loop]
                                                                                        │
                                                                                   [Check for Alerts]
                                                                                   ├── new listings ──> POST LOS-27
                                                                                   ├── price changes ──> POST LOS-28
                                                                                   └── status changes ──> POST LOS-29
                                                                                        │
                                                                                   [Update Sync Record]

[Error Trigger] ──> [Mark Sync Failed] ──> [Log Error]
```

---

## Environment Variables / n8n Credentials Required

| Credential | Type | Purpose |
|-----------|------|---------|
| Supabase Service Role | Supabase API | Database read/write with service role key (bypasses RLS) |
| Spark API | Custom Auth (headers) | `Authorization: OAuth <SPARK_API_TOKEN>` |
| N8N_BASE_URL | Environment Variable | Base URL for internal webhook calls (e.g., `https://n8n.lorena-os.com`) |

---

## Monitoring & Observability

**Dashboard query for sync health:**

```sql
SELECT
  sync_type,
  status,
  started_at,
  completed_at,
  records_processed,
  records_new,
  records_updated,
  records_price_changed,
  records_status_changed,
  records_failed,
  error_message,
  EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
FROM mls_sync_metadata
ORDER BY started_at DESC
LIMIT 20;
```

**Stale data detection (used by `useMLSSyncStatus()` in `hooks/useListings.ts`):**

```sql
SELECT
  completed_at,
  EXTRACT(EPOCH FROM (NOW() - completed_at)) / 3600 as hours_since_last_sync
FROM mls_sync_metadata
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;
```

If `hours_since_last_sync > 12`, the `StaleDataBanner` component displays a warning per GEPAR Rule 18.2.5.

---

## Source Code References

| File | Purpose |
|------|---------|
| `lib/mls/sparkApi.ts` | Spark API client, `transformSparkToSupabase()`, helpers |
| `lib/mls/syncService.ts` | `runIncrementalSync()`, SQL constants, `SyncResult` types |
| `lib/mls/adapter.ts` | `transformListingToDisplay()` for frontend consumption |
| `lib/mls/compliance.ts` | `isListingDisplayable()` opt-out flag checks |
| `lib/mls/types.ts` | `MLSListing`, `PropertyDisplayData`, `PropertyFilters` |
| `lib/supabase/database.types.ts` | All table type definitions including MLS tables |
| `hooks/useListings.ts` | Frontend hooks consuming `listings` table |
| `hooks/useMarketSnapshots.ts` | Frontend hooks consuming `market_snapshots` table |
| `components/mls/StaleDataBanner.tsx` | GEPAR compliance stale data warning |
