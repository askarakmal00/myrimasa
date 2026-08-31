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
          title="Klik untuk melihat detail laporan"
        >
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '2px',
            background: '#eafaf1',
            border: '1px solid #bbf7d0',
            padding: '6px 10px',
            borderRadius: '8px',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✅ {formatWibTime(report.timestamp)}
            </span>
            <span style={{ fontSize: '11px', color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
              📍 {report.locationName}
            </span>
          </div>
        </Link>
      );
    }

    if (isOpen) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 10px',
          borderRadius: '8px',
          background: '#fef3c7',
          color: '#b45309',
          fontSize: '11px',
          fontWeight: '700',
          border: '1px solid #fde68a',
        }}>
          ⏳ Sedang Dibuka (Belum)
        </span>
      );
    }

    if (isPassed) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 10px',
          borderRadius: '8px',
          background: '#fee2e2',
          color: '#991b1b',
          fontSize: '11px',
          fontWeight: '700',
          border: '1px solid #fecaca',
        }}>
          ❌ Tidak Presensi
        </span>
      );
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        borderRadius: '8px',
        background: '#f1f5f9',
        color: '#64748b',
        fontSize: '11px',
        fontWeight: '600',
      }}>
        🔒 Belum Dibuka
      </span>
    );
  }

  return (
    <div style={{ marginTop: '28px', marginBottom: '28px' }}>
        {/* Header with Title and Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥 Monitoring Presensi Karyawan & Staff Hari Ini</span>
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Pantau kehadiran dan temukan staff yang belum atau tidak melakukan presensi
            </p>
          </div>

          {/* Search box */}
          <div style={{ minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              placeholder="🔍 Cari nama staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              border: filterTab === 'all' ? '2px solid #1b4d3e' : '1px solid var(--color-border)',
              background: filterTab === 'all' ? '#eafaf1' : '#ffffff',
              color: filterTab === 'all' ? '#1b4d3e' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Semua Staff ({employees.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('incomplete')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              border: filterTab === 'incomplete' ? '2px solid #dc2626' : '1px solid var(--color-border)',
              background: filterTab === 'incomplete' ? '#fee2e2' : '#ffffff',
              color: filterTab === 'incomplete' ? '#991b1b' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⚠️ Belum Lengkap / Belum Presensi ({totalIncomplete})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('complete')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              border: filterTab === 'complete' ? '2px solid #166534' : '1px solid var(--color-border)',
              background: filterTab === 'complete' ? '#dcfce7' : '#ffffff',
              color: filterTab === 'complete' ? '#166534' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ✅ Lengkap 2 Sesi ({totalComplete})
          </button>
        </div>

        {/* Monitoring Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Karyawan / Staff</th>
                <th style={{ minWidth: '160px' }}>☀️ Pagi (06.00 - 08.00)</th>
                <th style={{ minWidth: '160px' }}>🌙 Sore (16.00 - 23.59)</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: '#1b4d3e',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '800',
                          flexShrink: 0,
                        }}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
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
                        <span className="status-pill done" style={{ fontSize: '11px', padding: '4px 10px' }}>
                          ✅ Lengkap (2/2)
                        </span>
                      ) : count === 0 ? (
                        <span className="status-pill closed" style={{ fontSize: '11px', padding: '4px 10px' }}>
                          ❌ Belum (0/2)
                        </span>
                      ) : (
                        <span className="status-pill locked" style={{ fontSize: '11px', padding: '4px 10px', background: '#fef3c7', color: '#b45309' }}>
                          ⏳ {count} / 2 Sesi
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center muted" style={{ padding: '36px' }}>
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
