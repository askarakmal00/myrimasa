import Link from 'next/link';
import type { Metadata } from 'next';
import { getProfile } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Buku Panduan Penggunaan — Myrimasa',
  description: 'Panduan operasional sistem presensi dan laporan harian petugas lapangan Myrimasa',
};

export const dynamic = 'force-dynamic';

export default async function PanduanPage() {
  const profile = await getProfile();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Top Breadcrumb */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          <Link
            href={profile?.role === 'admin' ? '/admin' : '/'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
              fontSize: '12.5px',
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            ← Kembali ke {profile?.role === 'admin' ? 'Dashboard Admin' : 'Beranda Presensi'}
          </Link>

          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Domain: <strong>rimasa.my.id</strong>
          </span>
        </div>

        {/* Hero Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px', margin: '0 0 6px 0', color: 'var(--color-text)' }}>
            Panduan Sistem Presensi Digital Petugas
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Petunjuk tata cara akses, jadwal sesi presensi, pengambilan foto, deteksi lokasi GPS, dan pelaporan harian.
          </p>
        </div>

        {/* Quick Index */}
        <div className="card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '10px' }}>
            Daftar Isi Panduan
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            {[
              { id: 'domain-akses', label: '1. Akses Website & Pintasan HP' },
              { id: 'jadwal-sesi', label: '2. Jadwal Sesi Presensi' },
              { id: 'login-password', label: '3. Login & Ganti Kata Sandi' },
              { id: 'lokasi-gps', label: '4. Izin GPS & Lokasi Penugasan' },
              { id: 'kamera-foto', label: '5. Foto Dokumentasi Lapangan' },
              { id: 'laporan-harian', label: '6. Pengisian Laporan Kegiatan' },
              { id: 'fitur-admin', label: '7. Fitur Administrator' },
              { id: 'faq-kendala', label: '8. Solusi Masalah Teknis' },
            ].map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '12px',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Section 1: Akses Website */}
        <section id="domain-akses" className="card" style={{ padding: '22px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 12px 0' }}>
            1. Akses Website &amp; Domain Resmi
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Aplikasi Myrimasa dapat diakses melalui browser ponsel pada tautan:
          </p>

          <div style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            margin: '12px 0 14px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--color-primary-dark)',
          }}>
            https://rimasa.my.id
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <strong>Menambahkan Pintasan ke Layar Utama Ponsel:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '6px', margin: '6px 0 0' }}>
              <li><strong>Google Chrome (Android):</strong> Buka link di atas → Ketuk menu titik tiga (⋮) di kanan atas → Pilih <em>Tambahkan ke Layar Utama (Add to Home Screen)</em>.</li>
              <li><strong>Safari (iPhone):</strong> Buka link di atas → Ketuk tombol Bagikan (Share) di bilah bawah → Pilih <em>Add to Home Screen</em>.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Jadwal Sesi Presensi */}
        <section id="jadwal-sesi" className="card" style={{ padding: '22px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 12px 0' }}>
            2. Jadwal Sesi Presensi Rutin
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Setiap petugas wajib mengisi presensi 2 kali sehari sesuai jam server (WIB):
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '14px 0' }}>
            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)' }}>SESI PAGI</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text)', margin: '4px 0 2px' }}>
                06.00 – 08.00 WIB
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                Presensi &amp; laporan patroli pagi
              </div>
            </div>

            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)' }}>SESI SORE</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text)', margin: '4px 0 2px' }}>
                16.00 – 23.59 WIB
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                Presensi &amp; laporan penutupan harian
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <strong>Arti Status Sesi:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '4px', margin: '4px 0 0' }}>
              <li><strong>Belum Dibuka:</strong> Waktu presensi belum dimulai. Tombol form dinonaktifkan.</li>
              <li><strong>Sedang Dibuka:</strong> Form presensi aktif dan siap diisi.</li>
              <li><strong>Hadir:</strong> Laporan presensi untuk sesi tersebut telah berhasil dikirimkan.</li>
              <li><strong>Terlewat:</strong> Batas waktu sesi berakhir sebelum laporan dikirim.</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Login & Kata Sandi */}
        <section id="login-password" className="card" style={{ padding: '22px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 12px 0' }}>
            3. Login &amp; Pengaturan Kata Sandi
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <p>
              Akun petugas dibuatkan oleh Administrator. Gunakan email dan kata sandi yang telah dibagikan.
            </p>
            <p style={{ marginTop: '10px' }}>
              <strong>Mengganti Kata Sandi:</strong><br />
              Petugas dapat mengganti kata sandi kapan saja dengan mengklik ikon gembok pada bilah navigasi atas, memasukkan sandi saat ini, dan menentukan sandi baru minimal 6 karakter.
            </p>
            <p style={{ marginTop: '10px' }}>
              <strong>Kendala Lupa Sandi:</strong><br />
              Hubungi Administrator untuk mereset kata sandi akun Anda melalui panel admin.
            </p>
          </div>
        </section>

        {/* Section 4: GPS */}
        <section id="lokasi-gps" className="card" style={{ padding: '22px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 12px 0' }}>
            4. Izin Lokasi (GPS) &amp; Penugasan
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <p>
              Lokasi penugasan KHDTK terikat secara otomatis dengan akun Anda sehingga Anda tidak perlu memilih lokasi secara manual.
            </p>
            <div className="alert alert-info" style={{ marginTop: '12px' }}>
              Pastikan GPS ponsel dalam keadaan aktif dan berikan izin saat peramban meminta akses lokasi. Presensi memerlukan koordinat GPS yang akurat.
            </div>
          </div>
        </section>

        {/* Section 5: Foto Dokumentasi */}
        <section id="kamera-foto" className="card" style={{ padding: '22px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 12px 0' }}>
            5. Dokumentasi Foto Lapangan
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <p>
              Setiap sesi laporan mewajibkan minimal 1 foto dokumentasi kegiatan lapangan:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px', margin: '6px 0 0' }}>
              <li>Foto secara otomatis dikompresi sebelum diunggah sehingga pengiriman tetap cepat di jaringan seluler lemah.</li>
              <li>Maksimal hingga 5 file foto per sesi laporan.</li>
              <li>Jika sinyal terputus di tengah pengiriman, sistem menyediakan tombol kirim ulang instan tanpa mengulang pengisian.</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Laporan Kegiatan */}
        <section id="laporan-harian" className="card" style={{ padding: '22px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 12px 0' }}>
            6. Format Isian Laporan Kegiatan
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <strong>Kegiatan Rutin:</strong> Ringkasan patroli, pengecekan batas, atau penjagaan pos.
            </div>
            <div>
              <strong>Kegiatan Insidentil:</strong> Kejadian khusus di luar rutinitas (atau isi "Nihil" jika tidak ada).
            </div>
            <div>
              <strong>Kondisi Lapangan:</strong> Situasi keamanan kawasan, kondisi cuaca, atau temuan lapangan.
            </div>
            <div>
              <strong>Tindak Lanjut / Usulan:</strong> Rekomendasi penanganan atau kebutuhan sarana prasarana.
            </div>
          </div>
        </section>

        {/* Section 7: Fitur Administrator */}
        <section id="fitur-admin" className="card" style={{ padding: '22px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 12px 0' }}>
            7. Ringkasan Fitur Administrator
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li><strong>Monitoring Harian:</strong> Memantau kehadiran petugas per sesi pagi dan sore secara langsung.</li>
              <li><strong>Kelola Petugas:</strong> Menambah akun, memperbarui nomor WhatsApp, mengubah lokasi tugas, serta mereset kata sandi.</li>
              <li><strong>Laporan &amp; Ekspor CSV:</strong> Memeriksa detail laporan, verifikasi koordinat Google Maps, dan mengunduh rekap spreadsheet.</li>
            </ul>
          </div>
        </section>

        {/* Section 8: FAQ */}
        <section id="faq-kendala" className="card" style={{ padding: '22px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 12px 0' }}>
            8. Solusi Masalah Teknis (FAQ)
          </h2>

          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <strong>Q: Tombol presensi tidak dapat diklik?</strong><br />
              A: Form hanya dapat diisi pada rentang waktu sesi yang ditentukan (Pagi: 06.00–08.00 WIB, Sore: 16.00–23.59 WIB).
            </div>
            <div>
              <strong>Q: Pesan error izin lokasi atau GPS tidak terbaca?</strong><br />
              A: Buka pengaturan izin peramban di ponsel Anda, pastikan izin lokasi diaktifkan dengan mode akurasi tinggi, lalu segarkan halaman.
            </div>
            <div>
              <strong>Q: Gagal mengirim akibat sinyal lemah di lapangan?</strong><br />
              A: Jangan tutup form. Tekan tombol <em>Coba Kirim Ulang</em> saat ponsel mendapatkan sinyal. Data form dan foto tersimpan di perangkat Anda.
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', paddingBottom: '32px' }}>
          <Link
            href={profile?.role === 'admin' ? '/admin' : '/'}
            className="btn btn-primary"
          >
            ← Kembali ke {profile?.role === 'admin' ? 'Dashboard Admin' : 'Beranda Presensi'}
          </Link>
        </div>
      </div>
    </div>
  );
}
