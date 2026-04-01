/**
 * MLS Listing Pull Script
 * Fetches all active El Paso listings from Spark API (GEPAR)
 * and upserts them into the Supabase `listings` table.
 *
 * Run: node scripts/pull-mls.mjs
 */

import { createClient } from '@supabase/supabase-js';

// ── Config ──────────────────────────────────────────────
const SPARK_TOKEN = process.env.SPARK_API_TOKEN;
const SPARK_BASE = 'https://replication.sparkapi.com/v1';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zdonombljnuylmnwkhga.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lorena's agent info for is_lorenas_listing detection
const LORENA_AGENT_IDS = ['gep.8809'];
const LORENA_NAMES = ['lorena ontiveros', 'lorena ortega', 'lorena ontiveros-ortega'];

const PAGE_SIZE = 200;
const BATCH_SIZE = 50; // Supabase upsert batch size

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Spark API helpers ──────────────────────────────────
async function sparkFetch(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SPARK_TOKEN}`,
        'Accept': 'application/json',
      },
    });
    if (res.status === 429) {
      const wait = Math.pow(2, attempt + 1) * 5000; // 10s, 20s, 40s
      console.log(`  Rate limited. Waiting ${wait / 1000}s (attempt ${attempt + 1}/${retries + 1})...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`Spark API ${res.status}: ${res.statusText}`);
    return res.json();
  }
  throw new Error('Spark API rate limit exceeded after retries');
}

async function fetchListingPhotos(sparkId) {
  try {
    const data = await sparkFetch(
      `${SPARK_BASE}/listings/${sparkId}/photos?_limit=25`
    );
    const results = data?.D?.Results || [];
    return results.map((p) => ({
      url: p.Uri1024 || p.Uri800 || p.Uri640 || p.UriLarge || p.Uri300,
      caption: p.Caption || '',
      primary: p.Primary || false,
    }));
  } catch {
    return [];
  }
}

// ── Transform Spark listing → Supabase row ─────────────
// Spark API masks restricted fields with "********"
function clean(val) {
  if (val === '********' || val === null || val === undefined) return null;
  return val;
}
function cleanNum(val) {
  const v = clean(val);
  if (v === null) return null;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function cleanInt(val) {
  const v = cleanNum(val);
  return v === null ? null : Math.round(v);
}

function extractArrayKeys(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj)
    .filter(([k, v]) => v === true && k !== '********')
    .map(([k]) => k);
}

function stripContactInfo(text) {
  if (!text) return text;
  // Strip phone numbers
  let cleaned = text.replace(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g, '[phone removed]');
  // Strip email addresses
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email removed]');
  return cleaned;
}

function isLorenaListing(sf) {
  const agentName = (sf.ListAgentName || '').toLowerCase();
  const agentId = (sf.ListAgentMlsId || '').toLowerCase();
  return (
    LORENA_NAMES.some((n) => agentName.includes(n)) ||
    LORENA_AGENT_IDS.some((id) => agentId === id)
  );
}

function mapStatus(mlsStatus) {
  const s = (mlsStatus || '').toLowerCase();
  if (s === 'active' || s === 'active under contract') return 'active';
  if (s === 'pending') return 'pending';
  if (s === 'closed' || s === 'sold') return 'sold';
  if (s === 'expired') return 'expired';
  if (s === 'canceled' || s === 'cancelled') return 'canceled';
  if (s === 'withdrawn') return 'withdrawn';
  return 'active';
}

