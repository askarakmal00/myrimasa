import { getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PresenceForm from '@/components/PresenceForm';
import Header from '@/components/Header';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Uji Coba Kamera Langsung — Myrimasa',
};

export default async function TestKameraPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect('/login?redirect=/test-kamera');
  }

  return (
    <div className="page">
      <div className="container">
        <Header profile={profile} />

        <div style={{
          background: '#fef3c7',
          border: '1.5px solid #fde68a',
          borderRadius: '16px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '24px' }}>🧪</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#92400e' }}>
              Halaman Khusus Uji Coba Kamera Langsung
            </div>
            <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
              Halaman ini memaksa input kamera real-time (galeri dinonaktifkan) untuk testing di HP.
            </div>
          </div>
        </div>

        {/* Presence form with cameraOnly=true */}
        <PresenceForm session="special" profile={profile} cameraOnly={true} />
      </div>
    </div>
  );
}
