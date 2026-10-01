'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Report, Profile, Location } from '@/lib/types';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [sessionType, setSessionType] = useState('');

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (startDate) p.set('start_date', startDate);
    if (endDate) p.set('end_date', endDate);
    if (employeeId) p.set('employee_id', employeeId);
    if (locationId) p.set('location_id', locationId);
    if (sessionType) p.set('session_type', sessionType);
    p.set('limit', '100');
    return p.toString();
  }, [startDate, endDate, employeeId, locationId, sessionType]);

  async function fetchReports() {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?${buildParams()}`);
    const json = await res.json();
    setReports(json.data || []);
    setTotal(json.count || 0);
    setLoading(false);
  }

  useEffect(() => {
    // Run all initial requests concurrently in parallel
    Promise.all([
      fetch(`/api/admin/reports?${buildParams()}`).then(r => r.json()),
      fetch('/api/admin/employees').then(r => r.json()),
      fetch('/api/locations').then(r => r.json()),
    ]).then(([repData, empData, locData]) => {
      setReports(repData.data || []);
      setTotal(repData.count || 0);
      setEmployees(Array.isArray(empData) ? empData : []);
      setLocations(Array.isArray(locData) ? locData : []);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching admin reports data:', err);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleExportExcel() {
    const url = `/api/admin/export?${buildParams()}`;
    window.open(url, '_blank');
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    fetchReports();
  }

  function handleReset() {
    setStartDate(''); setEndDate(''); setEmployeeId(''); setLocationId(''); setSessionType('');
    setTimeout(fetchReports, 100);
  }

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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Presensi</h1>
          <p className="page-subtitle">{total} laporan ditemukan</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link
            href="/admin/rekap-dokumentasi"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Rekap Dokumentasi</span>
          </Link>

          <button
            id="btn-export-excel"
            className="btn btn-primary"
            onClick={handleExportExcel}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} id="form-filter-reports">
        <div className="filter-bar">
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-start-date">Dari Tanggal</label>
            <input
              id="filter-start-date"
              type="date"
              className="form-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-end-date">Sampai Tanggal</label>
            <input
              id="filter-end-date"
              type="date"
              className="form-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-employee">Petugas</label>
            <select
              id="filter-employee"
              className="form-select"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
            >
              <option value="">Semua Petugas</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-location">Lokasi Penugasan</label>
            <select
              id="filter-location"
              className="form-select"
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
            >
              <option value="">Semua Lokasi</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-session">Sesi Presensi</label>
            <select
              id="filter-session"
              className="form-select"
              value={sessionType}
              onChange={e => setSessionType(e.target.value)}
            >
              <option value="">Semua Sesi</option>
              <option value="morning">Pagi (06.00 – 08.00)</option>
              <option value="evening">Sore (16.00 – 23.59)</option>
              <option value="special">Insidentil (24 Jam)</option>
            </select>
          </div>
          <div className="filter-actions">
            <button id="btn-apply-filter" type="submit" className="btn btn-primary">Terapkan</button>
            <button id="btn-reset-filter" type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px', borderColor: '#cbd5e1', borderTopColor: '#1b4d3e' }} />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Karyawan</th>
                <th>Lokasi KHDTK</th>
                <th>Sesi</th>
                <th>Kegiatan Rutin</th>
                <th>Insidentil</th>
                <th>Kondisi</th>
                <th>Tindak Lanjut</th>
                <th>Lat</th>
                <th>Lon</th>
                <th>Foto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? (
                reports.map((r: any) => (
                  <tr
                    key={r.id}
                    onClick={() => window.location.href = `/admin/reports/${r.id}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="muted" style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {new Date(r.timestamp).toLocaleString('id-ID', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>{r.profiles?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.profiles?.email}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{r.locations?.name || '—'}</td>
                    <td>
                      {renderSessionBadge(r.session_type)}
                    </td>
                    <td className="truncate" style={{ maxWidth: '160px', fontSize: '12px' }}>{r.routine_activity || '—'}</td>
                    <td className="truncate" style={{ maxWidth: '120px', fontSize: '12px' }}>{r.incident_activity || '—'}</td>
                    <td className="truncate" style={{ maxWidth: '120px', fontSize: '12px' }}>{r.field_condition || '—'}</td>
                    <td className="truncate" style={{ maxWidth: '120px', fontSize: '12px' }}>{r.follow_up || '—'}</td>
                    <td className="muted" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{r.latitude?.toFixed(4) || '—'}</td>
                    <td className="muted" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{r.longitude?.toFixed(4) || '—'}</td>
                    <td className="muted" style={{ fontSize: '12px' }}>
                      {r.report_files?.length || 0} file
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <Link
                        href={`/admin/reports/${r.id}`}
                        id={`btn-detail-${r.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="text-center muted" style={{ padding: '40px' }}>
                    Tidak ada laporan yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
