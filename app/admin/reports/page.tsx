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
    fetch('/api/admin/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : []));
    fetch('/api/locations').then(r => r.json()).then(d => setLocations(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleExportCSV() {
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
      return <span className="badge badge-morning">☀️ Pagi</span>;
    }
    if (session === 'afternoon') {
      return <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>🌤️ Siang</span>;
    }
    return <span className="badge badge-evening">🌙 Sore</span>;
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Laporan Presensi</h1>
          <p className="page-subtitle">{total} laporan ditemukan</p>
        </div>
        <button
          id="btn-export-csv"
          className="btn btn-primary"
          onClick={handleExportCSV}
        >
          📥 Export CSV
        </button>
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
            <label className="filter-label" htmlFor="filter-employee">Karyawan</label>
            <select
              id="filter-employee"
              className="form-select"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
            >
              <option value="">Semua Karyawan</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-location">Lokasi</label>
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
            <label className="filter-label" htmlFor="filter-session">Sesi</label>
            <select
              id="filter-session"
              className="form-select"
              value={sessionType}
              onChange={e => setSessionType(e.target.value)}
            >
              <option value="">Semua Sesi</option>
              <option value="morning">☀️ Pagi (06.00 - 08.00)</option>
              <option value="afternoon">🌤️ Siang (13.00 - 14.00)</option>
              <option value="evening">🌙 Sore (16.00 - 23.59)</option>
            </select>
          </div>
          <div className="filter-actions">
            <button id="btn-apply-filter" type="submit" className="btn btn-primary">Filter</button>
            <button id="btn-reset-filter" type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="spinner spinner-green" style={{ width: '32px', height: '32px' }} />
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
