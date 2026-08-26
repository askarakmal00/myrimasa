'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Profile } from '@/lib/types';
import { signOut } from '@/app/actions';
import { useState } from 'react';

interface AdminSidebarProps {
  profile: Profile;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/reports', label: 'Laporan', icon: '📋', exact: false },
  { href: '/admin/employees', label: 'Karyawan', icon: '👥', exact: false },
  { href: '/admin/accounts', label: 'Lembar Akun', icon: '🎫', exact: false },
  { href: '/admin/locations', label: 'Lokasi', icon: '📍', exact: false },
  { href: '/panduan', label: 'Buku Panduan', icon: '📖', exact: false },
];

export default function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile Top Navbar (Visible only on mobile) */}
      <div className="admin-mobile-navbar">
        <Link href="/admin" className="admin-mobile-brand">
          <div className="admin-mobile-logo-box">
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span>MyRimasa Admin</span>
        </Link>
        <button
          id="btn-mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="admin-hamburger-btn"
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Top brand & profile */}
        <div>
          {/* Brand header */}
          <div className="admin-sidebar-brand">
            <div className="admin-brand-card">
              <div className="admin-logo-box">
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div className="admin-sidebar-logo">MyRimasa</div>
                <div className="admin-sidebar-subtitle">Panel Administrator</div>
              </div>
            </div>
          </div>

          {/* User profile card */}
          <div className="admin-sidebar-user">
            <div className="admin-user-avatar">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-user-name">
                {profile.name}
              </div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="admin-nav-container">
            <ul className="admin-nav">
              {navItems.map(item => (
                <li key={item.href} className="admin-nav-item">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={isActive(item.href, item.exact) ? 'active' : ''}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Actions (Clean flex bottom, never overlaps) */}
        <div className="admin-sidebar-footer">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="admin-footer-link"
          >
            🏠 Ke Beranda
          </Link>
          <button
            id="btn-admin-sign-out"
            className="admin-footer-logout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? <span className="spinner" style={{ width: '14px', height: '14px', borderColor: '#fca5a5' }} /> : '↪'}
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
