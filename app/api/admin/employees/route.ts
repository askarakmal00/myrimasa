import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { getAssignedLocationName } from '@/lib/staff-assignments';

// GET /api/admin/employees — List all employees (admin only)
export async function GET() {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const adminClient = createAdminClient();

    // Fetch auth users to get user_metadata with location_name
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    const authMap = new Map();
    (authUsers?.users || []).forEach(u => {
      authMap.set(u.id, u.user_metadata || {});
    });

    const { data, error } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 });

    const enrichedProfiles = (data || []).map((p: any) => {
      const meta = authMap.get(p.id) || {};
      const assignedLocName = getAssignedLocationName(p.email, p.name);
      return {
        ...p,
        location_id: p.location_id || meta.location_id || null,
        location_name: p.location_name || meta.location_name || assignedLocName || null,
      };
    });

    return NextResponse.json(enrichedProfiles);
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
    const { name, email, password, role, location_id } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'employee';
    const adminClient = createAdminClient();

    // Lookup location name if location_id is provided
    let locationName: string | null = null;
    if (location_id) {
      const { data: locData } = await adminClient.from('locations').select('name').eq('id', location_id).single();
      locationName = locData?.name || null;
    }

    // 1. Create auth user with email_confirm: true (no confirmation email sent!)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        role: assignedRole,
        location_id: location_id || null,
        location_name: locationName,
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
    const profileInsertData: any = {
      id: newUserId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: assignedRole,
      status: 'active',
    };

    if (location_id) {
      profileInsertData.location_id = location_id;
    }
    if (locationName) {
      profileInsertData.location_name = locationName;
    }

    try {
      await adminClient.from('profiles').upsert(profileInsertData);
    } catch {
      // Fallback if columns not yet synced in table
      await adminClient.from('profiles').upsert({
        id: newUserId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: assignedRole,
        status: 'active',
      });
    }

    return NextResponse.json({ success: true, user_id: newUserId });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: error?.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
