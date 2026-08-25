import { createClient } from '@supabase/supabase-js';

const url = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZ2ZleGx3YWxob2Z1eHNrcnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0NDIwMiwiZXhwIjoyMTAzMjIwMjAyfQ.IC4hbJZfJTJ0baypdn29gUitncqhmmQBOgatL8KqISQ';

const supabase = createClient(url, serviceKey);

async function testInsertAfternoon() {
  console.log('Testing inserting afternoon session...');
  // Find an existing profile and location to test
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const { data: locations } = await supabase.from('locations').select('id').limit(1);

  if (!profiles || !locations) {
    console.log('No profiles or locations found');
    return;
  }

  const userId = profiles[0].id;
  const locId = locations[0].id;

  const res = await supabase.from('reports').insert({
    user_id: userId,
    session_type: 'afternoon',
    report_date: '2026-08-26',
    routine_activity: 'Test siang',
    location_id: locId,
  }).select();

  console.log('Afternoon insert result:', res);

  // Clean up test row
  if (res.data?.[0]?.id) {
    await supabase.from('reports').delete().eq('id', res.data[0].id);
    console.log('Test row cleaned up');
  }
}

testInsertAfternoon();
