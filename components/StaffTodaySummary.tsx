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
          padding: '6px 12px',
          borderRadius: '8px',
          background: '#dcfce7',
          color: '#166534',
          textAlign: 'center',
          border: '1px solid #bbf7d0',
          minWidth: '80px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800' }}>✅ Hadir</div>
          <div style={{ fontSize: '10px', fontWeight: '600', opacity: 0.9 }}>{formatWibTime(report.timestamp)}</div>
        </div>
      );
    }

    if (status === 'open') {
      return (
        <div style={{
          padding: '6px 12px',
          borderRadius: '8px',
          background: '#fef3c7',
          color: '#b45309',
          textAlign: 'center',
          border: '1px solid #fde68a',
          minWidth: '80px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800' }}>⌛ Dibuka</div>
          <div style={{ fontSize: '10px', fontWeight: '600' }}>(Belum Isi)</div>
        </div>
      );
    }

    if (status === 'closed') {
      return (
        <div style={{
          padding: '6px 12px',
          borderRadius: '8px',
          background: '#fee2e2',
          color: '#991b1b',
          textAlign: 'center',
          border: '1px solid #fecaca',
          minWidth: '80px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800' }}>✕ Lewat</div>
          <div style={{ fontSize: '10px', fontWeight: '600' }}>Tidak Presensi</div>
        </div>
      );
    }

    return (
      <div style={{
        padding: '6px 12px',
        borderRadius: '8px',
        background: '#f1f5f9',
        color: '#64748b',
        textAlign: 'center',
        border: '1px solid var(--color-border)',
        minWidth: '80px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: '700' }}>🔒 Terkunci</div>
        <div style={{ fontSize: '10px' }}>Belum Dibuka</div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-card)',
      padding: '24px 20px',
      marginBottom: '16px',
    }}>
      {/* Card Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}>
            📋
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Status Presensi Saya Hari Ini
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
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
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: '#dcfce7',
              color: '#166534',
              fontSize: '12px',
              fontWeight: '800',
              border: '1px solid #bbf7d0',
            }}>
              ✅ LENGKAP (3/3)
            </span>
          ) : completedCount === 0 ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: '#fee2e2',
              color: '#991b1b',
              fontSize: '12px',
              fontWeight: '800',
              border: '1px solid #fecaca',
            }}>
              ✕ BELUM PRESENSI (0/3)
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: '#fef3c7',
              color: '#b45309',
              fontSize: '12px',
              fontWeight: '800',
              border: '1px solid #fde68a',
            }}>
              ⏳ {completedCount} / 3 SESI SELESAI
            </span>
          )}
        </div>
      </div>

      {/* 3 Mini Session Cards (Side-by-Side Grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}>
        {/* Sesi 1: PAGI */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#fef9c3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}>
              ☀️
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>PAGI</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>06.00 - 08.00</div>
            </div>
          </div>
          <div>
            {renderSessionPill(morningReport, morningStatus)}
          </div>
        </div>

        {/* Sesi 2: SIANG */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}>
              🌤️
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>SIANG</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>13.00 - 14.00</div>
            </div>
          </div>
          <div>
            {renderSessionPill(afternoonReport, afternoonStatus)}
          </div>
        </div>

        {/* Sesi 3: SORE */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}>
              🌙
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>SORE</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>16.00 - 23.59</div>
            </div>
          </div>
          <div>
            {renderSessionPill(eveningReport, eveningStatus)}
          </div>
        </div>
      </div>
    </div>
  );
}
