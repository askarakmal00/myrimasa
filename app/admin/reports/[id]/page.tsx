import { createAdminClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatWibDate, formatWibTime } from '@/lib/time';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Detail Laporan' };

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = createAdminClient();

  const { data: report, error } = await client
    .from('reports')
    .select(`
      *,
      profiles!reports_user_id_fkey(name, email),
      locations(name, address, latitude, longitude),
      report_files(id, file_name, file_type, drive_file_id, drive_url, created_at)
    `)
    .eq('id', id)
    .single();

  if (error || !report) notFound();

  const r = report as any;

  function renderSessionBadge(session: string) {
    if (session === 'morning') {
      return <span className="badge badge-morning">Pagi</span>;
    }
    if (session === 'special') {
      return <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>Insidentil</span>;
    }
    return <span className="badge badge-evening">Sore</span>;
  }

  return (
    <div>
      {/* Back */}
      <Link
        href="/admin/reports"
        id="btn-back-reports"
        style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px', textDecoration: 'none' }}
      >
        ← Kembali ke Daftar Laporan
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Detail Laporan Presensi</h1>
          <p className="page-subtitle">{formatWibDate(r.timestamp)} — {formatWibTime(r.timestamp)}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Petugas */}
        <div className="card">
          <div className="form-section-title">Informasi Petugas &amp; Penugasan</div>
          <div className="detail-grid">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div className="detail-item">
                <div className="detail-label">Nama Lengkap</div>
                <div className="detail-value">{r.profiles?.name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{r.profiles?.email}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Tanggal Laporan</div>
                <div className="detail-value">{formatWibDate(r.timestamp)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Sesi Presensi</div>
                <div className="detail-value">
                  {renderSessionBadge(r.session_type)}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Lokasi Penugasan</div>
                <div className="detail-value">{r.locations?.name || '—'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Waktu Presensi</div>
                <div className="detail-value">{formatWibTime(r.timestamp)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Laporan Kegiatan */}
        <div className="card">
          <div className="form-section-title">Laporan Kegiatan</div>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Kegiatan Rutin</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{r.routine_activity || <span className="empty">—</span>}</div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', margin: '4px 0' }} />
            <div className="detail-item">
              <div className="detail-label">Kegiatan Insidentil</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{r.incident_activity || <span className="empty">—</span>}</div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', margin: '4px 0' }} />
            <div className="detail-item">
              <div className="detail-label">Kondisi Lapangan</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{r.field_condition || <span className="empty">—</span>}</div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', margin: '4px 0' }} />
            <div className="detail-item">
              <div className="detail-label">Tindak Lanjut / Usulan</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{r.follow_up || <span className="empty">—</span>}</div>
            </div>
          </div>
        </div>

        {/* GPS */}
        <div className="card">
          <div className="form-section-title">Verifikasi Lokasi (GPS)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="detail-item">
              <div className="detail-label">Latitude</div>
              <div className="detail-value">{r.latitude ?? '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Longitude</div>
              <div className="detail-value">{r.longitude ?? '—'}</div>
            </div>
            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
              <div className="detail-label">Alamat Terdeteksi</div>
              <div className="detail-value">{r.address || '—'}</div>
            </div>
          </div>
          {r.maps_url && (
            <div style={{ marginTop: '14px' }}>
              <a
                id="btn-open-maps"
                href={r.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Buka di Google Maps →
              </a>
            </div>
          )}
        </div>

        {/* Files */}
        {r.report_files && r.report_files.length > 0 && (
          <div className="card">
            <div className="form-section-title">Dokumentasi Foto ({r.report_files.length} file)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {r.report_files.map((f: any) => {
                const isImage = f.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.file_name);
                const fileUrl = f.drive_url;

                return (
                  <div key={f.id} style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      height: '140px',
                      background: 'var(--color-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      {fileUrl && isImage ? (
                        <img
                          src={fileUrl}
                          alt={f.file_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          Berkas Foto
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{
                        fontSize: '11.5px',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={f.file_name}>
                        {f.file_name}
                      </div>

                      {fileUrl ? (
                        <a
                          id={`btn-open-file-${f.id}`}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm btn-full"
                          style={{ fontSize: '11.5px', padding: '4px 8px' }}
                        >
                          Buka Foto
                        </a>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Lampiran tidak tersedia
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
