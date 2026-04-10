import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zdonombljnuylmnwkhga.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const EMAIL = 'lorena.realtor@icloud.com';
const PASSWORD = 'TheRightMove!!!';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Checking Lorena auth account...');

  // List existing users to find Lorena
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) { console.error('List error:', listErr.message); process.exit(1); }

  const lorena = users?.find(u => u.email === EMAIL);

  if (lorena) {
    console.log(`✅ User exists: ${lorena.id}`);
    console.log(`   Email confirmed: ${!!lorena.email_confirmed_at}`);
    
    // Update password to ensure it matches
    const { error: updateErr } = await supabase.auth.admin.updateUserById(lorena.id, {
      password: PASSWORD,
      email_confirm: true
    });
    if (updateErr) {
      console.error('Update error:', updateErr.message);
    } else {
      console.log('✅ Password updated + email confirmed');
    }

    // Check profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', lorena.id)
      .single();
    
    if (!profile) {
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: lorena.id,
        email: EMAIL,
        full_name: 'Lorena Ontiveros-Ortega',
        role: 'realtor',
        phone: '+19154875581'
      });
      if (profileErr) console.error('Profile error:', profileErr.message);
      else console.log('✅ Profile created');
    } else {
      console.log('✅ Profile exists:', profile.full_name);
    }
  } else {
    console.log('Creating new user...');
    const { data, error: createErr } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Lorena Ontiveros-Ortega', role: 'realtor' }
    });
    
    if (createErr) { console.error('Create error:', createErr.message); process.exit(1); }
    
    console.log(`✅ User created: ${data.user.id}`);

    // Create profile
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: EMAIL,
      full_name: 'Lorena Ontiveros-Ortega',
      role: 'realtor',
      phone: '+19154875581'
    });
    if (profileErr) console.log('Profile note:', profileErr.message);
    else console.log('✅ Profile created');
  }

  // Verify login works
  const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD
  });
  
  if (signInErr) {
    console.error('❌ Login test FAILED:', signInErr.message);
    process.exit(1);
  } else {
    console.log('✅ Login test PASSED — auth is working!');
    console.log(`   Token: ${session.session?.access_token?.substring(0, 20)}...`);
  }
}

main().catch(console.error);
