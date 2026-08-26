import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { isWithinWindow, getTodayLocalDate } from '@/lib/time';
import { uploadFileToDrive } from '@/lib/google-drive';
import { SessionType } from '@/lib/types';
import { getAssignedLocationName } from '@/lib/staff-assignments';

const sessionLabels: Record<SessionType, string> = {
  morning: 'Pagi',
  afternoon: 'Siang',
  evening: 'Sore',
};

// POST /api/reports — Submit a new presence report
export async function POST(request: Request) {
  try {
    const profile = await getProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized. Silakan masuk terlebih dahulu.' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const session_type = formData.get('session_type') as SessionType;
    const location_id = formData.get('location_id') as string;
    const formLocationName = formData.get('location_name') as string;
    const routine_activity = formData.get('routine_activity') as string;
    const incident_activity = formData.get('incident_activity') as string;
    const field_condition = formData.get('field_condition') as string;
    const follow_up = formData.get('follow_up') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const address = formData.get('address') as string | null;
    const gps_timestamp = formData.get('gps_timestamp') as string;
    const timezoneOffsetRaw = formData.get('timezone_offset') as string | null;
    const timezoneOffset = timezoneOffsetRaw ? parseInt(timezoneOffsetRaw) : undefined;
    const files = formData.getAll('files') as File[];

    // Validate required fields
    if (!session_type || !['morning', 'afternoon', 'evening'].includes(session_type)) {
      return NextResponse.json({ error: 'Session type tidak valid (harus morning, afternoon, atau evening)' }, { status: 400 });
    }
    if (!routine_activity || !routine_activity.trim()) {
      return NextResponse.json({ error: 'Kolom Kegiatan Rutin wajib diisi' }, { status: 400 });
    }
    if (!incident_activity || !incident_activity.trim()) {
      return NextResponse.json({ error: 'Kolom Kegiatan Insidentil wajib diisi (tulis "Nihil" jika tidak ada)' }, { status: 400 });
    }
    if (!field_condition || !field_condition.trim()) {
      return NextResponse.json({ error: 'Kolom Hasil Kondisi di lapangan wajib diisi' }, { status: 400 });
    }
    if (!follow_up || !follow_up.trim()) {
      return NextResponse.json({ error: 'Kolom Tindak Lanjut/Usulan wajib diisi' }, { status: 400 });
    }
    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Data GPS wajib ada' }, { status: 400 });
    }
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Minimal satu foto/video wajib diupload' }, { status: 400 });
    }

    const sessionName = sessionLabels[session_type] || session_type;

    // === TIME WINDOW VALIDATION IN USER LOCAL TIMEZONE ===
    const serverNow = new Date();
    if (!isWithinWindow(session_type, serverNow, timezoneOffset)) {
      return NextResponse.json(
        { error: `Presensi ${sessionName} tidak dalam jam yang ditentukan waktu setempat. Silahkan presensi pada waktu yang telah ditetapkan.` },
        { status: 400 }
      );
    }

    // === DUPLICATE CHECK ===
    const adminClient = createAdminClient();
    const reportDate = getTodayLocalDate(timezoneOffset);

    const { data: existing } = await adminClient
      .from('reports')
      .select('id')
      .eq('user_id', profile.id)
      .eq('session_type', session_type)
      .eq('report_date', reportDate)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Anda sudah melakukan presensi ${sessionName} hari ini.` },
        { status: 409 }
      );
    }

    // === RESOLVE LOCATION INFO ===
    const assignedLocName = getAssignedLocationName(profile.email, profile.name);
    let finalLocationId = location_id || profile.location_id;
    let locationName = formLocationName || profile.location_name || assignedLocName || 'KHDTK';

    if (finalLocationId) {
      const { data: locRow } = await adminClient.from('locations').select('name').eq('id', finalLocationId).single();
      if (locRow?.name) {
        locationName = locRow.name;
      }
    } else if (locationName) {
      const { data: locRow } = await adminClient.from('locations').select('id, name').ilike('name', locationName).single();
      if (locRow?.id) {
        finalLocationId = locRow.id;
        locationName = locRow.name;
      } else {
        const { data: newLoc } = await adminClient.from('locations').insert({ name: locationName, active: true }).select('id, name').single();
        if (newLoc?.id) {
          finalLocationId = newLoc.id;
        }
      }
    }

    const maps_url = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // === CREATE REPORT ===
    const { data: report, error: reportError } = await adminClient
      .from('reports')
      .insert({
        user_id: profile.id,
        session_type,
        report_date: reportDate,
        timestamp: serverNow.toISOString(),
        location_id: finalLocationId || null,
        routine_activity,
        incident_activity,
        field_condition,
        follow_up,
        latitude,
        longitude,
        address,
        maps_url,
        gps_timestamp,
        status: 'submitted',
      })
      .select()
      .single();

    if (reportError || !report) {
      console.error('Error creating report:', reportError);
      return NextResponse.json({ error: 'Gagal menyimpan laporan ke database' }, { status: 500 });
    }

    // === UPLOAD FILES TO GOOGLE DRIVE / CLOUD STORAGE ===
    const uploadResults = await Promise.allSettled(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return uploadFileToDrive(
          buffer,
          file.name,
          file.type,
          locationName,
          profile.name,
          serverNow
        );
      })
    );

    // Save file metadata to database
    const fileInserts = uploadResults.map((r, idx) => {
      if (r.status === 'fulfilled') {
        const result = r.value;
        return {
          report_id: report.id,
          file_name: result.file_name,
          file_type: result.file_type,
          drive_file_id: result.drive_file_id,
          drive_url: result.drive_url,
        };
      } else {
        console.error(`Upload error for file ${files[idx].name}:`, r.reason);
        return {
          report_id: report.id,
          file_name: files[idx].name,
          file_type: files[idx].type,
          drive_file_id: 'pending_storage',
          drive_url: null,
        };
      }
    });

    if (fileInserts.length > 0) {
      await adminClient.from('report_files').insert(fileInserts);
    }

    return NextResponse.json({
      success: true,
      report_id: report.id,
      files_uploaded: fileInserts.length,
      timestamp: report.timestamp,
    });
  } catch (error) {
    console.error('Submit report error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
