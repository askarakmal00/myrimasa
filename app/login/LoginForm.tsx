'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/app/actions';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  function translateAuthError(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
      return 'Email atau password salah. Pastikan akun Anda sudah terdaftar.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Email belum dikonfirmasi.';
    }
    return msg;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/logo.png"
            alt="Myrimasa"
            style={{
              width: '180px',
              height: 'auto',
              objectFit: 'contain',
              display: 'inline-block',
            }}
          />
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px 24px' }}>
          <h1 style={{
            fontSize: '17px',
            fontWeight: '700',
            color: 'var(--color-text)',
            marginBottom: '2px',
            letterSpacing: '-0.2px',
          }}>
            Masuk ke Akun
          </h1>
          <p style={{
            fontSize: '12.5px',
            color: 'var(--color-text-secondary)',
            marginBottom: '20px',
          }}>
            Masukkan kredensial akun Anda untuk melanjutkan.
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="form-login">
            <div className="form-group">
              <label className="form-label" htmlFor="input-email">
                Email
              </label>
              <input
                id="input-email"
                type="email"
                className="form-input"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="input-password">
                Kata Sandi
              </label>
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
              disabled={loading}
              className="btn btn-primary btn-full btn-lg"
            >
              {loading ? (
                <><span className="spinner" style={{ marginRight: '6px' }} /> Memproses...</>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link
              href="/panduan"
              style={{
                fontSize: '12px',
                color: 'var(--color-primary)',
                fontWeight: '500',
                textDecoration: 'none',
              }}
            >
              Bantuan &amp; Panduan Penggunaan →
            </Link>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--color-text-muted)',
          marginTop: '20px',
        }}>
          MyRimasa — Sistem Presensi Lapangan
        </p>
      </div>
    </div>
  );
}
