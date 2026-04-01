#!/usr/bin/env node
/**
 * CINC Lead Import Script
 *
 * Imports leads from a CINC CRM CSV export into the Supabase `leads` table.
 * Uses the service role key to bypass RLS.
 *
 * Usage:
 *   node scripts/import-cinc-leads.mjs "/path/to/Cinc Leads.csv"
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config(); // Load .env

// ── Config ──────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AGENT_ID = '373896de-b814-4a83-9ce1-a2af5a1b5ed2'; // Lorena's primary profile
const BATCH_SIZE = 50;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Field Mappings ──────────────────────────────────────

/** Map CINC Pipeline Stage → leads.status */
function mapStatus(pipelineStage, cincStatus) {
  const stage = (pipelineStage || '').trim().toLowerCase();
  const map = {
    'new': 'new_lead',
    'contacted': 'contacted',
    'attempted contact': 'attempted_contact',
    'appointment set': 'appointment_set',
    'appointment met': 'appointment_met',
    'active client': 'active_client',
    'pending client': 'pending_client',
    'past client': 'past_client',
    'lost': 'lost',
  };
  return map[stage] || 'contacted'; // Default to contacted (most CINC leads are in-progress)
}

/** Map CINC Source → leads.source */
function mapSource(cincSource) {
  const src = (cincSource || '').trim().toLowerCase();
  if (src.includes('google')) return 'website';
  if (src.includes('facebook') || src.includes('meta') || src.includes('instagram')) return 'social';
  if (src.includes('zillow')) return 'zillow';
  if (src.includes('referral')) return 'referral';
  if (src.includes('open house')) return 'open_house';
  if (src.includes('phone') || src.includes('call')) return 'cold_call';
  if (src.includes('one suite') || src.includes('cinc') || src.includes('home actions')) return 'cinc';
  if (src.includes('admin')) return 'other';
  return 'cinc'; // Default for CINC imports
}

/** Map CINC Buyer/Seller → leads.deal_type */
function mapDealType(buyerSeller) {
  const val = (buyerSeller || '').trim().toLowerCase();
  if (val === 'buyer') return 'buyer';
  if (val === 'seller') return 'seller';
  if (val === 'both') return 'dual';
  return null;
}

/** Map CINC Timeframe → leads.timeline */
function mapTimeline(timeframe) {
  const val = (timeframe || '').trim();
  if (!val) return null;
  const map = {
    'ASAP': '0-3 months',
    'RightAway': '0-3 months',
    '3to6Months': '3-6 months',
    '6to12Months': '6-12 months',
    'NotRightNow': '12+ months',
    'JustLooking': 'Just looking',
  };
  return map[val] || val;
}

/** Clean phone number to just digits */
function cleanPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  return digits.length === 10 ? digits : digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits;
}

/** Parse CINC date string to ISO */
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/** Check if email is a CINC placeholder */
function isPlaceholderEmail(email) {
  if (!email) return true;
  const e = email.trim().toLowerCase();
  return e.startsWith('noemail') || e.includes('@example.com') || e === '';
}

/** Parse comma-separated labels into tags array */
function parseTags(labels) {
  if (!labels) return [];
  return labels.split(',').map(t => t.trim()).filter(Boolean);
}

/** Determine preferred language from notes/labels */
function detectLanguage(row) {
  const notes = ((row['Notes'] || '') + ' ' + (row['Notes 2'] || '')).toLowerCase();
  // Spanish indicators in notes
  const spanishWords = ['quiere', 'casa', 'hablar', 'comprar', 'vender', 'llamar', 'dijo', 'pregunto', 'mande'];
  const hasSpanish = spanishWords.some(w => notes.includes(w));
  return hasSpanish ? 'es' : 'en';
}

/** Determine communication preference from opt-in flags */
function mapCommPreference(optEmail, optText) {
  const email = (optEmail || '').toLowerCase().includes('opted in');
  const text = (optText || '').toLowerCase().includes('opted in');
  if (email && text) return 'any';
  if (text && !email) return 'sms';
  if (email && !text) return 'email';
  return 'any';
}

