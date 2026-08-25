import { getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPresenceStatus, PRESENCE_WINDOWS } from '@/lib/time';
import { getMyReportToday } from '@/app/actions';
import { SessionType } from '@/lib/types';
import PresenceForm from '@/components/PresenceForm';
import Header from '@/components/Header';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const sessionTitles: Record<string, string> = {
  morning: 'Pagi',
  afternoon: 'Siang',
  evening: 'Sore',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ session: string }>;
}): Promise<Metadata> {
  const { session } = await params;
  const label = sessionTitles[session] || session;
  return { title: `Presensi ${label} — KHDTK Litbanghut` };
}

export default async function PresensiPage({
  params,
}: {
  params: Promise<{ session: string }>;
}) {
  const { session: sessionParam } = await params;

  // Validate session param
  if (sessionParam !== 'morning' && sessionParam !== 'afternoon' && sessionParam !== 'evening') {
    redirect('/');
  }
  const session = sessionParam as SessionType;

  // Auth guard
  const profile = await getProfile();
  if (!profile) {
    redirect(`/login?redirect=/presensi/${session}`);
  }

  // Check if window is open or already submitted
  const serverNow = new Date();
  const todayReport = await getMyReportToday(session);
  const status = getPresenceStatus(session, serverNow, todayReport);
  const win = PRESENCE_WINDOWS[session];

  // If already submitted, redirect to home
  if (status === 'done') {
    redirect('/');
  }

  // If window closed or not yet open, show blocked page
  if (status !== 'open') {
    return (
      <div className="page">
        <div className="container">
          <Header profile={profile} />
          <div className="card text-center" style={{ padding: '40px 20px', marginTop: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {status === 'locked' ? '🔒' : '🔴'}
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: status === 'locked' ? 'var(--color-locked)' : 'var(--color-closed)', marginBottom: '8px' }}>
              {status === 'locked' ? 'Presensi Belum Dibuka' : 'Presensi Ditutup'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
              {status === 'locked'
                ? `Presensi ${win.label} dibuka pukul ${win.startHour.toString().padStart(2,'0')}.${win.startMinute.toString().padStart(2,'0')} waktu setempat.`
                : `Waktu presensi ${win.timeLabel} telah berakhir.`
              }
            </p>
            <Link href="/" id="btn-back-home-blocked" className="btn btn-primary">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Header profile={profile} />
        <PresenceForm session={session} profile={profile} />
      </div>
    </div>
  );
}
