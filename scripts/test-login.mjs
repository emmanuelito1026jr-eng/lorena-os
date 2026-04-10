const SUPABASE_URL = 'https://zdonombljnuylmnwkhga.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkb25vbWJsam51eWxtbndraGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjM2OTUsImV4cCI6MjA4NjkzOTY5NX0.h-rFY-MMuN0jwo8NeIOOLrISkRWd_Xt8Wn9Ffp6_FwQ';

console.log('🔐 Testing Lorena auth...');
const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
  body: JSON.stringify({ email: 'lorena.realtor@icloud.com', password: 'TheRightMove!!!' })
});
const data = await res.json();

if (data.access_token) {
  console.log('✅ LOGIN WORKS — lorena.realtor@icloud.com / TheRightMove!!!');
  console.log(`   User ID: ${data.user?.id}`);
  console.log(`   Email confirmed: ${!!data.user?.email_confirmed_at}`);
  console.log(`   Role: ${data.user?.role}`);
} else {
  console.error('❌ LOGIN FAILED:', JSON.stringify(data));
  process.exit(1);
}
