import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/manual-attendance/bulk-review — Bulk approve or reject manual attendances
export async function POST(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Akses hanya untuk Administrator' }, { status: 403 });
    }

    const body = await request.json();
    const { ids, action, admin_notes } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Harap pilih minimal satu pengajuan untuk diproses' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action harus "approve" atau "reject"' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch all requested manual attendance records that are still pending
    const { data: requestRows, error: fetchError } = await adminClient
      .from('manual_attendances')
      .select('*, manual_attendance_files(*)')
      .in('id', ids)
      .eq('status', 'pending');

    if (fetchError) {
      console.error('Error fetching bulk manual attendances:', fetchError);
      return NextResponse.json({ error: 'Gagal memuat data pengajuan' }, { status: 500 });
    }

    if (!requestRows || requestRows.length === 0) {
      return NextResponse.json({
        error: 'Tidak ada pengajuan dengan status "pending" yang ditemukan untuk diproses.',
      }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    let processedCount = 0;
    const errors: string[] = [];

    // ==========================================================
    // ACTION: BULK APPROVE
    // ==========================================================
    if (action === 'approve') {
      for (const row of requestRows) {
        try {
          let targetReportId = row.replaces_report_id;

          if (!targetReportId) {
            const { data: existing } = await adminClient
              .from('reports')
              .select('id')
              .eq('user_id', row.user_id)
              .eq('session_type', row.session_type)
              .eq('report_date', row.report_date)
              .maybeSingle();

            if (existing) targetReportId = existing.id;
          }

          if (targetReportId) {
            // REPLACE EXISTING REPORT
            const updatePayload: any = {
              timestamp: row.timestamp,
              location_id: row.location_id,
              routine_activity: row.routine_activity,
              incident_activity: row.incident_activity,
              field_condition: row.field_condition,
              follow_up: row.follow_up,
              status: 'submitted',
            };

            let { error: updateErr } = await adminClient
              .from('reports')
              .update({
                ...updatePayload,
                is_manual: true,
                manual_reason: row.reason || null,
              })
              .eq('id', targetReportId);

            if (updateErr) {
              // Retry without is_manual if schema migration has not run yet
              const retry = await adminClient.from('reports').update(updatePayload).eq('id', targetReportId);
              updateErr = retry.error;
            }

            if (updateErr) {
              console.error(`Error updating report for ${row.id}:`, updateErr);
              errors.push(`ID ${row.id}: Gagal memperbarui data presensi lama`);
              continue;
            }

            // Copy files to report_files
            const filesToInsert = (row.manual_attendance_files || []).map((f: any) => ({
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
            const insertPayload: any = {
              user_id: row.user_id,
              session_type: row.session_type,
              report_date: row.report_date,
              timestamp: row.timestamp,
              location_id: row.location_id,
              routine_activity: row.routine_activity,
              incident_activity: row.incident_activity,
              field_condition: row.field_condition,
              follow_up: row.follow_up,
              status: 'submitted',
            };

            let newReportId: string | null = null;
            const resWithFlag = await adminClient
              .from('reports')
              .insert({
                ...insertPayload,
                is_manual: true,
                manual_reason: row.reason || null,
              })
              .select('id')
              .maybeSingle();

            if (resWithFlag.data?.id) {
              newReportId = resWithFlag.data.id;
            } else {
              // Fallback without is_manual
              const resFallback = await adminClient
                .from('reports')
                .insert(insertPayload)
                .select('id')
                .single();

              if (resFallback.error || !resFallback.data) {
                console.error(`Error inserting report for ${row.id}:`, resFallback.error);
                errors.push(`ID ${row.id}: Gagal membuat data presensi baru`);
                continue;
              }
              newReportId = resFallback.data.id;
            }

            // Copy files to report_files
            const filesToInsert = (row.manual_attendance_files || []).map((f: any) => ({
              report_id: newReportId,
              file_name: f.file_name,
              file_type: f.file_type,
              drive_file_id: f.drive_file_id,
              drive_url: f.drive_url,
            }));

            if (filesToInsert.length > 0) {
              await adminClient.from('report_files').insert(filesToInsert);
            }
          }

          // Mark manual attendance record as approved
          await adminClient
            .from('manual_attendances')
            .update({
              status: 'approved',
              reviewed_by: profile.id,
              reviewed_at: nowIso,
              admin_notes: admin_notes || 'Disetujui secara massal oleh Administrator.',
            })
            .eq('id', row.id);

          processedCount++;
        } catch (itemErr: any) {
          console.error(`Error processing item ${row.id}:`, itemErr);
          errors.push(`ID ${row.id}: ${itemErr?.message || 'Gagal diproses'}`);
        }
      }

      return NextResponse.json({
        success: true,
        processedCount,
        totalRequested: ids.length,
        errors,
        message: `${processedCount} dari ${requestRows.length} pengajuan absen manual berhasil DISETUJUI.`,
      });
    }

    // ==========================================================
    // ACTION: BULK REJECT
    // ==========================================================
    if (action === 'reject') {
      const { error: rejectError } = await adminClient
        .from('manual_attendances')
        .update({
          status: 'rejected',
          reviewed_by: profile.id,
          reviewed_at: nowIso,
          admin_notes: admin_notes || 'Ditolak secara massal oleh Administrator.',
        })
        .in('id', requestRows.map(r => r.id));

      if (rejectError) {
        console.error('Bulk reject error:', rejectError);
        return NextResponse.json({ error: 'Gagal menolak pengajuan secara massal' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        processedCount: requestRows.length,
        message: `${requestRows.length} pengajuan absen manual berhasil DITOLAK.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Bulk review error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memproses bulk review' }, { status: 500 });
  }
}
