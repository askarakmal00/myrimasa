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
  const canPresence = status === 'open';
  const href = isLoggedIn ? `/presensi/${session}` : `/login?redirect=/presensi/${session}`;

  // Session Icon & Styling
  const sessionConfig: Record<SessionType, { iconClass: string; icon: string }> = {
    morning: { iconClass: 'session-icon-morning', icon: '☀️' },
    afternoon: { iconClass: 'session-icon-afternoon', icon: '🌤️' },
    evening: { iconClass: 'session-icon-evening', icon: '🌅' },
  };

  const currentIcon = sessionConfig[session] || { iconClass: 'session-icon-morning', icon: '☀️' };

  // Status Badge Label & Class
  function renderStatusPill() {
    switch (status) {
      case 'open':
        return (
          <span className="status-pill open">
            <span className="status-dot" /> BELUM PRESENSI
          </span>
        );
      case 'locked':
        return (
          <span className="status-pill locked">
            🔒 BELUM DIBUKA
          </span>
        );
      case 'done':
        return (
          <span className="status-pill done">
            ✅ SUDAH PRESENSI
          </span>
        );
      case 'closed':
        return (
          <span className="status-pill closed">
            🔴 DITUTUP
          </span>
        );
    }
  }

  // Info Bar Text
  function getInfoText() {
    if (status === 'open') {
      return `Presensi tersedia sampai pukul ${win.endHour.toString().padStart(2, '0')}.${win.endMinute.toString().padStart(2, '0')}`;
    }
    if (status === 'locked') {
      return `Presensi dibuka pukul ${win.startHour.toString().padStart(2, '0')}.${win.startMinute.toString().padStart(2, '0')}`;
    }
    if (status === 'done' && report) {
      return `Presensi tercatat pada pukul ${formatWibTime(report.timestamp)}`;
    }
    return `Waktu presensi ${win.timeLabel} telah berakhir.`;
  }

  return (
    <div className="presence-card fade-in">
      <div className="presence-card-top">
        <div className="presence-card-left">
          {/* Circle Icon Badge */}
          <div className={`session-icon-box ${currentIcon.iconClass}`}>
            {currentIcon.icon}
          </div>

          <div>
            <div className="presence-title">{win.label}</div>
            <div className="presence-time-label">Waktu presensi</div>
            <div className="presence-time-highlight">{win.timeLabel}</div>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div>
          {renderStatusPill()}
        </div>
      </div>

      {/* Info Bar with Clock Icon */}
      <div className={`presence-info-bar ${status}`}>
        <span style={{ fontSize: '16px' }}>⏱️</span>
        <span>{getInfoText()}</span>
      </div>

      {/* Action Button */}
      {canPresence && (
        <div className="presence-action-bar">
          <Link
            href={href}
            id={`btn-presensi-${session}`}
            className="btn btn-primary"
          >
            📝 PRESENSI SEKARANG
          </Link>
        </div>
      )}
    </div>
  );
}
