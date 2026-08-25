'use client';

import { formatWibTime } from '@/lib/time';

interface ReportInfo {
  id: string;
  timestamp: string;
  locationName?: string;
}

interface StaffTodaySummaryProps {
  name: string;
  email: string;
  morningReport: ReportInfo | null;
  afternoonReport: ReportInfo | null;
  eveningReport: ReportInfo | null;
  morningStatus: 'open' | 'locked' | 'closed' | 'done';
  afternoonStatus: 'open' | 'locked' | 'closed' | 'done';
  eveningStatus: 'open' | 'locked' | 'closed' | 'done';
}

export default function StaffTodaySummary({
  name,
  email,
  morningReport,
  afternoonReport,
  eveningReport,
  morningStatus,
  afternoonStatus,
  eveningStatus,
}: StaffTodaySummaryProps) {
  let completedCount = 0;
  if (morningReport) completedCount++;
  if (afternoonReport) completedCount++;
  if (eveningReport) completedCount++;

  // Desktop Pill
  function renderDesktopPill(
    report: ReportInfo | null,
    status: 'open' | 'locked' | 'closed' | 'done'
  ) {
    if (report) {
      return (
        <span style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: '#dcfce7',
          color: '#166534',
          fontSize: '11px',
          fontWeight: '700',
          border: '1px solid #bbf7d0',
          whiteSpace: 'nowrap',
        }}>
          <span>✅ Sudah ({formatWibTime(report.timestamp)})</span>
          {report.locationName && (
            <span style={{ fontSize: '10px', color: '#15803d', fontWeight: '500' }}>
              📍 {report.locationName}
            </span>
          )}
        </span>
      );
    }

    if (status === 'open') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: '#fef3c7',
          color: '#b45309',
          fontSize: '11px',
          fontWeight: '700',
          border: '1px solid #fde68a',
          whiteSpace: 'nowrap',
        }}>
          ⏳ Sedang Dibuka (Belum)
        </span>
      );
    }

    if (status === 'closed') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: '#fee2e2',
          color: '#991b1b',
          fontSize: '11px',
          fontWeight: '700',
          border: '1px solid #fecaca',
          whiteSpace: 'nowrap',
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
        padding: '6px 12px',
        borderRadius: '8px',
        background: '#f1f5f9',
        color: '#64748b',
        fontSize: '11px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
      }}>
        🔒 Belum Dibuka
      </span>
    );
  }

  // Mobile Pill (Compact, fits all phone screens perfectly)
  function renderMobilePill(
    report: ReportInfo | null,
    status: 'open' | 'locked' | 'closed' | 'done'
  ) {
    if (report) {
      return (
        <div style={{
          width: '100%',
          padding: '6px 4px',
          borderRadius: '6px',
          background: '#dcfce7',
          color: '#166534',
          fontSize: '10px',
          fontWeight: '800',
          border: '1px solid #bbf7d0',
          textAlign: 'center',
        }}>
          <div>✅ Sudah</div>
          <div style={{ fontSize: '9px', fontWeight: '600', opacity: 0.9 }}>{formatWibTime(report.timestamp)}</div>
        </div>
      );
    }

    if (status === 'open') {
      return (
        <div style={{
          width: '100%',
          padding: '6px 4px',
          borderRadius: '6px',
          background: '#fef3c7',
          color: '#b45309',
          fontSize: '10px',
          fontWeight: '800',
          border: '1px solid #fde68a',
          textAlign: 'center',
        }}>
          <div>⏳ Dibuka</div>
          <div style={{ fontSize: '9px', fontWeight: '600' }}>(Belum Isi)</div>
        </div>
      );
    }

    if (status === 'closed') {
      return (
        <div style={{
          width: '100%',
          padding: '6px 4px',
          borderRadius: '6px',
          background: '#fee2e2',
          color: '#991b1b',
          fontSize: '10px',
          fontWeight: '800',
          border: '1px solid #fecaca',
          textAlign: 'center',
        }}>
          <div>❌ Lewat</div>
          <div style={{ fontSize: '9px', fontWeight: '600' }}>Tidak Presensi</div>
        </div>
      );
    }

    return (
      <div style={{
        width: '100%',
        padding: '6px 4px',
        borderRadius: '6px',
        background: '#f1f5f9',
        color: '#64748b',
        fontSize: '10px',
        fontWeight: '700',
        border: '1px solid var(--color-border)',
        textAlign: 'center',
      }}>
        <div>🔒 Terkunci</div>
        <div style={{ fontSize: '9px' }}>Belum Buka</div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      {/* Card Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        background: '#fafafa',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Status Presensi Saya Hari Ini
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Ringkasan kehadiran seluruh sesi harian Anda
            </p>
          </div>
        </div>

        {/* Total Status Badge */}
        <div>
          {completedCount === 3 ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '100px',
              background: '#dcfce7',
              color: '#166534',
              fontSize: '11px',
              fontWeight: '800',
              border: '1px solid #bbf7d0',
            }}>
              ✅ LENGKAP (3/3)
            </span>
          ) : completedCount === 0 ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '100px',
              background: '#fee2e2',
              color: '#991b1b',
              fontSize: '11px',
              fontWeight: '800',
              border: '1px solid #fecaca',
            }}>
              ❌ BELUM PRESENSI (0/3)
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '100px',
              background: '#fef3c7',
              color: '#b45309',
              fontSize: '11px',
              fontWeight: '800',
              border: '1px solid #fde68a',
            }}>
              ⏳ {completedCount} / 3 SESI
            </span>
          )}
        </div>
      </div>

      {/* 1. Mobile View (< 768px): 3-Column Responsive Grid (No horizontal scrolling!) */}
      <div className="staff-summary-mobile">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '12px',
        }}>
          {/* Pagi */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '10px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#d97706' }}>☀️ PAGI</span>
            <span style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>06.00-08.00</span>
            {renderMobilePill(morningReport, morningStatus)}
          </div>

          {/* Siang */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '10px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309' }}>🌤️ SIANG</span>
            <span style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>13.00-14.00</span>
            {renderMobilePill(afternoonReport, afternoonStatus)}
          </div>

          {/* Sore */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '10px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#4338ca' }}>🌙 SORE</span>
            <span style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>16.00-23.59</span>
            {renderMobilePill(eveningReport, eveningStatus)}
          </div>
        </div>
      </div>

      {/* 2. Desktop View (>= 768px): Full Table View */}
      <div className="staff-summary-desktop">
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          textAlign: 'left',
        }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Karyawan / Staff
              </th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>
                ☀️ Pagi (06.00 - 08.00)
              </th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>
                🌤️ Siang (13.00 - 14.00)
              </th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>
                🌙 Sore (16.00 - 23.59)
              </th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>
                Status Hari Ini
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Profile */}
              <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#1e5631',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '800',
                    flexShrink: 0,
                  }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {email}
                    </div>
                  </div>
                </div>
              </td>

              {/* Pagi */}
              <td style={{ padding: '16px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                {renderDesktopPill(morningReport, morningStatus)}
              </td>

              {/* Siang */}
              <td style={{ padding: '16px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                {renderDesktopPill(afternoonReport, afternoonStatus)}
              </td>

              {/* Sore */}
              <td style={{ padding: '16px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                {renderDesktopPill(eveningReport, eveningStatus)}
              </td>

              {/* Total */}
              <td style={{ padding: '16px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                {completedCount === 3 ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#dcfce7',
                    color: '#166534',
                    fontSize: '11px',
                    fontWeight: '800',
                    border: '1px solid #bbf7d0',
                  }}>
                    ✅ LENGKAP (3/3)
                  </span>
                ) : completedCount === 0 ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    fontSize: '11px',
                    fontWeight: '800',
                    border: '1px solid #fecaca',
                  }}>
                    ❌ BELUM (0/3)
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#fef3c7',
                    color: '#b45309',
                    fontSize: '11px',
                    fontWeight: '800',
                    border: '1px solid #fde68a',
                  }}>
                    ⏳ {completedCount}/3 Sesi
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
