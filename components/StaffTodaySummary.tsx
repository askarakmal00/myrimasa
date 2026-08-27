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

  function renderSessionPill(
    report: ReportInfo | null,
    status: 'open' | 'locked' | 'closed' | 'done'
  ) {
    if (report) {
      return (
        <div style={{
          width: '100%',
          padding: '5px 2px',
          borderRadius: '6px',
          background: '#dcfce7',
          color: '#166534',
          textAlign: 'center',
          border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '800' }}>✅ Hadir</div>
          <div style={{ fontSize: '9px', fontWeight: '600', opacity: 0.95 }}>{formatWibTime(report.timestamp)}</div>
        </div>
      );
    }

    if (status === 'open') {
      return (
        <div style={{
          width: '100%',
          padding: '5px 2px',
          borderRadius: '6px',
          background: '#fef3c7',
          color: '#b45309',
          textAlign: 'center',
          border: '1px solid #fde68a',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '800' }}>⌛ Dibuka</div>
          <div style={{ fontSize: '9px', fontWeight: '600' }}>(Belum Isi)</div>
        </div>
      );
    }

    if (status === 'closed') {
      return (
        <div style={{
          width: '100%',
          padding: '5px 2px',
          borderRadius: '6px',
          background: '#fee2e2',
          color: '#991b1b',
          textAlign: 'center',
          border: '1px solid #fecaca',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '800' }}>✕ Lewat</div>
          <div style={{ fontSize: '9px', fontWeight: '600' }}>Tidak Presensi</div>
        </div>
      );
    }

    return (
      <div style={{
        width: '100%',
        padding: '5px 2px',
        borderRadius: '6px',
        background: '#f1f5f9',
        color: '#64748b',
        textAlign: 'center',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ fontSize: '10px', fontWeight: '700' }}>🔒 Terkunci</div>
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
      padding: '16px 14px',
      marginBottom: '16px',
    }}>
      {/* Card Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
          }}>
            📋
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Status Presensi Saya Hari Ini
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              Ringkasan kehadiran seluruh sesi harian Anda
            </p>
          </div>
        </div>

        {/* Total Status Pill Badge */}
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
              ✕ BELUM PRESENSI (0/3)
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
              ⏳ {completedCount} / 3 SESI SELESAI
            </span>
          )}
        </div>
      </div>

      {/* 3 Mini Session Cards (Always Strictly 1 Row, 3 Columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
      }}>
        {/* Sesi 1: PAGI */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '10px 4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '4px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#fef9c3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}>
            ☀️
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>PAGI</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>06.00 - 08.00</div>
          </div>
          <div style={{ width: '100%', marginTop: '2px' }}>
            {renderSessionPill(morningReport, morningStatus)}
          </div>
        </div>

        {/* Sesi 2: SIANG */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '10px 4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '4px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}>
            🌤️
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>SIANG</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>13.00 - 14.00</div>
          </div>
          <div style={{ width: '100%', marginTop: '2px' }}>
            {renderSessionPill(afternoonReport, afternoonStatus)}
          </div>
        </div>

        {/* Sesi 3: SORE */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '10px 4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '4px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#e0e7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}>
            🌙
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>SORE</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>16.00 - 23.59</div>
          </div>
          <div style={{ width: '100%', marginTop: '2px' }}>
            {renderSessionPill(eveningReport, eveningStatus)}
          </div>
        </div>
      </div>
    </div>
  );
}
