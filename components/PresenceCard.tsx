'use client';

import Link from 'next/link';
import { PresenceWindow, PresenceCardStatus, SessionType } from '@/lib/types';
import { formatWibTime } from '@/lib/time';

interface PresenceCardProps {
  session: SessionType;
  window: PresenceWindow;
  status: PresenceCardStatus;
  report: { timestamp: string } | null;
  isLoggedIn: boolean;
}

export default function PresenceCard({
  session,
  window: win,
  status,
  report,
  isLoggedIn,
}: PresenceCardProps) {
  const href = isLoggedIn ? `/presensi/${session}` : `/login?redirect=/presensi/${session}`;

  const sessionLabels: Record<SessionType, string> = {
    morning: 'Sesi Pagi',
    evening: 'Sesi Sore',
    special: 'Kejadian Khusus (Insidentil)',
  };

  const title = sessionLabels[session] || win?.label || session;

  function getTimeDescription() {
    if (session === 'special') {
      return 'Dapat dilaporkan sewaktu-waktu selama 24 jam';
    }
    if (status === 'done' && report) {
      return `Terkirim pada pukul ${formatWibTime(report.timestamp).replace(' WIB', '')} WIB`;
    }
    return win?.timeLabel ? `Jadwal: ${win.timeLabel}` : '';
  }

  function renderStatusOrAction() {
    if (session === 'special') {
      return (
        <Link
          href={href}
          id={`btn-presensi-${session}`}
          className="btn btn-secondary btn-sm"
        >
          Buat Laporan
        </Link>
      );
    }

    switch (status) {
      case 'open':
        return (
          <Link
            href={href}
            id={`btn-presensi-${session}`}
            className="btn btn-primary btn-sm"
          >
            Isi Presensi
          </Link>
        );
      case 'locked':
        return (
          <span className="status-pill locked">
            Dibuka {win.startHour.toString().padStart(2, '0')}.{win.startMinute.toString().padStart(2, '0')} WIB
          </span>
        );
      case 'done':
        return (
          <span className="status-pill done">
            <span className="status-dot" /> Selesai
          </span>
        );
      case 'closed':
        return (
          <span className="status-pill closed">
            <span className="status-dot" /> Terlewat
          </span>
        );
    }
  }

  const dotClass = status === 'open' ? 'open' : status === 'done' ? 'done' : status === 'closed' ? 'closed' : 'locked';

  return (
    <div
      className={`presence-card ${status === 'open' ? 'is-open' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div className={`session-indicator-dot ${dotClass}`} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
            {title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {getTimeDescription()}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {renderStatusOrAction()}
      </div>
    </div>
  );
}
