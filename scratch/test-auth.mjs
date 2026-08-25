import { createClient } from '@supabase/supabase-js';

const url = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const anonKey = 'sb_publishable_ySILmUqGiTvpVf5D3mQw-w_rGqTdiPW';

const supabase = createClient(url, anonKey);

async function testAuth() {
  console.log('Testing Supabase Auth API...');
  const res = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  });
  console.log('Auth result with sample credentials:', res.error ? res.error.message : 'Success');
}

testAuth();
