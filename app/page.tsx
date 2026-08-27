import { getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPresenceStatus, PRESENCE_WINDOWS } from '@/lib/time';
import { getMyReportToday } from './actions';
import PresenceCard from '@/components/PresenceCard';
import Header from '@/components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Beranda — Myrimasa',
};

export const dynamic = 'force-dynamic';

function getGreeting(): string {
  const hour = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  ).getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export default async function HomePage() {
  const profile = await getProfile();

  // 1. If not logged in, go straight to login
  if (!profile) {
    redirect('/login');
  }

  // 2. If Admin, go straight to Admin Dashboard
  if (profile.role === 'admin') {
    redirect('/admin');
  }

  // 3. For Employee/Staff: fetch today's status for all 3 routine sessions
  const serverNow = new Date();
  const [morningReport, afternoonReport, eveningReport] = await Promise.all([
    getMyReportToday('morning'),
    getMyReportToday('afternoon'),
    getMyReportToday('evening'),
  ]);

  const morningStatus = getPresenceStatus('morning', serverNow, morningReport);
  const afternoonStatus = getPresenceStatus('afternoon', serverNow, afternoonReport);
  const eveningStatus = getPresenceStatus('evening', serverNow, eveningReport);

  const completedCount = [morningReport, afternoonReport, eveningReport].filter(Boolean).length;

  let summarySubLabel = 'Sesi belum diisi';
  if (completedCount === 3) summarySubLabel = 'Semua sesi rutin selesai ✓';
  else if (completedCount > 0) summarySubLabel = `${completedCount} dari 3 sesi selesai`;

  const greeting = getGreeting();
  const firstName = profile.name ? profile.name.split(' ')[0] : 'Staff';

  return (
    <div className="page">
      <div className="container">
        {/* Top Header Card */}
        <Header profile={profile} />

        {/* User Greeting & Notification Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          padding: '0 2px',
        }}>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#0f172a',
              lineHeight: 1.2,
            }}>
              {greeting},
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#e11d48',
              lineHeight: 1.2,
              marginTop: '2px',
            }}>
              {firstName}
            </div>
          </div>

          {/* Circular Notification / Guide Bell Button */}
          <Link
            href="/panduan"
            id="btn-header-notification"
            title="Panduan & Notifikasi"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
              textDecoration: 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>
        </div>

        {/* Solid Vibrant Summary Card (Matching Sample Layout in Pink/Rose Theme) */}
        <div style={{
          background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
          borderRadius: '24px',
          padding: '22px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 10px 25px -4px rgba(225, 29, 72, 0.35)',
          color: '#ffffff',
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '600',
              marginBottom: '4px',
            }}>
              Presensi hari ini
            </div>
            <div style={{
              fontSize: '38px',
              fontWeight: '800',
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '6px',
              letterSpacing: '-0.5px',
            }}>
              {completedCount} / 3
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '500',
            }}>
              {summarySubLabel}
            </div>
          </div>

          {/* Double Concentric Circle Clock Icon */}
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
        </div>

        {/* Section 1: Routine Presence */}
        <div style={{
          fontSize: '17px',
          fontWeight: '800',
          color: '#0f172a',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>📅</span> Jadwal Presensi Rutin
        </div>

        {/* 3 Routine Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '24px' }}>
          <PresenceCard
            session="morning"
            window={PRESENCE_WINDOWS.morning}
            status={morningStatus}
            report={morningReport ? { timestamp: morningReport.timestamp } : null}
            isLoggedIn={true}
          />
          <PresenceCard
            session="afternoon"
            window={PRESENCE_WINDOWS.afternoon}
            status={afternoonStatus}
            report={afternoonReport ? { timestamp: afternoonReport.timestamp } : null}
            isLoggedIn={true}
          />
          <PresenceCard
            session="evening"
            window={PRESENCE_WINDOWS.evening}
            status={eveningStatus}
            report={eveningReport ? { timestamp: eveningReport.timestamp } : null}
            isLoggedIn={true}
          />
        </div>

        {/* Section 2: Incidental Presence (Kejadian Khusus) */}
        <div style={{
          fontSize: '17px',
          fontWeight: '800',
          color: '#0f172a',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🚨</span> Presensi Insidentil
        </div>

        <div style={{ marginBottom: '24px' }}>
          <PresenceCard
            session="special"
            window={PRESENCE_WINDOWS.special}
            status="open"
            report={null}
            isLoggedIn={true}
          />
        </div>

        {/* Bottom Notice Card with Panduan Link */}
        <div className="notice-card fade-in" style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="notice-icon">ⓘ</span>
            <span>Pastikan Anda melakukan presensi sesuai jadwal yang telah ditentukan.</span>
          </div>
          <Link
            href="/panduan"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#1e5631',
              textDecoration: 'none',
              padding: '5px 12px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #bbf7d0',
              flexShrink: 0,
            }}
          >
            📖 Panduan
          </Link>
        </div>

        {/* Footer */}
        <div className="footer-text">
          © 2026 MyRimasa (rimasa.my.id). Semua hak dilindungi.
        </div>
      </div>
    </div>
  );
}