function transformListing(raw, photos = []) {
  const sf = raw.StandardFields || raw;

  const primaryPhoto = photos.find((p) => p.primary);
  const primaryUrl = primaryPhoto?.url || photos[0]?.url || null;

  // Build address from components
  const parts = [sf.StreetNumber, sf.StreetDirPrefix, sf.StreetName, sf.StreetSuffix, sf.StreetDirSuffix]
    .filter(Boolean)
    .join(' ');
  const address = parts || sf.UnparsedFirstLineAddress || sf.UnparsedAddress || 'Unknown';

  return {
    spark_id: raw.Id || sf.ListingKey,
    mls_id: clean(sf.ListingId) || clean(sf.OriginatingSystemListingId) || String(sf.ListingNumber || ''),
    status: mapStatus(sf.MlsStatus || sf.StandardStatus),
    list_price: cleanNum(sf.ListPrice) || cleanNum(sf.CurrentPrice) || 0,
    original_list_price: cleanNum(sf.OriginalListPrice),
    sold_price: cleanNum(sf.ClosePrice),
    close_price: cleanNum(sf.ClosePrice),
    close_date: clean(sf.CloseDate),
    list_date: clean(sf.ListingContractDate) || clean(sf.OnMarketContractDate),
    pending_date: clean(sf.PendingDate),

    address,
    unit_number: clean(sf.UnitNumber),
    city: clean(sf.City) || 'El Paso',
    state: clean(sf.StateOrProvince) || 'TX',
    zip_code: clean(sf.PostalCode) || '79900',
    county: clean(sf.CountyOrParish) || 'El Paso',
    subdivision: clean(sf.SubdivisionName),
    latitude: cleanNum(sf.Latitude),
    longitude: cleanNum(sf.Longitude),

    property_type: clean(sf.PropertyTypeLabel) || clean(sf.PropertyClass) || 'Residential',
    property_subtype: clean(sf.PropertySubType),
    beds: cleanInt(sf.BedsTotal) || 0,
    baths: cleanInt(sf.BathsFull) || Math.floor(cleanNum(sf.BathroomsTotalDecimal) || 0),
    half_baths: cleanInt(sf.BathsHalf) || 0,
    sqft: cleanInt(sf.BuildingAreaTotal) || 0,
    lot_sqft: cleanInt(sf.LotSizeSquareFeet) ? Math.min(cleanInt(sf.LotSizeSquareFeet), 99999999) : null,
    lot_acres: cleanNum(sf.LotSizeAcres) ? Math.min(cleanNum(sf.LotSizeAcres), 9999) : null,
    year_built: cleanInt(sf.YearBuilt),
    stories: cleanInt(sf.StoriesTotal),
    garage_spaces: cleanInt(sf.GarageSpaces) || 0,
    pool: sf.PoolYN === true,

    days_on_market: cleanInt(sf.DaysOnMarket) || 0,
    cumulative_dom: cleanInt(sf.CumulativeDaysOnMarket) || cleanInt(sf.DaysOnMarket) || 0,

    description: stripContactInfo(clean(sf.PublicRemarks) || ''),
    public_remarks: stripContactInfo(clean(sf.PublicRemarks) || ''),
    interior_features: extractArrayKeys(sf.InteriorFeatures),
    exterior_features: extractArrayKeys(sf.ExteriorFeatures),
    appliances: extractArrayKeys(sf.KitchenAppliances),
    heating: extractArrayKeys(sf.Heating).join(', ') || null,
    cooling: extractArrayKeys(sf.Cooling).join(', ') || null,
    construction: extractArrayKeys(sf.ConstructionMaterials).join(', ') || null,
    roof: extractArrayKeys(sf.Roof).join(', ') || null,
    foundation: clean(sf.FoundationDetails) && typeof sf.FoundationDetails === 'string' ? sf.FoundationDetails : null,
    parking_description: clean(sf.ParkingFeatures) && typeof sf.ParkingFeatures === 'string' ? sf.ParkingFeatures : extractArrayKeys(sf.ParkingFeatures).join(', ') || null,

    hoa_fee: cleanNum(sf.AssociationFee),
    hoa_frequency: clean(sf.AssociationFeeFrequency),
    tax_amount: cleanNum(sf.TaxAmount),
    tax_year: cleanInt(sf.TaxYear),

    school_district: clean(sf.SchoolDistrict) || clean(sf.DistrictHighSchool),
    elementary_school: clean(sf.ElementarySchool),
    middle_school: clean(sf.MiddleOrJuniorSchool),
    high_school: clean(sf.HighSchool),

    photos: photos.length > 0 ? JSON.stringify(photos) : '[]',
    photo_count: cleanInt(sf.PhotosCount) || photos.length || 0,
    primary_photo_url: primaryUrl,
    virtual_tour_url: null,

    listing_agent_id: clean(sf.ListAgentMlsId) || clean(sf.ListAgentId),
    listing_agent_name: clean(sf.ListAgentName) || clean(sf.ListAgentViewName),
    listing_agent_phone: clean(sf.ListAgentPreferredPhone),
    listing_agent_email: null, // Never expose agent emails publicly
    listing_office_name: clean(sf.ListOfficeName) || clean(sf.ListOfficeViewName),
    listing_office_id: clean(sf.ListOfficeMlsId) || clean(sf.ListOfficeId),
    co_listing_agent_name: clean(sf.CoListAgentName),
    buyer_agent_name: null, // Not relevant for active listings
    buyer_office_name: null,

    is_lorenas_listing: isLorenaListing(sf),

    display_compliance: raw.DisplayCompliance || {},
    mls_name: 'GEPAR',

    spark_modification_timestamp: clean(sf.SparkModificationTimestamp) || clean(sf.ModificationTimestamp),
    last_synced_at: new Date().toISOString(),
  };
}

