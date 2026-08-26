'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAccountsPage() {
  const router = useRouter();

  useEffect(() => {
    // Menu Lembar Akun dialihkan ke Manajemen Karyawan
    router.replace('/admin/employees');
  }, [router]);

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <span className="spinner" style={{ width: '32px', height: '32px', borderColor: '#cbd5e1', borderTopColor: '#1b4d3e' }} />
      <p style={{ marginTop: '16px', color: '#64748b', fontSize: '13px' }}>
        Mengalihkan ke Manajemen Karyawan...
      </p>
    </div>
  );
}
