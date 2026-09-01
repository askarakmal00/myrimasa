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

  // 3. For Employee/Staff: fetch today's status for routine sessions (Pagi & Sore)
  const serverNow = new Date();
  const [morningReport, eveningReport] = await Promise.all([
    getMyReportToday('morning'),
    getMyReportToday('evening'),
  ]);

  const morningStatus = getPresenceStatus('morning', serverNow, morningReport);
  const eveningStatus = getPresenceStatus('evening', serverNow, eveningReport);

  const completedCount = [morningReport, eveningReport].filter(Boolean).length;

  let summarySubLabel = 'Sesi belum diisi';
  if (completedCount === 2) summarySubLabel = 'Semua sesi rutin selesai ✓';
  else if (completedCount > 0) summarySubLabel = `${completedCount} dari 2 sesi selesai`;

  const greeting = getGreeting();
  const firstName = profile.name ? profile.name.split(' ')[0] : 'Staff';

  return (
    <div className="page">
      <div className="container">
        {/* Top Header */}
        <Header profile={profile} />

        {/* Page Header / Welcome */}
        <div style={{
          marginBottom: '20px',
        }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            fontWeight: '500',
          }}>
            {greeting}
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--color-text)',
            letterSpacing: '-0.3px',
            marginTop: '2px',
          }}>
            {profile.name}
          </div>
          {profile.location_name && (
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              marginTop: '2px',
            }}>
              Penugasan: {profile.location_name}
            </div>
          )}
        </div>

        {/* Daily Progress Status Bar (Editorial & Clean) */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
            }}>
              Presensi Hari Ini
            </div>
            <div style={{
              fontSize: '13px',
              color: completedCount === 2 ? '#15803d' : 'var(--color-text)',
              fontWeight: '500',
              marginTop: '2px',
            }}>
              {summarySubLabel}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: completedCount === 2 ? '#15803d' : 'var(--color-text)',
            }}>
              {completedCount} / 2
            </div>
          </div>
        </div>

        {/* Section 1: Routine Presence */}
        <div style={{
          marginBottom: '20px',
        }}>
          <div style={{
            fontSize: '13.5px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '10px',
            letterSpacing: '-0.1px',
          }}>
            Jadwal Presensi Rutin
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <PresenceCard
              session="morning"
              window={PRESENCE_WINDOWS.morning}
              status={morningStatus}
              report={morningReport ? { timestamp: morningReport.timestamp } : null}
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
        </div>

        {/* Section 2: Incidental Presence */}
        <div style={{
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '13.5px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '10px',
            letterSpacing: '-0.1px',
          }}>
            Laporan Insidentil
          </div>

          <PresenceCard
            session="special"
            window={PRESENCE_WINDOWS.special}
            status="open"
            report={null}
            isLoggedIn={true}
          />
        </div>

        {/* Footer info note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border-subtle)',
          fontSize: '12.5px',
          color: 'var(--color-text-secondary)',
          marginTop: '16px',
          gap: '10px',
          flexWrap: 'wrap',
        }}>
          <div>
            Pastikan presensi dilakukan tepat waktu sesuai jadwal operasional.
          </div>
          <Link
            href="/panduan"
            className="btn btn-secondary btn-sm"
          >
            Panduan Lengkap
          </Link>
        </div>

        {/* Footer */}
        <div className="footer-text">
          MyRimasa — Sistem Presensi & Dokumentasi Lapangan
        </div>
      </div>
    </div>
  );
}
