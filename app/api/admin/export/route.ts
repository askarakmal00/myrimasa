import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { formatWibTime, formatWibDate } from '@/lib/time';

export const dynamic = 'force-dynamic';

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
      special: 'Kejadian Khusus (24 Jam)',
    };

    // Transform to Excel data array
    const excelRows = (data || []).map((r: any, idx: number) => {
      const fileUrls = (r.report_files || [])
        .map((f: any) => f.drive_url)
        .filter(Boolean)
        .join(' | ');

      return {
        'No': idx + 1,
        'Timestamp (WIB)': r.timestamp ? `${formatWibDate(r.timestamp)} ${formatWibTime(r.timestamp)}` : '',
        'Nama Petugas': r.profiles?.name || '',
        'Lokasi KHDTK': r.locations?.name || '',
        'Email Petugas': r.profiles?.email || '',
        'Sesi': sessionLabels[r.session_type] || r.session_type,
        'Foto/Dokumentasi Lapangan': fileUrls || '—',
        'Kegiatan Rutin': r.routine_activity || '',
        'Kegiatan Insidentil': r.incident_activity || '',
        'Kondisi Lapangan': r.field_condition || '',
        'Tindak Lanjut / Usulan': r.follow_up || '',
        'Latitude': r.latitude ?? '',
        'Longitude': r.longitude ?? '',
        'Alamat Terdeteksi': r.address || '',
        'Link Google Maps': r.maps_url || '',
      };
    });

    // Create Worksheet & Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Set Column Widths for readability
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 22 }, // Timestamp
      { wch: 24 }, // Nama Petugas
      { wch: 20 }, // Lokasi KHDTK
      { wch: 26 }, // Email
      { wch: 22 }, // Sesi
      { wch: 45 }, // Foto URLs
      { wch: 35 }, // Kegiatan Rutin
      { wch: 25 }, // Kegiatan Insidentil
      { wch: 35 }, // Kondisi Lapangan
      { wch: 35 }, // Tindak Lanjut
      { wch: 14 }, // Latitude
      { wch: 14 }, // Longitude
      { wch: 30 }, // Alamat
      { wch: 35 }, // Google Maps URL
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Presensi');

    // Generate Excel Buffer (.xlsx)
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `myrimasa_laporan_presensi_${dateStr}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat export excel' }, { status: 500 });
  }
}
