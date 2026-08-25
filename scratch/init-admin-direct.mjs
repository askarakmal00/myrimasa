import { createClient } from '@supabase/supabase-js';

const url = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZ2ZleGx3YWxob2Z1eHNrcnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0NDIwMiwiZXhwIjoyMTAzMjIwMjAyfQ.IC4hbJZfJTJ0baypdn29gUitncqhmmQBOgatL8KqISQ';

const supabase = createClient(url, serviceKey);

async function initAdmin() {
  console.log('Creating initial admin account...');
  const { data: userList } = await supabase.auth.admin.listUsers();
  console.log('Existing users count:', userList?.users?.length || 0);

  const existing = userList?.users?.find(u => u.email === 'admin@khdtk.id');
  let uid = existing?.id;

  if (!uid) {
    const res = await supabase.auth.admin.createUser({
      email: 'admin@khdtk.id',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrator KHDTK',
        role: 'admin'
      }
    });

    if (res.error) {
      console.error('Error creating admin:', res.error);
      return;
    }
    uid = res.data.user?.id;
    console.log('Admin user created successfully with ID:', uid);
  } else {
    console.log('Admin user already exists with ID:', uid);
  }

  if (uid) {
    const prof = await supabase.from('profiles').upsert({
      id: uid,
      email: 'admin@khdtk.id',
      name: 'Administrator KHDTK',
      role: 'admin',
      status: 'active'
    }).select();

    console.log('Admin profile upserted:', prof.data);
  }
}

initAdmin();
