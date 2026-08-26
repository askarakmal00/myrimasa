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
    <header style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 12px rgba(26, 39, 68, 0.06)',
      marginBottom: '20px',
      gap: '12px',
    }}>

      {/* Brand — logo displayed large enough to be readable */}
      <Link
        href="/"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src="/logo.png"
          alt="Myrimasa"
          style={{
            width: '140px',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </Link>

      {/* Right: User + Logout */}
      {profile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          {/* Avatar with initial */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f9a8c9 0%, #c7d2fe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '800',
            color: '#1a2744',
            flexShrink: 0,
            border: '2px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}>
            {profile.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          {/* Name + Role (hidden on tiny screens) */}
          <div className="header-user-info">
            <div style={{
              fontWeight: '800',
              fontSize: '13px',
              color: '#1a2744',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}>
              {profile.name}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#f472b6',
              fontWeight: '600',
            }}>
              {profile.role === 'admin' ? 'Administrator' : 'Staff'}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '28px',
            background: '#e2e8f0',
            flexShrink: 0,
          }} />

          {/* Logout */}
          <button
            id="btn-sign-out"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Keluar"
            aria-label="Keluar dari akun"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 14px',
              borderRadius: '9px',
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.18s',
              whiteSpace: 'nowrap',
            }}
          >
            {signingOut
              ? <span className="spinner" style={{ width: '12px', height: '12px', borderColor: '#cbd5e1', borderTopColor: '#64748b' }} />
              : <span>↪</span>
            }
            <span>Keluar</span>
          </button>
        </div>
      )}
    </header>
  );
}
