import { getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPresenceStatus, PRESENCE_WINDOWS } from '@/lib/time';
import { getMyReportToday } from './actions';
import PresenceCard from '@/components/PresenceCard';
import Header from '@/components/Header';
import StaffTodaySummary from '@/components/StaffTodaySummary';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Beranda — Myrimasa',
};

export const dynamic = 'force-dynamic';

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

  // 3. For Employee/Staff: fetch today's status for all 3 sessions
  const serverNow = new Date();
  const [morningReport, afternoonReport, eveningReport] = await Promise.all([
    getMyReportToday('morning'),
    getMyReportToday('afternoon'),
    getMyReportToday('evening'),
  ]);

  const morningStatus = getPresenceStatus('morning', serverNow, morningReport);
  const afternoonStatus = getPresenceStatus('afternoon', serverNow, afternoonReport);
  const eveningStatus = getPresenceStatus('evening', serverNow, eveningReport);

  return (
    <div className="page">
      <div className="container">
        {/* Top Header Card */}
        <Header profile={profile} />

        {/* Staff Today Attendance Status Summary (Matrix Overview) */}
        <StaffTodaySummary
          name={profile.name}
          email={profile.email}
          morningReport={morningReport ? { id: morningReport.id, timestamp: morningReport.timestamp } : null}
          afternoonReport={afternoonReport ? { id: afternoonReport.id, timestamp: afternoonReport.timestamp } : null}
          eveningReport={eveningReport ? { id: eveningReport.id, timestamp: eveningReport.timestamp } : null}
          morningStatus={morningStatus}
          afternoonStatus={afternoonStatus}
          eveningStatus={eveningStatus}
        />

        {/* 3 Presence Action Cards: Pagi, Siang, Sore */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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

        {/* Bottom Notice Card with Panduan Link */}
        <div className="notice-card fade-in" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
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
              padding: '4px 10px',
              borderRadius: '6px',
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
