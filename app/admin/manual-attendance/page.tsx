'use client';

import { useState, useEffect, useCallback } from 'react';
import { ManualAttendance, Profile } from '@/lib/types';

export default function AdminManualAttendancePage() {
  const [requests, setRequests] = useState<ManualAttendance[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Modal Review States
  const [selectedRequest, setSelectedRequest] = useState<ManualAttendance | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkAdminNotes, setBulkAdminNotes] = useState('Disetujui secara massal oleh Administrator.');
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setNeedsMigration(false);
    try {
      const p = new URLSearchParams();
      if (statusFilter !== 'all') p.set('status', statusFilter);
      if (employeeFilter) p.set('employee_id', employeeFilter);

      const res = await fetch(`/api/manual-attendance?${p.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        if (json.needsMigration) {
          setNeedsMigration(true);
        }
        throw new Error(json.error || 'Gagal memuat data');
      }

      setRequests(json.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, employeeFilter]);

  useEffect(() => {
    fetchRequests();
    fetch('/api/admin/employees')
      .then(r => r.json())
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [fetchRequests]);

  // Clear selections when filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter, employeeFilter]);

  const handleOpenReview = (req: ManualAttendance, action: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setReviewAction(action);
    setAdminNotes(action === 'approve' ? 'Disetujui oleh Administrator.' : '');
    setReviewError('');
  };

  const handleCloseReview = () => {
    setSelectedRequest(null);
    setReviewAction(null);
    setAdminNotes('');
    setReviewError('');
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !reviewAction) return;
    if (reviewAction === 'reject' && !adminNotes.trim()) {
      setReviewError('Harap berikan alasan penolakan agar petugas memahami penyebabnya.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');

    try {
      const res = await fetch(`/api/manual-attendance/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          admin_notes: adminNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memproses review');
      }

      handleCloseReview();
      fetchRequests();
    } catch (err: any) {
      setReviewError(err.message || 'Terjadi kesalahan saat memproses review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Bulk Actions
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const allPendingSelected = pendingRequests.length > 0 && pendingRequests.every(r => selectedIds.includes(r.id));

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRequests.map(r => r.id));
    }
  };

  const handleOpenBulkApprove = (preselectIds?: string[]) => {
    if (preselectIds && preselectIds.length > 0) {
      setSelectedIds(preselectIds);
    }
    setBulkAdminNotes('Disetujui secara massal oleh Administrator.');
    setBulkError('');
    setBulkModalOpen(true);
  };

  const handleCloseBulkApprove = () => {
    setBulkModalOpen(false);
    setBulkError('');
  };

  const handleExecuteBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setSubmittingBulk(true);
    setBulkError('');

    try {
      const res = await fetch('/api/manual-attendance/bulk-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          action: 'approve',
          admin_notes: bulkAdminNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memproses approval massal');
      }

      setBulkModalOpen(false);
      setSelectedIds([]);
      fetchRequests();
    } catch (err: any) {
      setBulkError(err?.message || 'Terjadi kesalahan saat memproses approval massal');
    } finally {
      setSubmittingBulk(false);
    }
  };

  const getSessionBadge = (session: string) => {
    if (session === 'morning') return <span className="badge badge-morning">Pagi</span>;
    if (session === 'evening') return <span className="badge badge-evening">Sore</span>;
    return <span className="badge badge-special">Insidentil</span>;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Approval Absen Manual</h1>
          <p className="page-subtitle">
            Verifikasi dan berikan persetujuan untuk pengajuan presensi manual atau keterlambatan staff.
          </p>
        </div>
      </div>

      {/* Migration Notice if table does not exist */}
      {needsMigration && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: '700', fontSize: '14px' }}>
            <span>⚠️</span>
            <span>Tabel Database Belum Dibuat di Supabase</span>
          </div>
          <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '8px 0 12px', lineHeight: 1.5 }}>
            Fitur absen manual memerlukan tabel baru di database. Silakan buka <strong>Supabase Dashboard &gt; SQL Editor</strong>, lalu jalankan script dari file:
            <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>supabase/migrations/008_manual_attendance.sql</code>
          </p>
          <button
            onClick={fetchRequests}
            className="btn btn-primary btn-sm"
          >
            Coba Muat Ulang Setelah Menjalankan SQL
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: statusFilter === 'pending' ? '#ffffff' : 'transparent',
              color: statusFilter === 'pending' ? '#0f172a' : '#64748b',
              fontWeight: statusFilter === 'pending' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: statusFilter === 'pending' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Menunggu Review {pendingCount > 0 && <span style={{ background: '#f59e0b', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '10px', marginLeft: '4px' }}>{pendingCount}</span>}
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: statusFilter === 'approved' ? '#ffffff' : 'transparent',
              color: statusFilter === 'approved' ? '#0f172a' : '#64748b',
              fontWeight: statusFilter === 'approved' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: statusFilter === 'approved' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Disetujui
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: statusFilter === 'rejected' ? '#ffffff' : 'transparent',
              color: statusFilter === 'rejected' ? '#0f172a' : '#64748b',
              fontWeight: statusFilter === 'rejected' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: statusFilter === 'rejected' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Ditolak
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: statusFilter === 'all' ? '#ffffff' : 'transparent',
              color: statusFilter === 'all' ? '#0f172a' : '#64748b',
              fontWeight: statusFilter === 'all' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: statusFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Semua
          </button>
        </div>

        {/* Filter Petugas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
            Petugas:
          </label>
          <select
            className="form-select"
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            style={{ width: '200px', fontSize: '13px', padding: '6px 10px' }}
          >
            <option value="">Semua Petugas</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when there are pending requests and statusFilter is pending or all) */}
      {pendingRequests.length > 0 && (statusFilter === 'pending' || statusFilter === 'all') && (
        <div
          style={{
            background: selectedIds.length > 0 ? '#f0fdf4' : '#f8fafc',
            border: selectedIds.length > 0 ? '1.5px solid #86efac' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: selectedIds.length > 0 ? '0 2px 4px rgba(22, 163, 74, 0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e293b', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={allPendingSelected}
                onChange={handleSelectAllPending}
                style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#15803d' }}
              />
              <span>Pilih Semua yang Menunggu Review ({pendingRequests.length})</span>
            </label>

            {selectedIds.length > 0 && (
              <span style={{ fontSize: '12px', background: '#dcfce7', color: '#15803d', fontWeight: '700', padding: '2px 8px', borderRadius: '12px' }}>
                {selectedIds.length} dipilih
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedIds.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Batal Pilih
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenBulkApprove()}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#15803d',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <span>✓</span>
                  <span>Setujui {selectedIds.length} Terpilih (Bulk Approve)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenBulkApprove(pendingRequests.map(r => r.id))}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #86efac',
                  background: '#ffffff',
                  color: '#15803d',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⚡</span>
                <span>Setujui Semua Menunggu Review ({pendingRequests.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '14px' }}>
          <div style={{ width: '24px', height: '24px', border: '3px solid #0284c7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Memuat daftar pengajuan absen manual...
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📋</div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', margin: '0 0 6px' }}>
            Tidak ada pengajuan absen manual
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {statusFilter === 'pending'
              ? 'Semua pengajuan absen manual telah ditinjau.'
              : 'Tidak ditemukan data pengajuan dengan filter saat ini.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map(req => (
            <div
              key={req.id}
              style={{
                background: selectedIds.includes(req.id) ? '#fafffd' : '#ffffff',
                border: selectedIds.includes(req.id) ? '2px solid #16a34a' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: selectedIds.includes(req.id) ? '0 4px 6px -1px rgba(22, 163, 74, 0.1)' : '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'border 0.15s, background 0.15s',
              }}
            >
              {/* Card Header: Checkbox (if pending), Petugas, Tanggal, Sesi, Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {req.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(req.id)}
                      onChange={() => handleToggleSelect(req.id)}
                      title="Pilih pengajuan ini"
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#15803d' }}
                    />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                      {req.profiles?.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {req.profiles?.name || 'Petugas'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {req.profiles?.email} • Lokasi: {req.locations?.name || req.location_name || 'KHDTK'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      {req.report_date}
                    </span>
                    {getSessionBadge(req.session_type)}
                    <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: '600' }}>
                      Jam {req.actual_time ? req.actual_time.substring(0, 5) : '—'} WIB
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Diajukan pada: {new Date(req.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Replacement Badge / Banner */}
              {req.replaces_report_id ? (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>🔄</span>
                  <div>
                    <strong>Penggantian Presensi (Replace):</strong> Petugas ini sudah memiliki presensi di hari &amp; sesi tersebut. Menyetujui pengajuan ini akan <u>me-replace</u> data presensi lama.
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>➕</span>
                  <div>
                    <strong>Presensi Susulan:</strong> Belum ada presensi tercatat di hari &amp; sesi ini. Menyetujui akan membuat data kehadiran baru.
                  </div>
                </div>
              )}

              {/* Alasan Pengisian Manual (CRITICAL BOX) */}
              <div style={{ background: '#f8fafc', borderLeft: '4px solid #f59e0b', padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: '14px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: '#b45309', marginBottom: '2px' }}>
                  Alasan Keterlambatan / Isi Manual:
                </div>
                <div style={{ fontSize: '13px', color: '#1e293b', fontStyle: 'italic' }}>
                  &quot;{req.reason}&quot;
                </div>
              </div>

              {/* Activities Detail */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px', fontSize: '12px' }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Kegiatan Rutin:</span>
                  <div style={{ color: '#0f172a', marginTop: '2px' }}>{req.routine_activity || '—'}</div>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Kegiatan Insidentil:</span>
                  <div style={{ color: '#0f172a', marginTop: '2px' }}>{req.incident_activity || 'Nihil'}</div>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Kondisi Lapangan:</span>
                  <div style={{ color: '#0f172a', marginTop: '2px' }}>{req.field_condition || '—'}</div>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Tindak Lanjut:</span>
                  <div style={{ color: '#0f172a', marginTop: '2px' }}>{req.follow_up || '—'}</div>
                </div>
              </div>

              {/* Foto Bukti Dokumentasi */}
              {req.manual_attendance_files && req.manual_attendance_files.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Foto Bukti Dokumentasi ({req.manual_attendance_files.length}):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {req.manual_attendance_files.map((file, fIdx) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          const src = file.drive_url ? `/api/proxy-image?url=${encodeURIComponent(file.drive_url)}` : null;
                          if (src) setPreviewImage(src);
                        }}
                        style={{
                          width: '90px',
                          height: '70px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                          background: '#f1f5f9',
                          cursor: file.drive_url ? 'pointer' : 'default',
                          position: 'relative',
                        }}
                        title="Klik untuk perbesar"
                      >
                        {file.drive_url ? (
                          <img
                            src={`/api/proxy-image?url=${encodeURIComponent(file.drive_url)}`}
                            alt={`Bukti ${fIdx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>
                            Sinkronisasi...
                          </div>
                        )}
                        <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '8px', padding: '1px 3px', borderRadius: '2px' }}>
                          F{fIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status & Review Action Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <div>
                  {req.status === 'approved' && (
                    <div style={{ fontSize: '12.5px', color: '#15803d', fontWeight: '600' }}>
                      ✓ Telah Disetujui {req.reviewed_at && `pada ${new Date(req.reviewed_at).toLocaleDateString('id-ID')}`}
                      {req.admin_notes && <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '400', marginTop: '2px' }}>Catatan: {req.admin_notes}</div>}
                    </div>
                  )}

                  {req.status === 'rejected' && (
                    <div style={{ fontSize: '12.5px', color: '#b91c1c', fontWeight: '600' }}>
                      ✕ Telah Ditolak {req.reviewed_at && `pada ${new Date(req.reviewed_at).toLocaleDateString('id-ID')}`}
                      {req.admin_notes && <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '400', marginTop: '2px' }}>Alasan: {req.admin_notes}</div>}
                    </div>
                  )}

                  {req.status === 'pending' && (
                    <span style={{ fontSize: '12.5px', color: '#b45309', fontWeight: '600' }}>
                      ⏳ Menunggu Keputusan Administrator
                    </span>
                  )}
                </div>

                {/* Buttons for Pending */}
                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenReview(req, 'reject')}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Tolak
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenReview(req, 'approve')}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#15803d',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Setujui (Approve)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =======================================================
          MODAL: APPROVE / REJECT CONFIRMATION
         ======================================================= */}
      {selectedRequest && reviewAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: reviewAction === 'approve' ? '#15803d' : '#b91c1c', margin: '0 0 8px' }}>
              {reviewAction === 'approve' ? 'Setujui Pengajuan Absen Manual?' : 'Tolak Pengajuan Absen Manual?'}
            </h3>

            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
              {reviewAction === 'approve'
                ? `Anda akan menyetujui presensi manual atas nama ${selectedRequest.profiles?.name} untuk tanggal ${selectedRequest.report_date} (${selectedRequest.session_type}). ${selectedRequest.replaces_report_id ? 'Data presensi lama pada sesi ini akan otomatis DIGANTIKAN (REPLACED).' : 'Data kehadiran baru akan dicatat.'}`
                : `Pengajuan absen manual atas nama ${selectedRequest.profiles?.name} akan ditolak. Berikan catatan alasan penolakan.`}
            </p>

            {reviewError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                ⚠️ {reviewError}
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                {reviewAction === 'approve' ? 'Catatan Admin (Opsional):' : 'Alasan Penolakan (Wajib):'}
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={reviewAction === 'approve' ? 'Contoh: Disetujui, bukti kegiatan lapangan valid.' : 'Contoh: Foto tidak sesuai penugasan atau waktu tidak valid...'}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseReview}
                disabled={submittingReview}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: reviewAction === 'approve' ? '#15803d' : '#b91c1c',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: submittingReview ? 'not-allowed' : 'pointer',
                }}
              >
                {submittingReview ? 'Memproses...' : reviewAction === 'approve' ? 'Ya, Setujui' : 'Tolak Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: BULK APPROVE CONFIRMATION
         ======================================================= */}
      {bulkModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#15803d', margin: 0 }}>
                Setujui Massal (Bulk Approve)
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 14px', lineHeight: 1.5 }}>
              Anda akan menyetujui sekaligus <strong>{selectedIds.length} pengajuan absen manual</strong>. Seluruh presensi akan langsung diperbarui di database dan tercatat sebagai presensi yang sah.
            </p>

            {bulkError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px' }}>
                ⚠️ {bulkError}
              </div>
            )}

            {/* List preview of requests being approved */}
            <div style={{ maxHeight: '160px', overflowY: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px' }}>
              <div style={{ fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Daftar Pengajuan yang Akan Disetujui ({selectedIds.length}):
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {requests
                  .filter(r => selectedIds.includes(r.id))
                  .map(r => (
                    <li key={r.id} style={{ color: '#1e293b' }}>
                      <strong>{r.profiles?.name || 'Petugas'}</strong> — {r.report_date} ({r.session_type === 'morning' ? 'Pagi' : r.session_type === 'evening' ? 'Sore' : 'Insidentil'})
                      {r.replaces_report_id && <span style={{ color: '#b45309', marginLeft: '6px', fontSize: '11px', fontWeight: '600' }}>(Replace)</span>}
                    </li>
                  ))}
              </ul>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Catatan Administrator untuk Seluruh Pengajuan:
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={bulkAdminNotes}
                onChange={e => setBulkAdminNotes(e.target.value)}
                placeholder="Contoh: Disetujui secara massal oleh Administrator."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseBulkApprove}
                disabled={submittingBulk}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkApprove}
                disabled={submittingBulk}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#15803d',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: submittingBulk ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {submittingBulk ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span>Menyetujui {selectedIds.length} Pengajuan...</span>
                  </>
                ) : (
                  <span>Ya, Setujui Semua ({selectedIds.length})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: FULL IMAGE PREVIEW
         ======================================================= */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={previewImage}
              alt="Preview Dokumentasi"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
