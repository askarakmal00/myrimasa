import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Masuk — MyRimasa',
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="loading-screen">
        <span className="spinner spinner-green" style={{ width: '32px', height: '32px' }} />
        <p>Memuat...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
