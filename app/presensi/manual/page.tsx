'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Location, Profile, SessionType } from '@/lib/types';

interface ExistingReportInfo {
  id: string;
  timestamp: string;
  routine_activity: string | null;
  locations?: { name: string } | null;
}

interface MyManualAttendanceItem {
  id: string;
  report_date: string;
  session_type: string;
  actual_time: string;
  location_name: string;
  routine_activity: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  replaces_report_id: string | null;
  manual_attendance_files?: Array<{ id: string; file_name: string; drive_url: string | null }>;
}

export default function ManualAttendancePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [history, setHistory] = useState<MyManualAttendanceItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form states
  const [reportDate, setReportDate] = useState(() => {
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().split('T')[0];
  });
  const [sessionType, setSessionType] = useState<SessionType>('morning');
  const [actualTime, setActualTime] = useState('07:15');
  const [locationId, setLocationId] = useState('');
  const [reason, setReason] = useState('');
  const [routineActivity, setRoutineActivity] = useState('');
  const [incidentActivity, setIncidentActivity] = useState('Nihil');
  const [fieldCondition, setFieldCondition] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Replacement detection
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingReport, setExistingReport] = useState<ExistingReportInfo | null>(null);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user profile & locations
  useEffect(() => {
    Promise.all([
      fetch('/api/locations').then(r => r.json()).catch(() => []),
      fetch('/api/manual-attendance').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([locData, histData]) => {
      setLocations(Array.isArray(locData) ? locData : []);
      setHistory(histData.data || []);
      setLoadingHistory(false);
    });

    // Check user session
    fetch('/api/init-admin')
      .then(r => r.json())
      .catch(() => null);
  }, []);

  // Check if attendance already exists on selected date & session
  const checkExistingAttendance = useCallback(async (date: string, session: string) => {
    if (!date || !session) return;
    setCheckingExisting(true);
    try {
      const res = await fetch(`/api/manual-attendance/check-existing?date=${date}&session=${session}`);
      const json = await res.json();
      if (json.exists && json.report) {
        setExistingReport(json.report);
      } else {
        setExistingReport(null);
      }
    } catch {
      setExistingReport(null);
    } finally {
      setCheckingExisting(false);
    }
  }, []);

  useEffect(() => {
    checkExistingAttendance(reportDate, sessionType);
  }, [reportDate, sessionType, checkExistingAttendance]);

  // Adjust default time when session changes
  const handleSessionChange = (newSession: SessionType) => {
    setSessionType(newSession);
    if (newSession === 'morning') setActualTime('07:00');
    else if (newSession === 'evening') setActualTime('17:00');
    else if (newSession === 'special') setActualTime('12:00');
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(newFiles);

    // Create previews
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setFilePreviews(previews);
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    const updatedPreviews = updatedFiles.map(f => URL.createObjectURL(f));
    setFilePreviews(updatedPreviews);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!reason.trim()) {
      setErrorMessage('Alasan keterlambatan / pengisian absen manual wajib diisi.');
      return;
    }
    if (!routineActivity.trim()) {
      setErrorMessage('Kolom Kegiatan Rutin wajib diisi.');
      return;
    }
    if (!fieldCondition.trim()) {
      setErrorMessage('Kolom Kondisi Lapangan wajib diisi.');
      return;
    }
    if (!followUp.trim()) {
      setErrorMessage('Kolom Tindak Lanjut wajib diisi.');
      return;
    }
    if (selectedFiles.length === 0) {
      setErrorMessage('Minimal lampirkan 1 foto dokumentasi / bukti kehadiran.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('report_date', reportDate);
      formData.append('session_type', sessionType);
      formData.append('actual_time', actualTime);
      formData.append('location_id', locationId);
      formData.append('reason', reason);
      formData.append('routine_activity', routineActivity);
      formData.append('incident_activity', incidentActivity || 'Nihil');
      formData.append('field_condition', fieldCondition);
      formData.append('follow_up', followUp);

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/manual-attendance', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengirim pengajuan absen manual');
      }

      setSuccessMessage('Pengajuan absen manual berhasil dikirim! Menunggu persetujuan (approval) dari Administrator.');
      
      // Reset form
      setReason('');
      setRoutineActivity('');
      setIncidentActivity('Nihil');
      setFieldCondition('');
      setFollowUp('');
      setSelectedFiles([]);
      setFilePreviews([]);

      // Refresh history
      const histRes = await fetch('/api/manual-attendance');
      const histJson = await histRes.json();
      setHistory(histJson.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const getSessionBadge = (session: string) => {
    if (session === 'morning') return <span className="badge badge-morning">Pagi</span>;
    if (session === 'evening') return <span className="badge badge-evening">Sore</span>;
    return <span className="badge badge-special">Insidentil</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
          ✓ Disetujui
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
          ✕ Ditolak
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
        ⏳ Menunggu Approval
      </span>
    );
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '720px' }}>
        {/* Top Header */}
        <div style={{ marginBottom: '16px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
            ← Kembali ke Beranda
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '8px 0 4px' }}>
            Pengajuan Absen Manual
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Gunakan formulir ini jika Anda terlambat presensi atau memerlukan koreksi/penggantian presensi pada tanggal tertentu.
          </p>
        </div>

        {/* Info Card Banner */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '12.5px', color: '#166534', lineHeight: 1.5 }}>
          <strong>ℹ️ Informasi Penting:</strong> Setiap pengajuan absen manual akan ditinjau dan disetujui terlebih dahulu oleh Administrator. Jika disetujui, data presensi resmi akan diperbarui secara otomatis.
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#166534', fontSize: '13px', fontWeight: '500' }}>
            ✅ {successMessage}
          </div>
        )}

        {/* Main Submission Form */}
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
            Formulir Presensi Manual
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {/* Tanggal Presensi */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Tanggal Presensi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                required
              />
            </div>

            {/* Sesi Presensi */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Sesi Presensi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="form-select"
                value={sessionType}
                onChange={e => handleSessionChange(e.target.value as SessionType)}
                required
              >
                <option value="morning">Presensi Pagi (06.00 – 08.00)</option>
                <option value="evening">Presensi Sore (16.00 – 23.59)</option>
                <option value="special">Laporan Insidentil (24 Jam)</option>
              </select>
            </div>
          </div>

          {/* Replacement Warning / Status Notification */}
          {checkingExisting ? (
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', fontStyle: 'italic' }}>
              Memeriksa data presensi pada tanggal & sesi ini...
            </div>
          ) : existingReport ? (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#92400e' }}>
              <div style={{ fontWeight: '700', marginBottom: '2px' }}>
                ⚠️ Perhatian: Data Presensi Sudah Ada
              </div>
              <div>
                Anda sudah memiliki presensi pada tanggal dan sesi ini ({existingReport.routine_activity ? `"${existingReport.routine_activity.substring(0, 50)}..."` : 'Tercatat'}).
              </div>
              <div style={{ marginTop: '4px', fontWeight: '600', color: '#b45309' }}>
                Pengajuan absen manual ini akan <u>MENGGANTIKAN (REPLACE)</u> data presensi lama tersebut setelah disetujui oleh Administrator.
              </div>
            </div>
          ) : (
            <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#1e40af' }}>
              ℹ️ Belum ada presensi tercatat pada sesi ini. Pengajuan ini akan dimasukkan sebagai kehadiran baru setelah disetujui.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {/* Waktu / Jam Aktual */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Waktu / Jam Aktual <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="time"
                className="form-input"
                value={actualTime}
                onChange={e => setActualTime(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Waktu riil pelaksanaan kegiatan di lapangan</span>
            </div>

            {/* Lokasi Penugasan */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Lokasi Penugasan
              </label>
              <select
                className="form-select"
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
              >
                <option value="">Lokasi Terdaftar (Default)</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Alasan Absen Manual (CRUCIAL) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
              Alasan Terlambat / Pengisian Absen Manual <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Jelaskan alasan mengapa terlambat atau mengisi secara manual (contoh: Blank spot sinyal di petak 4, perangkat smartphone error, tugas darurat, dll)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />
          </div>

          {/* Kegiatan Rutin */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Kegiatan Rutin <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Uraikan kegiatan rutin yang dilakukan..."
              value={routineActivity}
              onChange={e => setRoutineActivity(e.target.value)}
              required
            />
          </div>

          {/* Kegiatan Insidentil */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Kegiatan Insidentil
            </label>
            <input
              type="text"
              className="form-input"
              placeholder='Tulis "Nihil" jika tidak ada kegiatan khusus'
              value={incidentActivity}
              onChange={e => setIncidentActivity(e.target.value)}
            />
          </div>

          {/* Kondisi Lapangan */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Hasil Kondisi di Lapangan <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Jelaskan kondisi cuaca, keamanan, atau situasi tegakan/hutan..."
              value={fieldCondition}
              onChange={e => setFieldCondition(e.target.value)}
              required
            />
          </div>

          {/* Tindak Lanjut */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Tindak Lanjut / Usulan <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Rencana tindak lanjut atau usulan..."
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              required
            />
          </div>

          {/* Upload Foto Dokumentasi */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
              Foto Dokumentasi Lapangan (1 – 5 Foto) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 10px' }}>
              Lampirkan foto bukti kegiatan sebagai dokumentasi verifikasi admin.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Thumbnail previews */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {filePreviews.map((preview, idx) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <img src={preview} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {selectedFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '6px',
                    border: '1px dashed #94a3b8',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '11px',
                    gap: '4px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Tambah</span>
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600' }}
          >
            {submitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Absen Manual'}
          </button>
        </form>

        {/* =======================================================
            RIWAYAT PENGAJUAN SAYA
           ======================================================= */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
            Riwayat Pengajuan Absen Manual Saya
          </h2>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
              Memuat riwayat pengajuan...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
              Belum ada riwayat pengajuan absen manual.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    background: item.status === 'approved' ? '#f0fdf4' : item.status === 'rejected' ? '#fef2f2' : '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>
                          {item.report_date}
                        </span>
                        {getSessionBadge(item.session_type)}
                        <span style={{ fontSize: '12px', color: '#475569' }}>
                          Jam {item.actual_time ? item.actual_time.substring(0, 5) : '—'}
                        </span>
                      </div>
                      {item.replaces_report_id && (
                        <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: '500' }}>
                          ↳ Penggantian (Replace) Presensi Sebelumnya
                        </div>
                      )}
                    </div>
                    <div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '6px' }}>
                    <strong>Alasan:</strong> {item.reason}
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <strong>Kegiatan:</strong> {item.routine_activity}
                  </div>

                  {item.admin_notes && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px', fontSize: '11.5px', color: '#334155' }}>
                      <strong>Catatan Admin:</strong> {item.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
