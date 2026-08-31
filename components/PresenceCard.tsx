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

  // Session icon & pastel background config
  const sessionConfig: Record<SessionType, {
    label: string;
    icon: string;
    iconBg: string;
    iconBorder: string;
  }> = {
    morning:   { label: 'Pagi',            icon: '☀️', iconBg: '#fef9c3', iconBorder: '#fef08a' },
    evening:   { label: 'Sore',            icon: '🌙', iconBg: '#ede9fe', iconBorder: '#ddd6fe' },
    special:   { label: 'Kejadian Khusus', icon: '⚠️', iconBg: '#ffe4e6', iconBorder: '#fecdd3' },
  };

  const cfg = sessionConfig[session] || {
    label: win?.label || session,
    icon: '📝',
    iconBg: '#f1f5f9',
    iconBorder: '#e2e8f0',
  };

  // Border highlight by status
  const cardBorder: Record<PresenceCardStatus, string> = {
    open:   session === 'special' ? '#fecdd3' : '#bbf7d0',
    locked: '#e2e8f0',
    done:   '#bbf7d0',
    closed: '#fecaca',
  };

  // Status group header label
  function renderGroupLabel() {
    if (session === 'special') {
      return (
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#be185d',
          marginBottom: '5px',
          paddingLeft: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}>
          🚨 Insidentil • Setiap Saat
        </div>
      );
    }

    const labels: Record<PresenceCardStatus, { text: string; color: string }> = {
      open:   { text: 'Presensi dibuka',  color: '#166534' },
      locked: { text: 'Belum dibuka',     color: '#64748b' },
      done:   { text: 'Sudah presensi',   color: '#166534' },
      closed: { text: 'Terlewat',         color: '#dc2626' },
    };

    const l = labels[status];
    return (
      <div style={{
        fontSize: '11px',
        fontWeight: '700',
        color: l.color,
        marginBottom: '5px',
        paddingLeft: '2px',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
      }}>
        {l.text}
      </div>
    );
  }

  // Right-side action badge / button
  function renderAction() {
    if (session === 'special') {
      return (
        <Link
          href={href}
          id={`btn-presensi-${session}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '9px 18px',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '700',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)',
          }}
        >
          Lapor
        </Link>
      );
    }

    switch (status) {
      case 'open':
        return (
          <Link
            href={href}
            id={`btn-presensi-${session}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px 20px',
              borderRadius: '100px',
              background: '#166534',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(22, 101, 52, 0.2)',
            }}
          >
            Presensi
          </Link>
        );
      case 'locked':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 14px',
            borderRadius: '100px',
            color: '#64748b',
            fontSize: '13px',
            fontWeight: '600',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            🔒 {win.startHour.toString().padStart(2,'0')}.{win.startMinute.toString().padStart(2,'0')}
          </span>
        );
      case 'done':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 16px',
            borderRadius: '100px',
            background: '#dcfce7',
            color: '#166534',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid #bbf7d0',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            ✓ Hadir
          </span>
        );
      case 'closed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 16px',
            borderRadius: '100px',
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid #fecaca',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            ✕ Terlewat
          </span>
        );
    }
  }

  // Subtitle info
  function getSubLabel() {
    if (session === 'special') {
      return 'Bisa diinput kapan saja (24 Jam)';
    }
    if (status === 'done' && report) {
      return `Presensi ${formatWibTime(report.timestamp).replace(' WIB', '')}`;
    }
    return win?.timeLabel || '';
  }

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* Group label */}
      {renderGroupLabel()}

      {/* Horizontal Card */}
      <div
        className="fade-in"
        style={{
          background: '#ffffff',
          border: `1px solid ${cardBorder[status]}`,
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Icon box */}
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          background: cfg.iconBg,
          border: `1px solid ${cfg.iconBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0,
        }}>
          {cfg.icon}
        </div>

        {/* Text info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '800',
            color: '#0f172a',
            lineHeight: 1.2,
          }}>
            {cfg.label}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            marginTop: '3px',
          }}>
            {getSubLabel()}
          </div>
        </div>

        {/* Right action */}
        {renderAction()}
      </div>
    </div>
  );
}
