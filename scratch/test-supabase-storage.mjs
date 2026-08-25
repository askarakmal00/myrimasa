import { createClient } from '@supabase/supabase-js';

const url = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZ2ZleGx3YWxob2Z1eHNrcnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0NDIwMiwiZXhwIjoyMTAzMjIwMjAyfQ.IC4hbJZfJTJ0baypdn29gUitncqhmmQBOgatL8KqISQ';

const supabase = createClient(url, serviceKey);

async function testStorage() {
  console.log('Checking Supabase Storage buckets...');
  let { data: buckets, error } = await supabase.storage.listBuckets();
  console.log('Existing buckets:', buckets);

  let bucket = buckets?.find(b => b.name === 'khdtk-reports');
  if (!bucket) {
    console.log('Creating public bucket khdtk-reports...');
    const createRes = await supabase.storage.createBucket('khdtk-reports', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    console.log('Bucket created:', createRes);
  }

  // Test uploading a test file
  const testBuffer = Buffer.from('test image binary content');
  const uploadRes = await supabase.storage
    .from('khdtk-reports')
    .upload('test/sample.txt', testBuffer, {
      contentType: 'text/plain',
      upsert: true,
    });

  console.log('Upload result:', uploadRes);

  const { data: { publicUrl } } = supabase.storage
    .from('khdtk-reports')
    .getPublicUrl('test/sample.txt');

  console.log('Public URL:', publicUrl);
}

testStorage();
