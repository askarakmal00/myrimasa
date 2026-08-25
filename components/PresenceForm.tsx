'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Location, Profile, SessionType, GpsData } from '@/lib/types';
import Link from 'next/link';

interface PresenceFormProps {
  session: SessionType;
  profile: Profile;
}

const sessionConfig: Record<SessionType, { label: string; emoji: string }> = {
  morning: { label: 'Pagi', emoji: '☀️' },
  afternoon: { label: 'Siang', emoji: '🌤️' },
  evening: { label: 'Sore', emoji: '🌙' },
};

export default function PresenceForm({ session, profile }: PresenceFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [locationId, setLocationId] = useState('');
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

  // Fetch locations
  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(data => setLocations(Array.isArray(data) ? data : []));
  }, []);

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
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
  }

  function addFiles(newFiles: File[]) {
    const combined = [...files, ...newFiles].slice(0, 5);
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    // Validate GPS
    if (gpsStatus !== 'success' || !gpsData) {
      setSubmitError('GPS belum berhasil. Dapatkan lokasi terlebih dahulu sebelum submit.');
      return;
    }

    // Validate files
    if (files.length === 0) {
      setSubmitError('Minimal satu foto/video wajib diupload.');
      return;
    }

    // Validate location
    if (!locationId) {
      setSubmitError('Pilih lokasi KHDTK terlebih dahulu.');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('session_type', session);
    formData.append('location_id', locationId);
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
    files.forEach(file => formData.append('files', file));

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

  // ===== SUCCESS STATE =====
  if (submitSuccess) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="success-state fade-in">
          <div className="success-icon">✅</div>
          <div className="success-title">Presensi Berhasil!</div>
          <div className="success-subtitle">
            Laporan presensi {sessionLabel} Anda telah berhasil dikirim.
            {submittedAt && (
              <><br />Tercatat pada <strong>{new Date(submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} waktu setempat</strong></>
            )}
          </div>
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/" id="btn-back-home-success" className="btn btn-primary btn-full">
              🏠 Kembali ke Beranda
            </Link>
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

        {/* Lokasi */}
        <div className="form-section">
          <div className="form-section-title">📍 Lokasi KHDTK</div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="field-location">Pilih Lokasi</label>
            <select
              id="field-location"
              className="form-select"
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              required
            >
              <option value="">-- Pilih Lokasi --</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
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
            <label className="form-label" htmlFor="field-routine">Kegiatan Rutin yang dilaksanakan</label>
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
            <label className="form-label" htmlFor="field-incident">Kegiatan Insidentil yang dilaksanakan</label>
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
            <label className="form-label" htmlFor="field-condition">Hasil Kondisi di lapangan</label>
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
            <label className="form-label" htmlFor="field-followup">Tindak Lanjut/Usulan</label>
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
          <div className="form-section-title">📷 Foto/Video Dokumentasi</div>
          <div className="form-hint" style={{ marginBottom: '12px' }}>
            Maksimal 5 file. Format: JPG, PNG, MP4, MOV, dll.
          </div>

          {/* Upload area */}
          {files.length < 5 && (
            <div
              id="file-upload-area"
              className="file-upload-area"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              role="button"
              tabIndex={0}
              aria-label="Area upload foto atau video"
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <div className="file-upload-icon">📁</div>
              <div className="file-upload-text">
                <strong>Ketuk untuk mengambil foto</strong> atau pilih dari galeri
              </div>
              <div className="file-upload-hint">{5 - files.length} slot tersisa</div>
            </div>
          )}

          <input
            ref={fileInputRef}
            id="input-files"
            type="file"
            accept="image/*,video/*"
            multiple
            capture="environment"
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
          style={{ marginTop: '8px' }}
        >
          {submitting ? (
            <><span className="spinner" /> Mengirim Laporan...</>
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
    </div>
  );
}
