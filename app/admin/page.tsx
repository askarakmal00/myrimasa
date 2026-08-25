import { createAdminClient } from '@/lib/supabase';
import Link from 'next/link';
import { formatWibDate } from '@/lib/time';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const client = createAdminClient();

  // Get today's date in local/WIB
  const now = new Date();
  const wibMs = now.getTime() + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibMs);
  const todayStr = `${wibDate.getUTCFullYear()}-${String(wibDate.getUTCMonth() + 1).padStart(2,'0')}-${String(wibDate.getUTCDate()).padStart(2,'0')}`;

  // Stats for 3 sessions
  const [
    { count: totalReports },
    { count: todayMorning },
    { count: todayAfternoon },
    { count: todayEvening },
    { count: totalEmployees },
  ] = await Promise.all([
    client.from('reports').select('*', { count: 'exact', head: true }),
    client.from('reports').select('*', { count: 'exact', head: true }).eq('report_date', todayStr).eq('session_type', 'morning'),
    client.from('reports').select('*', { count: 'exact', head: true }).eq('report_date', todayStr).eq('session_type', 'afternoon'),
    client.from('reports').select('*', { count: 'exact', head: true }).eq('report_date', todayStr).eq('session_type', 'evening'),
    client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee'),
  ]);

  // Recent reports
  const { data: recentReports } = await client
    .from('reports')
    .select(`
      id, timestamp, session_type, report_date,
      profiles!reports_user_id_fkey(name, email),
      locations(name)
    `)
    .order('timestamp', { ascending: false })
    .limit(10);

  const todayLabel = formatWibDate(now.toISOString());

  function getBadge(session: string) {
    if (session === 'morning') return <span className="badge badge-morning">☀️ Pagi</span>;
    if (session === 'afternoon') return <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }}>🌤️ Siang</span>;
    return <span className="badge badge-evening">🌙 Sore</span>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{todayLabel}</p>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Presensi Pagi Hari Ini</div>
          <div className="stat-card-value" style={{ color: '#d97706' }}>
            {todayMorning ?? 0}
          </div>
          <div className="stat-card-sub">☀️ 06.00 - 08.00</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Presensi Siang Hari Ini</div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>
            {todayAfternoon ?? 0}
          </div>
          <div className="stat-card-sub">🌤️ 13.00 - 14.00</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Presensi Sore Hari Ini</div>
          <div className="stat-card-value" style={{ color: '#4338ca' }}>
            {todayEvening ?? 0}
          </div>
          <div className="stat-card-sub">🌙 16.00 - 23.59</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Total Laporan</div>
          <div className="stat-card-value" style={{ color: '#1e5631' }}>
            {totalReports ?? 0}
          </div>
          <div className="stat-card-sub">📋 Semua waktu</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Total Karyawan</div>
          <div className="stat-card-value" style={{ color: '#0f172a' }}>
            {totalEmployees ?? 0}
          </div>
          <div className="stat-card-sub">👤 Terdaftar</div>
        </div>
      </div>

      {/* Recent reports section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', marginTop: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Laporan Terbaru</h2>
        <Link href="/admin/reports" className="btn btn-secondary btn-sm">Lihat Semua →</Link>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Karyawan</th>
              <th>Lokasi</th>
              <th>Sesi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentReports && recentReports.length > 0 ? (
              recentReports.map((r: any) => (
                <tr key={r.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.timestamp).toLocaleString('id-ID', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{r.profiles?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{r.profiles?.email}</div>
                  </td>
                  <td className="muted truncate">{r.locations?.name || '—'}</td>
                  <td>
                    {getBadge(r.session_type)}
                  </td>
                  <td>
                    <Link
                      href={`/admin/reports/${r.id}`}
                      id={`btn-view-report-${r.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      →
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center muted" style={{ padding: '36px' }}>
                  Belum ada laporan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