// ── Main Pull Loop ──────────────────────────────────────
async function pullListings() {
  console.log('=== GEPAR MLS Pull ===\n');

  let page = 1;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalPhotos = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${SPARK_BASE}/listings?_limit=${PAGE_SIZE}&_page=${page}&_filter=StandardStatus+Eq+%27Active%27+And+City+Eq+%27El+Paso%27&_orderby=-ListPrice`;

    console.log(`Page ${page}: Fetching ${PAGE_SIZE} listings...`);
    const data = await sparkFetch(url);
    const results = data?.D?.Results || [];

    if (results.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`  Got ${results.length} listings`);

    // Fetch photos for each listing (batch of 5 concurrent)
    const listingsWithPhotos = [];
    for (let i = 0; i < results.length; i += 5) {
      const batch = results.slice(i, i + 5);
      const photoBatches = await Promise.all(
        batch.map((listing) => {
          const sparkId = listing.Id || listing.StandardFields?.ListingKey;
          return fetchListingPhotos(sparkId);
        })
      );

      for (let j = 0; j < batch.length; j++) {
        const photos = photoBatches[j];
        totalPhotos += photos.length;
        listingsWithPhotos.push(transformListing(batch[j], photos));
      }

      // Rate limiting: delay between photo batches
      if (i + 5 < results.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Upsert into Supabase in batches
    for (let i = 0; i < listingsWithPhotos.length; i += BATCH_SIZE) {
      const batch = listingsWithPhotos.slice(i, i + BATCH_SIZE);
      const { data: upserted, error } = await supabase
        .from('listings')
        .upsert(batch, {
          onConflict: 'spark_id',
          ignoreDuplicates: false,
        })
        .select('id');

      if (error) {
        console.error(`  Upsert error (batch ${i / BATCH_SIZE + 1}):`, error.message);
        // Try individual inserts for failed batch
        for (const listing of batch) {
          const { error: singleErr } = await supabase
            .from('listings')
            .upsert(listing, { onConflict: 'spark_id' });
          if (singleErr) {
            console.error(`    Failed: ${listing.address} — ${singleErr.message}`);
          } else {
            totalInserted++;
          }
        }
      } else {
        totalInserted += upserted?.length || batch.length;
      }
    }

    console.log(`  Upserted ${listingsWithPhotos.length} listings, ${totalPhotos} photos total`);

    // If we got fewer than PAGE_SIZE, we're done
    hasMore = results.length === PAGE_SIZE;
    page++;

    // Rate limiting between pages (2s delay to avoid 429)
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n=== Complete ===`);
  console.log(`Total listings upserted: ${totalInserted}`);
  console.log(`Total photos fetched: ${totalPhotos}`);

  return totalInserted;
}

