import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Hanya admin yang dapat mengganti password' }, { status: 403 });

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json({ error: 'Password baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Update user password in Supabase Auth
    const { data, error } = await adminClient.auth.admin.updateUserById(id, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message || 'Gagal mengubah password' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui!',
      user_id: data.user.id,
      email: data.user.email,
    });
  } catch (error: any) {
    console.error('Admin change staff password error:', error);
    return NextResponse.json({ error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
