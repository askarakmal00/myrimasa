import { NextResponse, after } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { uploadFileToDrive } from '@/lib/google-drive';
import { SessionType } from '@/lib/types';
import { getAssignedLocationName } from '@/lib/staff-assignments';

export const dynamic = 'force-dynamic';

// GET /api/manual-attendance — List manual attendance requests
export async function GET(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employee_id');

    let query = adminClient
      .from('manual_attendances')
      .select(`
        *,
        profiles!manual_attendances_user_id_fkey(id, name, email),
        locations(id, name, address),
        manual_attendance_files(id, file_name, file_type, drive_url),
        replaces_report:reports!manual_attendances_replaces_report_id_fkey(id, timestamp, routine_activity, field_condition)
      `)
      .order('created_at', { ascending: false });

    // Non-admin can only see their own requests
    if (profile.role !== 'admin') {
      query = query.eq('user_id', profile.id);
    } else {
      // Admin filters
      if (employeeId) query = query.eq('user_id', employeeId);
    }

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet if migration hasn't been run
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'Tabel manual_attendances belum dibuat di database. Harap jalankan migrasi 008_manual_attendance.sql di Supabase SQL Editor.',
            needsMigration: true,
          },
          { status: 503 }
        );
      }
      console.error('Error fetching manual attendances:', error);
      return NextResponse.json({ error: 'Gagal memuat data absen manual' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Manual attendance GET error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/manual-attendance — Submit a new manual attendance request
export async function POST(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized. Silakan masuk terlebih dahulu.' }, { status: 401 });
    }

    const formData = await request.formData();
    const report_date = formData.get('report_date') as string;
    const session_type = formData.get('session_type') as SessionType;
    const actual_time = formData.get('actual_time') as string; // HH:mm
    const location_id = formData.get('location_id') as string;
    const formLocationName = formData.get('location_name') as string;
    const routine_activity = formData.get('routine_activity') as string;
    const incident_activity = formData.get('incident_activity') as string || 'Nihil';
    const field_condition = formData.get('field_condition') as string;
    const follow_up = formData.get('follow_up') as string;
    const reason = formData.get('reason') as string;
    const files = formData.getAll('files') as File[];

    // Validations
    if (!report_date) {
      return NextResponse.json({ error: 'Tanggal presensi wajib diisi' }, { status: 400 });
    }
    if (!session_type || !['morning', 'afternoon', 'evening', 'special'].includes(session_type)) {
      return NextResponse.json({ error: 'Sesi presensi tidak valid' }, { status: 400 });
    }
    if (!actual_time) {
      return NextResponse.json({ error: 'Waktu / Jam presensi wajib diisi' }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Alasan terlambat / isi absen manual wajib diisi' }, { status: 400 });
    }
    if (!routine_activity || !routine_activity.trim()) {
      return NextResponse.json({ error: 'Kolom Kegiatan Rutin wajib diisi' }, { status: 400 });
    }
    if (!field_condition || !field_condition.trim()) {
      return NextResponse.json({ error: 'Kolom Kondisi Lapangan wajib diisi' }, { status: 400 });
    }
    if (!follow_up || !follow_up.trim()) {
      return NextResponse.json({ error: 'Kolom Tindak Lanjut wajib diisi' }, { status: 400 });
    }
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Minimal 1 foto dokumentasi/bukti wajib dilampirkan' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if there is an existing report for this date & session
    const { data: existingReport } = await adminClient
      .from('reports')
      .select('id, timestamp, routine_activity')
      .eq('user_id', profile.id)
      .eq('session_type', session_type)
      .eq('report_date', report_date)
      .maybeSingle();

    // Resolve location
    const assignedLocName = getAssignedLocationName(profile.email, profile.name);
    let finalLocationId = location_id || profile.location_id;
    let locationName = formLocationName || profile.location_name || assignedLocName || 'KHDTK';

    if (finalLocationId) {
      const { data: locRow } = await adminClient.from('locations').select('name').eq('id', finalLocationId).single();
      if (locRow?.name) locationName = locRow.name;
    }

    // Construct full timestamp in WIB
    // Format: YYYY-MM-DDTHH:mm:00+07:00
    const timeParts = actual_time.split(':');
    const hh = timeParts[0].padStart(2, '0');
    const mm = (timeParts[1] || '00').padStart(2, '0');
    const wibTimestamp = `${report_date}T${hh}:${mm}:00+07:00`;

    // Insert into manual_attendances table
    const { data: requestRow, error: insertError } = await adminClient
      .from('manual_attendances')
      .insert({
        user_id: profile.id,
        report_date,
        session_type,
        actual_time: `${hh}:${mm}:00`,
        timestamp: wibTimestamp,
        location_id: finalLocationId || null,
        location_name: locationName,
        routine_activity,
        incident_activity,
        field_condition,
        follow_up,
        reason,
        replaces_report_id: existingReport?.id || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !requestRow) {
      if (insertError?.code === 'PGRST205' || insertError?.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'Tabel manual_attendances belum dibuat di Supabase. Harap jalankan migrasi 008_manual_attendance.sql terlebih dahulu.',
            needsMigration: true,
          },
          { status: 503 }
        );
      }
      console.error('Error inserting manual attendance:', insertError);
      return NextResponse.json({ error: 'Gagal menyimpan pengajuan absen manual' }, { status: 500 });
    }

    // Read files into memory for async upload
    const filePayloads = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        type: f.type || 'image/jpeg',
        buffer: Buffer.from(await f.arrayBuffer()),
      }))
    );

    // Insert initial manual_attendance_files records
    const initialFiles = filePayloads.map((f) => ({
      manual_attendance_id: requestRow.id,
      file_name: f.name,
      file_type: f.type,
      drive_file_id: 'syncing',
      drive_url: null,
    }));

    const { data: insertedFiles } = await adminClient
      .from('manual_attendance_files')
      .insert(initialFiles)
      .select('id');

    // Async upload to Google Drive
    const serverNow = new Date();
    after(async () => {
      try {
        const uploadResults = await Promise.allSettled(
          filePayloads.map(async (f) => {
            return uploadFileToDrive(
              f.buffer,
              f.name,
              f.type,
              locationName,
              profile.name,
              serverNow
            );
          })
        );

        for (let i = 0; i < uploadResults.length; i++) {
          const res = uploadResults[i];
          const rowId = insertedFiles?.[i]?.id;
          if (rowId && res.status === 'fulfilled' && res.value?.drive_url) {
            await adminClient
              .from('manual_attendance_files')
              .update({
                drive_file_id: res.value.drive_file_id,
                drive_url: res.value.drive_url,
              })
              .eq('id', rowId);
          }
        }
      } catch (err) {
        console.error('Background upload error for manual attendance:', err);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pengajuan absen manual berhasil dikirim dan menunggu persetujuan Admin.',
      data: requestRow,
      isReplacement: !!existingReport,
    });
  } catch (error: any) {
    console.error('Manual attendance POST error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memproses absen manual' }, { status: 500 });
  }
}