// ── Generate Market Snapshots ───────────────────────────
async function generateMarketSnapshots() {
  console.log('\n=== Generating Market Snapshots ===\n');

  // Query listings for stats
  const { data: listings, error } = await supabase
    .from('listings')
    .select('zip_code, subdivision, list_price, sqft, days_on_market, status, list_date')
    .eq('status', 'active');

  if (error || !listings?.length) {
    console.error('No listings to analyze:', error?.message);
    return;
  }

  console.log(`Analyzing ${listings.length} active listings...`);

  // City-wide snapshot
  const prices = listings.map((l) => Number(l.list_price)).sort((a, b) => a - b);
  const medianPrice = prices[Math.floor(prices.length / 2)];
  const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const avgDom = Math.round(
    listings.reduce((s, l) => s + (l.days_on_market || 0), 0) / listings.length
  );
  const pricePerSqft = listings.filter((l) => l.sqft > 0);
  const avgPpsf = pricePerSqft.length
    ? Math.round(
        pricePerSqft.reduce((s, l) => s + Number(l.list_price) / l.sqft, 0) / pricePerSqft.length
      )
    : 0;

  // New this week (list_date within 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const newThisWeek = listings.filter((l) => l.list_date && l.list_date >= weekAgo).length;

  const today = new Date().toISOString().split('T')[0];

  // City-wide snapshot
  const citySnapshot = {
    area: 'El Paso',
    area_type: 'city',
    snapshot_date: today,
    active_count: listings.length,
    new_count_7d: newThisWeek,
    pending_count: 0, // Will be updated if we pull pending listings
    sold_count_30d: 0,
    median_price: medianPrice,
    avg_price: avgPrice,
    median_sold_price: null,
    avg_dom: avgDom,
    median_dom: 0,
    avg_price_per_sqft: avgPpsf,
    months_of_inventory: null,
    list_to_sold_ratio: null,
  };

  const { error: cityErr } = await supabase.from('market_snapshots').upsert(citySnapshot, {
    onConflict: 'area,area_type,snapshot_date',
  });
  if (cityErr) console.error('City snapshot error:', cityErr.message);
  else console.log(`  City snapshot: ${listings.length} active, median $${medianPrice.toLocaleString()}, avg DOM ${avgDom}`);

  // ZIP-level snapshots
  const zipGroups = new Map();
  for (const l of listings) {
    const zip = l.zip_code;
    if (!zipGroups.has(zip)) zipGroups.set(zip, []);
    zipGroups.get(zip).push(l);
  }

  const zipSnapshots = [];
  for (const [zip, zipListings] of zipGroups) {
    const zPrices = zipListings.map((l) => Number(l.list_price)).sort((a, b) => a - b);
    const zMedian = zPrices[Math.floor(zPrices.length / 2)];
    const zAvgDom = Math.round(
      zipListings.reduce((s, l) => s + (l.days_on_market || 0), 0) / zipListings.length
    );
    const zPpsf = zipListings.filter((l) => l.sqft > 0);
    const zAvgPpsf = zPpsf.length
      ? Math.round(zPpsf.reduce((s, l) => s + Number(l.list_price) / l.sqft, 0) / zPpsf.length)
      : 0;
    const zNew = zipListings.filter((l) => l.list_date && l.list_date >= weekAgo).length;

    zipSnapshots.push({
      area: zip,
      area_type: 'zip',
      snapshot_date: today,
      active_count: zipListings.length,
      new_count_7d: zNew,
      pending_count: 0,
      sold_count_30d: 0,
      median_price: zMedian,
      avg_price: Math.round(zPrices.reduce((s, p) => s + p, 0) / zPrices.length),
      median_sold_price: null,
      avg_dom: zAvgDom,
      median_dom: 0,
      avg_price_per_sqft: zAvgPpsf,
      months_of_inventory: null,
      list_to_sold_ratio: null,
    });
  }

  // Upsert ZIP snapshots
  if (zipSnapshots.length > 0) {
    const { error: zipErr } = await supabase.from('market_snapshots').upsert(zipSnapshots, {
      onConflict: 'area,area_type,snapshot_date',
    });
    if (zipErr) console.error('ZIP snapshots error:', zipErr.message);
    else console.log(`  ${zipSnapshots.length} ZIP snapshots generated`);
  }

  // Subdivision-level snapshots (top 20 by count)
  const subGroups = new Map();
  for (const l of listings) {
    const sub = l.subdivision;
    if (!sub) continue;
    if (!subGroups.has(sub)) subGroups.set(sub, []);
    subGroups.get(sub).push(l);
  }

  const subSnapshots = Array.from(subGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 30)
    .map(([sub, subListings]) => {
      const sPrices = subListings.map((l) => Number(l.list_price)).sort((a, b) => a - b);
      const sNew = subListings.filter((l) => l.list_date && l.list_date >= weekAgo).length;
      return {
        area: sub,
        area_type: 'subdivision',
        snapshot_date: today,
        active_count: subListings.length,
        new_count_7d: sNew,
        pending_count: 0,
        sold_count_30d: 0,
        median_price: sPrices[Math.floor(sPrices.length / 2)],
        avg_price: Math.round(sPrices.reduce((s, p) => s + p, 0) / sPrices.length),
        median_sold_price: null,
        avg_dom: Math.round(subListings.reduce((s, l) => s + (l.days_on_market || 0), 0) / subListings.length),
        median_dom: 0,
        avg_price_per_sqft: 0,
        months_of_inventory: null,
        list_to_sold_ratio: null,
      };
    });

  if (subSnapshots.length > 0) {
    const { error: subErr } = await supabase.from('market_snapshots').upsert(subSnapshots, {
      onConflict: 'area,area_type,snapshot_date',
    });
    if (subErr) console.error('Subdivision snapshots error:', subErr.message);
    else console.log(`  ${subSnapshots.length} subdivision snapshots generated`);
  }

  // Record sync metadata
  const { error: metaErr } = await supabase.from('mls_sync_metadata').insert({
    sync_type: 'full',
    status: 'completed',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    records_processed: listings.length,
    records_created: listings.length,
    records_updated: 0,
    records_failed: 0,
  });
  if (metaErr) console.error('Sync metadata error:', metaErr.message);
  else console.log('  Sync metadata recorded');
}

