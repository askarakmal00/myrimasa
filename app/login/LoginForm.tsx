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
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fdf0f5 50%, #f0f4ff 100%)',
    }}>
      {/* Left panel — branding (hidden on mobile) */}
      <div className="login-left-panel">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '32px' }}>
          <img
            src="/logo.png"
            alt="Myrimasa"
            style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '900',
              color: '#1a2744',
              lineHeight: 1.2,
              letterSpacing: '-0.8px',
              marginBottom: '12px',
            }}>
              Kelola tim Anda<br />lebih cerdas & efisien
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: 1.7,
              maxWidth: '340px',
            }}>
              Platform presensi digital, laporan harian, dan monitoring karyawan dalam satu genggaman.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: '📍', text: 'Presensi berbasis GPS real-time' },
              { icon: '📋', text: 'Laporan harian terstruktur otomatis' },
              { icon: '📊', text: 'Dashboard monitoring karyawan' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '14px', color: '#334155', fontWeight: '600' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Logo — sized by width so all text (incl. Smart Workforce Platform) is readable */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img
              src="/logo.png"
              alt="Myrimasa — Smart Workforce Platform"
              style={{
                width: '260px',
                height: 'auto',
                objectFit: 'contain',
                display: 'inline-block',
              }}
            />
          </div>

          {/* Form card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 20px 60px -10px rgba(26, 39, 68, 0.12), 0 8px 24px -8px rgba(244, 114, 182, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '800',
              color: '#1a2744',
              marginBottom: '4px',
              letterSpacing: '-0.3px',
            }}>
              Masuk ke Akun
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#94a3b8',
              marginBottom: '24px',
            }}>
              Selamat datang! Masukkan email dan password Anda.
            </p>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#be123c',
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} id="form-login">
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '6px',
                }}>
                  Email
                </label>
                <input
                  id="input-email"
                  type="email"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#1a2744',
                    background: '#f8fafc',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '6px',
                }}>
                  Password
                </label>
                <input
                  id="input-password"
                  type="password"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#1a2744',
                    background: '#f8fafc',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
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
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: loading
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #1a2744 0%, #2d3e6b 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  letterSpacing: '-0.2px',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(26, 39, 68, 0.25)',
                }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: '16px', height: '16px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }} /> Memproses...</>
                ) : (
                  '🔑 Masuk Sekarang'
                )}
              </button>
            </form>

            <div style={{ marginTop: '18px', textAlign: 'center' }}>
              <Link
                href="/panduan"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#166534',
                  fontWeight: '700',
                  textDecoration: 'none',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  transition: 'all 0.15s',
                }}
              >
                📖 Panduan Presensi &amp; Tata Cara Login
              </Link>
            </div>
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '20px',
          }}>
            © 2026 Myrimasa · PT. Rimasa Inovasi Bersama
          </p>
        </div>
      </div>
    </div>
  );
}
