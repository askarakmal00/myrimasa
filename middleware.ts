import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const session = sessionCookie?.value ? decodeSession(sessionCookie.value) : null;
  const path = request.nextUrl.pathname;

  // 1. If not authenticated and accessing root / or /presensi -> redirect immediately to /login
  if ((path === '/' || path.startsWith('/presensi')) && !session) {
    const loginUrl = new URL('/login', request.url);
    if (path.startsWith('/presensi')) {
      loginUrl.searchParams.set('redirect', path);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 2. Protect /admin routes - redirect to login if not authenticated, or to / if not admin
  if (path.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. If authenticated user visits /login:
  // - Admin goes directly to /admin
  // - Employee goes directly to / (which auto-routes to active form)
  if (path === '/login' && session) {
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|api/server-time).*)',
  ],
};
