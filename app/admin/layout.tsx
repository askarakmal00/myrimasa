import { getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Admin — MyRimasa',
    template: '%s | Admin MyRimasa',
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) redirect('/login?redirect=/admin');
  if (profile.role !== 'admin') redirect('/');

  return (
    <div className="admin-layout">
      <AdminSidebar profile={profile} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
