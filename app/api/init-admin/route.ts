import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// POST /api/init-admin — Initialize default admin account if not exists
export async function POST() {
  try {
    const adminClient = createAdminClient();

    const adminEmail = 'admin@khdtk.id';
    const adminPass = 'admin123';
    const adminName = 'Administrator KHDTK';

    // Check if user already exists
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const existing = userList?.users?.find(u => u.email === adminEmail);

    let userId = existing?.id;

    if (!userId) {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPass,
        email_confirm: true,
        user_metadata: {
          name: adminName,
          role: 'admin',
        },
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      userId = newUser.user?.id;
    } else {
      // Update password just in case
      await adminClient.auth.admin.updateUserById(userId, {
        password: adminPass,
        email_confirm: true,
        user_metadata: { name: adminName, role: 'admin' },
      });
    }

    if (userId) {
      await adminClient.from('profiles').upsert({
        id: userId,
        email: adminEmail,
        name: adminName,
        role: 'admin',
        status: 'active',
      });
    }

    return NextResponse.json({
      success: true,
      email: adminEmail,
      message: 'Akun admin berhasil diinisialisasi',
    });
  } catch (err: any) {
    console.error('Init admin error:', err);
    return NextResponse.json({ error: err?.message || 'Gagal inisialisasi admin' }, { status: 500 });
  }
}
