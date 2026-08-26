'use client';

import { useState, useEffect } from 'react';
import { Profile, Location } from '@/lib/types';
import { STAFF_ASSIGNMENTS, StaffAssignment } from '@/lib/staff-assignments';

interface StaffAccountRow {
  no: number;
  id: string;
  name: string;
  phone: string;
  locationName: string;
  email: string;
  role: string;
  status: string;
  defaultPassword?: string;
}

export default function AdminAccountsPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [visiblePasswordMap, setVisiblePasswordMap] = useState<Record<string, boolean>>({});

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<StaffAccountRow | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Slip card modal state
  const [slipTarget, setSlipTarget] = useState<StaffAccountRow | null>(null);
  const [toastMessage, setToastMessage] = useState('');

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

  // Merge Database Profiles with Staff Assignments master list
  const accountRows: StaffAccountRow[] = STAFF_ASSIGNMENTS.map((sa, index) => {
    const matchedProfile = employees.find(
      e => e.email.toLowerCase() === sa.email.toLowerCase() ||
           e.name.toLowerCase().includes(sa.name.toLowerCase()) ||
           sa.name.toLowerCase().includes(e.name.toLowerCase())
    );

    return {
      no: index + 1,
      id: matchedProfile?.id || `staff-${sa.no}`,
      name: matchedProfile?.name || sa.name,
      phone: sa.phone,
      locationName: matchedProfile?.location_name || sa.locationName,
      email: matchedProfile?.email || sa.email,
      role: matchedProfile?.role || 'employee',
      status: matchedProfile?.status || 'active',
      defaultPassword: 'khdtk' + (sa.phone ? sa.phone.replace(/[^0-9]/g, '').slice(-4) : '2026'),
    };
  });

  // Also append any extra employees registered from database not in static list
  employees.forEach((emp) => {
    const alreadyExists = accountRows.some(r => r.email.toLowerCase() === emp.email.toLowerCase());
    if (!alreadyExists && emp.role === 'employee') {
      accountRows.push({
        no: accountRows.length + 1,
        id: emp.id,
        name: emp.name,
        phone: '—',
        locationName: emp.location_name || 'KHDTK',
        email: emp.email,
        role: emp.role,
        status: emp.status,
        defaultPassword: 'khdtk' + emp.email.slice(0, 4),
      });
    }
  });

  // Filter
  const filteredRows = accountRows.filter(row => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.phone.includes(searchQuery);

    const matchesLocation =
      selectedLocation === 'all' ||
      row.locationName.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }

  function getWhatsAppText(row: StaffAccountRow, pass: string): string {
    return (
      `*KREDENSIAL AKUN PRESENSI MYRIMASA*\n` +
      `----------------------------------------\n` +
      `Yth. Bapak/Ibu *${row.name}*,\n` +
      `Berikut rincian akun Anda untuk presensi harian petugas pengamanan KHDTK:\n\n` +
      `🌐 *Akses Web:* https://rimasa.my.id\n` +
      `📧 *Email / Login:* ${row.email}\n` +
      `🔑 *Kata Sandi:* ${pass}\n` +
      `📍 *Lokasi Tugas:* ${row.locationName}\n` +
      `----------------------------------------\n` +
      `*Jadwal Presensi Harian:*\n` +
      `☀️ Pagi: 06.00 - 07.45 WIB\n` +
      `🌤️ Siang: 13.00 - 14.00 WIB\n` +
      `🌙 Sore: 16.00 - 23.59 WIB\n\n` +
      `*Langkah Presensi:*\n` +
      `1. Buka browser HP di https://rimasa.my.id\n` +
      `2. Masuk menggunakan Email dan Password di atas.\n` +
      `3. Aktifkan GPS dan izinkan akses lokasi & kamera.\n` +
      `4. Ambil foto di lokasi tugas dan kirim laporan presensi.\n\n` +
      `Anda dapat mengubah password mandiri di menu Profil setelah login.`
    );
  }

  function copySingleWaMessage(row: StaffAccountRow) {
    const pass = row.defaultPassword || 'khdtk2026';
    const text = getWhatsAppText(row, pass);
    navigator.clipboard.writeText(text);
    showToast(`✅ Format WhatsApp untuk ${row.name} berhasil disalin!`);
  }

  function openWhatsAppWeb(row: StaffAccountRow) {
    const pass = row.defaultPassword || 'khdtk2026';
    const text = encodeURIComponent(getWhatsAppText(row, pass));
    const cleanPhone = row.phone.replace(/[^0-9]/g, '');
    let targetPhone = '';
    if (cleanPhone.startsWith('0')) {
      targetPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('62')) {
      targetPhone = cleanPhone;
    }

    if (targetPhone.length >= 10) {
      window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  }

  function copyAllAccountsText() {
    let summary = `*DAFTAR KREDENSIAL AKUN PETUGAS PRESENSI MYRIMASA*\n`;
    summary += `Domain: https://rimasa.my.id\n`;
    summary += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
    summary += `--------------------------------------------------\n\n`;

    filteredRows.forEach((r, i) => {
      summary += `${i + 1}. *${r.name}*\n`;
      summary += `   • Lokasi : ${r.locationName}\n`;
      summary += `   • No. WA : ${r.phone}\n`;
      summary += `   • Email  : ${r.email}\n`;
      summary += `   • Sandi  : ${r.defaultPassword || 'khdtk2026'}\n\n`;
    });

    summary += `--------------------------------------------------\n`;
    summary += `Login di https://rimasa.my.id (Jadwal: Pagi 06.00-07.45 | Siang 13.00-14.00 | Sore 16.00-23.59)`;

    navigator.clipboard.writeText(summary);
    showToast('✅ Seluruh ringkasan tabel akun berhasil disalin ke Clipboard!');
  }

  function toggleSinglePassword(email: string) {
    setVisiblePasswordMap(prev => ({
      ...prev,
      [email]: !prev[email],
    }));
  }

  function handleOpenResetModal(row: StaffAccountRow) {
    setResetTarget(row);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setNewStaffPassword(`Rimasa#${randomDigits}`);
    setResetSuccess(false);
    setResetError('');
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    if (newStaffPassword.length < 6) {
      setResetError('Password minimal 6 karakter');
      return;
    }

    setResettingPassword(true);
    setResetError('');

    try {
      const res = await fetch(`/api/admin/employees/${resetTarget.id}/password`, {
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
      showToast(`✅ Password untuk ${resetTarget.name} berhasil diperbarui!`);
    } catch {
      setResetError('Terjadi kesalahan jaringan');
    }
    setResettingPassword(false);
  }

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toastMessage}
        </div>
      )}

      {/* Page Header (Hidden on Print) */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">🎫 Lembar Akun & Kredensial Staff</h1>
          <p className="page-subtitle">
            Daftar kredensial login akun petugas pengamanan KHDTK untuk dibagikan via WhatsApp atau dicetak.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={copyAllAccountsText}
            title="Salin semua akun dalam format teks WhatsApp"
            style={{ fontSize: '13px', padding: '9px 14px' }}
          >
            📋 Salin Semua Akun
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            title="Cetak lembar kredensial akun dalam format PDF/Kertas"
            style={{ fontSize: '13px', padding: '9px 14px' }}
          >
            🖨️ Cetak Lembar Akun (PDF)
          </button>
        </div>
      </div>

      {/* Official Print Header (Visible ONLY on Print) */}
      <div className="print-only" style={{ marginBottom: '24px', borderBottom: '2px solid #0f172a', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              LEMBAR DISTRIBUSI KREDENSIAL AKUN PETUGAS KHDTK
            </h1>
            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
              Sistem Informasi Laporan Harian & Presensi Digital MyRimasa · <strong>https://rimasa.my.id</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
            Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Info Card (Hidden on Print) */}
      <div className="no-print" style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}>
        <div style={{ fontSize: '24px', flexShrink: 0 }}>💡</div>
        <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
          <strong>Petunjuk Pembagian Akun:</strong>
          <ul style={{ paddingLeft: '18px', marginTop: '4px', margin: 0 }}>
            <li>Arahkan petugas membuka browser di HP dan ketik: <strong>https://rimasa.my.id</strong></li>
            <li>Klik tombol <strong>"📲 Bagikan via WA"</strong> untuk mengirim pesan format resmi langsung ke WhatsApp personil terkait.</li>
            <li>Klik <strong>"🎫 Slip Akun"</strong> untuk melihat kartu kredensial perorangan yang siap di-screenshot.</li>
            <li>Jika staf lupa sandi, gunakan tombol <strong>"🔑 Reset Password"</strong> untuk mengatur password baru seketika.</li>
          </ul>
        </div>
      </div>

      {/* Filter & Search Bar (Hidden on Print) */}
      <div className="no-print" style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '14px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '13px', padding: '8px 12px' }}
            placeholder="🔍 Cari nama petugas, email, atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="form-select"
            style={{ fontSize: '13px', padding: '8px 12px', width: 'auto', minWidth: '180px' }}
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="all">Semua Lokasi KHDTK</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.name}>📍 {loc.name}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '12px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
          onClick={() => setShowAllPasswords(!showAllPasswords)}
        >
          {showAllPasswords ? '🙈 Sembunyikan Semua Password' : '👁️ Tampilkan Semua Password'}
        </button>
      </div>

      {/* Main Accounts Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px', borderColor: '#cbd5e1', borderTopColor: '#1b4d3e' }} />
        </div>
      ) : (
        <div className="table-wrapper print-table-wrapper">
          <table className="data-table print-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                <th>Nama Petugas</th>
                <th>No. WhatsApp / HP</th>
                <th>Lokasi Penugasan</th>
                <th>Email (Username Login)</th>
                <th>Password / Sandi</th>
                <th className="no-print" style={{ textAlign: 'center', width: '190px' }}>Aksi Pembagian</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, idx) => {
                  const isVisible = showAllPasswords || visiblePasswordMap[row.email];
                  const passwordText = row.defaultPassword || 'khdtk2026';

                  return (
                    <tr key={row.email}>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: '#1e5631', color: '#ffffff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: '800', flexShrink: 0,
                          }}>
                            {row.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>
                              {row.name}
                            </div>
                            <div className="print-only" style={{ fontSize: '11px', color: '#64748b' }}>
                              {row.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                        {row.phone}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#0f172a'
                        }}>
                          📍 {row.locationName}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
                        {row.email}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#166534',
                            letterSpacing: isVisible ? '0.5px' : '2px',
                          }}>
                            {isVisible ? passwordText : '••••••••'}
                          </span>
                          <button
                            type="button"
                            className="no-print"
                            onClick={() => toggleSinglePassword(row.email)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: '13px', padding: '2px 4px',
                            }}
                            title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {isVisible ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </td>
                      <td className="no-print">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {/* Share via WhatsApp */}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{
                              background: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac',
                              padding: '4px 7px',
                              fontSize: '11px',
                              fontWeight: '700',
                              borderRadius: '7px',
                            }}
                            onClick={() => openWhatsAppWeb(row)}
                            title="Buka WhatsApp untuk kirim kredensial"
                          >
                            📲 Kirim WA
                          </button>

                          {/* Copy WhatsApp template */}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{
                              background: '#f8fafc',
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                              padding: '4px 6px',
                              fontSize: '11px',
                              borderRadius: '7px',
                            }}
                            onClick={() => copySingleWaMessage(row)}
                            title="Salin template pesan WhatsApp"
                          >
                            📋
                          </button>

                          {/* Slip Card */}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '4px 6px',
                              fontSize: '11px',
                              borderRadius: '7px',
                            }}
                            onClick={() => setSlipTarget(row)}
                            title="Lihat kartu slip akun"
                          >
                            🎫
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{
                              background: '#faf5ff',
                              color: '#7e22ce',
                              border: '1px solid #e9d5ff',
                              padding: '4px 6px',
                              fontSize: '11px',
                              borderRadius: '7px',
                            }}
                            onClick={() => handleOpenResetModal(row)}
                            title="Reset kata sandi"
                          >
                            🔑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center muted" style={{ padding: '30px' }}>
                    Tidak ada data yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Slip Modal: Ready to Screenshot / Share */}
      {slipTarget && (
        <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
          <div className="modal centered-modal" style={{ maxWidth: '440px', width: '92%', padding: '0', overflow: 'hidden' }}>
            {/* Slip Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1e5631 0%, #143d22 100%)',
              color: '#ffffff',
              padding: '24px 20px',
              textAlign: 'center',
              position: 'relative',
            }}>
              <button
                type="button"
                onClick={() => setSlipTarget(null)}
                style={{
                  position: 'absolute', right: '12px', top: '12px',
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                  borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
              <div style={{
                fontSize: '11px', fontWeight: '800', letterSpacing: '1px',
                textTransform: 'uppercase', color: '#86efac', marginBottom: '4px',
              }}>
                Kartu Kredensial Akun Presensi
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0' }}>
                {slipTarget.name}
              </h2>
              <div style={{ fontSize: '13px', color: '#dcfce7' }}>
                📍 {slipTarget.locationName}
              </div>
            </div>

            {/* Slip Body */}
            <div style={{ padding: '24px 20px' }}>
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    🌐 Website Akses
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af' }}>
                    https://rimasa.my.id
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    📧 Email / Username Login
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                    {slipTarget.email}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    🔑 Kata Sandi (Password)
                  </div>
                  <div style={{
                    fontSize: '16px', fontWeight: '900', color: '#166534',
                    fontFamily: 'monospace', letterSpacing: '1px',
                  }}>
                    {slipTarget.defaultPassword || 'khdtk2026'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    📱 No. Kontak / WhatsApp
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                    {slipTarget.phone}
                  </div>
                </div>
              </div>

              {/* Schedules Info */}
              <div style={{
                fontSize: '11px', color: '#475569', background: '#fef3c7',
                padding: '10px 14px', borderRadius: '10px', border: '1px solid #fde68a',
                marginBottom: '18px', lineHeight: 1.5,
              }}>
                ⏰ <strong>Jadwal Presensi:</strong><br />
                ☀️ Pagi: 06.00 – 07.45 WIB | 🌤️ Siang: 13.00 – 14.00 WIB | 🌙 Sore: 16.00 – 23.59 WIB
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                  onClick={() => {
                    openWhatsAppWeb(slipTarget);
                    setSlipTarget(null);
                  }}
                >
                  <span>📲</span>
                  <span>Kirim Kredensial via WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px' }}
                  onClick={() => copySingleWaMessage(slipTarget)}
                >
                  📋 Salin Teks Format WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="modal-overlay centered" style={{ zIndex: 9999 }}>
          <div className="modal centered-modal" style={{ maxWidth: '440px', width: '92%' }}>
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
                  <h2 className="modal-title" style={{ fontSize: '17px' }}>Reset Kata Sandi</h2>
                  <p className="modal-subtitle" style={{ fontSize: '12px' }}>
                    {resetTarget.name} ({resetTarget.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setResetTarget(null)}
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
                    <strong>Kata sandi berhasil diperbarui!</strong>
                    <div style={{ marginTop: '2px', fontSize: '12px' }}>
                      Password baru: <strong>{newStaffPassword}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      copySingleWaMessage({ ...resetTarget, defaultPassword: newStaffPassword });
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                  >
                    📋 Salin Format WhatsApp Baru
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setResetTarget(null)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px' }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                    Password Baru
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontSize: '14px' }}
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setNewStaffPassword(`Rimasa#${rand}`);
                    }}
                  >
                    🎲 Acak Baru
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                    onClick={() => setNewStaffPassword('khdtk2026')}
                  >
                    🔑 Default khdtk2026
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ flex: 1, padding: '10px', borderRadius: '10px' }}
                    onClick={() => setResetTarget(null)}
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
                    {resettingPassword ? 'Menyimpan...' : 'Simpan Password'}
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
