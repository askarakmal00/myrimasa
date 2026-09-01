'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Location, Profile, SessionType, GpsData } from '@/lib/types';
import { getAssignedLocationName } from '@/lib/staff-assignments';
import { compressImageWithStats, formatBytes, CompressionResult } from '@/lib/image-compression';
import { formatWibDate, formatWibTime } from '@/lib/time';
import Link from 'next/link';

interface PresenceFormProps {
  session: SessionType;
  profile: Profile;
  cameraOnly?: boolean;
}

interface PhotoItem {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

const sessionConfig: Record<SessionType, { label: string; emoji: string }> = {
  morning: { label: 'Pagi', emoji: '☀️' },
  evening: { label: 'Sore', emoji: '🌙' },
  special: { label: 'Kejadian Khusus', emoji: '⚠️' },
};

export default function PresenceForm({ session, profile, cameraOnly = false }: PresenceFormProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const standardInputRef = useRef<HTMLInputElement>(null);
  const draftKey = `myrimasa_draft_${profile.id}_${session}`;

  // Auto-assigned location name from table
  const assignedLoc = getAssignedLocationName(profile.email, profile.name);
  const initialLocName = profile.location_name || assignedLoc || '';

  // Form state
  const [locationId, setLocationId] = useState(profile.location_id || '');
  const [routineActivity, setRoutineActivity] = useState('');
  const [incidentActivity, setIncidentActivity] = useState('Nihil');
  const [fieldCondition, setFieldCondition] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Network & Connectivity state
  const [isOnline, setIsOnline] = useState(true);

  // Data state
  const [locations, setLocations] = useState<Location[]>([]);
  const [gpsData, setGpsData] = useState<GpsData | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');

  // Submit & Auto-Retry state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedAt, setSubmittedAt] = useState('');

  // Auto-retry engine state
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryFormDataRef = useRef<FormData | null>(null);

  const currentConfig = sessionConfig[session] || { label: session, emoji: '📝' };
  const sessionLabel = currentConfig.label;
  const sessionEmoji = currentConfig.emoji;

  // Listen to network online/offline events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        // If we were waiting due to offline error, trigger instant retry
        if (isRetrying) {
          triggerInstantRetry();
        }
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isRetrying]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.routineActivity) setRoutineActivity(parsed.routineActivity);
        if (parsed.incidentActivity) setIncidentActivity(parsed.incidentActivity);
        if (parsed.fieldCondition) setFieldCondition(parsed.fieldCondition);
        if (parsed.followUp) setFollowUp(parsed.followUp);
        setDraftLoaded(true);
        setTimeout(() => setDraftLoaded(false), 4000);
      }
    } catch {
      // ignore storage errors
    }
  }, [draftKey]);

  // Auto-save draft on change
  useEffect(() => {
    if (routineActivity || incidentActivity !== 'Nihil' || fieldCondition || followUp) {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          routineActivity,
          incidentActivity,
          fieldCondition,
          followUp,
          savedAt: Date.now(),
        }));
      } catch {
        // ignore
      }
    }
  }, [routineActivity, incidentActivity, fieldCondition, followUp, draftKey]);

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

  // File handling with smart client-side compression
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    await addPhotos(selected);
    e.target.value = '';
  }

  async function addPhotos(newFiles: File[]) {
    if (newFiles.length === 0) return;
    setCompressing(true);

    try {
      const remainingSlots = Math.max(0, 5 - photos.length);
      const toProcess = newFiles.slice(0, remainingSlots);

      const processedList: PhotoItem[] = await Promise.all(
        toProcess.map(async (file) => {
          if (file.type.startsWith('image/')) {
            const res: CompressionResult = await compressImageWithStats(file);
            return {
              file: res.file,
              previewUrl: res.previewUrl,
              originalSize: res.originalSize,
              compressedSize: res.compressedSize,
              savingsPercent: res.savingsPercent,
            };
          } else {
            // Video or non-image
            return {
              file,
              previewUrl: URL.createObjectURL(file),
              originalSize: file.size,
              compressedSize: file.size,
              savingsPercent: 0,
            };
          }
        })
      );

      setPhotos(prev => [...prev, ...processedList].slice(0, 5));
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setCompressing(false);
    }
  }

  function removePhoto(idx: number) {
    setPhotos(prev => {
      const target = prev[idx];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    await addPhotos(dropped);
  }

  // Clear retry timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Main Submit Pipeline with Auto-Retry
  async function executeSubmit(attempt = 1) {
    if (!retryFormDataRef.current) return;

    setSubmitting(true);
    setSubmitError('');

    // Abort controller with 30-second timeout to handle slow mobile 3G/Edge
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        body: retryFormDataRef.current,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        // Business logic error (e.g. outside session window, already submitted)
        setSubmitError(data.error || 'Gagal mengirim laporan');
        setSubmitting(false);
        setIsRetrying(false);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        return;
      }

      // Success! Clear draft and show digital receipt
      try {
        localStorage.removeItem(draftKey);
      } catch {}

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setIsRetrying(false);
      setSubmitting(false);
      setSubmitSuccess(true);
      setSubmittedAt(data.timestamp);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`Report submit attempt ${attempt} failed:`, err);

      const isNetworkOrTimeout =
        !navigator.onLine ||
        err?.name === 'AbortError' ||
        err?.message?.toLowerCase().includes('failed to fetch') ||
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('timeout');

      if (isNetworkOrTimeout && attempt < 3) {
        // Enter auto-retry mode
        setIsRetrying(true);
        setRetryAttempt(attempt);
        setSubmitting(false);

        // 5 seconds countdown
        let count = 5;
        setRetryCountdown(count);

        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = setInterval(() => {
          count -= 1;
          setRetryCountdown(count);
          if (count <= 0) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            executeSubmit(attempt + 1);
          }
        }, 1000);
      } else {
        // Stop automatic retry, show manual retry option
        setSubmitting(false);
        setIsRetrying(true);
        setRetryAttempt(attempt);
        setRetryCountdown(0);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setSubmitError(
          !navigator.onLine
            ? 'Koneksi internet terputus. Silakan tekan tombol "Coba Kirim Ulang" saat sinyal kembali.'
            : 'Sinyal tidak stabil saat mengirim laporan. Data Anda tersimpan aman, silakan kirim ulang.'
        );
      }
    }
  }

  function triggerInstantRetry() {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setRetryCountdown(0);
    executeSubmit(retryAttempt + 1);
  }

  function cancelRetry() {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsRetrying(false);
    setSubmitting(false);
    setRetryCountdown(0);
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
    if (photos.length === 0) {
      setSubmitError('Minimal satu foto/video wajib diupload.');
      return;
    }

    // Use embedded location or matched location
    let finalLocationId = locationId || profile.location_id;
    if (!finalLocationId && displayLocationName && locations.length > 0) {
      const match = locations.find(l => l.name.toLowerCase() === displayLocationName.toLowerCase());
      if (match) finalLocationId = match.id;
    }

    const formData = new FormData();
    formData.append('session_type', session);
    formData.append('location_id', finalLocationId || '');
    formData.append('location_name', displayLocationName || '');
    formData.append('routine_activity', routineActivity.trim());
    formData.append('incident_activity', incidentActivity.trim());
    formData.append('field_condition', fieldCondition.trim());
    formData.append('follow_up', followUp.trim());
    formData.append('latitude', String(gpsData.latitude));
    formData.append('longitude', String(gpsData.longitude));
    formData.append('address', gpsData.address || '');
    formData.append('gps_timestamp', gpsData.timestamp);
    formData.append('timezone_offset', String(new Date().getTimezoneOffset()));
    photos.forEach(p => formData.append('files', p.file));

    retryFormDataRef.current = formData;
    await executeSubmit(1);
  }

  // ===== SUCCESS STATE (Clean Editorial Receipt) =====
  if (submitSuccess) {
    const formattedTime = submittedAt ? formatWibTime(submittedAt) : 'Baru saja';
    const formattedDate = submittedAt ? formatWibDate(submittedAt) : formatWibDate(new Date().toISOString());

    return (
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px', maxWidth: '420px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '28px 24px', textAlign: 'center' }}>
          {/* Success Icon */}
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'var(--color-primary-subtle)',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--color-text)',
            marginBottom: '4px',
            letterSpacing: '-0.2px',
          }}>
            Presensi Berhasil Terkirim
          </h2>

          <p style={{
            fontSize: '12.5px',
            color: 'var(--color-text-secondary)',
            marginBottom: '20px',
          }}>
            Laporan <strong>{sessionLabel}</strong> Anda telah diverifikasi oleh sistem.
          </p>

          {/* Receipt Data Box */}
          <div style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            textAlign: 'left',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '10px',
              marginBottom: '10px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Bukti Presensi
              </span>
              <span className="badge badge-morning" style={{ fontSize: '10.5px' }}>
                Terverifikasi
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Petugas</span>
                <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>{profile.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Sesi</span>
                <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>{sessionLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Waktu</span>
                <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{formattedTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Tanggal</span>
                <span style={{ color: 'var(--color-text)' }}>{formattedDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Lokasi</span>
                <span style={{ color: 'var(--color-text)' }}>{displayLocationName || 'KHDTK'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Dokumentasi</span>
                <span style={{ color: 'var(--color-text)' }}>{photos.length} Foto</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              href="/"
              id="btn-back-home-success"
              className="btn btn-primary btn-full"
            >
              Kembali ke Beranda
            </Link>

            {session === 'special' && (
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setPhotos([]);
                  setRoutineActivity('');
                  setIncidentActivity('Nihil');
                  setFieldCondition('');
                  setFollowUp('');
                }}
                className="btn btn-secondary btn-full btn-sm"
              >
                Input Laporan Khusus Lainnya
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalCompressedBytes = photos.reduce((acc, p) => acc + p.compressedSize, 0);

  // ===== FORM =====
  return (
    <div className="container-narrow" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          Mode Offline: Koneksi internet terputus. Data Anda tetap tersimpan dan siap dikirim ulang begitu sinyal kembali.
        </div>
      )}

      {/* Draft Restored Banner */}
      {draftLoaded && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          Draf laporan sebelumnya otomatis dimuat kembali.
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/" style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
          ← Kembali ke Jadwal
        </Link>
        <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>
          Form Presensi {sessionLabel}
        </h1>
        <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          Lengkapi laporan harian dan dokumentasi foto di lapangan.
        </p>
      </div>

      {submitError && !isRetrying && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} id="form-presensi">
        {/* Info Petugas */}
        <div className="form-section">
          <div className="form-section-title">Informasi Petugas</div>
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

        {/* Lokasi Penugasan */}
        <div className="form-section">
          <div className="form-section-title">Lokasi Penugasan</div>
          <div style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                {displayLocationName || 'KHDTK Penugasan'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                Lokasi terhubung otomatis dengan profil penugasan
              </div>
            </div>
            <span className="badge badge-morning" style={{ fontSize: '10px', flexShrink: 0 }}>
              Sesuai Akun
            </span>
          </div>
        </div>

        {/* GPS */}
        <div className="form-section">
          <div className="form-section-title">Koordinat Lokasi (GPS)</div>
          {gpsStatus === 'idle' && (
            <div className="gps-status loading">
              <div className="gps-pulse" />
              Menunggu izin akses GPS...
            </div>
          )}
          {gpsStatus === 'loading' && (
            <div className="gps-status loading">
              <div className="gps-pulse" />
              Mendeteksi koordinat GPS...
            </div>
          )}
          {gpsStatus === 'success' && gpsData && (
            <div className="gps-status success">
              <div>
                <div style={{ fontWeight: '600' }}>Lokasi terverifikasi</div>
                <div style={{ fontSize: '11.5px', marginTop: '1px', opacity: 0.85 }}>
                  {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}
                </div>
                {gpsData.address && (
                  <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.75 }}>
                    {gpsData.address.substring(0, 80)}...
                  </div>
                )}
              </div>
            </div>
          )}
          {gpsStatus === 'error' && (
            <div>
              <div className="gps-status error" style={{ marginBottom: '8px' }}>
                {gpsError}
              </div>
              <button
                type="button"
                id="btn-retry-gps"
                className="btn btn-secondary btn-sm"
                onClick={requestGps}
              >
                Coba Deteksi Ulang
              </button>
            </div>
          )}
        </div>

        {/* Laporan Kegiatan */}
        <div className="form-section">
          <div className="form-section-title">Laporan Kegiatan</div>

          <div className="form-group">
            <label className="form-label" htmlFor="field-routine">
              Kegiatan Rutin <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="field-routine"
              className="form-textarea"
              placeholder="Contoh: Patroli jalur batas kawasan KHDTK, pemantauan pos jaga..."
              value={routineActivity}
              onChange={e => setRoutineActivity(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="field-incident">
              Kegiatan Insidentil <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="field-incident"
              className="form-textarea"
              placeholder="Tulis 'Nihil' bila tidak ada"
              value={incidentActivity}
              onChange={e => setIncidentActivity(e.target.value)}
              required
              rows={2}
            />
            <div className="form-hint">Jika tidak ada peristiwa khusus, cukup tulis &quot;Nihil&quot;.</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="field-condition">
              Kondisi Lapangan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="field-condition"
              className="form-textarea"
              placeholder="Jelaskan kondisi cuaca, keamanan, dan situasi di lokasi..."
              value={fieldCondition}
              onChange={e => setFieldCondition(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="field-followup">
              Tindak Lanjut / Saran <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="field-followup"
              className="form-textarea"
              placeholder="Tuliskan rekomendasi atau tindak lanjut..."
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              required
              rows={2}
            />
          </div>
        </div>

        {/* Foto Dokumentasi with Auto Compression Indicator */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div className="form-section-title" style={{ marginBottom: 0 }}>
              Dokumentasi Foto <span style={{ color: '#dc2626', fontSize: '12px' }}>*</span>
            </div>
            {compressing && (
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="spinner" style={{ width: '10px', height: '10px', borderWidth: '1.5px', borderTopColor: 'var(--color-primary)' }} />
                Mengompresi...
              </span>
            )}
          </div>
          <div className="form-hint" style={{ marginBottom: '10px' }}>
            Maks. 5 file. Foto otomatis dioptimalkan agar ringan dan cepat diunggah.
          </div>

          {/* Upload area */}
          {photos.length < 5 && (
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
                >
                  <div className="file-upload-text">
                    <strong>Ambil Foto Kamera Langsung</strong>
                  </div>
                  <div className="file-upload-hint">{5 - photos.length} slot foto tersisa</div>
                </div>
              ) : (
                /* Standard Camera + Gallery */
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
                  <div className="file-upload-text">
                    <strong>Ketuk untuk ambil foto</strong> atau pilih berkas
                  </div>
                  <div className="file-upload-hint">{5 - photos.length} slot tersisa</div>
                </div>
              )}
            </div>
          )}

          {/* Hidden Inputs */}
          <input
            ref={cameraInputRef}
            id="input-camera"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <input
            ref={standardInputRef}
            id="input-files"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Previews with Optimization Label */}
          {photos.length > 0 && (
            <div className="file-previews" style={{ marginTop: '12px' }}>
              {photos.map((item, idx) => (
                <div key={idx} className="file-preview-item">
                  {item.file.type.startsWith('image/') ? (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="file-preview-img"
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', color: 'var(--color-text-muted)',
                    }}>
                      Video
                    </div>
                  )}

                  {item.savingsPercent > 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '3px',
                      right: '3px',
                      background: 'rgba(17, 24, 39, 0.75)',
                      color: '#4ade80',
                      fontSize: '8.5px',
                      fontWeight: '600',
                      padding: '1px 3px',
                      borderRadius: '3px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}>
                      {formatBytes(item.compressedSize)} (-{item.savingsPercent}%)
                    </div>
                  )}

                  <div className="file-preview-overlay">
                    <button
                      type="button"
                      className="file-preview-remove"
                      onClick={() => removePhoto(idx)}
                      aria-label={`Hapus file ${item.file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="file-preview-name">{item.file.name}</div>
                </div>
              ))}
            </div>
          )}

          {photos.length === 0 && (
            <div className="form-error" style={{ marginTop: '6px' }}>
              Minimal 1 foto dokumentasi wajib diunggah.
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          id="btn-submit-presensi"
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={submitting || compressing || gpsStatus !== 'success' || photos.length === 0}
          style={{ marginTop: '4px' }}
        >
          {submitting ? (
            <><span className="spinner" style={{ marginRight: '6px' }} /> Mengirim Laporan...</>
          ) : (
            `Kirim Laporan Presensi ${photos.length > 0 ? `(${formatBytes(totalCompressedBytes)})` : ''}`
          )}
        </button>

        {gpsStatus !== 'success' && (
          <div className="form-hint text-center" style={{ marginTop: '6px', textAlign: 'center' }}>
            Tombol kirim aktif setelah koordinat GPS terdeteksi dan foto dipilih.
          </div>
        )}
      </form>

      {/* Auto-Retry Overlay */}
      {(submitting || isRetrying) && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '340px', textAlign: 'center', padding: '24px 20px' }}>
            {isRetrying ? (
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>
                  Koneksi Terputus
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                  {retryCountdown > 0 ? (
                    <>
                      Mencoba mengirim ulang dalam <strong>{retryCountdown} detik</strong> (Percobaan {retryAttempt}/3)...
                    </>
                  ) : (
                    <>
                      Sinyal internet belum stabil. Data Anda tetap tersimpan dengan aman.
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={triggerInstantRetry}
                    className="btn btn-primary btn-full"
                  >
                    Kirim Ulang Sekarang
                  </button>

                  <button
                    type="button"
                    onClick={cancelRetry}
                    className="btn btn-ghost btn-full"
                    style={{ fontSize: '12px' }}
                  >
                    Kembali ke Form
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <span className="spinner" style={{ width: '24px', height: '24px', borderColor: 'var(--color-border-strong)', borderTopColor: 'var(--color-primary)' }} />
                </div>

                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '2px' }}>
                  Mengirim Laporan Presensi...
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                  Mengunggah berkas ({formatBytes(totalCompressedBytes)}). Mohon tunggu.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
