import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Sesi telah berakhir. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan password baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'Password baru tidak boleh sama dengan password saat ini' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Verify current password
    const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Password saat ini tidak sesuai / salah' }, { status: 400 });
    }

    // 2. Update to new password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Gagal mengubah password' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui! Gunakan password baru untuk login berikutnya.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
