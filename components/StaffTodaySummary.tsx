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
  eveningReport: ReportInfo | null;
  morningStatus: 'open' | 'locked' | 'closed' | 'done';
  eveningStatus: 'open' | 'locked' | 'closed' | 'done';
}

export default function StaffTodaySummary({
  name,
  email,
  morningReport,
  eveningReport,
  morningStatus,
  eveningStatus,
}: StaffTodaySummaryProps) {
  let completedCount = 0;
  if (morningReport) completedCount++;
  if (eveningReport) completedCount++;

  function renderSessionBadge(
    report: ReportInfo | null,
    status: 'open' | 'locked' | 'closed' | 'done'
  ) {
    if (report) {
      return (
        <span className="status-pill done">
          <span className="status-dot" /> Hadir ({formatWibTime(report.timestamp).replace(' WIB', '')})
        </span>
      );
    }

    if (status === 'open') {
      return (
        <span className="status-pill open">
          <span className="status-dot" /> Sedang Dibuka
        </span>
      );
    }

    if (status === 'closed') {
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
    <div className="card" style={{ padding: '16px 18px', marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text)' }}>
            Status Kehadiran Hari Ini
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
            {name} • {email}
          </div>
        </div>

        <div style={{ fontSize: '12px', fontWeight: '600', color: completedCount === 2 ? '#15803d' : 'var(--color-text-secondary)' }}>
          {completedCount} dari 2 Sesi Selesai
        </div>
      </div>

      {/* 2 Sesi Columns: Pagi & Sore */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {/* Sesi 1: PAGI */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text)' }}>Sesi Pagi</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>06.00 - 08.00</span>
          </div>
          <div>
            {renderSessionBadge(morningReport, morningStatus)}
          </div>
        </div>

        {/* Sesi 2: SORE */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text)' }}>Sesi Sore</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>16.00 - 23.59</span>
          </div>
          <div>
            {renderSessionBadge(eveningReport, eveningStatus)}
          </div>
        </div>
      </div>
    </div>
  );
}
