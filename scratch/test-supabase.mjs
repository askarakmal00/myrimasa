import { createClient } from '@supabase/supabase-js';

const url = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const anonKey = 'sb_publishable_ySILmUqGiTvpVf5D3mQw-w_rGqTdiPW';

const supabase = createClient(url, anonKey);

async function test() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('locations').select('*');
    console.log('Locations select:', { data, error });
  } catch (err) {
    console.error('Error selecting:', err);
  }
}

test();
