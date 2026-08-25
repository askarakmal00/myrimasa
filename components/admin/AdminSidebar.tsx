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
  { href: '/admin/locations', label: 'Lokasi', icon: '📍', exact: false },
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
      {/* Mobile top bar */}
      <div className="admin-main-mobile-header" style={{
        display: 'flex', background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: 'var(--color-primary)', fontSize: '16px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', background: '#fff', borderRadius: '4px', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span>MyRimasa Admin</span>
        </Link>
        <button
          id="btn-mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn btn-ghost btn-sm"
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-primary-light)',
              boxShadow: '0 0 10px var(--color-primary-glow)',
              flexShrink: 0,
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="admin-sidebar-logo">MyRimasa</div>
              <div className="admin-sidebar-subtitle">Panel Administrator</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '12px 20px 8px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0,
            }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>Administrator</div>
            </div>
          </div>
        </div>

        <nav>
          <ul className="admin-nav">
            {navItems.map(item => (
              <li key={item.href} className={`admin-nav-item ${isActive(item.href, item.exact) ? 'active' : ''}`}>
                <Link href={item.href} onClick={() => setMobileOpen(false)}>
                  <span className="admin-nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ padding: '12px', marginTop: 'auto', borderTop: '1px solid var(--color-border)', position: 'absolute', bottom: 0, width: '100%' }}>
          <Link href="/" className="btn btn-ghost btn-sm btn-full" style={{ justifyContent: 'flex-start', gap: '8px', marginBottom: '4px' }}>
            🏠 Ke Beranda
          </Link>
          <button
            id="btn-admin-sign-out"
            className="btn btn-danger btn-sm btn-full"
            style={{ justifyContent: 'flex-start', gap: '8px' }}
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : '↩'}
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
