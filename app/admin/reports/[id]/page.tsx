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
      return <span className="badge badge-morning">☀️ Presensi Pagi</span>;
    }
    if (session === 'afternoon') {
      return <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>🌤️ Presensi Siang</span>;
    }
    return <span className="badge badge-evening">🌙 Presensi Sore</span>;
  }

  return (
    <div>
      {/* Back */}
      <Link
        href="/admin/reports"
        id="btn-back-reports"
        style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px', textDecoration: 'none' }}
      >
        ← Kembali ke Laporan
      </Link>

      <div className="page-header">
        <h1 className="page-title">Detail Laporan</h1>
        <p className="page-subtitle">{formatWibDate(r.timestamp)} — {formatWibTime(r.timestamp)}</p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Karyawan */}
        <div className="card">
          <div className="form-section-title">👤 Informasi Karyawan</div>
          <div className="detail-grid">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="detail-item">
                <div className="detail-label">Nama</div>
                <div className="detail-value">{r.profiles?.name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{r.profiles?.email}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Tanggal</div>
                <div className="detail-value">{formatWibDate(r.timestamp)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Sesi</div>
                <div className="detail-value">
                  {renderSessionBadge(r.session_type)}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Lokasi KHDTK</div>
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
          <div className="form-section-title">📋 Laporan Kegiatan</div>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Kegiatan Rutin</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{r.routine_activity || <span className="empty">—</span>}</div>
            </div>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="detail-item">
              <div className="detail-label">Kegiatan Insidentil</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{r.incident_activity || <span className="empty">—</span>}</div>
            </div>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="detail-item">
              <div className="detail-label">Kondisi Lapangan</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{r.field_condition || <span className="empty">—</span>}</div>
            </div>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="detail-item">
              <div className="detail-label">Tindak Lanjut / Usulan</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{r.follow_up || <span className="empty">—</span>}</div>
            </div>
          </div>
        </div>

        {/* GPS */}
        <div className="card">
          <div className="form-section-title">🛰️ Data GPS</div>
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
              <div className="detail-label">Alamat</div>
              <div className="detail-value">{r.address || '—'}</div>
            </div>
          </div>
          {r.maps_url && (
            <div style={{ marginTop: '16px' }}>
              <a
                id="btn-open-maps"
                href={r.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                🗺️ Buka di Google Maps
              </a>
            </div>
          )}
        </div>

        {/* Files */}
        {r.report_files && r.report_files.length > 0 && (
          <div className="card">
            <div className="form-section-title">📷 Dokumentasi ({r.report_files.length} file)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {r.report_files.map((f: any) => {
                const isImage = f.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.file_name);
                const fileUrl = f.drive_url;

                return (
                  <div key={f.id} style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      height: '160px',
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
                        <div style={{ fontSize: '40px' }}>
                          {isImage ? '🖼️' : '🎥'}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{
                        fontSize: '12px',
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
                          className="btn btn-primary btn-sm btn-full"
                          style={{ fontSize: '12px', textDecoration: 'none' }}
                        >
                          👁️ Buka / Unduh Foto
                        </a>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
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
