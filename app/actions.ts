'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { encodeSession, SESSION_COOKIE, getProfile } from '@/lib/auth';
import { SessionType } from '@/lib/types';
import { isWithinWindow } from '@/lib/time';

export async function signIn(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const customRedirect = formData.get('redirect') as string;

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi' };
  }

  const adminClient = createAdminClient();

  // 1. Authenticate with Supabase
  const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error('Supabase signIn error:', authError);
    return { error: 'Email atau password salah. Pastikan akun Anda sudah didaftarkan oleh Admin.' };
  }

  const user = authData.user;

  // 2. Get profile details
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role || user.user_metadata?.role || (email.includes('admin') ? 'admin' : 'employee')) as 'employee' | 'admin';
  const userName = profile?.name || user.user_metadata?.name || email.split('@')[0];

  // 3. Set standard HTTP cookie
  const cookieStore = await cookies();
  const sessionToken = encodeSession({
    id: user.id,
    email: user.email || email,
    name: userName,
    role: userRole,
  });

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  revalidatePath('/', 'layout');

  // 4. Role-based smart redirection:
  // - If specific redirect requested (e.g. was accessing a specific /presensi/... link), honor it
  if (customRedirect && customRedirect !== '/' && customRedirect !== '/login') {
    redirect(customRedirect);
  }

  // - Admin goes directly to /admin dashboard
  if (userRole === 'admin') {
    redirect('/admin');
  }

  // - Staff / Employee goes to home status hub (Overview: Pagi & Sore)
  redirect('/');
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getMyReportToday(session: SessionType) {
  const profile = await getProfile();
  if (!profile) return null;

  const adminClient = createAdminClient();

  // Get today's date in WIB/local
  const now = new Date();
  const wibMs = now.getTime() + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibMs);
  const reportDate = `${wibDate.getUTCFullYear()}-${String(wibDate.getUTCMonth() + 1).padStart(2, '0')}-${String(wibDate.getUTCDate()).padStart(2, '0')}`;

  const { data } = await adminClient
    .from('reports')
    .select('id, timestamp')
    .eq('user_id', profile.id)
    .eq('session_type', session)
    .eq('report_date', reportDate)
    .single();

  return data;
}
