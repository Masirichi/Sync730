import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run Supabase SSR session updater
  const { supabaseResponse, user, role } = await updateSession(request);
  const normalizedRole = role?.toLowerCase() as 'candidate' | 'recruiter' | 'admin' | null;

  const isCandidateRoute = pathname.startsWith('/candidate') || pathname.startsWith('/dashboard');
  const isRecruiterRoute = pathname.startsWith('/recruiter') || pathname.startsWith('/console');
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/signup/company' ||
    pathname === '/register/recruiter';

  // 1. Role Isolation: Candidate routes
  if (isCandidateRoute) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Block non-candidate users (unless admin)
    if (normalizedRole === 'recruiter') {
      return NextResponse.redirect(new URL('/console/jobs', request.url));
    }
  }

  // 2. Role Isolation: Recruiter routes
  if (isRecruiterRoute) {
    if (!user) {
      const loginUrl = new URL('/signup/company', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Block candidate users (unless admin)
    if (normalizedRole === 'candidate') {
      return NextResponse.redirect(new URL('/candidate', request.url));
    }
  }

  // 3. Role Isolation: Admin routes
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (normalizedRole !== 'admin') {
      // Redirect to their respective authorized portal
      const targetDashboard = normalizedRole === 'recruiter' ? '/console/jobs' : '/candidate';
      return NextResponse.redirect(new URL(targetDashboard, request.url));
    }
  }

  // 4. Authenticated users visiting login/register: redirect to their role portal
  if (isAuthRoute && user) {
    if (normalizedRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (normalizedRole === 'recruiter') {
      return NextResponse.redirect(new URL('/console/jobs', request.url));
    }
    return NextResponse.redirect(new URL('/candidate', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (/assets/*)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
