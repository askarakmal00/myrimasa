import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ikgfexlwalhofuxskrrw.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_ySILmUqGiTvpVf5D3mQw-w_rGqTdiPW';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZ2ZleGx3YWxob2Z1eHNrcnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0NDIwMiwiZXhwIjoyMTAzMjIwMjAyfQ.IC4hbJZfJTJ0baypdn29gUitncqhmmQBOgatL8KqISQ';

// Browser client (for use in Client Components only)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  return createSupabaseBrowserClient(url, anonKey);
}

// Admin client with service role (server-side ONLY, never expose to client)
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key-here' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== ''
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : DEFAULT_SERVICE_ROLE_KEY;

  return createClient(
    url,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
