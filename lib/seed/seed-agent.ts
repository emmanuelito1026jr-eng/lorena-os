/**
 * Agent Account Seed Script
 *
 * Creates an agent account (Lorena) with a pre-confirmed email and 'agent' role profile.
 *
 * Usage:
 *   npx tsx lib/seed/seed-agent.ts <email> <password> <full_name>
 *
 * Example:
 *   npx tsx lib/seed/seed-agent.ts lorena@casasenelpasotx.com MySecurePass1 "Lorena Ontiveros-Ortega"
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set
 *   - Or a .env file in the project root with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env and .env.local from project root (no dotenv dependency needed)
for (const envFile of ['.env', '.env.local']) {
  try {
    const envPath = resolve(process.cwd(), envFile);
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // env file not found — continue
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables.');
  console.error('Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: npx tsx lib/seed/seed-agent.ts <email> <password> <full_name>');
  console.error('Example: npx tsx lib/seed/seed-agent.ts lorena@casasenelpasotx.com MyPass123 "Lorena Ontiveros-Ortega"');
  process.exit(1);
}

const [email, password, fullName] = args;

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
  console.error('Password must contain at least one letter and one number.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedAgent() {
  console.log(`Creating agent account for: ${email}`);

  // Create auth user with email auto-confirmed
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (userError) {
    if (userError.message?.includes('already been registered')) {
      console.log('User already exists. Checking profile...');

      // Look up existing user by email
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Failed to list users:', listError.message);
        process.exit(1);
      }
      const existing = existingUsers.users.find((u: { email?: string }) => u.email === email);
      if (!existing) {
        console.error('User not found after "already registered" error.');
        process.exit(1);
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', existing.id)
        .single();

      if (profile) {
        if (profile.role === 'agent') {
          console.log('Agent profile already exists. Done.');
        } else {
          // Upgrade to agent
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ role: 'agent' })
            .eq('id', existing.id);
          if (updateErr) {
            console.error('Failed to upgrade profile to agent:', updateErr.message);
            process.exit(1);
          }
          console.log('Upgraded existing profile to agent role.');
        }
      } else {
        // Create profile
        const { error: insertErr } = await supabase.from('profiles').insert({
          id: existing.id,
          email,
          full_name: fullName,
          role: 'agent',
        });
        if (insertErr) {
          console.error('Failed to create agent profile:', insertErr.message);
          process.exit(1);
        }
        console.log('Created agent profile for existing user.');
      }

      console.log('\nAgent account ready.');
      console.log(`  Email: ${email}`);
      console.log(`  Login: /login`);
      process.exit(0);
    }

    console.error('Failed to create user:', userError.message);
    process.exit(1);
  }

  const userId = userData.user.id;
  console.log(`Auth user created: ${userId}`);

  // Create profile with agent role
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName,
    role: 'agent',
  });

  if (profileError) {
    console.error('Failed to create profile:', profileError.message);
    console.error('Auth user was created but profile insert failed. You may need to manually create the profile.');
    process.exit(1);
  }

  console.log('Agent profile created successfully.');
  console.log('\nAgent account ready:');
  console.log(`  Email: ${email}`);
  console.log(`  Login: /login`);
}

seedAgent();
