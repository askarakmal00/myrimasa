import { createClient } from '@supabase/supabase-js';

const url = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZ2ZleGx3YWxob2Z1eHNrcnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0NDIwMiwiZXhwIjoyMTAzMjIwMjAyfQ.IC4hbJZfJTJ0baypdn29gUitncqhmmQBOgatL8KqISQ';

const supabase = createClient(url, serviceKey);

async function testTables() {
  console.log('Checking tables with service role key...');
  const loc = await supabase.from('locations').select('*');
  console.log('locations table:', loc.data ? `${loc.data.length} rows found` : loc.error);

  const prof = await supabase.from('profiles').select('*');
  console.log('profiles table:', prof.data ? `${prof.data.length} rows found` : prof.error);

  const users = await supabase.auth.admin.listUsers();
  console.log('auth users:', users.data ? `${users.data.users.length} users in auth` : users.error);
}

testTables();
