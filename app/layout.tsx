import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Myrimasa — Smart Workforce Platform',
    template: '%s | Myrimasa',
  },
  description:
    'Myrimasa adalah platform manajemen tenaga kerja yang modern. Presensi digital, laporan harian, dan monitoring karyawan dalam satu aplikasi terintegrasi.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1923',
};

import { Suspense } from 'react';
import NavigationProgressBar from '@/components/NavigationProgressBar';

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
      <body>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
