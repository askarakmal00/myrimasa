import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// GET /api/admin/employees — List all employees (admin only)
export async function GET() {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

// POST /api/admin/employees — Create a new employee/admin account (admin only)
export async function POST(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'employee';
    const adminClient = createAdminClient();

    // 1. Create auth user with email_confirm: true (no confirmation email sent!)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        role: assignedRole,
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'Email sudah terdaftar untuk pengguna lain' }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user?.id;
    if (!newUserId) {
      return NextResponse.json({ error: 'Gagal membuat akun user' }, { status: 500 });
    }

    // 2. Ensure profile record is inserted/updated
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: newUserId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: assignedRole,
        status: 'active',
      });

    if (profileError) {
      console.error('Error creating profile row:', profileError);
    }

    return NextResponse.json({ success: true, user_id: newUserId });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
