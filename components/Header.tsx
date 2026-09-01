'use client';

import Link from 'next/link';
import { Profile } from '@/lib/types';
import { signOut } from '@/app/actions';
import { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';

interface HeaderProps {
  profile: Profile | null;
}

export default function Header({ profile }: HeaderProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <>
      <header className="main-header">
        {/* Brand / Logo */}
        <Link href="/" className="main-header-brand">
          <img
            src="/logo.png"
            alt="Myrimasa"
            className="main-header-logo-img"
          />
        </Link>

        {/* Right side: Actions & User & Sign out */}
        {profile ? (
          <div className="main-header-right">
            {/* Guide Quick Link */}
            <Link
              href="/panduan"
              className="main-header-action-btn"
              title="Panduan Penggunaan"
              aria-label="Buka panduan penggunaan"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="header-text-label">Panduan</span>
            </Link>

            {/* Change Password Quick Button */}
            <button
              type="button"
              id="btn-change-password-header"
              onClick={() => setShowPasswordModal(true)}
              className="main-header-action-btn"
              title="Ganti Password Akun"
              aria-label="Ganti password akun"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="header-text-label">Sandi</span>
            </button>

            {/* User Profile Badge */}
            <div
              className="main-header-user-badge"
              onClick={() => setShowPasswordModal(true)}
              title={`Ganti kata sandi akun (${profile.name})`}
              style={{ cursor: 'pointer' }}
            >
              <div className="main-header-avatar">
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="main-header-user-info">
                <div className="main-header-user-name">
                  {profile.name}
                </div>
                <div className="main-header-user-role">
                  {profile.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="btn-sign-out"
              onClick={handleSignOut}
              disabled={signingOut}
              title="Keluar dari akun"
              aria-label="Keluar dari akun"
              className="main-header-logout-btn"
            >
              {signingOut ? (
                <span className="spinner" style={{ width: '11px', height: '11px', borderColor: '#cbd5e1', borderTopColor: '#64748b' }} />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
              <span className="header-logout-text">Keluar</span>
            </button>
          </div>
        ) : (
          <div className="main-header-right">
            <Link href="/login" className="btn btn-primary btn-sm">
              Masuk
            </Link>
          </div>
        )}
      </header>

      {/* Change Password Modal */}
      {profile && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userEmail={profile.email}
          userName={profile.name}
        />
      )}
    </>
  );
}
