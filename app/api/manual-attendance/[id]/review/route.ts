import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/manual-attendance/[id]/review — Admin review (approve or reject)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Akses hanya untuk Administrator' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, admin_notes } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action harus "approve" atau "reject"' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch the manual attendance record
    const { data: requestRow, error: fetchError } = await adminClient
      .from('manual_attendances')
      .select('*, manual_attendance_files(*)')
      .eq('id', id)
      .single();

    if (fetchError || !requestRow) {
      return NextResponse.json({ error: 'Pengajuan absen manual tidak ditemukan' }, { status: 404 });
    }

    if (requestRow.status !== 'pending') {
      return NextResponse.json(
        { error: `Pengajuan ini sudah berstatus "${requestRow.status}" dan tidak dapat diubah lagi.` },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // ==========================================================
    // ACTION: APPROVE
    // ==========================================================
    if (action === 'approve') {
      // Check if there is an existing report to replace
      let targetReportId = requestRow.replaces_report_id;

      if (!targetReportId) {
        const { data: existing } = await adminClient
          .from('reports')
          .select('id')
          .eq('user_id', requestRow.user_id)
          .eq('session_type', requestRow.session_type)
          .eq('report_date', requestRow.report_date)
          .maybeSingle();

        if (existing) targetReportId = existing.id;
      }

      if (targetReportId) {
        // REPLACE EXISTING REPORT
        const { error: updateReportError } = await adminClient
          .from('reports')
          .update({
            timestamp: requestRow.timestamp,
            location_id: requestRow.location_id,
            routine_activity: requestRow.routine_activity,
            incident_activity: requestRow.incident_activity,
            field_condition: requestRow.field_condition,
            follow_up: requestRow.follow_up,
            status: 'submitted',
          })
          .eq('id', targetReportId);

        if (updateReportError) {
          console.error('Error updating existing report:', updateReportError);
          return NextResponse.json({ error: 'Gagal memperbarui data presensi lama' }, { status: 500 });
        }

        // Attach new files to the report
        const filesToInsert = (requestRow.manual_attendance_files || []).map((f: any) => ({
          report_id: targetReportId,
          file_name: f.file_name,
          file_type: f.file_type,
          drive_file_id: f.drive_file_id,
          drive_url: f.drive_url,
        }));

        if (filesToInsert.length > 0) {
          await adminClient.from('report_files').insert(filesToInsert);
        }
      } else {
        // INSERT NEW REPORT
        const { data: newReport, error: insertReportError } = await adminClient
          .from('reports')
          .insert({
            user_id: requestRow.user_id,
            session_type: requestRow.session_type,
            report_date: requestRow.report_date,
            timestamp: requestRow.timestamp,
            location_id: requestRow.location_id,
            routine_activity: requestRow.routine_activity,
            incident_activity: requestRow.incident_activity,
            field_condition: requestRow.field_condition,
            follow_up: requestRow.follow_up,
            status: 'submitted',
          })
          .select('id')
          .single();

        if (insertReportError || !newReport) {
          console.error('Error creating new report from manual attendance:', insertReportError);
          return NextResponse.json({ error: 'Gagal memasukkan data presensi baru ke database' }, { status: 500 });
        }

        // Attach files to new report
        const filesToInsert = (requestRow.manual_attendance_files || []).map((f: any) => ({
          report_id: newReport.id,
          file_name: f.file_name,
          file_type: f.file_type,
          drive_file_id: f.drive_file_id,
          drive_url: f.drive_url,
        }));

        if (filesToInsert.length > 0) {
          await adminClient.from('report_files').insert(filesToInsert);
        }
      }

      // Update manual attendance status to approved
      await adminClient
        .from('manual_attendances')
        .update({
          status: 'approved',
          reviewed_by: profile.id,
          reviewed_at: nowIso,
          admin_notes: admin_notes || 'Disetujui oleh Administrator.',
        })
        .eq('id', id);

      return NextResponse.json({
        success: true,
        message: 'Pengajuan absen manual berhasil DISETUJUI dan data presensi telah diperbarui.',
        status: 'approved',
      });
    }

    // ==========================================================
    // ACTION: REJECT
    // ==========================================================
    if (action === 'reject') {
      await adminClient
        .from('manual_attendances')
        .update({
          status: 'rejected',
          reviewed_by: profile.id,
          reviewed_at: nowIso,
          admin_notes: admin_notes || 'Ditolak oleh Administrator.',
        })
        .eq('id', id);

      return NextResponse.json({
        success: true,
        message: 'Pengajuan absen manual telah DITOLAK.',
        status: 'rejected',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Review manual attendance error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memproses review' }, { status: 500 });
  }
}
