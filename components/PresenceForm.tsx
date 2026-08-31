'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Location, Profile, SessionType, GpsData } from '@/lib/types';
import { getAssignedLocationName } from '@/lib/staff-assignments';
import { compressFiles } from '@/lib/image-compression';
import { formatWibDate, formatWibTime } from '@/lib/time';
import Link from 'next/link';

interface PresenceFormProps {
  session: SessionType;
  profile: Profile;
  cameraOnly?: boolean;
}

const sessionConfig: Record<SessionType, { label: string; emoji: string }> = {
  morning: { label: 'Pagi', emoji: '☀️' },
  evening: { label: 'Sore', emoji: '🌙' },
  special: { label: 'Kejadian Khusus', emoji: '⚠️' },
};

export default function PresenceForm({ session, profile, cameraOnly = false }: PresenceFormProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const standardInputRef = useRef<HTMLInputElement>(null);

  // Auto-assigned location name from table
  const assignedLoc = getAssignedLocationName(profile.email, profile.name);
  const initialLocName = profile.location_name || assignedLoc || '';

  // Form state
  const [locationId, setLocationId] = useState(profile.location_id || '');
  const [routineActivity, setRoutineActivity] = useState('');
  const [incidentActivity, setIncidentActivity] = useState('Nihil');
  const [fieldCondition, setFieldCondition] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Data state
  const [locations, setLocations] = useState<Location[]>([]);
  const [gpsData, setGpsData] = useState<GpsData | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedAt, setSubmittedAt] = useState('');

  const currentConfig = sessionConfig[session] || { label: session, emoji: '📝' };
  const sessionLabel = currentConfig.label;
  const sessionEmoji = currentConfig.emoji;

  // Fetch locations to bind locationId automatically
  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setLocations(list);

        const targetName = (profile.location_name || assignedLoc || '').toLowerCase();
        if (targetName) {
          const match = list.find((l: Location) => l.name.toLowerCase() === targetName);
          if (match) {
            setLocationId(match.id);
            return;
          }
        }

        if (!locationId && profile.location_id) {
          setLocationId(profile.location_id);
        }
      })
      .catch(() => {});
  }, [locationId, profile.location_id, profile.location_name, assignedLoc]);

  // Find user's location name
  const matchedLocation = locations.find(l => l.id === locationId);
  const displayLocationName = profile.location_name || assignedLoc || matchedLocation?.name || (profile.location_id ? 'Lokasi Penugasan' : 'KHDTK Penugasan');

  // Auto-request GPS
  const requestGps = useCallback(() => {
    setGpsStatus('loading');
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError('Browser tidak mendukung GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const timestamp = new Date(pos.timestamp).toISOString();
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        // Try reverse geocode with Nominatim
        let address = '';
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`,
            { headers: { 'User-Agent': 'MyRimasa/1.0' } }
          );
          const geoData = await geoRes.json();
          address = geoData.display_name || '';
        } catch {
          // address stays empty
        }

        setGpsData({ latitude, longitude, timestamp, address, mapsUrl });
        setGpsStatus('success');
      },
      (err) => {
        setGpsStatus('error');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Izin lokasi ditolak. Aktifkan GPS dan izinkan akses lokasi di browser Anda.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Lokasi tidak tersedia. Pastikan GPS aktif.');
            break;
          case err.TIMEOUT:
            setGpsError('Waktu GPS habis. Coba lagi.');
            break;
          default:
            setGpsError('Gagal mendapatkan lokasi. Coba lagi.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    requestGps();
  }, [requestGps]);

  // File handling
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    await addFiles(selected);
    // Reset input so same file can be chosen again if needed
    e.target.value = '';
  }

  async function addFiles(newFiles: File[]) {
    if (newFiles.length === 0) return;
    
    // Automatically downscale and compress camera photos in browser (e.g. 10MB -> 200KB)
    const compressed = await compressFiles(newFiles);
    const combined = [...files, ...compressed].slice(0, 5);
    setFiles(combined);

    // Generate previews
    combined.forEach((file, idx) => {
      if (filePreviews[idx]) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => {
          const next = [...prev];
          next[idx] = reader.result as string;
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function removeFile(idx: number) {
    const newFiles = files.filter((_, i) => i !== idx);
    const newPreviews = filePreviews.filter((_, i) => i !== idx);
    setFiles(newFiles);
    setFilePreviews(newPreviews);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    await addFiles(dropped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    // Validate GPS
    if (gpsStatus !== 'success' || !gpsData) {
      setSubmitError('Lokasi GPS belum terdeteksi. Harap izinkan akses lokasi (GPS) terlebih dahulu.');
      return;
    }

    // Validate 4 text fields
    if (!routineActivity.trim()) {
      setSubmitError('Kolom "Kegiatan Rutin yang dilaksanakan" wajib diisi.');
      return;
    }
    if (!incidentActivity.trim()) {
      setSubmitError('Kolom "Kegiatan Insidentil yang dilaksanakan" wajib diisi (tulis "Nihil" jika tidak ada).');
      return;
    }
    if (!fieldCondition.trim()) {
      setSubmitError('Kolom "Hasil Kondisi di lapangan" wajib diisi.');
      return;
    }
    if (!followUp.trim()) {
      setSubmitError('Kolom "Tindak Lanjut/Usulan" wajib diisi.');
      return;
    }

    // Validate files
    if (files.length === 0) {
      setSubmitError('Minimal satu foto/video wajib diupload.');
      return;
    }

    // Use embedded location or matched location
    let finalLocationId = locationId || profile.location_id;
    if (!finalLocationId && displayLocationName && locations.length > 0) {
      const match = locations.find(l => l.name.toLowerCase() === displayLocationName.toLowerCase());
      if (match) finalLocationId = match.id;
    }

    setSubmitting(true);

    // Final check compress files
    const readyFiles = await compressFiles(files);

    const formData = new FormData();
    formData.append('session_type', session);
    formData.append('location_id', finalLocationId || '');
    formData.append('location_name', displayLocationName || '');
    formData.append('routine_activity', routineActivity);
    formData.append('incident_activity', incidentActivity);
    formData.append('field_condition', fieldCondition);
    formData.append('follow_up', followUp);
    formData.append('latitude', String(gpsData.latitude));
    formData.append('longitude', String(gpsData.longitude));
    formData.append('address', gpsData.address || '');
    formData.append('gps_timestamp', gpsData.timestamp);
    // User local timezone offset in minutes (e.g. -420 for WIB, -480 for WITA, -540 for WIT)
    formData.append('timezone_offset', String(new Date().getTimezoneOffset()));
    readyFiles.forEach(file => formData.append('files', file));

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Gagal mengirim laporan');
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      setSubmittedAt(data.timestamp);
    } catch {
      setSubmitError('Terjadi kesalahan jaringan. Coba lagi.');
      setSubmitting(false);
    }
  }

  // ===== SUCCESS STATE (Modern Digital Receipt Card) =====
  if (submitSuccess) {
    const formattedTime = submittedAt ? formatWibTime(submittedAt) : 'Baru saja';
    const formattedDate = submittedAt ? formatWibDate(submittedAt) : formatWibDate(new Date().toISOString());

    return (
      <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px', maxWidth: '440px', margin: '0 auto' }}>
        {/* Main Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '32px 24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.07)',
          textAlign: 'center',
          animation: 'modalFadeIn 0.3s ease-out',
        }}>
          {/* Animated Success Checkmark Badge */}
          <div style={{
            width: '76px',
            height: '76px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '3px solid #86efac',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px -4px rgba(34, 197, 94, 0.35)',
          }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#0f172a',
            marginBottom: '6px',
            letterSpacing: '-0.3px',
          }}>
            Presensi Berhasil!
          </h2>

          <p style={{
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '24px',
            lineHeight: 1.4,
          }}>
            Laporan presensi <strong>{sessionLabel}</strong> Anda telah berhasil diverifikasi dan tersimpan.
          </p>

          {/* Digital Receipt Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '18px 16px',
            textAlign: 'left',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              marginBottom: '12px',
              borderBottom: '1px dashed #cbd5e1',
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                BUKTI PRESENSI DIGITAL
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#166534',
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '100px',
              }}>
                ✓ Terverifikasi
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Karyawan</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{profile.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Sesi</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{sessionEmoji} {sessionLabel}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Waktu Presensi</span>
                <span style={{ fontWeight: '700', color: '#166534' }}>⏱️ {formattedTime}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Tanggal</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{formattedDate}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Lokasi KHDTK</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>📍 {displayLocationName || 'KHDTK'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Dokumentasi</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>📷 {files.length} Foto Tersimpan</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href="/"
              id="btn-back-home-success"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: '14px',
                background: '#166534',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '800',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(22, 101, 52, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              🏠 Kembali ke Beranda
            </Link>

            {session === 'special' && (
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setFiles([]);
                  setFilePreviews([]);
                  setRoutineActivity('');
                  setIncidentActivity('Nihil');
                  setFieldCondition('');
                  setFollowUp('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                ➕ Input Laporan Khusus Lain
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== FORM =====
  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/" style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          ← Kembali
        </Link>
        <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          {sessionEmoji} Presensi {sessionLabel}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Isi laporan harian Anda dengan lengkap
        </p>
      </div>

      {submitError && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="form-presensi">
        {/* Info Karyawan */}
        <div className="form-section">
          <div className="form-section-title">👤 Informasi Karyawan</div>
          <div className="form-group">
            <label className="form-label" htmlFor="field-name">Nama Lengkap</label>
            <input
              id="field-name"
              type="text"
              className="form-input"
              value={profile.name}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="field-email">Email</label>
            <input
              id="field-email"
              type="email"
              className="form-input"
              value={profile.email}
              readOnly
              aria-readonly="true"
            />
          </div>
        </div>

        {/* Lokasi KHDTK (Terkunci Otomatis Sesuai Penugasan) */}
        <div className="form-section">
          <div className="form-section-title">📍 Lokasi KHDTK</div>
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                📍 {displayLocationName || 'KHDTK Penugasan'}
              </div>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600', marginTop: '2px' }}>
                🔒 Lokasi penugasan terhubung otomatis dengan akun Anda
              </div>
            </div>
            <span className="badge badge-morning" style={{ fontSize: '11px', flexShrink: 0 }}>
              Otomatis
            </span>
          </div>
        </div>

        {/* GPS */}
        <div className="form-section">
          <div className="form-section-title">🛰️ Lokasi GPS</div>
          {gpsStatus === 'idle' && (
            <div className="gps-status loading">
              <div className="gps-pulse" />
              Menunggu GPS...
            </div>
          )}
          {gpsStatus === 'loading' && (
            <div className="gps-status loading">
              <div className="gps-pulse" />
              Mendeteksi lokasi Anda...
            </div>
          )}
          {gpsStatus === 'success' && gpsData && (
            <div className="gps-status success">
              <span>📍</span>
              <div>
                <div style={{ fontWeight: '600' }}>Lokasi berhasil terdeteksi</div>
                <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.8 }}>
                  {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}
                </div>
                {gpsData.address && (
                  <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.7, lineHeight: '1.4' }}>
                    {gpsData.address.substring(0, 80)}...
                  </div>
                )}
              </div>
            </div>
          )}
          {gpsStatus === 'error' && (
            <div>
              <div className="gps-status error" style={{ marginBottom: '10px' }}>
                <span>❌</span>
                <span>{gpsError}</span>
              </div>
              <button
                type="button"
                id="btn-retry-gps"
                className="btn btn-secondary btn-sm"
                onClick={requestGps}
              >
                🔄 Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Laporan Kegiatan */}
        <div className="form-section">
          <div className="form-section-title">📋 Laporan Kegiatan</div>

          <div className="form-group">
            <label className="form-label" htmlFor="field-routine">
              Kegiatan Rutin yang dilaksanakan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="field-routine"
              className="form-textarea"
              placeholder="Contoh: Patroli keliling area KHDTK, pemeriksaan pos jaga, dll."
              value={routineActivity}
              onChange={e => setRoutineActivity(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="field-incident">
              Kegiatan Insidentil yang dilaksanakan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="field-incident"
              className="form-textarea"
              placeholder="Tuliskan 'Nihil' jika tidak ada"
              value={incidentActivity}
              onChange={e => setIncidentActivity(e.target.value)}
              required
              rows={3}
            />
            <div className="form-hint">Jika tidak ada kegiatan insidentil, tulis "Nihil"</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="field-condition">
              Hasil Kondisi di lapangan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="field-condition"
              className="form-textarea"
              placeholder="Deskripsikan kondisi lapangan yang ditemukan..."
              value={fieldCondition}
              onChange={e => setFieldCondition(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="field-followup">
              Tindak Lanjut/Usulan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="field-followup"
              className="form-textarea"
              placeholder="Tuliskan tindak lanjut atau usulan yang perlu dilakukan..."
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              required
              rows={3}
            />
          </div>
        </div>

        {/* Foto/Video */}
        <div className="form-section">
          <div className="form-section-title">
            📷 Foto/Video Dokumentasi <span style={{ color: '#dc2626', fontSize: '13px' }}>(Wajib Min. 1) *</span>
          </div>
          <div className="form-hint" style={{ marginBottom: '12px' }}>
            Maksimal 5 file. Format: JPG, PNG, MP4, MOV, dll.
          </div>

          {/* Upload area: Camera-Only mode (for testing) vs Standard mode (for production) */}
          {files.length < 5 && (
            <div>
              {cameraOnly ? (
                /* Camera-Only UI */
                <div
                  id="file-upload-area"
                  className="file-upload-area"
                  onClick={() => cameraInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Ambil foto langsung di lokasi dengan kamera"
                  onKeyDown={e => e.key === 'Enter' && cameraInputRef.current?.click()}
                  style={{
                    padding: '24px 20px',
                    borderRadius: '16px',
                    border: '2px dashed #bbf7d0',
                    background: '#f0fdf4',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '6px' }}>📸</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#166534', marginBottom: '4px' }}>
                    Ambil Foto Langsung di Lokasi
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '10px' }}>
                    🔒 Mode Uji Coba: Wajib kamera langsung (galeri dinonaktifkan)
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '100px',
                    background: '#166534',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    boxShadow: '0 2px 8px rgba(22, 101, 52, 0.2)',
                  }}>
                    📷 Buka Kamera ({5 - files.length} slot tersisa)
                  </div>
                </div>
              ) : (
                /* Standard Normal Production UI (Camera + Gallery) */
                <div
                  id="file-upload-area"
                  className="file-upload-area"
                  onClick={() => standardInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  role="button"
                  tabIndex={0}
                  aria-label="Area upload foto atau video"
                  onKeyDown={e => e.key === 'Enter' && standardInputRef.current?.click()}
                >
                  <div className="file-upload-icon">📁</div>
                  <div className="file-upload-text">
                    <strong>Ketuk untuk mengambil foto</strong> atau pilih dari galeri
                  </div>
                  <div className="file-upload-hint">{5 - files.length} slot tersisa</div>
                </div>
              )}
            </div>
          )}

          {/* Camera-Only Input (Forces rear camera on mobile) */}
          <input
            ref={cameraInputRef}
            id="input-camera"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-label="Ambil foto langsung dari kamera"
          />

          {/* Standard Input (Allows Camera or Gallery on mobile) */}
          <input
            ref={standardInputRef}
            id="input-files"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-label="Input file foto atau video"
          />

          {/* Previews */}
          {files.length > 0 && (
            <div className="file-previews" style={{ marginTop: '12px' }}>
              {files.map((file, idx) => (
                <div key={idx} className="file-preview-item">
                  {filePreviews[idx] && file.type.startsWith('image/') ? (
                    <img
                      src={filePreviews[idx]}
                      alt={file.name}
                      className="file-preview-img"
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px',
                    }}>
                      🎥
                    </div>
                  )}
                  <div className="file-preview-overlay">
                    <button
                      type="button"
                      className="file-preview-remove"
                      onClick={() => removeFile(idx)}
                      aria-label={`Hapus file ${file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="file-preview-name">{file.name}</div>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && (
            <div className="form-error" style={{ marginTop: '8px' }}>
              ⚠️ Minimal 1 foto/video wajib diupload
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          id="btn-submit-presensi"
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={submitting || gpsStatus !== 'success' || files.length === 0}
          style={{ marginTop: '8px', cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? (
            <><span className="spinner" style={{ marginRight: '8px' }} /> Menyimpan Laporan...</>
          ) : (
            `${sessionEmoji} Kirim Laporan Presensi`
          )}
        </button>

        {gpsStatus !== 'success' && (
          <div className="form-hint text-center" style={{ marginTop: '8px' }}>
            Tombol submit aktif setelah GPS berhasil dan minimal 1 foto diupload
          </div>
        )}
      </form>

      {/* Fullscreen Loading Modal Animation (Prevents accidental double-clicking) */}
      {submitting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '340px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            animation: 'modalFadeIn 0.25s ease-out',
          }}>
            {/* Animated circle */}
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: '#f0fdf4',
              border: '2px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span className="spinner" style={{ width: '30px', height: '30px', borderColor: '#bbf7d0', borderTopColor: '#166534' }} />
            </div>

            <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              Menyimpan Presensi...
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              Mengunggah foto & data presensi. Mohon tunggu, jangan tutup halaman.
            </div>

            {/* Indeterminate progress bar */}
            <div style={{
              marginTop: '18px',
              height: '4px',
              background: '#f1f5f9',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #166534, #22c55e)',
                borderRadius: '10px',
                animation: 'indeterminate 1.5s infinite linear',
                width: '60%',
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
