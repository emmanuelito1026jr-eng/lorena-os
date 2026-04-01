/**
 * Seed script — run with: npx tsx lib/seed/seed.ts
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
 * NOTE: You must be logged in as an agent to seed (RLS requires agent role)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SEED_LEADS, SEED_PROPERTIES, AGENT_ID } from './data';
import { SEED_DRIP_SEQUENCES, SEED_CALENDAR_CAMPAIGNS, SEED_CHECKLIST_TEMPLATES, SEED_EMAIL_TEMPLATES } from './automation-data';
import type { Database } from '../supabase/database.types';
import type { ActionType } from '../scoring/constants';
import { SCORING_TABLE } from '../scoring/constants';

// Load .env and .env.local from project root
for (const envFile of ['.env', '.env.local']) {
  try {
    const envPath = resolve(process.cwd(), envFile);
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // env file not found — continue
  }
}

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(url, key);

async function seedLeads(agentId: string) {
  console.log('Seeding 20 leads...');
  const leads = SEED_LEADS.map((lead) => ({
    agent_id: agentId,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    score: lead.score,
    source: lead.source,
    status: lead.status,
    tags: lead.tags,
    preferred_language: lead.preferred_language,
    budget_min: lead.budget_min,
    budget_max: lead.budget_max,
    preferred_areas: lead.preferred_areas,
    property_type: lead.property_type,
    timeline: lead.timeline,
    last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const { data, error } = await supabase.from('leads').insert(leads).select('id, score, first_name, last_name');
  if (error) {
    console.error('Error seeding leads:', error.message);
    return [];
  }
  console.log(`  Inserted ${data.length} leads`);
  return data;
}

async function seedActivities(leads: { id: string; score: number }[]) {
  console.log('Seeding lead activities...');

  const positiveActions: ActionType[] = ['login', 'property_view', 'property_favorite', 'search_save', 'showing_request', 'message_sent', 'home_valuation', 'email_open', 'email_click', 'session_5_plus', 'return_visit'];

  let totalActivities = 0;

  for (const lead of leads) {
    // Generate enough activities to reach the lead's score
    let remainingScore = lead.score;
    const activities: { lead_id: string; action: string; points: number; created_at: string }[] = [];

    while (remainingScore > 0) {
      const action = positiveActions[Math.floor(Math.random() * positiveActions.length)];
      const points = Math.min(SCORING_TABLE[action], remainingScore);
      remainingScore -= points;

      activities.push({
        lead_id: lead.id,
        action,
        points,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (activities.length > 0) {
      const { error } = await supabase.from('lead_activity').insert(activities);
      if (error) console.error(`  Error for lead ${lead.id}:`, error.message);
      totalActivities += activities.length;
    }
  }

  console.log(`  Inserted ${totalActivities} activities`);
}

async function seedProperties() {
  console.log('Seeding 15 properties...');
  const properties = SEED_PROPERTIES.map((p) => ({
    address: p.address,
    city: 'El Paso',
    state: 'TX',
    zip: p.zip,
    price: p.price,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sqft: p.sqft,
    year_built: p.year_built,
    property_type: p.property_type,
    neighborhood: p.neighborhood,
    features: p.features,
    description: p.description,
    status: 'active',
    photos: [],
  }));

  const { data, error } = await supabase.from('properties').insert(properties).select('id');
  if (error) {
    console.error('Error seeding properties:', error.message);
    return [];
  }
  console.log(`  Inserted ${data.length} properties`);
  return data;
}

async function seedMessages(agentId: string, leads: { id: string }[]) {
  console.log('Seeding messages...');
  const channels = ['sms', 'email', 'ai_sms'] as const;
  const messages: Array<{
    lead_id: string;
    agent_id: string;
    channel: typeof channels[number];
    direction: 'inbound' | 'outbound';
    content: string;
    created_at: string;
  }> = [];

  // Create message threads for first 8 leads
  for (let i = 0; i < Math.min(8, leads.length); i++) {
    const channel = channels[i % channels.length];
    const baseTime = Date.now() - (8 - i) * 24 * 60 * 60 * 1000;

    messages.push({
      lead_id: leads[i].id,
      agent_id: agentId,
      channel,
      direction: 'inbound',
      content: 'Hi, I\'m interested in seeing some properties in the area.',
      created_at: new Date(baseTime).toISOString(),
    });
    messages.push({
      lead_id: leads[i].id,
      agent_id: agentId,
      channel,
      direction: 'outbound',
      content: 'Hello! I\'d love to help you find your perfect home. What areas are you interested in?',
      created_at: new Date(baseTime + 300000).toISOString(),
    });
  }

  const { error } = await supabase.from('messages').insert(messages);
  if (error) console.error('Error seeding messages:', error.message);
  else console.log(`  Inserted ${messages.length} messages`);
}

async function seedShowings(agentId: string, leads: { id: string }[]) {
  console.log('Seeding showings...');
  const today = new Date();
  const showings = [];

  for (let i = 0; i < Math.min(6, leads.length); i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    showings.push({
      lead_id: leads[i].id,
      agent_id: agentId,
      address: SEED_PROPERTIES[i].address + ', El Paso, TX ' + SEED_PROPERTIES[i].zip,
      date: date.toISOString().split('T')[0],
      start_time: `${10 + i}:00`,
      end_time: `${11 + i}:00`,
      status: i === 0 ? 'confirmed' as const : 'scheduled' as const,
    });
  }

  const { error } = await supabase.from('showings').insert(showings);
  if (error) console.error('Error seeding showings:', error.message);
  else console.log(`  Inserted ${showings.length} showings`);
}

async function main() {
  console.log('=== Casas En El Paso TX — Seed Script ===\n');

  // Use provided agent ID or first profile
  let agentId = AGENT_ID;
  const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'agent').limit(1);
  if (profiles?.length) {
    agentId = profiles[0].id;
    console.log(`Using agent: ${agentId}`);
  } else {
    console.log(`No agent profile found. Using placeholder: ${agentId}`);
    console.log('NOTE: You may need to sign up first and update AGENT_ID in seed/data.ts\n');
  }

  const leads = await seedLeads(agentId);
  if (leads.length > 0) {
    await seedActivities(leads);
    await seedMessages(agentId, leads);
    await seedShowings(agentId, leads);
  }
  await seedProperties();
  await seedSequences(agentId);
  await seedCalendarCampaigns(agentId);
  await seedChecklists(agentId);
  await seedEmailTemplates(agentId);

  console.log('\n=== Seed complete ===');
}

async function seedSequences(agentId: string) {
  console.log('Seeding 5 drip sequences...');
  const sequences = SEED_DRIP_SEQUENCES.map((seq) => ({
    agent_id: agentId,
    name: seq.name,
    description: seq.description,
    trigger: seq.trigger,
    steps: seq.steps as unknown as Database['public']['Tables']['drip_sequences']['Insert']['steps'],
    is_active: seq.is_active,
  }));
  const { data, error } = await supabase.from('drip_sequences').insert(sequences).select('id');
  if (error) console.error('Error seeding sequences:', error.message);
  else console.log(`  Inserted ${data.length} sequences`);
}

async function seedCalendarCampaigns(agentId: string) {
  console.log('Seeding 10 calendar campaigns...');
  const campaigns = SEED_CALENDAR_CAMPAIGNS.map((c) => ({
    agent_id: agentId,
    name: c.name,
    description: c.description,
    month: c.month,
    day: c.day,
    channel: c.channel,
    is_active: c.is_active,
  }));
  const { data, error } = await supabase.from('calendar_campaigns').insert(campaigns).select('id');
  if (error) console.error('Error seeding campaigns:', error.message);
  else console.log(`  Inserted ${data.length} campaigns`);
}

async function seedChecklists(agentId: string) {
  console.log('Seeding 3 checklist templates...');
  const checklists = SEED_CHECKLIST_TEMPLATES.map((cl) => ({
    agent_id: agentId,
    name: cl.name,
    description: cl.description,
    items: cl.items as unknown as Database['public']['Tables']['checklist_templates']['Insert']['items'],
  }));
  const { data, error } = await supabase.from('checklist_templates').insert(checklists).select('id');
  if (error) console.error('Error seeding checklists:', error.message);
  else console.log(`  Inserted ${data.length} checklists`);
}

async function seedEmailTemplates(agentId: string) {
  console.log('Seeding 5 email templates...');
  const templates = SEED_EMAIL_TEMPLATES.map((t) => ({
    agent_id: agentId,
    name: t.name,
    subject: t.subject,
    body_html: t.body_html,
    body_text: t.body_text,
    category: t.category,
    language: t.language,
  }));
  const { data, error } = await supabase.from('email_templates').insert(templates).select('id');
  if (error) console.error('Error seeding templates:', error.message);
  else console.log(`  Inserted ${data.length} email templates`);
}

main().catch(console.error);
