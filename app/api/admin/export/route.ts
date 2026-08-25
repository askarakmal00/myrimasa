import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import Papa from 'papaparse';
import { formatWibTime, formatWibDate } from '@/lib/time';

export async function GET(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const employeeId = searchParams.get('employee_id');
    const locationId = searchParams.get('location_id');
    const sessionType = searchParams.get('session_type');

    let query = adminClient
      .from('reports')
      .select(`
        *,
        profiles!reports_user_id_fkey(name, email),
        locations(name),
        report_files(drive_url)
      `)
      .order('timestamp', { ascending: false });

    if (startDate) query = query.gte('report_date', startDate);
    if (endDate) query = query.lte('report_date', endDate);
    if (employeeId) query = query.eq('user_id', employeeId);
    if (locationId) query = query.eq('location_id', locationId);
    if (sessionType) query = query.eq('session_type', sessionType);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 });

    const sessionLabels: Record<string, string> = {
      morning: 'Pagi (06.00-08.00)',
      afternoon: 'Siang (13.00-14.00)',
      evening: 'Sore (16.00-23.59)',
    };

    // Transform to CSV format (like Google Forms Response)
    const csvData = (data || []).map((r: any) => {
      const fileUrls = (r.report_files || [])
        .map((f: any) => f.drive_url)
        .filter(Boolean)
        .join(' | ');

      return {
        'Timestamp': r.timestamp ? `${formatWibDate(r.timestamp)} ${formatWibTime(r.timestamp)}` : '',
        'Nama Lengkap': r.profiles?.name || '',
        'Lokasi KHDTK': r.locations?.name || '',
        'Email Address': r.profiles?.email || '',
        'Foto/video di lokasi': fileUrls,
        'Kegiatan Rutin yang dilaksanakan': r.routine_activity || '',
        'Kegiatan Insidentil yang dilaksanakan': r.incident_activity || '',
        'Hasil Kondisi di lapangan': r.field_condition || '',
        'Tindak Lanjut/Usulan': r.follow_up || '',
        'Session': sessionLabels[r.session_type] || r.session_type,
        'Latitude': r.latitude || '',
        'Longitude': r.longitude || '',
        'GeoAddress': r.address || '',
        'Google Maps URL': r.maps_url || '',
      };
    });

    const csv = Papa.unparse(csvData, {
      quotes: true,
      delimiter: ',',
    });

    const now = new Date();
    const filename = `myrimasa_export_${now.toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
