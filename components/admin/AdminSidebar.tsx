'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Profile } from '@/lib/types';
import { signOut } from '@/app/actions';
import { useState } from 'react';

interface AdminSidebarProps {
  profile: Profile;
}

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
      {/* Mobile Top Navbar */}
      <div className="admin-mobile-navbar">
        <Link href="/admin" className="admin-mobile-brand">
          <div className="admin-mobile-logo-box">
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span>MyRimasa</span>
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
        <div>
          {/* Brand header */}
          <div className="admin-sidebar-brand">
            <div className="admin-brand-card">
              <div className="admin-logo-box">
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div className="admin-sidebar-logo">MyRimasa</div>
                <div className="admin-sidebar-subtitle">Administrator</div>
              </div>
            </div>
          </div>

          {/* User profile info */}
          <div className="admin-sidebar-user">
            <div className="admin-user-avatar">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-user-name">
                {profile.name}
              </div>
              <div className="admin-user-role">Admin</div>
            </div>
          </div>

          {/* Navigation links with clean SVG icons */}
          <nav className="admin-nav-container">
            {/* Group 1: Presensi Operasional */}
            <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', padding: '12px 14px 4px' }}>
              Operasional Presensi
            </div>
            <ul className="admin-nav">
              <li className="admin-nav-item">
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin', true) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </span>
                  <span>Dashboard Presensi</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/reports"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/reports', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </span>
                  <span>Laporan Presensi</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/rekap-dokumentasi"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/rekap-dokumentasi', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </span>
                  <span>Rekap Dokumentasi</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/locations"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/locations', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span>Master Lokasi</span>
                </Link>
              </li>
            </ul>

            {/* Group 2: Kontrak & Klien */}
            <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', padding: '14px 14px 4px' }}>
              Kontrak &amp; Klien
            </div>
            <ul className="admin-nav">
              <li className="admin-nav-item">
                <Link
                  href="/admin/billing-dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/billing-dashboard', true) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                  <span>Ringkasan Finansial</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/customers"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/customers', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18" />
                      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                    </svg>
                  </span>
                  <span>Data Customer</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/contracts"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/contracts', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                  </span>
                  <span>Kontrak &amp; SPK</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/billing-profiles"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/billing-profiles', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </span>
                  <span>Penempatan &amp; Profile</span>
                </Link>
              </li>
            </ul>

            {/* Group 3: Billing & Keuangan */}
            <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', padding: '14px 14px 4px' }}>
              Billing &amp; Keuangan
            </div>
            <ul className="admin-nav">
              <li className="admin-nav-item">
                <Link
                  href="/admin/monthly-billing"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/monthly-billing', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                  <span>Billing &amp; Payroll</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/invoices"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/invoices', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                      <line x1="8" y1="8" x2="16" y2="8" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </span>
                  <span>Invoice Tagihan</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/talangan"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/talangan', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </span>
                  <span>Talangan Modal</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/admin/operational-expenses"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/operational-expenses', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                      <polyline points="17 18 23 18 23 12" />
                    </svg>
                  </span>
                  <span>Biaya Operasional</span>
                </Link>
              </li>
            </ul>

            {/* Group 4: Pengaturan */}
            <div style={{ fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', padding: '14px 14px 4px' }}>
              Pengaturan &amp; Bantuan
            </div>
            <ul className="admin-nav">
              <li className="admin-nav-item">
                <Link
                  href="/admin/employees"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/admin/employees', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <span>Kelola Karyawan</span>
                </Link>
              </li>

              <li className="admin-nav-item">
                <Link
                  href="/panduan"
                  onClick={() => setMobileOpen(false)}
                  className={isActive('/panduan', false) ? 'active' : ''}
                >
                  <span className="admin-nav-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </span>
                  <span>Buku Panduan</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="admin-sidebar-footer">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="admin-footer-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Tampilan Petugas</span>
          </Link>
          <button
            id="btn-admin-sign-out"
            className="admin-footer-logout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <span className="spinner" style={{ width: '12px', height: '12px', borderColor: '#fca5a5' }} />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            )}
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
