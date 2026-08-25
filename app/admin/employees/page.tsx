'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/lib/types';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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
        body: JSON.stringify({ name, email, password, role }),
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
      fetchEmployees();
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess('');
      }, 1500);
    } catch {
      setFormError('Terjadi kesalahan jaringan');
    }
    setSubmitting(false);
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
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Manajemen Karyawan</h1>
          <p className="page-subtitle">{employees.length} akun terdaftar di sistem</p>
        </div>
        <button
          id="btn-add-employee"
          className="btn btn-primary"
          onClick={() => { setShowModal(true); setFormError(''); setFormSuccess(''); }}
        >
          ➕ Tambah Karyawan Baru
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="spinner spinner-green" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: e.role === 'admin'
                            ? 'linear-gradient(135deg, #4f46e5, #818cf8)'
                            : 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '700', color: 'white',
                        }}>
                          {e.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>{e.name}</span>
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: '13px' }}>{e.email}</td>
                    <td>
                      <span className={`badge ${e.role === 'admin' ? 'badge-done' : 'badge-submitted'}`}>
                        {e.role === 'admin' ? '🛡️ Admin' : '👤 Petugas'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${e.status === 'active' ? 'badge-submitted' : 'badge-missed'}`}>
                        {e.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: '12px' }}>
                      {new Date(e.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-closed)' }}
                        onClick={() => handleDelete(e.id, e.name)}
                        title="Hapus Akun"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center muted" style={{ padding: '40px' }}>
                    Belum ada karyawan terdaftar. Klik tombol <strong>"Tambah Karyawan Baru"</strong> di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah Karyawan */}
      {showModal && (
        <div className="modal-overlay centered">
          <div className="modal centered-modal" style={{ maxWidth: '440px' }}>
            <div className="flex justify-between items-center mb-16">
              <h2 className="modal-title">➕ Tambah Akun Baru</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-subtitle">
              Akun akan langsung aktif tanpa perlu konfirmasi email.
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
                  placeholder="Contoh: Agus Sutrisno"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-emp-email">Email</label>
                <input
                  id="modal-emp-email"
                  type="email"
                  className="form-input"
                  placeholder="petugas@khdtk.id"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-emp-password">Password Awal</label>
                <input
                  id="modal-emp-password"
                  type="password"
                  className="form-input"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-emp-role">Role</label>
                <select
                  id="modal-emp-role"
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value as 'employee' | 'admin')}
                >
                  <option value="employee">👤 Petugas Pengamanan (Employee)</option>
                  <option value="admin">🛡️ Administrator (Admin)</option>
                </select>
              </div>

              <div className="flex gap-12 mt-20">
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}
