'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface PhotoItem {
  id: string;
  originalUrl: string;
  blobUrl: string | null;
  status: 'pending' | 'loading' | 'loaded' | 'error';
}

interface ReportRow {
  id: string;
  nama: string;
  tanggal: string;
  jam: string;
  presensi: string;
  lokasi?: string;
  isManual?: boolean;
  photos: PhotoItem[];
}

interface EmployeeOption {
  id: string;
  name: string;
}

interface LocationOption {
  id: string;
  name: string;
}

export default function RekapDokumentasiPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [allUploadedRows, setAllUploadedRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [loadedPhotos, setLoadedPhotos] = useState(0);
  const [sourceType, setSourceType] = useState<'upload' | 'db'>('db');

  // Master options
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [presenceMethod, setPresenceMethod] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch employees and locations on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/employees').then(r => r.json()).catch(() => []),
      fetch('/api/locations').then(r => r.json()).catch(() => []),
    ]).then(([empData, locData]) => {
      setEmployees(Array.isArray(empData) ? empData : []);
      setLocations(Array.isArray(locData) ? locData : []);
    });
  }, []);

  // Parse time / date strings
  function parseTimestampToParts(val: any): { tanggal: string; jam: string } {
    if (!val) return { tanggal: '', jam: '' };
    const str = String(val).trim();

    const match = str.match(/(\d{1,2}\s+\w+\s+\d{4})\s+(\d{2}:\d{2})/);
    if (match) {
      return { tanggal: match[1], jam: match[2] };
    }

    const iso = new Date(str);
    if (!isNaN(iso.getTime())) {
      const wib = new Date(iso.getTime() + 7 * 60 * 60 * 1000);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const d = wib.getUTCDate();
      const m = months[wib.getUTCMonth()];
      const y = wib.getUTCFullYear();
      const hh = String(wib.getUTCHours()).padStart(2, '0');
      const min = String(wib.getUTCMinutes()).padStart(2, '0');
      return { tanggal: `${d} ${m} ${y}`, jam: `${hh}:${min}` };
    }

    return { tanggal: str, jam: '' };
  }

  function formatPresensiLabel(val: any): string {
    if (!val) return '—';
    const s = String(val).toLowerCase();
    if (s.includes('pagi')) return 'Pagi';
    if (s.includes('siang')) return 'Siang';
    if (s.includes('sore')) return 'Sore';
    if (s.includes('khusus') || s.includes('special')) return 'Insidentil';
    return String(val);
  }

  // Fetch single photo and convert to Blob Object URL
  async function fetchPhotoAsBlob(url: string): Promise<string | null> {
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch {
      try {
        const directRes = await fetch(url);
        if (directRes.ok) {
          const directBlob = await directRes.blob();
          return URL.createObjectURL(directBlob);
        }
      } catch {
        // ignore
      }
      return null;
    }
  }

  // Sort reports chronologically: Tanggal 1 dulu s/d akhir, dan Pagi dulu sebelum Sore
  function sortReportsChronological<T extends { nama: string; tanggal: string; jam: string; presensi: string; rawDate?: string }>(rows: T[]): T[] {
    const getSessionWeight = (s: string) => {
      const lower = String(s || '').toLowerCase();
      if (lower.includes('pagi') || lower === 'morning') return 1;
      if (lower.includes('siang') || lower === 'afternoon') return 2;
      if (lower.includes('sore') || lower === 'evening') return 3;
      if (lower.includes('insidentil') || lower.includes('special') || lower.includes('khusus')) return 4;
      return 5;
    };

    const parseComparableDate = (t: string) => {
      if (!t) return '9999-99-99';
      const str = String(t).trim();

      // Check ISO or YYYY-MM-DD
      const isoMatch = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
      }

      // Check DD/MM/YYYY
      const dmyMatch = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
      }

      // Check "D [Month] YYYY" e.g. "1 Oktober 2026"
      const words = str.split(/\s+/);
      if (words.length >= 3) {
        const day = words[0].replace(/\D/g, '').padStart(2, '0');
        const monthStr = words[1].toLowerCase();
        const year = words[2].replace(/\D/g, '');
        const MONTH_MAP: Record<string, string> = {
          januari: '01', jan: '01',
          februari: '02', feb: '02',
          maret: '03', mar: '03',
          april: '04', apr: '04',
          mei: '05', may: '05',
          juni: '06', jun: '06',
          juli: '07', jul: '07',
          agustus: '08', agu: '08', ags: '08', aug: '08',
          september: '09', sep: '09',
          oktober: '10', okt: '10', oct: '10',
          november: '11', nov: '11',
          desember: '12', des: '12', dec: '12',
        };
        const month = MONTH_MAP[monthStr] || '01';
        if (year && day) {
          return `${year}-${month}-${day}`;
        }
      }

      return str;
    };

    return [...rows].sort((a, b) => {
      // 1. Tanggal: tanggal 1 dulu, lanjut ke tgl 2, 3, dst.
      const dateA = a.rawDate || parseComparableDate(a.tanggal);
      const dateB = b.rawDate || parseComparableDate(b.tanggal);
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      // 2. Sesi: Pagi dulu (1), lalu Sore (3), dst.
      const sessionWeightA = getSessionWeight(a.presensi);
      const sessionWeightB = getSessionWeight(b.presensi);
      if (sessionWeightA !== sessionWeightB) {
        return sessionWeightA - sessionWeightB;
      }

      // 3. Jam: jam lebih awal dulu
      const timeA = String(a.jam || '');
      const timeB = String(b.jam || '');
      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }

      // 4. Nama petugas: alfabetis
      const nameA = String(a.nama || '');
      const nameB = String(b.nama || '');
      return nameA.localeCompare(nameB);
    });
  }

  // Process rows and load their photos as image Blobs
  const processAndLoadImages = useCallback(async (rawRows: Array<{ nama: string; tanggal: string; jam: string; presensi: string; lokasi?: string; isManual?: boolean; urls: string[]; rawDate?: string }>) => {
    setLoading(true);
    setLoadingText('Mempersiapkan data dokumentasi...');

    // Urutkan kronologis: Tanggal 1 dulu s/d akhir, dan Pagi dulu sebelum Sore
    const sortedRows = sortReportsChronological(rawRows);

    let allUrlsCount = 0;
    sortedRows.forEach(r => { allUrlsCount += r.urls.length; });
    setTotalPhotos(allUrlsCount);
    setLoadedPhotos(0);

    const initialReports: ReportRow[] = sortedRows.map((r, rIdx) => ({
      id: `row-${rIdx}`,
      nama: r.nama,
      tanggal: r.tanggal,
      jam: r.jam,
      presensi: r.presensi,
      lokasi: r.lokasi,
      isManual: r.isManual,
      photos: r.urls.map((url, pIdx) => ({
        id: `p-${rIdx}-${pIdx}`,
        originalUrl: url,
        blobUrl: null,
        status: 'pending',
      })),
    }));

    setReports(initialReports);

    let completedCount = 0;
    const batchSize = 4;
    const flatPhotos: { rIdx: number; pIdx: number; url: string }[] = [];

    sortedRows.forEach((r, rIdx) => {
      r.urls.forEach((url, pIdx) => {
        flatPhotos.push({ rIdx, pIdx, url });
      });
    });

    const updatedReports = [...initialReports];

    for (let i = 0; i < flatPhotos.length; i += batchSize) {
      const batch = flatPhotos.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async item => {
          const blobUrl = await fetchPhotoAsBlob(item.url);
          completedCount++;
          setLoadedPhotos(completedCount);
          setLoadingText(`Mengunduh foto dokumentasi: ${completedCount} dari ${allUrlsCount}...`);

          const targetPhoto = updatedReports[item.rIdx]?.photos[item.pIdx];
          if (targetPhoto) {
            targetPhoto.blobUrl = blobUrl;
            targetPhoto.status = blobUrl ? 'loaded' : 'error';
          }
        })
      );
      setReports([...updatedReports]);
    }

    setLoading(false);
    setLoadingText('');
  }, []);

  // Build query params for system fetch
  const buildQueryParams = useCallback(() => {
    const p = new URLSearchParams();
    if (startDate) p.set('start_date', startDate);
    if (endDate) p.set('end_date', endDate);
    if (employeeId) p.set('employee_id', employeeId);
    if (locationId) p.set('location_id', locationId);
    if (sessionType) p.set('session_type', sessionType);
    if (presenceMethod) p.set('presence_method', presenceMethod);
    p.set('sort_order', 'asc');
    p.set('limit', '200');
    return p.toString();
  }, [startDate, endDate, employeeId, locationId, sessionType, presenceMethod]);

  // Load from system database with active filters
  const handleLoadFromDatabase = useCallback(async () => {
    setSourceType('db');
    setFileName('Data Presensi Sistem');
    setLoading(true);
    setLoadingText('Mengambil data presensi dari database...');

    try {
      const res = await fetch(`/api/admin/reports?${buildQueryParams()}`);
      const json = await res.json();
      const dbReports = json.data || [];

      const parsedRows = dbReports.map((r: any) => {
        const nama = r.profiles?.name || '';
        const parsed = parseTimestampToParts(r.timestamp);
        const presensi = formatPresensiLabel(r.session_type);
        const lokasi = r.locations?.name || '';
        const isManual = Boolean(r.is_manual);
        const rawDate = r.report_date || (r.timestamp ? r.timestamp.substring(0, 10) : '');
        const urls = (r.report_files || [])
          .map((f: any) => f.drive_url)
          .filter((u: any) => u && String(u).startsWith('http'))
          .slice(0, 5);

        return {
          nama,
          tanggal: parsed.tanggal,
          jam: parsed.jam,
          presensi,
          lokasi,
          isManual,
          urls,
          rawDate,
        };
      });

      await processAndLoadImages(parsedRows);
    } catch (err: any) {
      alert(`Gagal memuat data dari database: ${err?.message || err}`);
      setLoading(false);
    }
  }, [buildQueryParams, processAndLoadImages]);

  // Handle Excel upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSourceType('upload');
    setLoading(true);
    setLoadingText('Membaca file Excel...');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      let sheetName = 'Laporan Presensi';
      if (!workbook.Sheets[sheetName]) {
        sheetName = workbook.SheetNames[0];
      }

      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        alert('Sheet "Laporan Presensi" tidak ditemukan di dalam file Excel.');
        setLoading(false);
        return;
      }

      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const parsedRows = jsonRows.map((row: any) => {
        const nama = row['Nama Petugas'] || row['Nama'] || row['nama'] || '';
        let tanggal = row['Tanggal'] || '';
        let jam = row['Jam'] || row['Waktu'] || '';

        if (!tanggal || !jam) {
          const tsVal = row['Timestamp (WIB)'] || row['Timestamp'] || row['timestamp'] || '';
          const parsed = parseTimestampToParts(tsVal);
          if (!tanggal) tanggal = parsed.tanggal;
          if (!jam) jam = parsed.jam;
        }

        const presensi = formatPresensiLabel(row['Sesi'] || row['Presensi'] || row['sesi'] || '');
        const lokasi = row['Lokasi KHDTK'] || row['Lokasi'] || '';
        const metodeRaw = String(row['Metode Presensi'] || row['Metode'] || '').toLowerCase();
        const presensiRaw = String(row['Sesi'] || row['Presensi'] || row['sesi'] || '').toLowerCase();
        const isManual = metodeRaw.includes('manual') || presensiRaw.includes('manual');

        let rawDate = '';
        if (row['Tanggal']) {
          const matchIso = String(row['Tanggal']).match(/\d{4}-\d{2}-\d{2}/);
          if (matchIso) rawDate = matchIso[0];
        }
        if (!rawDate && (row['Timestamp (WIB)'] || row['Timestamp'])) {
          const ts = String(row['Timestamp (WIB)'] || row['Timestamp']);
          const matchIso = ts.match(/\d{4}-\d{2}-\d{2}/);
          if (matchIso) rawDate = matchIso[0];
        }

        const photoRaw = String(row['Foto/Dokumentasi Lapangan'] || row['Foto'] || row['Dokumentasi'] || row['foto'] || '');
        const urls = photoRaw
          .split(/[\n|;,]+/)
          .map(u => u.trim())
          .filter(u => u.startsWith('http'))
          .slice(0, 5);

        return { nama, tanggal, jam, presensi, lokasi, isManual, urls, rawDate };
      }).filter(r => r.nama || r.urls.length > 0);

      await processAndLoadImages(parsedRows);
    } catch (err: any) {
      alert(`Gagal memproses file Excel: ${err?.message || err}`);
      setLoading(false);
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLoadFromDatabase();
  }

  function handleResetFilter() {
    setStartDate('');
    setEndDate('');
    setEmployeeId('');
    setLocationId('');
    setSessionType('');
    setPresenceMethod('');
    setTimeout(() => {
      // Re-fetch default without filters (sorted ascending)
      fetch('/api/admin/reports?sort_order=asc&limit=200')
        .then(r => r.json())
        .then(json => {
          const dbReports = json.data || [];
          const parsedRows = dbReports.map((r: any) => {
            const nama = r.profiles?.name || '';
            const parsed = parseTimestampToParts(r.timestamp);
            const presensi = formatPresensiLabel(r.session_type);
            const lokasi = r.locations?.name || '';
            const isManual = Boolean(r.is_manual);
            const rawDate = r.report_date || (r.timestamp ? r.timestamp.substring(0, 10) : '');
            const urls = (r.report_files || [])
              .map((f: any) => f.drive_url)
              .filter((u: any) => u && String(u).startsWith('http'))
              .slice(0, 5);

            return { nama, tanggal: parsed.tanggal, jam: parsed.jam, presensi, lokasi, isManual, urls, rawDate };
          });
          processAndLoadImages(parsedRows);
        });
    }, 50);
  }

  function handlePrint() {
    if (loading) {
      alert('Harap tunggu hingga semua gambar selesai dimuat sebelum mencetak.');
      return;
    }
    window.print();
  }

  // Helper for human-readable filter summary in print header
  const getSelectedEmployeeName = () => employees.find(e => e.id === employeeId)?.name || 'Semua Petugas';
  const getSelectedLocationName = () => locations.find(l => l.id === locationId)?.name || 'Semua Lokasi';
  const getSelectedSessionName = () => {
    if (sessionType === 'morning') return 'Pagi';
    if (sessionType === 'evening') return 'Sore';
    if (sessionType === 'special') return 'Insidentil (24 Jam)';
    return 'Semua Sesi';
  };
  const getSelectedMethodName = () => {
    if (presenceMethod === 'manual') return 'Absen Manual';
    if (presenceMethod === 'realtime') return 'Presensi Realtime';
    return 'Semua Metode';
  };

  return (
    <div className="rekap-doc-page">
      {/* =======================================================
          TOP BAR & ACTIONS (Hidden when printing)
         ======================================================= */}
      <div className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href="/admin/reports" style={{ display: 'inline-flex', alignItems: 'center', color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>
                ← Kembali ke Laporan Presensi
              </Link>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '6px 0 2px' }}>
              Rekap Dokumentasi Presensi
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Filter spesifik berdasarkan nama karyawan, lokasi KHDTK, periode tanggal, dan sesi sebelum dicetak / diexport PDF.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              disabled={reports.length === 0 || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #0284c7',
                background: '#0284c7',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: reports.length === 0 || loading ? 'not-allowed' : 'pointer',
                opacity: reports.length === 0 || loading ? 0.6 : 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / Cetak Dokumen</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={reports.length === 0 || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: reports.length === 0 || loading ? 'not-allowed' : 'pointer',
                opacity: reports.length === 0 || loading ? 0.6 : 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* =======================================================
            FILTER BAR (Nama, Lokasi, Periode, Sesi)
           ======================================================= */}
        <form onSubmit={handleFilterSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
            {/* Periode Dari */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
              />
            </div>

            {/* Periode Sampai */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
              />
            </div>

            {/* Petugas / Karyawan */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Petugas / Karyawan
              </label>
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
              >
                <option value="">Semua Petugas</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {/* Lokasi KHDTK */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Lokasi KHDTK
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
              >
                <option value="">Semua Lokasi</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Sesi Presensi */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Sesi Presensi
              </label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
              >
                <option value="">Semua Sesi</option>
                <option value="morning">Pagi (06.00 – 08.00)</option>
                <option value="evening">Sore (16.00 – 23.59)</option>
                <option value="special">Insidentil (24 Jam)</option>
              </select>
            </div>

            {/* Metode Presensi */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Metode Presensi
              </label>
              <select
                value={presenceMethod}
                onChange={e => setPresenceMethod(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
              >
                <option value="">Semua Metode</option>
                <option value="realtime">⏱️ Realtime</option>
                <option value="manual">📝 Absen Manual</option>
              </select>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#15803d',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Terapkan</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilter}
                disabled={loading}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Secondary Row: File Upload Option */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '500',
                  fontSize: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Atau Upload File Excel (.xlsx)</span>
              </button>

              {fileName && (
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  File aktif: <strong>{fileName}</strong>
                </span>
              )}
            </div>

            <div style={{ fontSize: '12.5px', color: '#334155' }}>
              Ditemukan: <strong style={{ color: '#0f172a' }}>{reports.length}</strong> laporan presensi
            </div>
          </div>
        </form>

        {/* Loading / Progress indicator */}
        {loading && (
          <div style={{ marginBottom: '18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ flex: 1, fontSize: '13px', color: '#1e40af' }}>
              {loadingText || 'Memuat...'}
            </div>
            {totalPhotos > 0 && (
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af' }}>
                {Math.round((loadedPhotos / totalPhotos) * 100)}%
              </div>
            )}
          </div>
        )}
      </div>

      {/* =======================================================
          PRINT HEADER (Visible in print & PDF)
         ======================================================= */}
      <div className="print-header" style={{ marginBottom: '14px' }}>
        <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rekap Dokumentasi Presensi Lapangan
              </h2>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontWeight: '500' }}>
                Sistem Informasi Presensi MyRimasa — Kawasan Hutan Dengan Tujuan Khusus (KHDTK)
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#64748b' }}>
              <div>Total: {reports.length} Laporan</div>
              <div>Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Filter summary metadata on printed page */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '10px', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <div><strong>Periode:</strong> {startDate || endDate ? `${startDate || '...'} s/d ${endDate || '...'}` : 'Semua Periode'}</div>
            <div><strong>Petugas:</strong> {getSelectedEmployeeName()}</div>
            <div><strong>Lokasi:</strong> {getSelectedLocationName()}</div>
            <div><strong>Sesi:</strong> {getSelectedSessionName()}</div>
            <div><strong>Metode:</strong> {getSelectedMethodName()}</div>
          </div>
        </div>
      </div>

      {/* =======================================================
          DOCUMENTATION TABLE (Format: Nama | Tanggal | Jam | Presensi | Dokumentasi)
         ======================================================= */}
      {reports.length === 0 && !loading ? (
        <div className="no-print" style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', margin: '0 0 6px' }}>
            Belum ada data dokumentasi yang ditampilkan
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto 18px' }}>
            Pilih filter karyawan, lokasi, atau periode tanggal lalu klik tombol &quot;Terapkan&quot;, atau upload file Excel (.xlsx).
          </p>
          <button
            type="button"
            onClick={handleLoadFromDatabase}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Tampilkan Semua Laporan Presensi
          </button>
        </div>
      ) : (
        <div className="table-wrapper" style={{ overflowX: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                <th style={{ padding: '9px 12px', fontSize: '11.5px', fontWeight: '700', width: '15%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Nama Petugas
                </th>
                <th style={{ padding: '9px 10px', fontSize: '11.5px', fontWeight: '700', width: '12%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Tanggal
                </th>
                <th style={{ padding: '9px 8px', fontSize: '11.5px', fontWeight: '700', width: '7%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Jam
                </th>
                <th style={{ padding: '9px 10px', fontSize: '11.5px', fontWeight: '700', width: '9%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Presensi
                </th>
                <th style={{ padding: '9px 12px', fontSize: '11.5px', fontWeight: '700', width: '57%' }}>
                  Dokumentasi Lapangan (Foto 1 – Foto 5)
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <td style={{ padding: '9px 12px', fontSize: '12px', fontWeight: '600', color: '#0f172a', verticalAlign: 'middle' }}>
                    <div>{row.nama || '—'}</div>
                    {row.lokasi && (
                      <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '400', marginTop: '2px' }}>
                        {row.lokasi}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: '11.5px', color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {row.tanggal || '—'}
                  </td>
                  <td style={{ padding: '9px 8px', fontSize: '11.5px', color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {row.jam || '—'}
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: '11.5px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: '600',
                        background: row.presensi === 'Pagi' ? '#dcfce7' : row.presensi === 'Sore' ? '#ffedd5' : '#f1f5f9',
                        color: row.presensi === 'Pagi' ? '#15803d' : row.presensi === 'Sore' ? '#c2410c' : '#475569',
                      }}>
                        {row.presensi}
                      </span>
                      {row.isManual ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '9.5px',
                          fontWeight: '600',
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                        }}>
                          📝 Manual
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '9.5px',
                          fontWeight: '600',
                          background: '#f0fdf4',
                          color: '#166534',
                          border: '1px solid #bbf7d0',
                        }}>
                          ⏱️ Realtime
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '7px 10px', verticalAlign: 'middle' }}>
                    {/* Horizontal Photo Container */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
                      {row.photos.length === 0 ? (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          Tidak ada foto
                        </span>
                      ) : (
                        row.photos.map((photo, pIdx) => (
                          <div
                            key={photo.id}
                            style={{
                              position: 'relative',
                              width: '100px',
                              height: '75px',
                              flex: '0 0 100px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              cursor: photo.blobUrl ? 'pointer' : 'default',
                            }}
                            onClick={() => {
                              if (photo.blobUrl) setPreviewImage(photo.blobUrl);
                            }}
                            title={`Foto ${pIdx + 1}`}
                          >
                            {photo.blobUrl ? (
                              <img
                                src={photo.blobUrl}
                                alt={`Foto ${pIdx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            ) : photo.status === 'loading' || photo.status === 'pending' ? (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', color: '#64748b' }}>
                                <div style={{ width: '12px', height: '12px', border: '2px solid #94a3b8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                <span style={{ fontSize: '8.5px' }}>Memuat...</span>
                              </div>
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px', textAlign: 'center', color: '#94a3b8' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                                <span style={{ fontSize: '8px', marginTop: '2px', lineHeight: 1.1 }}>Foto Gagal</span>
                              </div>
                            )}

                            {/* Badge Foto index */}
                            <span
                              className="no-print"
                              style={{
                                position: 'absolute',
                                bottom: '2px',
                                right: '2px',
                                background: 'rgba(0,0,0,0.6)',
                                color: '#ffffff',
                                fontSize: '8px',
                                padding: '1px 3px',
                                borderRadius: '2px',
                                fontWeight: '600',
                              }}
                            >
                              F{pIdx + 1}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =======================================================
          FULL IMAGE PREVIEW MODAL (Screen only)
         ======================================================= */}
      {previewImage && (
        <div
          className="no-print"
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            zIndex: 9999,
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

      {/* =======================================================
          PRINT SPECIFIC STYLESHEET
         ======================================================= */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .print-header {
          display: none;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 8mm 8mm 8mm;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 10px !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print,
          .admin-sidebar,
          .admin-mobile-navbar,
          .admin-sidebar-backdrop {
            display: none !important;
          }

          .admin-layout,
          .admin-main,
          .rekap-doc-page {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            display: block !important;
          }

          .print-header {
            display: block !important;
          }

          .table-wrapper {
            border: none !important;
            overflow: visible !important;
          }

          table.doc-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          table.doc-table thead {
            display: table-header-group !important;
          }

          table.doc-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          table.doc-table th {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: 1px solid #94a3b8 !important;
            padding: 6px 8px !important;
            font-size: 10.5px !important;
          }

          table.doc-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 5px 6px !important;
            font-size: 10px !important;
            vertical-align: middle !important;
          }

          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
