/**
 * Generate Market Snapshots from listings data
 * Run: node scripts/gen-snapshots.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zdonombljnuylmnwkhga.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('=== Generating Market Snapshots ===\n');

  // Get all active listings (paginate past 1000 default limit)
  let allListings = [];
  let page = 0;
  const pageSize = 1000;
  let error = null;
  while (true) {
    const { data, error: e } = await supabase
      .from('listings')
      .select('zip_code, subdivision, list_price, sqft, days_on_market, status, list_date')
      .eq('status', 'active')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (e) { error = e; break; }
    if (!data?.length) break;
    allListings.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  const listings = allListings;

  if (error || !listings?.length) {
    console.error('No listings:', error?.message);
    return;
  }

  console.log(`Analyzing ${listings.length} active listings...`);

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  function calcStats(items) {
    const prices = items.map(l => Number(l.list_price)).filter(p => p > 0).sort((a, b) => a - b);
    if (!prices.length) return null;
    const median = prices[Math.floor(prices.length / 2)];
    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    const avgDom = Math.round(items.reduce((s, l) => s + (l.days_on_market || 0), 0) / items.length);
    const withSqft = items.filter(l => l.sqft > 0);
    const avgPpsf = withSqft.length
      ? Math.round(withSqft.reduce((s, l) => s + Number(l.list_price) / l.sqft, 0) / withSqft.length)
      : 0;
    const newCount = items.filter(l => l.list_date && l.list_date >= weekAgo).length;

    return {
      active_count: items.length,
      new_count_7d: newCount,
      pending_count: 0,
      sold_count_30d: 0,
      median_price: median,
      avg_price: avg,
      avg_price_per_sqft: avgPpsf,
      avg_dom: avgDom,
      median_dom: 0,
      months_of_inventory: null,
      list_to_sold_ratio: null,
    };
  }

  // City-wide
  const cityStats = calcStats(listings);
  if (cityStats) {
    const { error: e } = await supabase.from('market_snapshots').upsert({
      area: 'El Paso',
      area_type: 'city',
      snapshot_date: today,
      ...cityStats,
    }, { onConflict: 'area,area_type,snapshot_date' });
    if (e) console.error('City error:', e.message);
    else console.log(`City: ${cityStats.active_count} active, median $${cityStats.median_price.toLocaleString()}, avg DOM ${cityStats.avg_dom}`);
  }

  // ZIP-level
  const zipGroups = new Map();
  for (const l of listings) {
    if (!zipGroups.has(l.zip_code)) zipGroups.set(l.zip_code, []);
    zipGroups.get(l.zip_code).push(l);
  }

  const zipRows = [];
  for (const [zip, items] of zipGroups) {
    const stats = calcStats(items);
    if (stats) zipRows.push({ area: zip, area_type: 'zip', snapshot_date: today, ...stats });
  }

  if (zipRows.length) {
    const { error: e } = await supabase.from('market_snapshots').upsert(zipRows, {
      onConflict: 'area,area_type,snapshot_date',
    });
    if (e) console.error('ZIP error:', e.message);
    else console.log(`${zipRows.length} ZIP snapshots`);
  }

  // Subdivision-level (top 30)
  const subGroups = new Map();
  for (const l of listings) {
    if (!l.subdivision) continue;
    if (!subGroups.has(l.subdivision)) subGroups.set(l.subdivision, []);
    subGroups.get(l.subdivision).push(l);
  }

  const subRows = Array.from(subGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 30)
    .map(([sub, items]) => {
      const stats = calcStats(items);
      return stats ? { area: sub, area_type: 'subdivision', snapshot_date: today, ...stats } : null;
    })
    .filter(Boolean);

  if (subRows.length) {
    const { error: e } = await supabase.from('market_snapshots').upsert(subRows, {
      onConflict: 'area,area_type,snapshot_date',
    });
    if (e) console.error('Subdivision error:', e.message);
    else console.log(`${subRows.length} subdivision snapshots`);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
