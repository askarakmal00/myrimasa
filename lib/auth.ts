import { cookies } from 'next/headers';
import { createAdminClient } from './supabase';
import { Profile } from './types';

const SESSION_COOKIE = 'myrimasa_session';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'admin';
  location_id?: string | null;
  location_name?: string | null;
}

/**
 * Encodes a simple session payload to a base64 string
 */
export function encodeSession(user: UserSession): string {
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

/**
 * Decodes a session payload from a base64 string
 */
export function decodeSession(token: string): UserSession | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);
    if (parsed && parsed.id && parsed.email) {
      return parsed as UserSession;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get current logged in user session from cookies
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;
  return decodeSession(sessionCookie.value);
}

/**
 * Get full profile of current logged in user
 */
export async function getProfile(): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const adminClient = createAdminClient();

    // Fetch auth user metadata for location info
    const { data: authUserData } = await adminClient.auth.admin.getUserById(session.id);
    const authMeta = authUserData?.user?.user_metadata || {};

    const { data } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', session.id)
      .single();

    const location_id = data?.location_id || authMeta.location_id || session.location_id || null;
    const location_name = data?.location_name || authMeta.location_name || session.location_name || null;

    if (data) {
      return {
        ...data,
        location_id,
        location_name,
      } as Profile;
    }

    // Fallback using session data
    return {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      status: 'active',
      location_id,
      location_name,
      created_at: new Date().toISOString(),
    };
  } catch {
    return {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      status: 'active',
      location_id: session.location_id || null,
      location_name: session.location_name || null,
      created_at: new Date().toISOString(),
    };
  }
}

export async function getUser() {
  const profile = await getProfile();
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    user_metadata: {
      name: profile.name,
      role: profile.role,
      location_id: profile.location_id,
      location_name: profile.location_name,
    },
  };
}

export async function requireAuth() {
  const profile = await getProfile();
  if (!profile) {
    throw new Error('Unauthorized');
  }
  return profile;
}

export async function requireAdmin() {
  const profile = await requireAuth();
  if (profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return profile;
}

export { SESSION_COOKIE };
