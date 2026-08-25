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
      <Link href="/" className="app-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="app-logo-box" style={{ width: '46px', height: '46px', padding: '4px', borderRadius: '12px', border: 'none', boxShadow: 'none' }}>
          <img
            src="/logo.png"
            alt="Logo PT Rimasa Inovasi Bersama"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
            PT. RIMASA
          </span>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
            INOVASI BERSAMA
          </span>
        </div>
      </Link>

      {profile && (
        <div className="app-user-area" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="app-user-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '700',
              flexShrink: 0,
            }}>
              👤
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                {profile.name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {profile.role === 'admin' ? 'Administrator' : 'Staff / Employee'}
              </div>
            </div>
          </div>

          <button
            id="btn-sign-out"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Keluar"
            aria-label="Keluar dari akun"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1.5px solid #0f172a',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {signingOut ? <span className="spinner" style={{ width: '12px', height: '12px', borderColor: '#64748b' }} /> : <span>↪</span>}
            <span>Keluar</span>
          </button>
        </div>
      )}
    </header>
  );
}
