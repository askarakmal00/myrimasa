import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MyRimasa — Laporan Harian & Presensi KHDTK',
    template: '%s | MyRimasa',
  },
  description:
    'Sistem Laporan Harian dan Presensi Petugas Pengamanan KHDTK Litbanghut. Gantikan Google Form dengan pengalaman yang lebih modern dan terintegrasi.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1923',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
