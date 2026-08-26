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
              <span style={{ fontSize: '15px' }}>📖</span>
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
              <span style={{ fontSize: '15px' }}>🔑</span>
              <span className="header-text-label">Password</span>
            </button>

            {/* User Profile Badge (Clickable to change password) */}
            <div
              className="main-header-user-badge"
              onClick={() => setShowPasswordModal(true)}
              title={`Klik untuk ganti password (${profile.name})`}
              style={{ cursor: 'pointer' }}
            >
              <div className="main-header-avatar">
                {profile.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="main-header-user-info">
                <div className="main-header-user-name">
                  {profile.name}
                </div>
                <div className="main-header-user-role">
                  {profile.role === 'admin' ? 'Admin' : 'Staff'}
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
                <span className="spinner" style={{ width: '12px', height: '12px', borderColor: '#cbd5e1', borderTopColor: '#64748b' }} />
              ) : (
                <span style={{ fontSize: '13px' }}>↪</span>
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
