import { createClient } from '@supabase/supabase-js';

const url = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZ2ZleGx3YWxob2Z1eHNrcnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0NDIwMiwiZXhwIjoyMTAzMjIwMjAyfQ.IC4hbJZfJTJ0baypdn29gUitncqhmmQBOgatL8KqISQ';

const supabase = createClient(url, serviceKey);

async function testCreateUser() {
  console.log('Testing create user...');
  const res = await supabase.auth.admin.createUser({
    email: 'admin@khdtk.id',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      name: 'Admin Utama',
      role: 'admin'
    }
  });

  console.log('Create user result:', res.error ? res.error : res.data);

  const prof = await supabase.from('profiles').select('*');
  console.log('profiles table after create:', prof.data);
}

testCreateUser();
