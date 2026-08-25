import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Masuk — KHDTK Litbanghut',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const profile = await getProfile();

  if (profile) {
    if (profile.role === 'admin') {
      redirect('/admin');
    }
    redirect('/');
  }

  return (
    <Suspense fallback={
      <div className="loading-screen">
        <span className="spinner" style={{ width: '32px', height: '32px', borderColor: '#cbd5e1', borderTopColor: '#1b4d3e' }} />
        <p>Memuat...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
