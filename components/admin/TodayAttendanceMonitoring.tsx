'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatWibTime } from '@/lib/time';

export interface EmployeeAttendanceItem {
  id: string;
  name: string;
  email: string;
  morningReport: { id: string; timestamp: string; locationName: string } | null;
  eveningReport: { id: string; timestamp: string; locationName: string } | null;
}

interface Props {
  employees: EmployeeAttendanceItem[];
  morningOpen: boolean;
  eveningOpen: boolean;
  morningPassed: boolean;
  eveningPassed: boolean;
}

export default function TodayAttendanceMonitoring({
  employees,
  morningOpen,
  eveningOpen,
  morningPassed,
  eveningPassed,
}: Props) {
  const [filterTab, setFilterTab] = useState<'all' | 'incomplete' | 'complete'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate session completion for an employee
  function getCompletionCount(emp: EmployeeAttendanceItem) {
    let count = 0;
    if (emp.morningReport) count++;
    if (emp.eveningReport) count++;
    return count;
  }

  // Filter employees based on active tab and search
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const count = getCompletionCount(emp);
    if (filterTab === 'complete') return count === 2;
    if (filterTab === 'incomplete') return count < 2;
    return true;
  });

  const totalComplete = employees.filter((e) => getCompletionCount(e) === 2).length;
  const totalIncomplete = employees.length - totalComplete;

  // Render individual session cell
  function renderSessionStatus(
    report: { id: string; timestamp: string; locationName: string } | null,
    isOpen: boolean,
    isPassed: boolean
  ) {
    if (report) {
      return (
        <Link
          href={`/admin/reports/${report.id}`}
          style={{ textDecoration: 'none', display: 'inline-block' }}
          title="Lihat detail laporan"
        >
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '1px',
            background: 'var(--color-primary-subtle)',
            border: '1px solid #bbf7d0',
            padding: '4px 8px',
            borderRadius: 'var(--radius-xs)',
          }}>
            <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--color-primary-dark)' }}>
              {formatWibTime(report.timestamp).replace(' WIB', '')}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {report.locationName}
            </span>
          </div>
        </Link>
      );
    }

    if (isOpen) {
      return (
        <span className="status-pill open">
          <span className="status-dot" /> Sedang Dibuka
        </span>
      );
    }

    if (isPassed) {
      return (
        <span className="status-pill closed">
          <span className="status-dot" /> Terlewat
        </span>
      );
    }

    return (
      <span className="status-pill locked">
        Belum Dibuka
      </span>
    );
  }

  return (
    <div style={{ marginTop: '24px', marginBottom: '24px' }}>
      {/* Header with Title and Search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '12px',
      }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text)' }}>
            Monitoring Kehadiran Hari Ini
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
            Pantau status kepatuhan presensi seluruh petugas lapangan
          </p>
        </div>

        {/* Search box */}
        <div style={{ width: '220px' }}>
          <input
            type="text"
            className="form-input"
            style={{ padding: '6px 10px', fontSize: '12.5px' }}
            placeholder="Cari nama petugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}>
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`btn ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          Semua ({employees.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('incomplete')}
          className={`btn ${filterTab === 'incomplete' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
        >
          Belum Lengkap ({totalIncomplete})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('complete')}
          className={`btn ${filterTab === 'complete' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          Lengkap 2 Sesi ({totalComplete})
        </button>
      </div>

      {/* Monitoring Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: '180px' }}>Petugas Lapangan</th>
              <th style={{ minWidth: '150px' }}>Pagi (06.00 – 08.00)</th>
              <th style={{ minWidth: '150px' }}>Sore (16.00 – 23.59)</th>
              <th style={{ minWidth: '110px' }}>Status Hari Ini</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => {
                const count = getCompletionCount(emp);
                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: '#e2e8f0',
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '600',
                          flexShrink: 0,
                        }}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '12.5px', color: 'var(--color-text)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {renderSessionStatus(emp.morningReport, morningOpen, morningPassed)}
                    </td>
                    <td>
                      {renderSessionStatus(emp.eveningReport, eveningOpen, eveningPassed)}
                    </td>
                    <td>
                      {count === 2 ? (
                        <span className="status-pill done">
                          <span className="status-dot" /> Lengkap (2/2)
                        </span>
                      ) : count === 0 ? (
                        <span className="status-pill closed">
                          <span className="status-dot" /> Belum (0/2)
                        </span>
                      ) : (
                        <span className="status-pill locked" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                          {count} dari 2 Sesi
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center muted" style={{ padding: '28px', textAlign: 'center' }}>
                  Tidak ada data petugas yang sesuai filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
