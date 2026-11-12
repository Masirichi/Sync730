import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run Supabase SSR session updater
  const { supabaseResponse, user, role } = await updateSession(request);
  const isPlatformAdmin = role === 'PLATFORM_ADMIN';
  const normalizedRole = isPlatformAdmin ? 'admin' : (role?.toLowerCase() as 'candidate' | 'recruiter' | null);

  const isCommandRoute = pathname.startsWith('/command') || pathname.startsWith('/admin');
  const isAdminApiRoute = pathname.startsWith('/api/admin');
  const isCandidateRoute = pathname.startsWith('/candidate') || pathname.startsWith('/dashboard');
  const isRecruiterRoute = pathname.startsWith('/recruiter') || pathname.startsWith('/console');
  const isForbiddenPage = pathname === '/403';
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/signup/company' ||
    pathname === '/register/recruiter';

  // 1. Strict Security Requirement for Platform Admin Command Center (/command/* and /api/admin/*)
  if (isAdminApiRoute) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden: PLATFORM_ADMIN role required' }, { status: 403 });
    }
    return supabaseResponse;
  }

  if (isCommandRoute) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isPlatformAdmin) {
      // Redirect unauthorized users to /403
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // 2. Candidate routes isolation
  if (isCandidateRoute) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Block recruiters from candidate view (admins can view, recruiters can view in read-only preview mode)
    const isPreview = request.nextUrl.searchParams.get('preview') === 'true';
    if (normalizedRole === 'recruiter' && !isPreview) {
      return NextResponse.redirect(new URL('/console/jobs', request.url));
    }
  }

  // 3. Recruiter routes isolation
  if (isRecruiterRoute) {
    if (!user) {
      const loginUrl = new URL('/signup/company', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Block candidates from recruiter view (admins can view)
    if (normalizedRole === 'candidate') {
      return NextResponse.redirect(new URL('/candidate', request.url));
    }
  }

  // 4. Authenticated users visiting login/register: redirect to their respective role portal
  if (isAuthRoute && user) {
    if (isPlatformAdmin) {
      return NextResponse.redirect(new URL('/command/metrics', request.url));
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
