import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('reports')
      .select(`
        *,
        profiles!reports_user_id_fkey(id, name, email),
        locations(id, name, address, latitude, longitude),
        report_files(id, file_name, file_type, drive_file_id, drive_url, created_at)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