// ── Seed missing data ───────────────────────────────────
async function seedMissingData() {
  console.log('\n=== Seeding Missing Data ===\n');

  // Get agent ID
  const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'agent').limit(1);
  if (!profiles?.length) {
    console.error('No agent profile found. Sign up first.');
    return;
  }
  const agentId = profiles[0].id;
  console.log(`Agent ID: ${agentId}`);

  // Get existing leads
  const { data: leads } = await supabase.from('leads').select('id, first_name, last_name, score').limit(20);
  if (!leads?.length) {
    console.log('No leads found. Run the main seed script first.');
    return;
  }
  console.log(`Found ${leads.length} existing leads`);

  // Seed messages if empty
  const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
  if (msgCount === 0) {
    console.log('Seeding messages...');
    const channels = ['sms', 'email', 'ai_sms'];
    const messages = [];

    const inboundTemplates = [
      "Hi, I'm interested in seeing some properties in the area.",
      "Can you show me homes in the $200K-$300K range?",
      "We're relocating from Fort Bliss area. Need 3+ bedrooms.",
      "Is the home on Mesa Hills still available?",
      "What's the market like in Eastlake right now?",
      "We need something with a pool and garage.",
      "Looking for a fixer-upper under $180K.",
      "Can we schedule a showing this weekend?",
    ];

    const outboundTemplates = [
      "Hello! I'd love to help you find your perfect home in El Paso. What areas are you interested in?",
      "Great news! I have several options that match your criteria. When can we schedule a viewing?",
      "The Eastlake area is very popular right now. Prices have been steady. Let me send you some listings.",
      "Absolutely! That property is still available. Would Saturday at 10 AM work for a showing?",
      "I just listed a beautiful home that matches exactly what you're looking for. Can I send you details?",
    ];

    for (let i = 0; i < Math.min(8, leads.length); i++) {
      const channel = channels[i % channels.length];
      const baseTime = Date.now() - (8 - i) * 24 * 60 * 60 * 1000;

      messages.push({
        lead_id: leads[i].id,
        agent_id: agentId,
        channel,
        direction: 'inbound',
        content: inboundTemplates[i % inboundTemplates.length],
        read: i > 3,
        created_at: new Date(baseTime).toISOString(),
      });
      messages.push({
        lead_id: leads[i].id,
        agent_id: agentId,
        channel,
        direction: 'outbound',
        content: outboundTemplates[i % outboundTemplates.length],
        read: true,
        created_at: new Date(baseTime + 300000).toISOString(),
      });

      // Add a recent follow-up for some
      if (i < 4) {
        messages.push({
          lead_id: leads[i].id,
          agent_id: agentId,
          channel,
          direction: 'inbound',
          content: i % 2 === 0 ? "Yes, that works! See you then." : "Can you send me more details?",
          read: false,
          created_at: new Date(Date.now() - (3 - i) * 3600000).toISOString(),
        });
      }
    }

    const { error } = await supabase.from('messages').insert(messages);
    if (error) console.error('Messages error:', error.message);
    else console.log(`  Inserted ${messages.length} messages`);
  }

  // Seed showings if empty
  const { count: showCount } = await supabase.from('showings').select('*', { count: 'exact', head: true });
  if (showCount === 0) {
    console.log('Seeding showings...');

    // Get some real listing addresses
    const { data: sampleListings } = await supabase
      .from('listings')
      .select('address, city, zip_code')
      .eq('status', 'active')
      .limit(8);

    const addresses = sampleListings?.length
      ? sampleListings.map((l) => `${l.address}, ${l.city}, TX ${l.zip_code}`)
      : [
          '1234 Mesa Hills Dr, El Paso, TX 79912',
          '5678 Pebble Hills Blvd, El Paso, TX 79936',
          '910 Eastlake Dr, El Paso, TX 79938',
          '2345 Westside Ave, El Paso, TX 79932',
          '6789 Northeast Blvd, El Paso, TX 79934',
          '1111 Horizon City Rd, El Paso, TX 79928',
        ];

    const today = new Date();
    const showings = [];
    const statuses = ['confirmed', 'scheduled', 'scheduled', 'completed', 'scheduled', 'scheduled'];

    for (let i = 0; i < Math.min(6, leads.length); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + (i - 1)); // Some past, some future

      showings.push({
        lead_id: leads[i].id,
        agent_id: agentId,
        address: addresses[i % addresses.length],
        date: date.toISOString().split('T')[0],
        start_time: `${10 + i}:00`,
        end_time: `${11 + i}:00`,
        status: statuses[i],
        notes: i === 0 ? 'Client very interested in this property' : null,
      });
    }

    const { error } = await supabase.from('showings').insert(showings);
    if (error) console.error('Showings error:', error.message);
    else console.log(`  Inserted ${showings.length} showings`);
  }

  // Seed deals if empty
  const { count: dealCount } = await supabase.from('deals').select('*', { count: 'exact', head: true });
  if (dealCount === 0) {
    console.log('Seeding deals...');

    const deals = [
      {
        agent_id: agentId,
        lead_id: leads[0]?.id,
        property_address: '4521 Mesa Hills Dr, El Paso, TX 79912',
        stage: 'under_contract',
        deal_type: 'buyer',
        list_price: 285000,
        sale_price: 278000,
        commission_rate: 3,
        estimated_close_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Closing on schedule. Inspection passed.',
      },
      {
        agent_id: agentId,
        lead_id: leads[1]?.id,
        property_address: '7890 Pebble Hills Blvd, El Paso, TX 79936',
        stage: 'active_listing',
        deal_type: 'seller',
        list_price: 345000,
        commission_rate: 3,
        estimated_close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Listed 2 weeks ago. Multiple showings.',
      },
      {
        agent_id: agentId,
        lead_id: leads[2]?.id,
        property_address: '1234 Eastlake Blvd, El Paso, TX 79938',
        stage: 'pending',
        deal_type: 'buyer',
        list_price: 255000,
        sale_price: 250000,
        commission_rate: 2.5,
        estimated_close_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'VA loan. Appraisal scheduled.',
      },
      {
        agent_id: agentId,
        lead_id: leads[3]?.id,
        property_address: '5555 Upper Valley Rd, El Paso, TX 79922',
        stage: 'pre_listing',
        deal_type: 'seller',
        list_price: 425000,
        commission_rate: 3,
        estimated_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Staging in progress. Photos next week.',
      },
      {
        agent_id: agentId,
        lead_id: leads.length > 5 ? leads[5].id : leads[0].id,
        property_address: '9876 Coronado Hills, El Paso, TX 79912',
        stage: 'closed',
        deal_type: 'buyer',
        list_price: 310000,
        sale_price: 305000,
        commission_rate: 3,
        actual_close_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Closed! Happy client.',
      },
    ];

    const { error } = await supabase.from('deals').insert(deals);
    if (error) console.error('Deals error:', error.message);
    else console.log(`  Inserted ${deals.length} deals`);
  }
}

// ── Run everything ──────────────────────────────────────
async function main() {
  try {
    const count = await pullListings();
    if (count > 0) {
      await generateMarketSnapshots();
    }
    await seedMissingData();
    console.log('\n=== All done! ===');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
