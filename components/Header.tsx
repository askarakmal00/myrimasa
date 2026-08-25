'use client';

import Link from 'next/link';
import { Profile } from '@/lib/types';
import { signOut } from '@/app/actions';
import { useState } from 'react';

interface HeaderProps {
  profile: Profile | null;
}

export default function Header({ profile }: HeaderProps) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <header className="app-header-card fade-in">
      <Link href="/" className="app-brand" style={{ textDecoration: 'none' }}>
        <div className="app-logo-box">
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <div className="app-brand-title">KHDTK Litbanghut</div>
          <div className="app-brand-subtitle">Laporan Harian & Presensi Petugas Pengamanan KHDTK</div>
        </div>
      </Link>

      {profile && (
        <div className="app-user-area">
          <div className="app-user-badge">
            <div className="app-user-avatar">
              👤
            </div>
            <div>
              <div className="app-user-name">{profile.name}</div>
              <div className="app-user-role">
                {profile.role === 'admin' ? 'Administrator' : 'Petugas Pengamanan'}
              </div>
            </div>
          </div>

          <button
            id="btn-sign-out"
            className="btn-logout"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Keluar"
            aria-label="Keluar dari akun"
          >
            {signingOut ? <span className="spinner" style={{ width: '12px', height: '12px', borderColor: '#64748b' }} /> : '↪'}
            <span>Keluar</span>
          </button>
        </div>
      )}
    </header>
  );
}
