'use client';

import { useState, useEffect } from 'react';
import { Profile, Location } from '@/lib/types';
import { getAssignedLocationName } from '@/lib/staff-assignments';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('khdtk2026');
  const [addRole, setAddRole] = useState<'employee' | 'admin'>('employee');
  const [addLocationId, setAddLocationId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [createdResult, setCreatedResult] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
    locationId: string;
  } | null>(null);

  // Edit Modal State
  const [editEmployee, setEditEmployee] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'employee' | 'admin'>('employee');
  const [editLocationId, setEditLocationId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [enablePasswordChange, setEnablePasswordChange] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  // Universal Share WA Modal State (Updates password & blasts to WA simultaneously)
  const [shareWaTarget, setShareWaTarget] = useState<Profile | null>(null);
  const [sharePassword, setSharePassword] = useState('khdtk2026');
  const [updatingPasswordAndShare, setUpdatingPasswordAndShare] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Copy feedback state
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

  function cleanPhoneForWa(phoneStr?: string | null): string {
    if (!phoneStr) return '';
    let cleaned = phoneStr.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('+62')) {
      cleaned = cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  }

  function getWhatsAppCredentialMessage(empName: string, empEmail: string, pass: string, locIdOrName: string): string {
    let loc = locations.find(l => l.id === locIdOrName)?.name;
    if (!loc) {
      loc = locIdOrName || 'KHDTK Penugasan';
    }

    return (
      `🌲 *AKUN PRESENSI DIGITAL KHDTK*\n` +
      `_Sistem Pelaporan & Presensi Myrimasa_\n\n` +
      `Halo Bapak/Ibu *${empName}*,\n` +
      `Berikut adalah data akun resmi Anda untuk presensi lapangan:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🌐 *Link Website:*\n` +
      `https://rimasa.my.id\n\n` +
      `📧 *Email (Username):*\n` +
      `\`\`\`${empEmail}\`\`\`\n\n` +
      `🔑 *Password:*\n` +
      `\`\`\`${pass}\`\`\`\n\n` +
      `📍 *Lokasi Tugas:*\n` +
      `*${loc}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⏰ *Jadwal Presensi Rutin:*\n` +
      `☀️ *PAGI* : 06.00 – 08.00 WIB\n` +
      `🌙 *SORE* : 16.00 – 23.59 WIB\n\n` +
      `💡 *Petunjuk Masuk:*\n` +
      `1. Buka link https://rimasa.my.id di browser HP (Chrome / Safari).\n` +
      `2. Masukkan Email & Password di atas.\n` +
      `3. Setelah masuk, disarankan mengganti kata sandi melalui ikon kunci (🔑) di bar atas.\n\n` +
      `_Selamat bertugas! Hubungi Admin Rimasa bila ada kendala login._`
    );
  }

  function getWhatsAppShareUrl(empName: string, empEmail: string, pass: string, locIdOrName: string, phoneStr: string): string {
    const cleanPhone = cleanPhoneForWa(phoneStr);
    const msg = getWhatsAppCredentialMessage(empName, empEmail, pass, locIdOrName);
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError('');

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          phone: addPhone,
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

      setCreatedResult({
        name: addName,
        email: addEmail,
        phone: addPhone,
        password: addPassword,
        locationId: addLocationId,
      });

      fetchEmployees();
    } catch {
      setAddError('Terjadi kesalahan jaringan');
    }
    setAdding(false);
  }

  function handleOpenAddModal() {
    setAddName('');
    setAddEmail('');
    setAddPhone('');
    setAddPassword('khdtk2026');
    setAddRole('employee');
    setAddLocationId('');
    setAddError('');
    setCreatedResult(null);
    setShowAddModal(true);
  }

  function handleOpenEdit(emp: Profile) {
    setEditEmployee(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditPhone(emp.phone || '');
    setEditRole(emp.role);

    // Auto-detect matching location if location_id is not yet set
    let locId = emp.location_id || '';
    if (!locId) {
      const targetLocName = emp.location_name || getAssignedLocationName(emp.email, emp.name);
      if (targetLocName && locations.length > 0) {
        const found = locations.find(l =>
          l.name.toLowerCase().trim() === targetLocName.toLowerCase().trim() ||
          targetLocName.toLowerCase().includes(l.name.toLowerCase()) ||
          l.name.toLowerCase().includes(targetLocName.toLowerCase())
        );
        if (found) {
          locId = found.id;
        }
      }
    }

    setEditLocationId(locId);
    setEditPassword('');
    setEnablePasswordChange(false);
    setShowEditPassword(false);
    setEditError('');
    setEditSuccess(false);
    setCopiedWa(false);
  }

  function handleOpenShareWaModal(emp: Profile) {
    setShareWaTarget(emp);
    setSharePassword('khdtk2026');
    setShareError('');
    setShareSuccess(false);
    setCopiedWa(false);
  }

  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Rimasa@${code}`;
  }

  async function handleUpdatePasswordAndOpenWa() {
    if (!shareWaTarget) return;
    const cleanPass = sharePassword.trim();
    if (!cleanPass) {
      setShareError('Password baru wajib diisi (minimal 6 karakter)');
      return;
    }
    if (cleanPass.length < 6) {
      setShareError('Password baru minimal 6 karakter');
      return;
    }

    setUpdatingPasswordAndShare(true);
    setShareError('');

    try {
      // 1. Directly update password in database
      const res = await fetch(`/api/admin/employees/${shareWaTarget.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: cleanPass }),
      });

      const json = await res.json();
      if (!res.ok) {
        setShareError(json.error || 'Gagal mengubah password di sistem database');
        setUpdatingPasswordAndShare(false);
        return;
      }

      // 2. Open WhatsApp with exact same new password
      const url = getWhatsAppShareUrl(
        shareWaTarget.name,
        shareWaTarget.email,
        cleanPass,
        shareWaTarget.location_name || '',
        shareWaTarget.phone || ''
      );

      window.open(url, '_blank');
      setShareSuccess(true);
      fetchEmployees();
    } catch {
      setShareError('Terjadi kesalahan jaringan');
    }
    setUpdatingPasswordAndShare(false);
  }

  async function handleUpdatePasswordAndCopyWa() {
    if (!shareWaTarget) return;
    const cleanPass = sharePassword.trim();
    if (!cleanPass) {
      setShareError('Password baru wajib diisi (minimal 6 karakter)');
      return;
    }
    if (cleanPass.length < 6) {
      setShareError('Password baru minimal 6 karakter');
      return;
    }

    setUpdatingPasswordAndShare(true);
    setShareError('');

    try {
      // 1. Directly update password in database
      const res = await fetch(`/api/admin/employees/${shareWaTarget.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: cleanPass }),
      });

      const json = await res.json();
      if (!res.ok) {
        setShareError(json.error || 'Gagal mengubah password di sistem database');
        setUpdatingPasswordAndShare(false);
        return;
      }

      // 2. Copy to clipboard
      copyWaMessage(
        shareWaTarget.name,
        shareWaTarget.email,
        cleanPass,
        shareWaTarget.location_name || ''
      );

      setShareSuccess(true);
      fetchEmployees();
    } catch {
      setShareError('Terjadi kesalahan jaringan');
    }
    setUpdatingPasswordAndShare(false);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editEmployee) return;

    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Nama dan email wajib diisi');
      return;
    }

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
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          role: editRole,
          location_id: editRole === 'employee' ? (editLocationId || null) : null,
          newPassword: enablePasswordChange && editPassword.trim().length >= 6 ? editPassword.trim() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setEditError(json.error || 'Gagal memperbarui data karyawan');
        setSavingEdit(false);
        return;
      }

      await fetchEmployees();

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

  function copyWaMessage(name: string, email: string, pass: string, locIdOrName: string) {
    const msg = getWhatsAppCredentialMessage(name, email, pass, locIdOrName);
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
          <h1 className="page-title">Manajemen Petugas &amp; Akun</h1>
          <p className="page-subtitle">{employees.length} akun terdaftar di sistem</p>
        </div>
        <button
          id="btn-add-employee"
          className="btn btn-primary"
          onClick={handleOpenAddModal}
        >
          + Tambah Petugas
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px', borderColor: '#cbd5e1', borderTopColor: '#15803d' }} />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Petugas</th>
                <th>Email / Username</th>
                <th>No. WhatsApp</th>
                <th>Lokasi Penugasan</th>
                <th>Peran</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                          background: e.role === 'admin' ? '#4338ca' : '#15803d',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '600', color: 'white',
                        }}>
                          {e.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>{e.name}</span>
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: '12.5px' }}>{e.email}</td>
                    <td>
                      {e.phone ? (
                        <a
                          href={`https://wa.me/${cleanPhoneForWa(e.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Hubungi via WhatsApp"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--color-primary-subtle)',
                            color: 'var(--color-primary-dark)',
                            fontSize: '11.5px',
                            fontWeight: '500',
                            textDecoration: 'none',
                          }}
                        >
                          {e.phone}
                        </a>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      {e.location_name ? (
                        <span style={{ fontSize: '12px', color: 'var(--color-text)' }}>
                          {e.location_name}
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${e.role === 'admin' ? 'badge-evening' : 'badge-morning'}`}>
                        {e.role === 'admin' ? 'Admin' : 'Petugas'}
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
                        {/* Reset Password & Share WA Button */}
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 8px',
                          }}
                          onClick={() => handleOpenShareWaModal(e)}
                          title="Kirim kredensial atau reset password via WhatsApp"
                        >
                          Kirim WA
                        </button>

                        {/* Edit Button */}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 8px',
                          }}
                          onClick={() => handleOpenEdit(e)}
                          title="Edit data petugas"
                        >
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#dc2626', padding: '4px 6px', fontSize: '12px' }}
                          onClick={() => handleDelete(e.id, e.name)}
                          title="Hapus Akun"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center muted" style={{ padding: '36px', textAlign: 'center' }}>
                    Belum ada akun petugas terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Reset Password & Blast ke WhatsApp */}
      {shareWaTarget && (
        <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
          <div className="modal centered-modal" style={{ maxWidth: '460px', width: '92%' }}>
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2 className="modal-title" style={{ fontSize: '15px' }}>Kirim Kredensial via WhatsApp</h2>
                <p className="modal-subtitle" style={{ fontSize: '11.5px' }}>
                  {shareWaTarget.name} • {shareWaTarget.phone || 'No. HP belum diisi'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShareWaTarget(null)}
              >
                ✕
              </button>
            </div>

            {shareError && (
              <div className="alert alert-error mb-16">
                {shareError}
              </div>
            )}

            {shareSuccess && (
              <div className="alert alert-success mb-16">
                <strong>Password berhasil diperbarui dan siap dikirimkan.</strong>
              </div>
            )}

            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              marginBottom: '14px',
              fontSize: '12px',
              lineHeight: '1.6',
            }}>
              <div><strong>Nama Petugas:</strong> {shareWaTarget.name}</div>
              <div><strong>Email Login:</strong> {shareWaTarget.email}</div>
              <div><strong>No. WhatsApp:</strong> {shareWaTarget.phone || '—'}</div>
              <div><strong>Lokasi Penugasan:</strong> {shareWaTarget.location_name || 'KHDTK Penugasan'}</div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">
                Setel Kata Sandi Baru
              </label>
              <input
                type="text"
                className="form-input"
                value={sharePassword}
                onChange={e => setSharePassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                style={{ fontFamily: 'monospace' }}
                required
                minLength={6}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px' }}
                  onClick={() => setSharePassword('khdtk2026')}
                >
                  Gunakan "khdtk2026"
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px' }}
                  onClick={() => setSharePassword(generateRandomPassword())}
                >
                  Buat Acak
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdatePasswordAndOpenWa}
                disabled={updatingPasswordAndShare}
                style={{ width: '100%' }}
              >
                {updatingPasswordAndShare ? (
                  <><span className="spinner" /> Memproses...</>
                ) : (
                  'Simpan & Buka WhatsApp'
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleUpdatePasswordAndCopyWa}
                disabled={updatingPasswordAndShare}
                style={{ width: '100%' }}
              >
                {copiedWa ? 'Tersalin ke Clipboard!' : 'Salin Format Pesan WhatsApp'}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShareWaTarget(null)}
                style={{ width: '100%' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Karyawan */}
      {showAddModal && (
        <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
          <div className="modal centered-modal" style={{ maxWidth: '460px', width: '92%' }}>
            <div className="flex justify-between items-center mb-16">
              <h2 className="modal-title">Tambah Petugas Baru</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            {createdResult ? (
              <div>
                <div className="alert alert-success mb-16">
                  <strong>Akun Petugas Berhasil Dibuat</strong>
                  <div style={{ marginTop: '2px', fontSize: '12px' }}>
                    Kredensial login dapat segera dikirimkan ke petugas:
                  </div>
                </div>

                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}>
                  <div><strong>Nama:</strong> {createdResult.name}</div>
                  <div><strong>Email Login:</strong> {createdResult.email}</div>
                  <div><strong>No. WhatsApp:</strong> {createdResult.phone || '—'}</div>
                  <div><strong>Lokasi Penugasan:</strong> {locations.find(l => l.id === createdResult.locationId)?.name || '—'}</div>
                  <div style={{ marginTop: '6px' }}>
                    <strong>Password:</strong>{' '}
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: '600',
                      color: 'var(--color-primary-dark)',
                      background: 'var(--color-primary-subtle)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                    }}>
                      {createdResult.password}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href={getWhatsAppShareUrl(
                      createdResult.name,
                      createdResult.email,
                      createdResult.password,
                      createdResult.locationId,
                      createdResult.phone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
                  >
                    Kirim Kredensial via WhatsApp
                  </a>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => copyWaMessage(
                      createdResult.name,
                      createdResult.email,
                      createdResult.password,
                      createdResult.locationId
                    )}
                    style={{ width: '100%' }}
                  >
                    {copiedWa ? 'Tersalin ke Clipboard!' : 'Salin Format Pesan WhatsApp'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowAddModal(false)}
                    style={{ width: '100%' }}
                  >
                    Selesai &amp; Tutup
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="modal-subtitle" style={{ marginBottom: '16px' }}>
                  Akun petugas akan langsung aktif dan dapat digunakan untuk login.
                </p>

                {addError && (
                  <div className="alert alert-error mb-16">
                    {addError}
                  </div>
                )}

                <form onSubmit={handleAddEmployee}>
                  <div className="form-group">
                    <label className="form-label">
                      Nama Lengkap <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama lengkap petugas"
                      value={addName}
                      onChange={e => setAddName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Email / Username <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="nama@email.com"
                      value={addEmail}
                      onChange={e => setAddEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="08xxxxxxxxxx"
                      value={addPhone}
                      onChange={e => setAddPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Kata Sandi Awal <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Minimal 6 karakter"
                      value={addPassword}
                      onChange={e => setAddPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Peran Pengguna
                    </label>
                    <select
                      className="form-select"
                      value={addRole}
                      onChange={e => setAddRole(e.target.value as 'employee' | 'admin')}
                    >
                      <option value="employee">Petugas Lapangan</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {addRole === 'employee' && (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">
                        Lokasi Penugasan <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={addLocationId}
                        onChange={e => setAddLocationId(e.target.value)}
                        required
                      >
                        <option value="">-- Pilih Lokasi Penugasan --</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Edit Karyawan */}
      {editEmployee && (
        <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
          <div className="modal centered-modal" style={{ maxWidth: '460px', width: '92%' }}>
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2 className="modal-title" style={{ fontSize: '15px' }}>Edit Akun Petugas</h2>
                <p className="modal-subtitle" style={{ fontSize: '11.5px' }}>
                  {editEmployee.name} • {editEmployee.email}
                </p>
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
              <div className="alert alert-error mb-16">
                {editError}
              </div>
            )}

            {editSuccess ? (
              <div>
                <div className="alert alert-success mb-16">
                  <strong>Password Berhasil Diperbarui</strong>
                  <div style={{ marginTop: '2px', fontSize: '12px' }}>
                    Password baru untuk <strong>{editName}</strong>:
                  </div>
                  <div style={{
                    margin: '8px 0',
                    padding: '8px 12px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xs)',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--color-primary-dark)',
                  }}>
                    {editPassword}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href={getWhatsAppShareUrl(editName, editEmail, editPassword, editLocationId, editPhone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
                  >
                    Kirim ke WhatsApp
                  </a>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => copyWaMessage(editName, editEmail, editPassword, editLocationId)}
                    style={{ width: '100%' }}
                  >
                    {copiedWa ? 'Tersalin ke Clipboard!' : 'Salin Format Pesan WhatsApp'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditEmployee(null)}
                    style={{ width: '100%' }}
                  >
                    Selesai &amp; Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label className="form-label">
                    Nama Lengkap <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email (Username) <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="08xxxxxxxxxx"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Peran
                  </label>
                  <select
                    className="form-select"
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as 'employee' | 'admin')}
                  >
                    <option value="employee">Petugas Lapangan</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {editRole === 'employee' && (
                  <div className="form-group">
                    <label className="form-label">
                      Lokasi Penugasan
                    </label>
                    <select
                      className="form-select"
                      value={editLocationId}
                      onChange={e => setEditLocationId(e.target.value)}
                    >
                      <option value="">-- Pilih Lokasi Penugasan --</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reset / Ganti Password Section */}
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enablePasswordChange ? '8px' : '0' }}>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                      fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text)',
                    }}>
                      <input
                        type="checkbox"
                        checked={enablePasswordChange}
                        onChange={e => {
                          setEnablePasswordChange(e.target.checked);
                          if (e.target.checked && !editPassword) {
                            setEditPassword('');
                          }
                        }}
                      />
                      <span>Ubah Kata Sandi Petugas Ini</span>
                    </label>
                  </div>

                  {enablePasswordChange && (
                    <div>
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          className="form-input"
                          style={{ paddingRight: '42px', fontSize: '12.5px', fontFamily: 'monospace' }}
                          placeholder="Password baru (min. 6 karakter)"
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
                            cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-muted)'
                          }}
                          tabIndex={-1}
                        >
                          {showEditPassword ? 'Sembunyikan' : 'Lihat'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px' }}
                          onClick={generateRandomPassword}
                        >
                          Buat Acak
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setEditEmployee(null)}
                    disabled={savingEdit}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
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
