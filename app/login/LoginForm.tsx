'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from '@/app/actions';
import Link from 'next/link';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initLoading, setInitLoading] = useState(false);
  const [initSuccess, setInitSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('email', email.trim().toLowerCase());
    formData.append('password', password);
    formData.append('redirect', redirectTo);

    try {
      const res = await signIn(formData);
      if (res?.error) {
        setError(translateAuthError(res.error));
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.message?.includes('NEXT_REDIRECT') || err?.digest?.includes('NEXT_REDIRECT')) {
        return;
      }
      setError('Terjadi kesalahan saat masuk. Coba lagi.');
      setLoading(false);
    }
  }

  async function handleInitAdmin() {
    setInitLoading(true);
    setError('');
    try {
      const res = await fetch('/api/init-admin', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setEmail('admin@khdtk.id');
        setPassword('admin123');
        setInitSuccess('Akun admin berhasil disiapkan! Silakan klik tombol "Masuk".');
      } else {
        setError(json.error || 'Gagal inisialisasi');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    }
    setInitLoading(false);
  }

  function translateAuthError(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
      return 'Email atau password salah. Pastikan akun Anda sudah didaftarkan oleh Administrator.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Email belum dikonfirmasi di Supabase.';
    }
    return msg;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--color-bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo & Branding */}
        <div className="text-center" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 16px',
            borderRadius: '20px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-border)',
          }}>
            <img
              src="/logo.png"
              alt="Logo KHDTK"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#0f172a' }}>
            KHDTK Litbanghut
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Laporan Harian & Presensi Petugas Pengamanan
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
            Masuk ke Akun
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Silakan masukkan email dan password Anda.
          </p>

          <form onSubmit={handleSubmit} id="form-login">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <span>⚠️</span>
                <span style={{ fontSize: '13px' }}>{error}</span>
              </div>
            )}

            {initSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                <span>✅</span>
                <span style={{ fontSize: '13px' }}>{initSuccess}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="input-email">Email</label>
              <input
                id="input-email"
                type="email"
                className="form-input"
                placeholder="nama@khdtk.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-password">Password</label>
              <input
                id="input-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <><span className="spinner" /> Memproses...</>
              ) : (
                '🔑 Masuk Sekarang'
              )}
            </button>
          </form>

          {/* Quick Setup for Initial Admin */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
              Belum ada akun Admin pertama?
            </div>
            <button
              type="button"
              id="btn-init-admin"
              className="btn btn-secondary btn-sm btn-full"
              style={{ fontSize: '12px' }}
              onClick={handleInitAdmin}
              disabled={initLoading}
            >
              {initLoading ? 'Memproses...' : '🛡️ Siapkan Akun Admin (admin@khdtk.id / admin123)'}
            </button>
          </div>
        </div>

        <div className="footer-text" style={{ marginTop: '16px' }}>
          © 2026 KHDTK Litbanghut. Semua hak dilindungi.
        </div>
      </div>
    </div>
  );
}
