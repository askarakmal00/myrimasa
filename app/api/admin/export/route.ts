import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import ExcelJS from 'exceljs';
import { formatWibTime, formatWibDate } from '@/lib/time';


export const dynamic = 'force-dynamic';

// --- Helper: parse session label ---
const sessionLabels: Record<string, string> = {
  morning: 'Pagi (06.00-08.00)',
  afternoon: 'Siang (13.00-14.00)',
  evening: 'Sore (16.00-23.59)',
  special: 'Kejadian Khusus (24 Jam)',
};

function getSessionLabel(sessionType: string): string {
  return sessionLabels[sessionType] || sessionType;
}

// --- Helper: extract Tanggal and Jam from WIB timestamp string ---
// Input e.g. "Rabu, 30 September 2026 07:34 WIB" or ISO string
function parseTanggalJam(timestamp: string | null): { tanggal: string; jam: string } {
  if (!timestamp) return { tanggal: '', jam: '' };

  // Try ISO datetime first (from DB)
  const isoDate = new Date(timestamp);
  if (!isNaN(isoDate.getTime())) {
    // Convert to WIB (UTC+7)
    const wib = new Date(isoDate.getTime() + 7 * 60 * 60 * 1000);
    const dd = String(wib.getUTCDate()).padStart(2, '0');
    const mm = String(wib.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = wib.getUTCFullYear();
    const hh = String(wib.getUTCHours()).padStart(2, '0');
    const min = String(wib.getUTCMinutes()).padStart(2, '0');
    return { tanggal: `${dd}/${mm}/${yyyy}`, jam: `${hh}:${min}` };
  }

  // Fallback: already a WIB string like "Rabu, 30 September 2026 07:34 WIB"
  const match = timestamp.match(/(\d{1,2})\s+\w+\s+(\d{4})\s+(\d{2}:\d{2})/);
  if (match) {
    const day = String(match[1]).padStart(2, '0');
    const year = match[2];
    const time = match[3];
    // Extract month from string
    const monthMap: Record<string, string> = {
      Januari: '01', Februari: '02', Maret: '03', April: '04',
      Mei: '05', Juni: '06', Juli: '07', Agustus: '08',
      September: '09', Oktober: '10', November: '11', Desember: '12',
    };
    const monthName = timestamp.match(/\d{1,2}\s+(\w+)\s+\d{4}/)?.[1] || '';
    const monthNum = monthMap[monthName] || '??';
    return { tanggal: `${day}/${monthNum}/${year}`, jam: time };
  }

  return { tanggal: '', jam: '' };
}

// --- Helper: extract Pagi/Sore label from session type ---
function getPresensiLabel(sessionType: string): string {
  const label = getSessionLabel(sessionType).toLowerCase();
  if (label.includes('pagi')) return 'Pagi';
  if (label.includes('siang')) return 'Siang';
  if (label.includes('sore')) return 'Sore';
  if (label.includes('khusus') || label.includes('special')) return 'Khusus';
  return getSessionLabel(sessionType);
}

// --- Helper: convert Google Drive URL → image-friendly URL ---
// Uses uc?export=view&id=FILE_ID format — confirmed by user that this shows images
// when used with =IMAGE() in Excel (without the @ prefix issue).
function toDriveDirectUrl(url: string): string {
  // Match any common Drive URL format and extract FILE_ID
  const fileIdMatch =
    url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) ||
    url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
  }
  // Supabase / other public URLs: use as-is
  return url;
}

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

    const rows = data || [];

    // ============================================================
    // Build ExcelJS Workbook
    // ============================================================
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MyRimasa';
    workbook.created = new Date();

    // ============================================================
    // SHEET 1: Laporan Presensi (sama persis seperti sebelumnya)
    // ============================================================
    const sheetLaporan = workbook.addWorksheet('Laporan Presensi');

    sheetLaporan.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Timestamp (WIB)', key: 'timestamp', width: 26 },
      { header: 'Nama Petugas', key: 'nama', width: 26 },
      { header: 'Lokasi KHDTK', key: 'lokasi', width: 22 },
      { header: 'Email Petugas', key: 'email', width: 28 },
      { header: 'Sesi', key: 'sesi', width: 24 },
      { header: 'Foto/Dokumentasi Lapangan', key: 'foto', width: 48 },
      { header: 'Kegiatan Rutin', key: 'rutin', width: 36 },
      { header: 'Kegiatan Insidentil', key: 'insidentil', width: 26 },
      { header: 'Kondisi Lapangan', key: 'kondisi', width: 36 },
      { header: 'Tindak Lanjut / Usulan', key: 'tindak', width: 36 },
      { header: 'Latitude', key: 'lat', width: 16 },
      { header: 'Longitude', key: 'lng', width: 16 },
      { header: 'Alamat Terdeteksi', key: 'alamat', width: 32 },
      { header: 'Link Google Maps', key: 'maps', width: 36 },
    ];

    // Style header row Sheet 1
    sheetLaporan.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    sheetLaporan.getRow(1).height = 28;

    rows.forEach((r: any, idx: number) => {
      const fileUrls = (r.report_files || [])
        .map((f: any) => f.drive_url)
        .filter(Boolean)
        .join(' | ');

      const tsLabel = r.timestamp
        ? `${formatWibDate(r.timestamp)} ${formatWibTime(r.timestamp)}`
        : '';

      sheetLaporan.addRow({
        no: idx + 1,
        timestamp: tsLabel,
        nama: r.profiles?.name || '',
        lokasi: r.locations?.name || '',
        email: r.profiles?.email || '',
        sesi: getSessionLabel(r.session_type),
        foto: fileUrls || '—',
        rutin: r.routine_activity || '',
        insidentil: r.incident_activity || '',
        kondisi: r.field_condition || '',
        tindak: r.follow_up || '',
        lat: r.latitude ?? '',
        lng: r.longitude ?? '',
        alamat: r.address || '',
        maps: r.maps_url || '',
      });
    });

    // Freeze header row Sheet 1
    sheetLaporan.views = [{ state: 'frozen', ySplit: 1 }];

    // ============================================================
    // SHEET 2: Rekap Foto — DERIVED from Sheet 1 data
    // ============================================================
    const sheetRekap = workbook.addWorksheet('Rekap Foto');

    sheetRekap.columns = [
      { header: 'Nama', key: 'nama', width: 24 },
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'Jam', key: 'jam', width: 10 },
      { header: 'Presensi', key: 'presensi', width: 14 },
      { header: 'Foto 1', key: 'foto1', width: 30 },
      { header: 'Foto 2', key: 'foto2', width: 30 },
      { header: 'Foto 3', key: 'foto3', width: 30 },
      { header: 'Foto 4', key: 'foto4', width: 30 },
      { header: 'Foto 5', key: 'foto5', width: 30 },
    ];

    // Style header row Sheet 2
    sheetRekap.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    sheetRekap.getRow(1).height = 28;

    const ROW_HEIGHT = 100; // points — enough to show image thumbnails

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const excelRowIndex = i + 2; // 1-indexed, header is row 1

      const { tanggal, jam } = parseTanggalJam(r.timestamp);
      const presensi = getPresensiLabel(r.session_type);

      const photoUrls: string[] = (r.report_files || [])
        .map((f: any) => f.drive_url)
        .filter(Boolean)
        .slice(0, 5);

      // Add base row data (Nama, Tanggal, Jam, Presensi)
      const dataRow = sheetRekap.addRow({
        nama: r.profiles?.name || '',
        tanggal,
        jam,
        presensi,
      });
      dataRow.height = ROW_HEIGHT;

      // Style non-photo data cells
      [1, 2, 3, 4].forEach((col) => {
        const cell = dataRow.getCell(col);
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      });

      // For each photo URL (up to 5), write =IMAGE() formula
      for (let p = 0; p < photoUrls.length; p++) {
        const url = photoUrls[p];
        const colIndex = 5 + p; // E=5, F=6, G=7, H=8, I=9 (1-indexed)

        // Build image URL from Drive or use Supabase directly
        const imageUrl = toDriveDirectUrl(url);

        const cell = sheetRekap.getCell(excelRowIndex, colIndex);
        // ExcelJS writes =IMAGE(...) correctly in XLSX XML without @ prefix.
        // Verified via raw XML inspection: <f>=IMAGE("url",1)</f>
        cell.value = { formula: `=IMAGE("${imageUrl}",1)` };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    }

    // Freeze header row Sheet 2
    sheetRekap.views = [{ state: 'frozen', ySplit: 1 }];

    // ============================================================
    // Serialize & Return
    // ============================================================
    const excelBuffer = await workbook.xlsx.writeBuffer();

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `myrimasa_laporan_presensi_${dateStr}.xlsx`;

    return new NextResponse(excelBuffer as Buffer, {
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
