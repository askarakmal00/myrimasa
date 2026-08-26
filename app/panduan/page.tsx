import Link from 'next/link';
import type { Metadata } from 'next';
import { getProfile } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Buku Panduan & Tutorial Penggunaan — Myrimasa',
  description: 'Panduan lengkap penggunaan sistem presensi dan laporan harian petugas KHDTK Myrimasa',
};

export const dynamic = 'force-dynamic';

export default async function PanduanPage() {
  const profile = await getProfile();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '880px' }}>
        {/* Top Breadcrumb & Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '12px 18px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}>
          <Link
            href={profile?.role === 'admin' ? '/admin' : '/'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '700',
              fontSize: '13px',
              color: '#1e5631',
            }}
          >
            ← Kembali ke {profile?.role === 'admin' ? 'Dashboard Admin' : 'Beranda Presensi'}
          </Link>

          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            🌐 Domain Resmi: <strong>rimasa.my.id</strong>
          </span>
        </div>

        {/* Hero Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e5631 0%, #143d22 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '36px 28px',
          marginBottom: '28px',
          boxShadow: '0 12px 30px rgba(30, 86, 49, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            color: '#86efac',
          }}>
            BUKU PANDUAN PENGGUNAAN RESMI
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px', margin: '0 0 10px 0', lineHeight: 1.3 }}>
            Panduan Sistem Presensi Digital & Laporan Harian Petugas KHDTK
          </h1>
          <p style={{ fontSize: '14px', color: '#dcfce7', maxWidth: '620px', lineHeight: 1.6, margin: 0 }}>
            Petunjuk lengkap tata cara login, jadwal 3 sesi presensi, pengambilan foto kamera HP, deteksi GPS, pengisian laporan, dan pengaturan kata sandi akun di <strong>rimasa.my.id</strong>.
          </p>
        </div>

        {/* Quick Menu Index */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          marginBottom: '28px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
            📑 Daftar Isi Panduan
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {[
              { id: 'domain-akses', label: '1. Akses Website & Simpan di HP', icon: '🌐' },
              { id: 'jadwal-sesi', label: '2. Jadwal 3 Sesi Presensi', icon: '⏰' },
              { id: 'login-password', label: '3. Login & Ganti Kata Sandi', icon: '🔑' },
              { id: 'lokasi-gps', label: '4. Lokasi Penugasan & Izin GPS', icon: '📍' },
              { id: 'kamera-foto', label: '5. Dokumentasi Foto Lapangan', icon: '📸' },
              { id: 'laporan-harian', label: '6. Pengisian Laporan Kegiatan', icon: '📝' },
              { id: 'fitur-admin', label: '7. Fitur Khusus Administrator', icon: '🛡️' },
              { id: 'faq-kendala', label: '8. Solusi Masalah & FAQ', icon: '❓' },
            ].map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Section 1: Akses Website */}
        <section id="domain-akses" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🌐</span>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              1. Akses Website & Domain Resmi
            </h2>
          </div>

          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            Aplikasi Myrimasa kini dapat diakses secara langsung melalui domain resmi:
          </p>

          <div style={{
            background: '#f0fdf4',
            border: '2px dashed #86efac',
            borderRadius: '12px',
            padding: '16px 20px',
            margin: '14px 0 18px 0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
              Alamat Website Resmi
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#15803d', letterSpacing: '0.5px' }}>
              https://rimasa.my.id
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            color: '#334155',
            lineHeight: 1.6,
          }}>
            <strong>💡 Tips Praktis di Smartphone (Tambahkan ke Layar Utama / Add to Home Screen):</strong>
            <ol style={{ paddingLeft: '20px', marginTop: '8px', margin: 0 }}>
              <li><strong>Pengguna Android (Google Chrome):</strong> Buka <code>https://rimasa.my.id</code> → Klik titik tiga (⋮) di pojok kanan atas → Pilih <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.</li>
              <li><strong>Pengguna iPhone (Safari):</strong> Buka <code>https://rimasa.my.id</code> → Klik tombol Bagikan (Share) di bawah → Pilih <strong>"Add to Home Screen"</strong>.</li>
            </ol>
            <div style={{ marginTop: '8px', color: '#15803d', fontWeight: '600' }}>
              Ikon Myrimasa akan muncul di layar HP Anda layaknya aplikasi native!
            </div>
          </div>
        </section>

        {/* Section 2: Jadwal 3 Sesi Presensi */}
        <section id="jadwal-sesi" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>⏰</span>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              2. Jadwal 3 Sesi Presensi Harian (WIB)
            </h2>
          </div>

          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            Setiap personil pengamanan KHDTK wajib mengisi presensi 3 kali sehari sesuai jadwal waktu server (WIB / UTC+7):
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', margin: '16px 0' }}>
            {/* Pagi */}
            <div style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '18px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>☀️</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#92400e' }}>PRESENSI PAGI</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#b45309', margin: '6px 0' }}>
                06.00 – 07.45
              </div>
              <div style={{ fontSize: '11px', color: '#78350f', fontWeight: '600' }}>
                Waktu Indonesia Barat (WIB)
              </div>
            </div>

            {/* Siang */}
            <div style={{
              background: '#fef3c7',
              border: '1.5px solid #fcd34d',
              borderRadius: '14px',
              padding: '18px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🌤️</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#92400e' }}>PRESENSI SIANG</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#b45309', margin: '6px 0' }}>
                13.00 – 14.00
              </div>
              <div style={{ fontSize: '11px', color: '#78350f', fontWeight: '600' }}>
                Waktu Indonesia Barat (WIB)
              </div>
            </div>

            {/* Sore */}
            <div style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '14px',
              padding: '18px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🌙</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e40af' }}>PRESENSI SORE</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#1d4ed8', margin: '6px 0' }}>
                16.00 – 23.59
              </div>
              <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '600' }}>
                Waktu Indonesia Barat (WIB)
              </div>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '13px',
            color: '#475569',
            lineHeight: 1.6,
          }}>
            <strong>Penjelasan Status Kartu Presensi:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '6px', margin: 0 }}>
              <li>🔒 <strong>Belum Dibuka:</strong> Waktu presensi belum tiba. Tombol presensi tidak dapat diklik.</li>
              <li>🟢 <strong>Dibuka (Belum Isi):</strong> Waktu presensi sedang aktif. Silakan klik tombol <strong>"Presensi Sekarang"</strong>.</li>
              <li>✅ <strong>Sudah Presensi:</strong> Anda telah berhasil mengirimkan laporan presensi sesi tersebut.</li>
              <li>🔴 <strong>Lewat (Tidak Presensi):</strong> Batas waktu sesi telah berakhir dan Anda tidak melakukan presensi.</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Login & Ganti Kata Sandi */}
        <section id="login-password" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🔑</span>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              3. Tata Cara Login & Pengaturan Kata Sandi
            </h2>
          </div>

          <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
              A. Masuk ke Akun
            </h3>
            <p>
              Akun personil didaftarkan oleh Administrator. Gunakan <strong>Email</strong> dan <strong>Password</strong> yang diberikan Admin (dapat dilihat pada kartu kredensial akun masing-masing).
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginTop: '16px', marginBottom: '6px' }}>
              B. Fitur Ganti Password Mandiri
            </h3>
            <p>
              Untuk keamanan akun, Anda dapat mengganti kata sandi kapan saja secara mandiri:
            </p>
            <ol style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li>Klik tombol <strong>"🔑 Password"</strong> atau klik <strong>Foto/Nama Anda</strong> di bagian atas (Header).</li>
              <li>Masukkan <strong>Kata Sandi Saat Ini</strong>.</li>
              <li>Masukkan <strong>Kata Sandi Baru</strong> (minimal 6 karakter).</li>
              <li>Ketik ulang kata sandi baru untuk konfirmasi dan klik <strong>"Simpan Kata Sandi"</strong>.</li>
            </ol>

            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginTop: '16px', marginBottom: '6px' }}>
              C. Lupa Password?
            </h3>
            <p>
              Jika Anda lupa kata sandi akun, hubungi Administrator Rimasa. Administrator dapat langsung mereset kata sandi Anda dan membagikan password baru melalui WhatsApp.
            </p>
          </div>
        </section>

        {/* Section 4: Lokasi Penugasan & GPS */}
        <section id="lokasi-gps" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>📍</span>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              4. Lokasi Penugasan Otomatis & Deteksi GPS
            </h2>
          </div>

          <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            <p>
              Sistem Myrimasa telah dilengkapi fitur <strong>Penugasan Lokasi KHDTK Otomatis</strong>:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Petugas <strong>tidak perlu memilih lokasi KHDTK secara manual</strong>. Lokasi tugas (misal: KHDTK Kaliurang, KHDTK Ngandong, KHDTK Sumberwringin, KHDTK Kepau Jaya, dll.) telah otomatis terikat pada akun Anda.</li>
              <li>Sistem akan otomatis merekam titik koordinat <strong>Latitude & Longitude GPS</strong> secara presisi saat form presensi dibuka.</li>
            </ul>

            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '14px 18px',
              marginTop: '14px',
              color: '#991b1b',
              fontSize: '13px',
            }}>
              <strong>⚠️ PENTING: Izin Akses Lokasi (GPS)</strong><br />
              Pastikan GPS di smartphone Anda dalam kondisi <strong>AKTIF</strong>. Saat browser meminta izin: <em>"rimasa.my.id ingin mengetahui lokasi Anda"</em>, pilih <strong>"Allow" / "Izinkan"</strong>. Presensi tidak dapat dikirim jika GPS tidak aktif.
            </div>
          </div>
        </section>

        {/* Section 5: Foto Kamera Lapangan */}
        <section id="kamera-foto" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>📸</span>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              5. Pengambilan Foto & Kamera Lapangan
            </h2>
          </div>

          <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            <p>
              Setiap laporan presensi wajib menyertakan foto dokumentasi kegiatan di lapangan:
            </p>
            <ol style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Klik tombol <strong>"📷 Ambil Foto / Pilih File"</strong> pada form presensi.</li>
              <li>Kamera HP akan otomatis terbuka. Ambil foto kegiatan, patroli, pos penjagaan, atau kondisi pal batas.</li>
              <li>Anda dapat mengunggah hingga <strong>5 foto</strong> sekaligus per sesi laporan.</li>
              <li>Foto yang Anda ambil akan otomatis tersimpan rapi ke server cloud storage / Google Drive KHDTK secara terstruktur.</li>
            </ol>
          </div>
        </section>

        {/* Section 6: Pengisian Laporan Harian */}
        <section id="laporan-harian" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>📝</span>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              6. Panduan Pengisian Laporan Kegiatan
            </h2>
          </div>

          <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            <p>Formulir laporan dibuat ringkas dan padat. Isilah kolom berikut:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong>1. Kegiatan Rutin yang Dilaksanakan:</strong><br />
                <span style={{ color: '#64748b', fontSize: '13px' }}>Contoh: <em>Patroli batas petak 1–4, pengecekan plang larangan pembakaran, penjagaan pos utama.</em></span>
              </div>

              <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong>2. Kegiatan Insidentil yang Dilaksanakan:</strong><br />
                <span style={{ color: '#64748b', fontSize: '13px' }}>Isi kejadian khusus bila ada (misal: <em>Pendampingan tim survei, pemadaman api kecil</em>). Jika tidak ada kejadian khusus, isi: <strong>"Nihil"</strong>.</span>
              </div>

              <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong>3. Hasil Kondisi di Lapangan:</strong><br />
                <span style={{ color: '#64748b', fontSize: '13px' }}>Contoh: <em>Situasi kawasan hutan aman dan kondusif, cuaca cerah berawan, tidak ditemukan perambahan liar.</em></span>
              </div>

              <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong>4. Tindak Lanjut / Usulan:</strong><br />
                <span style={{ color: '#64748b', fontSize: '13px' }}>Contoh: <em>Perlu perbaikan pal batas nomor 12 yang miring, usulan penambahan rambu peringatan.</em></span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Fitur Khusus Admin */}
        <section id="fitur-admin" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              7. Fitur Khusus Administrator
            </h2>
          </div>

          <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            <p>Akun Administrator memiliki hak akses ke panel kontrol:</p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li><strong>Dashboard Real-time:</strong> Memantau kehadiran harian seluruh personil (siapa yang sudah hadir vs belum) pada 3 sesi harian (Pagi 06.00-07.45, Siang 13.00-14.00, Sore 16.00-23.59 WIB).</li>
              <li><strong>Manajemen Karyawan:</strong> Tambah personil baru, ubah penugasan lokasi, serta <strong>Ganti / Reset Password Staff langsung pada menu Edit Karyawan</strong>.</li>
              <li><strong>🎫 Lembar Akun Staff:</strong> Cetak slip akun resmi, bagikan kredensial login via WhatsApp sekali klik, dan salin ringkasan akun personil.</li>
              <li><strong>Export CSV:</strong> Unduh seluruh data laporan presensi ke file CSV dengan format standar Google Forms lengkap dengan link Google Drive dan koordinat peta.</li>
            </ul>
          </div>
        </section>

        {/* Section 8: FAQ */}
        <section id="faq-kendala" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>❓</span>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              8. Tanya Jawab & Solusi Kendala (FAQ)
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                Q: Tombol "Presensi Sekarang" tidak bisa diklik atau berwarna abu-abu?
              </div>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                A: Pastikan Anda membuka aplikasi pada jam sesi yang aktif (Pagi 06.00-07.45, Siang 13.00-14.00, Sore 16.00-23.59 WIB). Di luar jam tersebut, sistem terkunci secara otomatis.
              </div>
            </div>

            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                Q: Muncul pesan error "Izin Lokasi Ditolak / GPS Gagal"?
              </div>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                A: Buka Pengaturan HP → Aplikasi → Browser (Chrome/Safari) → Izin Aplikasi → Izinkan Lokasi (Presisi Tinggi). Kemudian muat ulang halaman <code>https://rimasa.my.id</code>.
              </div>
            </div>

            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                Q: Bagaimana jika sinyal internet lambat saat di hutan?
              </div>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                A: Foto dapat diambil terlebih dahulu di lokasi. Saat berada di titik dengan sinyal stabil dalam batas jam sesi, buka form presensi dan kirimkan laporan.
              </div>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', padding: '20px 0 40px 0' }}>
          <Link
            href={profile?.role === 'admin' ? '/admin' : '/'}
            className="btn btn-primary"
            style={{ padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '800' }}
          >
            ← Kembali ke {profile?.role === 'admin' ? 'Dashboard Admin' : 'Beranda Presensi'}
          </Link>
        </div>
      </div>
    </div>
  );
}
