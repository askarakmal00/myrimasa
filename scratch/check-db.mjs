import { createClient } from '@supabase/supabase-js';

const url = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZ2ZleGx3YWxob2Z1eHNrcnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0NDIwMiwiZXhwIjoyMTAzMjIwMjAyfQ.IC4hbJZfJTJ0baypdn29gUitncqhmmQBOgatL8KqISQ';

const supabase = createClient(url, serviceKey);

async function checkSchema() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', data, error);

  // Check if we can add password column or query columns
  const testInsert = await supabase.from('profiles').upsert({
    email: 'admin@khdtk.id',
    name: 'Administrator KHDTK',
    role: 'admin',
    status: 'active'
  }, { onConflict: 'email' }).select();
  console.log('Upsert test:', testInsert);
}

checkSchema();
