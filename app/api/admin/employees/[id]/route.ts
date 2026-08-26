import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// PUT /api/admin/employees/[id] — Update employee details & optionally reset/update password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const body = await request.json();
    const { name, email, role, location_id, newPassword, phone } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nama dan email wajib diisi' }, { status: 400 });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'employee';
    const adminClient = createAdminClient();

    // Lookup location name if location_id provided
    let locationName: string | null = null;
    if (location_id) {
      const { data: locData } = await adminClient.from('locations').select('name').eq('id', location_id).single();
      locationName = locData?.name || null;
    }

    // 1. Prepare Auth update payload
    const authUpdatePayload: any = {
      email: email.trim().toLowerCase(),
      user_metadata: {
        name: name.trim(),
        role: assignedRole,
        phone: phone ? phone.trim() : null,
        location_id: location_id || null,
        location_name: locationName,
      },
    };

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
      }
      authUpdatePayload.password = newPassword.trim();
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(id, authUpdatePayload);
    if (authError) {
      return NextResponse.json({ error: authError.message || 'Gagal memperbarui akun autentikasi' }, { status: 400 });
    }

    // 2. Update profiles table
    const profileUpdatePayload: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: assignedRole,
      phone: phone ? phone.trim() : null,
      location_id: location_id || null,
      location_name: locationName,
    };

    const { error: profileError } = await adminClient
      .from('profiles')
      .update(profileUpdatePayload)
      .eq('id', id);

    if (profileError) {
      console.warn('Profile table update fallback:', profileError);
    }

    return NextResponse.json({
      success: true,
      message: 'Data karyawan dan kredensial berhasil diperbarui',
      passwordUpdated: Boolean(newPassword && newPassword.trim().length >= 6),
    });
  } catch (error: any) {
    console.error('Update employee error:', error);
    return NextResponse.json({ error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/admin/employees/[id] — Delete employee account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (profile.id === id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun Anda sendiri' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    // Delete from auth and profiles
    await adminClient.auth.admin.deleteUser(id);
    await adminClient.from('profiles').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal menghapus pengguna' }, { status: 500 });
  }
}
