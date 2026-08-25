import { createAdminClient } from '@/lib/supabase';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Lokasi KHDTK' };
export const dynamic = 'force-dynamic';

export default async function AdminLocationsPage() {
  const client = createAdminClient();
  const { data: locations } = await client
    .from('locations')
    .select('*')
    .order('name');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Lokasi KHDTK</h1>
        <p className="page-subtitle">{locations?.length || 0} lokasi terdaftar</p>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Lokasi</th>
              <th>Alamat</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Status</th>
              <th>Terdaftar</th>
            </tr>
          </thead>
          <tbody>
            {locations && locations.length > 0 ? (
              locations.map((loc: any) => (
                <tr key={loc.id}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>
                      📍 {loc.name}
                    </div>
                  </td>
                  <td className="muted truncate" style={{ maxWidth: '200px', fontSize: '12px' }}>
                    {loc.address || '—'}
                  </td>
                  <td className="muted" style={{ fontSize: '12px' }}>{loc.latitude ?? '—'}</td>
                  <td className="muted" style={{ fontSize: '12px' }}>{loc.longitude ?? '—'}</td>
                  <td>
                    <span className={`badge ${loc.active ? 'badge-submitted' : 'badge-missed'}`}>
                      {loc.active ? '✅ Aktif' : '❌ Nonaktif'}
                    </span>
                  </td>
                  <td className="muted" style={{ fontSize: '12px' }}>
                    {new Date(loc.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center muted" style={{ padding: '40px' }}>
                  Belum ada lokasi terdaftar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="alert alert-warning" style={{ marginTop: '16px' }}>
        <span>ℹ️</span>
        <span>Untuk menambah atau mengubah lokasi, silahkan edit langsung di Supabase dashboard atau melalui SQL migration.</span>
      </div>
    </div>
  );
}
