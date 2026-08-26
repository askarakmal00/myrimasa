'use client';

import { useState } from 'react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail,
  userName,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Masukkan kata sandi Anda saat ini.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Kata sandi baru harus berbeda dari kata sandi saat ini.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Gagal mengubah kata sandi');
        setLoading(false);
        return;
      }

      setSuccess('Kata sandi Anda berhasil diperbarui! Silakan simpan kata sandi baru Anda.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        // give time to read success
      }, 2000);
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    }
    setLoading(false);
  }

  function handleClose() {
    setError('');
    setSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  }

  return (
    <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
      <div className="modal centered-modal" style={{ maxWidth: '440px', width: '92%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#e0e7ff',
              color: '#3730a3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              🔑
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '18px' }}>Ganti Kata Sandi</h2>
              <p className="modal-subtitle" style={{ fontSize: '12px' }}>{userName} ({userEmail})</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleClose}
            style={{ fontSize: '18px', padding: '4px 8px', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-16" style={{ fontSize: '13px', padding: '10px 14px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-16" style={{ fontSize: '13px', padding: '10px 14px' }}>
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
              onClick={handleClose}
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                Kata Sandi Saat Ini
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '42px', fontSize: '14px' }}
                  placeholder="Masukkan kata sandi lama"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#64748b',
                    padding: '4px',
                  }}
                  tabIndex={-1}
                >
                  {showCurrent ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                Kata Sandi Baru (Min. 6 Karakter)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '42px', fontSize: '14px' }}
                  placeholder="Masukkan kata sandi baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#64748b',
                    padding: '4px',
                  }}
                  tabIndex={-1}
                >
                  {showNew ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                Ulangi Kata Sandi Baru
              </label>
              <input
                type="password"
                className="form-input"
                style={{ fontSize: '14px' }}
                placeholder="Ketik ulang kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                  ⚠️ Kata sandi konfirmasi tidak cocok
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, padding: '10px', borderRadius: '10px' }}
                onClick={handleClose}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, padding: '10px', borderRadius: '10px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '14px', height: '14px' }} />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Simpan Kata Sandi'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
