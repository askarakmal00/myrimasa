import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/admin/reports — Get filtered reports (admin only)
export async function GET(request: Request) {
  try {
    const profile = await getProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const employeeId = searchParams.get('employee_id');
    const locationId = searchParams.get('location_id');
    const sessionType = searchParams.get('session_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = adminClient
      .from('reports')
      .select(`
        *,
        profiles!reports_user_id_fkey(id, name, email),
        locations(id, name, address),
        report_files(id, file_name, file_type, drive_file_id, drive_url)
      `, { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) query = query.gte('report_date', startDate);
    if (endDate) query = query.lte('report_date', endDate);
    if (employeeId) query = query.eq('user_id', employeeId);
    if (locationId) query = query.eq('location_id', locationId);
    if (sessionType) query = query.eq('session_type', sessionType);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Gagal memuat laporan' }, { status: 500 });
    }

    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