/** Clamp score to 0-100 */
function clampScore(score) {
  const n = parseInt(score, 10);
  if (isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

// ── Main Import ─────────────────────────────────────────

async function importLeads(csvPath) {
  console.log(`\n📂 Reading CSV: ${csvPath}`);

  const raw = readFileSync(csvPath, 'utf-8');

  // CINC CSVs have a metadata line before the header row
  const lines = raw.split('\n');
  let csvContent = raw;
  if (!lines[0].includes('First Name')) {
    console.log(`⏭  Skipping metadata line: ${lines[0].substring(0, 60)}...`);
    csvContent = lines.slice(1).join('\n');
  }

  const { data, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  });

  if (errors.length > 0) {
    console.log(`⚠️  Parse warnings: ${errors.length}`);
    errors.slice(0, 3).forEach(e => console.log(`   ${e.message} (row ${e.row})`));
  }

  console.log(`📊 Parsed ${data.length} rows from CSV\n`);

  // Generate a batch ID for this import
  const importBatchId = crypto.randomUUID();
  const importedAt = new Date().toISOString();

  // Transform rows
  const leads = [];
  const skipped = [];

  for (const row of data) {
    const firstName = (row['First Name'] || '').trim();
    const lastName = (row['Last Name'] || '').trim();

    // Skip rows with no name
    if (!firstName && !lastName) {
      skipped.push({ reason: 'no name', email: row['Email Address'] });
      continue;
    }

    const email = isPlaceholderEmail(row['Email Address']) ? null : row['Email Address'].trim();
    const phone = cleanPhone(row['Cell Phone']) || cleanPhone(row['Home Phone']) || cleanPhone(row['Work Phone']);

    // Build custom_fields with all the rich CINC data
    const customFields = {};

    // Home address
    if (row['Address']) {
      customFields.home_address = {
        address: row['Address']?.trim() || null,
        city: row['City']?.trim() || null,
        state: row['State']?.trim() || null,
        zip: row['ZIP']?.trim() || null,
      };
    }

    // Secondary contact
    if (row['Secondary Contact Name']?.trim()) {
      customFields.secondary_contact = {
        name: row['Secondary Contact Name']?.trim() || null,
        phone: row['Secondary Contact Phone']?.trim() || null,
        address: row['Secondary Contact Address']?.trim() || null,
        city: row['Secondary Contact City']?.trim() || null,
        state: row['Secondary Contact State']?.trim() || null,
        zip: row['Secondary Contact Zip']?.trim() || null,
        relationship: row['Secondary Contact Relationship']?.trim() || null,
      };
    }

    // CINC activity metrics
    const loginCount = parseInt(row['Login Count'], 10);
    const propertyViews = parseInt(row['Property Views'], 10);
    const propertyInquiries = parseInt(row['Property Inquiries'], 10);
    const favoriteProperties = parseInt(row['Favorite Properties'], 10);
    const savedSearches = parseInt(row['Saved Searches'], 10);

    if (loginCount > 0 || propertyViews > 0 || propertyInquiries > 0 || favoriteProperties > 0 || savedSearches > 0) {
      customFields.cinc_activity = {
        login_count: loginCount || 0,
        property_views: propertyViews || 0,
        property_inquiries: propertyInquiries || 0,
        favorite_properties: favoriteProperties || 0,
        saved_searches: savedSearches || 0,
      };
    }

    // Important dates
    if (row['Birthday']?.trim()) customFields.birthday = row['Birthday'].trim();
    if (row['Home Anniversary']?.trim()) customFields.home_anniversary = row['Home Anniversary'].trim();
    if (row['SpousePartner Birthday']?.trim()) customFields.spouse_birthday = row['SpousePartner Birthday'].trim();

    // Buyer/seller preferences
    if (row['House to Sell']?.trim() === 'Yes') customFields.house_to_sell = true;
    if (row['First Time Buyer']?.trim() === 'Yes') customFields.first_time_buyer = true;
    if (row['Favorite City']?.trim()) customFields.favorite_city = row['Favorite City'].trim();

    // CINC metadata
    customFields.cinc_registered = row['Registered']?.trim() || null;
    customFields.cinc_source = row['Source']?.trim() || null;
    customFields.cinc_quality_score = parseInt(row['Quality Score'], 10) || 0;
    if (row['Email CC']?.trim()) customFields.email_cc = row['Email CC'].trim();
    if (row['IP']?.trim()) customFields.ip_address = row['IP'].trim();

    // Build preferred areas from city
    const preferredAreas = [];
    if (row['City']?.trim()) preferredAreas.push(row['City'].trim());
    if (row['Favorite City']?.trim() && row['Favorite City'].trim() !== row['City']?.trim()) {
      preferredAreas.push(row['Favorite City'].trim());
    }

    // Budget from Average/Median Price
    const avgPrice = parseFloat(row['Average Price']);
    const medianPrice = parseFloat(row['Median Price']);
    const budgetMax = avgPrice > 0 ? avgPrice : medianPrice > 0 ? medianPrice : null;

    // Combine notes
    const notesParts = [];
    if (row['Notes']?.trim()) notesParts.push(row['Notes'].trim());
    if (row['Notes 2']?.trim()) notesParts.push(row['Notes 2'].trim());
    const notes = notesParts.join('\n\n---\n\n') || null;

    // Score: use CINC Quality Score, clamped to 0-100
    const score = clampScore(row['Quality Score']);

    const lead = {
      agent_id: AGENT_ID,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      source: mapSource(row['Source']),
      status: mapStatus(row['Pipeline Stage'], row['Status']),
      score,
      tags: parseTags(row['Labels']),
      notes,
      preferred_language: detectLanguage(row),
      budget_min: null,
      budget_max: budgetMax,
      preferred_areas: preferredAreas,
      timeline: mapTimeline(row['Timeframe']),
      last_activity: parseDate(row['Last Touch']),
      deal_type: mapDealType(row['Buyer/Seller']),
      pre_approved: (row['Pre-qualified for Mortgage'] || '').trim() === 'Yes',
      communication_preference: mapCommPreference(row['Opted In Email'], row['Opted In Text']),
      custom_fields: customFields,
      import_batch_id: importBatchId,
      imported_at: importedAt,
      created_at: parseDate(row['Registered']) || importedAt,
    };

    leads.push(lead);
  }

  console.log(`✅ ${leads.length} leads ready for import`);
  console.log(`⏭  ${skipped.length} rows skipped (no name)`);

  // Show source breakdown
  const sources = {};
  leads.forEach(l => { sources[l.source] = (sources[l.source] || 0) + 1; });
  console.log('\n📊 Source breakdown:');
  Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`   ${s}: ${c}`));

  // Show status breakdown
  const statuses = {};
  leads.forEach(l => { statuses[l.status] = (statuses[l.status] || 0) + 1; });
  console.log('\n📊 Status breakdown:');
  Object.entries(statuses).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`   ${s}: ${c}`));

  // Show deal type breakdown
  const dealTypes = {};
  leads.forEach(l => { dealTypes[l.deal_type || 'unset'] = (dealTypes[l.deal_type || 'unset'] || 0) + 1; });
  console.log('\n📊 Deal type breakdown:');
  Object.entries(dealTypes).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`   ${s}: ${c}`));

  // Show language breakdown
  const langs = {};
  leads.forEach(l => { langs[l.preferred_language] = (langs[l.preferred_language] || 0) + 1; });
  console.log('\n🌐 Language detection:');
  Object.entries(langs).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`   ${s}: ${c}`));

  // Show score distribution
  const scoreBuckets = { 'hot (80-100)': 0, 'warm (50-79)': 0, 'cool (20-49)': 0, 'cold (0-19)': 0 };
  leads.forEach(l => {
    if (l.score >= 80) scoreBuckets['hot (80-100)']++;
    else if (l.score >= 50) scoreBuckets['warm (50-79)']++;
    else if (l.score >= 20) scoreBuckets['cool (20-49)']++;
    else scoreBuckets['cold (0-19)']++;
  });
  console.log('\n🔥 Score distribution:');
  Object.entries(scoreBuckets).forEach(([s, c]) => console.log(`   ${s}: ${c}`));

  if (DRY_RUN) {
    console.log('\n🏃 DRY RUN — no data inserted');
    console.log('Remove --dry-run to actually import\n');
    // Print first 3 leads as sample
    console.log('Sample leads:');
    leads.slice(0, 3).forEach((l, i) => {
      console.log(`\n  [${i + 1}] ${l.first_name} ${l.last_name}`);
      console.log(`      Email: ${l.email || '(none)'}`);
      console.log(`      Phone: ${l.phone || '(none)'}`);
      console.log(`      Source: ${l.source} | Status: ${l.status} | Score: ${l.score}`);
      console.log(`      Deal: ${l.deal_type || 'unset'} | Lang: ${l.preferred_language}`);
      console.log(`      Tags: ${l.tags.join(', ') || '(none)'}`);
      console.log(`      Areas: ${l.preferred_areas.join(', ') || '(none)'}`);
    });
    return;
  }

  // ── Insert in batches ───────────────────────────────
  console.log(`\n🚀 Inserting ${leads.length} leads in batches of ${BATCH_SIZE}...`);

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const { data: result, error } = await supabase
      .from('leads')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
      // Try one-by-one for this batch to identify the bad row
      for (const lead of batch) {
        const { error: singleErr } = await supabase
          .from('leads')
          .insert(lead)
          .select('id');
        if (singleErr) {
          console.error(`   ❌ ${lead.first_name} ${lead.last_name}: ${singleErr.message}`);
          failed++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += result.length;
      process.stdout.write(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(leads.length / BATCH_SIZE)} (${inserted} inserted)\r`);
    }
  }

  console.log(`\n\n🎉 Import complete!`);
  console.log(`   ✅ Inserted: ${inserted}`);
  if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📋 Batch ID: ${importBatchId}`);

  // Verify final count
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  console.log(`   📊 Total leads in database: ${count}\n`);
}

// ── CLI Entry ───────────────────────────────────────────
const csvPath = process.argv.find(a => a.endsWith('.csv'));
if (!csvPath) {
  console.error('Usage: node scripts/import-cinc-leads.mjs "/path/to/file.csv" [--dry-run]');
  process.exit(1);
}

importLeads(resolve(csvPath)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
