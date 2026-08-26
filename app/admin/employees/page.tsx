'use client';

import { useState, useEffect } from 'react';
import { Profile, Location } from '@/lib/types';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Employee Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [locationId, setLocationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Password Reset Modal State
  const [resetTargetUser, setResetTargetUser] = useState<Profile | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEmployees();
    fetch('/api/locations').then(r => r.json()).then(d => setLocations(Array.isArray(d) ? d : []));
  }, []);

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          location_id: role === 'employee' ? locationId : null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setFormError(json.error || 'Gagal menambahkan karyawan');
        setSubmitting(false);
        return;
      }

      setFormSuccess(`Akun untuk ${name} berhasil dibuat!`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('employee');
      setLocationId('');
      fetchEmployees();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess('');
      }, 1500);
    } catch {
      setFormError('Terjadi kesalahan jaringan');
    }
    setSubmitting(false);
  }

  function handleOpenPasswordReset(emp: Profile) {
    setResetTargetUser(emp);
    // Generate a default memorable password
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setNewStaffPassword(`Rimasa#${randomDigits}`);
    setResetError('');
    setResetSuccess(false);
    setCopiedWa(false);
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (newStaffPassword.length < 6) {
      setResetError('Password minimal 6 karakter');
      return;
    }

    setResettingPassword(true);
    setResetError('');
    try {
      const res = await fetch(`/api/admin/employees/${resetTargetUser.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newStaffPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        setResetError(json.error || 'Gagal mengubah password');
        setResettingPassword(false);
        return;
      }

      setResetSuccess(true);
    } catch {
      setResetError('Terjadi kesalahan jaringan');
    }
    setResettingPassword(false);
  }

  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStaffPassword(`Rimasa@${code}`);
  }

  function getWhatsAppMessage(emp: Profile, pass: string): string {
    return (
      `*INFORMASI AKUN & PASSWORD PRESENSI MYRIMASA*\n` +
      `----------------------------------------\n` +
      `Halo *${emp.name}*,\n` +
      `Berikut kredensial login akun presensi Anda di sistem Myrimasa:\n\n` +
      `🌐 *Website Presensi:* https://rimasa.my.id\n` +
      `📧 *Email (Login):* ${emp.email}\n` +
      `📍 *Lokasi KHDTK:* ${emp.location_name || 'KHDTK Penugasan'}\n` +
      `🔑 *Password Baru:* ${pass}\n` +
      `----------------------------------------\n` +
      `Silakan buka https://rimasa.my.id melalui browser HP dan login. Anda dapat mengganti password mandiri kapan saja di menu profil/header.`
    );
  }

  function copyWaMessage() {
    if (!resetTargetUser) return;
    const msg = getWhatsAppMessage(resetTargetUser, newStaffPassword);
    navigator.clipboard.writeText(msg);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2500);
  }

  async function handleDelete(id: string, empName: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${empName}?`)) return;

    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal menghapus');
        return;
      }
      fetchEmployees();
    } catch {
      alert('Gagal menghapus');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Karyawan & Staff</h1>
          <p className="page-subtitle">{employees.length} akun terdaftar di sistem rimasa.my.id</p>
        </div>
        <button
          id="btn-add-employee"
          className="btn btn-primary"
          onClick={() => { setShowAddModal(true); setFormError(''); setFormSuccess(''); }}
        >
          ➕ Tambah Karyawan Baru
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px', borderColor: '#cbd5e1', borderTopColor: '#1b4d3e' }} />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email / Login</th>
                <th>Lokasi Penugasan</th>
                <th>Role</th>
                <th>Status</th>
                <th>Terdaftar</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                          background: e.role === 'admin'
                            ? '#3730a3'
                            : '#1e5631',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '700', color: 'white',
                        }}>
                          {e.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '13px' }}>{e.name}</span>
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: '13px' }}>{e.email}</td>
                    <td>
                      {e.location_name ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: '#f8fafc',
                          border: '1px solid var(--color-border)',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#0f172a'
                        }}>
                          📍 {e.location_name}
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${e.role === 'admin' ? 'badge-evening' : 'badge-morning'}`}>
                        {e.role === 'admin' ? '🛡️ Admin' : '👤 Staff'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-morning">
                        {e.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: '12px' }}>
                      {new Date(e.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{
                            color: '#1e40af',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            padding: '5px 9px',
                            fontSize: '12px',
                            fontWeight: '700',
                            borderRadius: '8px',
                          }}
                          onClick={() => handleOpenPasswordReset(e)}
                          title="Reset atau Ganti Password Staff"
                        >
                          🔑 Ganti Password
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#dc2626', padding: '5px 8px', fontSize: '12px' }}
                          onClick={() => handleDelete(e.id, e.name)}
                          title="Hapus Akun"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center muted" style={{ padding: '40px' }}>
                    Belum ada karyawan terdaftar. Klik tombol <strong>"Tambah Karyawan Baru"</strong> di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah Karyawan */}
      {showAddModal && (
        <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
          <div className="modal centered-modal" style={{ maxWidth: '460px', width: '92%' }}>
            <div className="flex justify-between items-center mb-16">
              <h2 className="modal-title">➕ Tambah Akun Baru</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-subtitle">
              Akun akan langsung aktif dan terhubung ke domain <strong>rimasa.my.id</strong>.
            </p>

            {formError && (
              <div className="alert alert-error mb-16">
                <span>⚠️</span>
                <span style={{ fontSize: '13px' }}>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="alert alert-success mb-16">
                <span>✅</span>
                <span style={{ fontSize: '13px' }}>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-emp-name">Nama Lengkap</label>
                <input
                  id="modal-emp-name"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Zulpan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-emp-email">Email (Username Login)</label>
                <input
                  id="modal-emp-email"
                  type="email"
                  className="form-input"
                  placeholder="petugas@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-emp-password">Password Awal</label>
                <input
                  id="modal-emp-password"
                  type="text"
                  className="form-input"
                  placeholder="Minimal 6 karakter (contoh: Rimasa#2026)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-emp-role">Role Pengguna</label>
                <select
                  id="modal-emp-role"
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value as 'employee' | 'admin')}
                >
                  <option value="employee">👤 Karyawan / Staff Lapangan</option>
                  <option value="admin">🛡️ Administrator</option>
                </select>
              </div>

              {role === 'employee' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-emp-location">Lokasi KHDTK Penugasan</label>
                  <select
                    id="modal-emp-location"
                    className="form-select"
                    value={locationId}
                    onChange={e => setLocationId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Lokasi KHDTK --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>📍 {loc.name}</option>
                    ))}
                  </select>
                  <div className="form-hint" style={{ marginTop: '4px', fontSize: '11px' }}>
                    Staf tidak perlu memilih lokasi lagi saat presensi.
                  </div>
                </div>
              )}

              <div className="flex gap-12 mt-20">
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button
                  id="btn-modal-submit-employee"
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={submitting}
                >
                  {submitting ? <><span className="spinner" /> Menyimpan...</> : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset / Ganti Password Staff oleh Admin */}
      {resetTargetUser && (
        <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
          <div className="modal centered-modal" style={{ maxWidth: '480px', width: '92%' }}>
            <div className="flex justify-between items-center mb-16">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#dbeafe', color: '#1e40af',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  🔑
                </div>
                <div>
                  <h2 className="modal-title" style={{ fontSize: '17px' }}>Ganti Password Staff</h2>
                  <p className="modal-subtitle" style={{ fontSize: '12px' }}>
                    {resetTargetUser.name} · {resetTargetUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setResetTargetUser(null)}
              >
                ✕
              </button>
            </div>

            {resetError && (
              <div className="alert alert-error mb-16" style={{ fontSize: '13px' }}>
                <span>⚠️</span>
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess ? (
              <div>
                <div className="alert alert-success mb-16" style={{ fontSize: '13px' }}>
                  <span>✅</span>
                  <div>
                    <strong>Password berhasil diubah!</strong>
                    <div style={{ marginTop: '2px', fontSize: '12px' }}>
                      Password baru untuk <strong>{resetTargetUser.name}</strong> adalah:
                    </div>
                    <div style={{
                      margin: '8px 0',
                      padding: '8px 12px',
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '15px',
                      fontWeight: '800',
                      color: '#166534',
                      letterSpacing: '0.5px',
                    }}>
                      {newStaffPassword}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  Bagikan informasi akun dan password baru ini langsung ke staf melalui WhatsApp:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={copyWaMessage}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: copiedWa ? '#16a34a' : '#1e5631',
                    }}
                  >
                    <span>{copiedWa ? '✅' : '📋'}</span>
                    <span>{copiedWa ? 'Format Pesan WA Berhasil Disalin!' : 'Salin Pesan Format WhatsApp'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setResetTargetUser(null)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px' }}
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#475569',
                }}>
                  📍 <strong>Lokasi Penugasan:</strong> {resetTargetUser.location_name || 'KHDTK'}<br />
                  🌐 <strong>Domain Login:</strong> https://rimasa.my.id
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                    Password Baru Staff
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewStaffPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingRight: '42px', fontSize: '14px', fontFamily: 'monospace' }}
                      value={newStaffPassword}
                      onChange={e => setNewStaffPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                      style={{
                        position: 'absolute', right: '10px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: '14px',
                      }}
                      tabIndex={-1}
                    >
                      {showNewStaffPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Quick Generator Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                    onClick={generateRandomPassword}
                  >
                    🎲 Buat Password Acak
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                    onClick={() => setNewStaffPassword('khdtk2026')}
                  >
                    🔑 Gunakan "khdtk2026"
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ flex: 1, padding: '10px', borderRadius: '10px' }}
                    onClick={() => setResetTargetUser(null)}
                    disabled={resettingPassword}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '10px', borderRadius: '10px' }}
                    disabled={resettingPassword}
                  >
                    {resettingPassword ? (
                      <>
                        <span className="spinner" style={{ width: '14px', height: '14px' }} />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      'Simpan Password Baru'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
