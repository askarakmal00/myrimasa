'use client';

import { useState, useRef, useEffect } from 'react';
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
  photos: PhotoItem[];
}

export default function RekapDokumentasiPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [loadedPhotos, setLoadedPhotos] = useState(0);
  const [sourceType, setSourceType] = useState<'upload' | 'db'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract Google Drive file ID
  function extractDriveId(url: string): string | null {
    const match =
      url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) ||
      url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  // Parse time / date strings
  function parseTimestampToParts(val: any): { tanggal: string; jam: string } {
    if (!val) return { tanggal: '', jam: '' };
    const str = String(val).trim();

    // Check if it's already separated or full WIB format
    const match = str.match(/(\d{1,2}\s+\w+\s+\d{4})\s+(\d{2}:\d{2})/);
    if (match) {
      return { tanggal: match[1], jam: match[2] };
    }

    const iso = new Date(str);
    if (!isNaN(iso.getTime())) {
      const wib = new Date(iso.getTime() + 7 * 60 * 60 * 1000);
      const dd = String(wib.getUTCDate()).padStart(2, '0');
      const mm = String(wib.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = wib.getUTCFullYear();
      const hh = String(wib.getUTCHours()).padStart(2, '0');
      const min = String(wib.getUTCMinutes()).padStart(2, '0');
      return { tanggal: `${dd}/${mm}/${yyyy}`, jam: `${hh}:${min}` };
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
      // Fallback: try direct fetch if public
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

  // Process rows and load their photos as image Blobs
  async function processAndLoadImages(rawRows: Array<{ nama: string; tanggal: string; jam: string; presensi: string; urls: string[] }>) {
    setLoading(true);
    setLoadingText('Mempersiapkan data dokumentasi...');

    let allUrlsCount = 0;
    rawRows.forEach(r => { allUrlsCount += r.urls.length; });
    setTotalPhotos(allUrlsCount);
    setLoadedPhotos(0);

    // Initial state with pending photos
    const initialReports: ReportRow[] = rawRows.map((r, rIdx) => ({
      id: `row-${rIdx}`,
      nama: r.nama,
      tanggal: r.tanggal,
      jam: r.jam,
      presensi: r.presensi,
      photos: r.urls.map((url, pIdx) => ({
        id: `p-${rIdx}-${pIdx}`,
        originalUrl: url,
        blobUrl: null,
        status: 'pending',
      })),
    }));

    setReports(initialReports);

    // Concurrently fetch images in controlled batches (up to 4 at a time)
    let completedCount = 0;
    const batchSize = 4;
    const flatPhotos: { rIdx: number; pIdx: number; url: string }[] = [];

    rawRows.forEach((r, rIdx) => {
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
      // Trigger state re-render for live thumbnail loading
      setReports([...updatedReports]);
    }

    setLoading(false);
    setLoadingText('');
  }

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

      // Look for "Laporan Presensi" sheet, or fallback to first sheet
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

        // If tanggal/jam not found, attempt to parse from Timestamp column
        if (!tanggal || !jam) {
          const tsVal = row['Timestamp (WIB)'] || row['Timestamp'] || row['timestamp'] || '';
          const parsed = parseTimestampToParts(tsVal);
          if (!tanggal) tanggal = parsed.tanggal;
          if (!jam) jam = parsed.jam;
        }

        const presensi = formatPresensiLabel(row['Sesi'] || row['Presensi'] || row['sesi'] || '');

        const photoRaw = String(row['Foto/Dokumentasi Lapangan'] || row['Foto'] || row['Dokumentasi'] || row['foto'] || '');
        const urls = photoRaw
          .split(/[\n|;,]+/)
          .map(u => u.trim())
          .filter(u => u.startsWith('http'))
          .slice(0, 5);

        return { nama, tanggal, jam, presensi, urls };
      }).filter(r => r.nama || r.urls.length > 0);

      await processAndLoadImages(parsedRows);
    } catch (err: any) {
      alert(`Gagal memproses file Excel: ${err?.message || err}`);
      setLoading(false);
    }
  }

  // Load directly from system database
  async function handleLoadFromDatabase() {
    setSourceType('db');
    setFileName('Data Presensi Sistem (Terkini)');
    setLoading(true);
    setLoadingText('Mengambil data presensi dari database...');

    try {
      const res = await fetch('/api/admin/reports?limit=100');
      const json = await res.json();
      const dbReports = json.data || [];

      const parsedRows = dbReports.map((r: any) => {
        const nama = r.profiles?.name || '';
        const parsed = parseTimestampToParts(r.timestamp);
        const presensi = formatPresensiLabel(r.session_type);
        const urls = (r.report_files || [])
          .map((f: any) => f.drive_url)
          .filter((u: any) => u && String(u).startsWith('http'))
          .slice(0, 5);

        return {
          nama,
          tanggal: parsed.tanggal,
          jam: parsed.jam,
          presensi,
          urls,
        };
      });

      await processAndLoadImages(parsedRows);
    } catch (err: any) {
      alert(`Gagal memuat data dari database: ${err?.message || err}`);
      setLoading(false);
    }
  }

  function handlePrint() {
    if (loading) {
      alert('Harap tunggu hingga semua gambar selesai dimuat sebelum mencetak.');
      return;
    }
    window.print();
  }

  return (
    <div className="rekap-doc-page">
      {/* =======================================================
          TOP BAR & ACTIONS (Hidden when printing)
         ======================================================= */}
      <div className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
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
              Menampilkan foto dokumentasi sebagai image object nyata dan siap dicetak / diexport PDF.
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
                padding: '9px 16px',
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
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#1e293b',
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

        {/* Upload & Source Control Card */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            {/* Upload Area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 350px' }}>
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
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload File Excel (.xlsx)</span>
              </button>

              <span style={{ fontSize: '13px', color: '#64748b' }}>atau</span>

              <button
                type="button"
                onClick={handleLoadFromDatabase}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #059669',
                  background: '#ecfdf5',
                  color: '#047857',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                <span>Tarik Data Presensi Terkini</span>
              </button>
            </div>

            {/* Current Loaded File / Source Info */}
            {fileName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>Sumber:</span>
                <span style={{ background: '#e2e8f0', padding: '3px 8px', borderRadius: '4px' }}>{fileName}</span>
                <span>({reports.length} baris laporan)</span>
              </div>
            )}
          </div>

          {/* Progress / Status banner */}
          {loading && (
            <div style={{ marginTop: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
      </div>

      {/* =======================================================
          PRINT HEADER (Visible in print & PDF)
         ======================================================= */}
      <div className="print-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e293b', paddingBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rekap Dokumentasi Presensi Lapangan
            </h2>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
              Sistem Informasi Presensi MyRimasa — KHDTK
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10.5px', color: '#475569' }}>
            <div>Total Laporan: {reports.length} Baris</div>
            <div>Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
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
            Belum ada data dokumentasi
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto 18px' }}>
            Silakan upload file Excel (.xlsx) hasil export presensi atau klik tombol &quot;Tarik Data Presensi Terkini&quot; untuk menampilkan rekap dokumentasi.
          </p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ overflowX: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '700', width: '16%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Nama
                </th>
                <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '700', width: '12%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Tanggal
                </th>
                <th style={{ padding: '10px 10px', fontSize: '12px', fontWeight: '700', width: '8%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Jam
                </th>
                <th style={{ padding: '10px 10px', fontSize: '12px', fontWeight: '700', width: '10%', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Presensi
                </th>
                <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '700', width: '54%' }}>
                  Dokumentasi (Foto 1 – Foto 5)
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
                  <td style={{ padding: '10px 12px', fontSize: '12.5px', fontWeight: '600', color: '#0f172a', verticalAlign: 'middle' }}>
                    {row.nama || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {row.tanggal || '—'}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: '12px', color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {row.jam || '—'}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: '12px', verticalAlign: 'middle' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: row.presensi === 'Pagi' ? '#dcfce7' : row.presensi === 'Sore' ? '#ffedd5' : '#f1f5f9',
                      color: row.presensi === 'Pagi' ? '#15803d' : row.presensi === 'Sore' ? '#c2410c' : '#475569',
                    }}>
                      {row.presensi}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                    {/* Horizontal Photo Container */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
                      {row.photos.length === 0 ? (
                        <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                          Tidak ada dokumentasi foto
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
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b' }}>
                                <div style={{ width: '12px', height: '12px', border: '2px solid #94a3b8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                <span style={{ fontSize: '9px' }}>Memuat...</span>
                              </div>
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px', textAlign: 'center', color: '#94a3b8' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                                <span style={{ fontSize: '8.5px', marginTop: '2px', lineHeight: 1.1 }}>Foto Gagal</span>
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
                                fontSize: '8.5px',
                                padding: '1px 4px',
                                borderRadius: '3px',
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
            font-size: 10.5px !important;
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
            font-size: 11px !important;
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
