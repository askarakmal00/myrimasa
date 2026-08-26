'use client';

import { useState, useEffect } from 'react';
import { Profile, Location } from '@/lib/types';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'employee' | 'admin'>('employee');
  const [addLocationId, setAddLocationId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Edit Modal State
  const [editEmployee, setEditEmployee] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'employee' | 'admin'>('employee');
  const [editLocationId, setEditLocationId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [enablePasswordChange, setEnablePasswordChange] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
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
    setAdding(true);
    setAddError('');
    setAddSuccess('');

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          password: addPassword,
          role: addRole,
          location_id: addRole === 'employee' ? addLocationId : null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setAddError(json.error || 'Gagal menambahkan karyawan');
        setAdding(false);
        return;
      }

      setAddSuccess(`Akun untuk ${addName} berhasil dibuat!`);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('employee');
      setAddLocationId('');
      fetchEmployees();
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 1500);
    } catch {
      setAddError('Terjadi kesalahan jaringan');
    }
    setAdding(false);
  }

  function handleOpenEdit(emp: Profile) {
    setEditEmployee(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditRole(emp.role);
    setEditLocationId(emp.location_id || '');
    setEditPassword('');
    setEnablePasswordChange(false);
    setShowEditPassword(false);
    setEditError('');
    setEditSuccess(false);
    setCopiedWa(false);
  }

  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditPassword(`Rimasa@${code}`);
    setEnablePasswordChange(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editEmployee) return;

    if (enablePasswordChange && editPassword.trim().length > 0 && editPassword.trim().length < 6) {
      setEditError('Password baru minimal 6 karakter');
      return;
    }

    setSavingEdit(true);
    setEditError('');

    try {
      const res = await fetch(`/api/admin/employees/${editEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          location_id: editRole === 'employee' ? editLocationId : null,
          newPassword: enablePasswordChange && editPassword.trim().length >= 6 ? editPassword.trim() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setEditError(json.error || 'Gagal memperbarui data karyawan');
        setSavingEdit(false);
        return;
      }

      fetchEmployees();

      if (enablePasswordChange && editPassword.trim().length >= 6) {
        setEditSuccess(true);
      } else {
        setEditEmployee(null);
      }
    } catch {
      setEditError('Terjadi kesalahan jaringan');
    }
    setSavingEdit(false);
  }

  function getWhatsAppMessage(empName: string, empEmail: string, pass: string, locId: string): string {
    const loc = locations.find(l => l.id === locId)?.name || 'KHDTK Penugasan';
    return (
      `*INFORMASI AKUN & PASSWORD PRESENSI MYRIMASA*\n` +
      `----------------------------------------\n` +
      `Halo *${empName}*,\n` +
      `Berikut pembaruan kredensial akun presensi Anda di sistem Myrimasa:\n\n` +
      `🌐 *Website Presensi:* https://rimasa.my.id\n` +
      `📧 *Email (Login):* ${empEmail}\n` +
      `📍 *Lokasi KHDTK:* ${loc}\n` +
      `🔑 *Password Baru:* ${pass}\n` +
      `----------------------------------------\n` +
      `Silakan buka https://rimasa.my.id melalui browser HP Anda dan lakukan login.`
    );
  }

  function copyWaMessage() {
    if (!editEmployee) return;
    const msg = getWhatsAppMessage(editName, editEmail, editPassword, editLocationId);
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
          <p className="page-subtitle">{employees.length} akun terdaftar di sistem</p>
        </div>
        <button
          id="btn-add-employee"
          className="btn btn-primary"
          onClick={() => { setShowAddModal(true); setAddError(''); setAddSuccess(''); }}
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
                          background: e.role === 'admin' ? '#3730a3' : '#1e5631',
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
                        {/* Edit Button — includes password change & reset */}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{
                            color: '#1e40af',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontWeight: '700',
                            borderRadius: '8px',
                          }}
                          onClick={() => handleOpenEdit(e)}
                          title="Edit data karyawan & ganti/reset password"
                        >
                          ✏️ Edit
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

            {addError && (
              <div className="alert alert-error mb-16">
                <span>⚠️</span>
                <span style={{ fontSize: '13px' }}>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="alert alert-success mb-16">
                <span>✅</span>
                <span style={{ fontSize: '13px' }}>{addSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Zulpan"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email (Username Login)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="petugas@gmail.com"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password Awal</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Minimal 6 karakter (contoh: khdtk2026)"
                  value={addPassword}
                  onChange={e => setAddPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role Pengguna</label>
                <select
                  className="form-select"
                  value={addRole}
                  onChange={e => setAddRole(e.target.value as 'employee' | 'admin')}
                >
                  <option value="employee">👤 Karyawan / Staff Lapangan</option>
                  <option value="admin">🛡️ Administrator</option>
                </select>
              </div>

              {addRole === 'employee' && (
                <div className="form-group">
                  <label className="form-label">Lokasi KHDTK Penugasan</label>
                  <select
                    className="form-select"
                    value={addLocationId}
                    onChange={e => setAddLocationId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Lokasi KHDTK --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>📍 {loc.name}</option>
                    ))}
                  </select>
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
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={adding}
                >
                  {adding ? <><span className="spinner" /> Menyimpan...</> : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Karyawan & Reset/Kirim Password */}
      {editEmployee && (
        <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
          <div className="modal centered-modal" style={{ maxWidth: '480px', width: '92%' }}>
            <div className="flex justify-between items-center mb-16">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#dbeafe', color: '#1e40af',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  ✏️
                </div>
                <div>
                  <h2 className="modal-title" style={{ fontSize: '17px' }}>Edit Data Karyawan</h2>
                  <p className="modal-subtitle" style={{ fontSize: '12px' }}>
                    {editEmployee.name} ({editEmployee.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditEmployee(null)}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="alert alert-error mb-16" style={{ fontSize: '13px' }}>
                <span>⚠️</span>
                <span>{editError}</span>
              </div>
            )}

            {editSuccess ? (
              <div>
                <div className="alert alert-success mb-16" style={{ fontSize: '13px' }}>
                  <span>✅</span>
                  <div>
                    <strong>Data dan Password berhasil diperbarui!</strong>
                    <div style={{ marginTop: '2px', fontSize: '12px' }}>
                      Password baru untuk <strong>{editName}</strong>:
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
                    }}>
                      {editPassword}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={copyWaMessage}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      background: copiedWa ? '#16a34a' : '#1e5631',
                    }}
                  >
                    <span>{copiedWa ? '✅ Pesan WA Disalin!' : '📋 Salin Pesan Format WhatsApp'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditEmployee(null)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px' }}
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                    Email (Login)
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                    Role
                  </label>
                  <select
                    className="form-select"
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as 'employee' | 'admin')}
                  >
                    <option value="employee">👤 Karyawan / Staff Lapangan</option>
                    <option value="admin">🛡️ Administrator</option>
                  </select>
                </div>

                {editRole === 'employee' && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                      Lokasi KHDTK Penugasan
                    </label>
                    <select
                      className="form-select"
                      value={editLocationId}
                      onChange={e => setEditLocationId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Lokasi KHDTK --</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>📍 {loc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reset / Ganti Password Section */}
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enablePasswordChange ? '10px' : '0' }}>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '700', color: '#1e293b',
                    }}>
                      <input
                        type="checkbox"
                        checked={enablePasswordChange}
                        onChange={e => {
                          setEnablePasswordChange(e.target.checked);
                          if (e.target.checked && !editPassword) {
                            const rand = Math.floor(1000 + Math.random() * 9000);
                            setEditPassword(`Rimasa#${rand}`);
                          }
                        }}
                      />
                      <span>🔑 Reset / Ganti Password Staff</span>
                    </label>
                  </div>

                  {enablePasswordChange && (
                    <div>
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          className="form-input"
                          style={{ paddingRight: '42px', fontSize: '13px', fontFamily: 'monospace' }}
                          placeholder="Masukkan password baru (min. 6 karakter)"
                          value={editPassword}
                          onChange={e => setEditPassword(e.target.value)}
                          required={enablePasswordChange}
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          style={{
                            position: 'absolute', right: '10px', top: '50%',
                            transform: 'translateY(-50%)', background: 'none', border: 'none',
                            cursor: 'pointer', fontSize: '14px',
                          }}
                          tabIndex={-1}
                        >
                          {showEditPassword ? '🙈' : '👁️'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                          onClick={generateRandomPassword}
                        >
                          🎲 Buat Acak
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                          onClick={() => setEditPassword('khdtk2026')}
                        >
                          🔑 Default "khdtk2026"
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ flex: 1, padding: '10px', borderRadius: '10px' }}
                    onClick={() => setEditEmployee(null)}
                    disabled={savingEdit}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '10px', borderRadius: '10px' }}
                    disabled={savingEdit}
                  >
                    {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
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
