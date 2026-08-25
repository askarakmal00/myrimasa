import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('locations')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) return NextResponse.json({ error: 'Gagal memuat lokasi' }, { status: 500 });
  return NextResponse.json(data);
}
