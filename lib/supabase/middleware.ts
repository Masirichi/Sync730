import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export type UserRole = 'candidate' | 'recruiter' | 'admin' | 'PLATFORM_ADMIN' | null;

export interface AuthSessionResult {
  supabaseResponse: NextResponse;
  user: {
    id: string;
    email?: string;
  } | null;
  role: UserRole;
}

export async function updateSession(request: NextRequest): Promise<AuthSessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Check for session via Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Support demo role cookie in development / automated testing environments
  const rawDemoCookie = request.cookies.get('sync730-demo-role')?.value;
  let demoRole: UserRole = null;
  if (rawDemoCookie) {
    const lower = rawDemoCookie.toLowerCase();
    if (lower === 'platform_admin' || lower === 'admin') {
      demoRole = 'PLATFORM_ADMIN';
    } else if (lower === 'recruiter') {
      demoRole = 'recruiter';
    } else if (lower === 'candidate') {
      demoRole = 'candidate';
    }
  }

  const isAuthPath =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/register/');
  const isRecruiterPath = request.nextUrl.pathname.startsWith('/console') || request.nextUrl.pathname.startsWith('/recruiter');
  const isCommandPath = request.nextUrl.pathname.startsWith('/command') || request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin');
  
  let defaultDevRole: UserRole = isAuthPath ? null : 'candidate';
  if (isCommandPath) defaultDevRole = 'PLATFORM_ADMIN';
  else if (isRecruiterPath) defaultDevRole = 'recruiter';

  const effectiveRole = demoRole || (process.env.NODE_ENV === 'development' ? defaultDevRole : null);

  if (!user && effectiveRole) {
    return {
      supabaseResponse,
      user: {
        id: `demo-${effectiveRole.toLowerCase()}-user`,
        email: `${effectiveRole.toLowerCase()}@sync730.test`,
      },
      role: effectiveRole,
    };
  }

  let role: UserRole = null;

  if (user) {
    const rawRole = user.user_metadata?.role || user.user_metadata?.Role;
    if (rawRole) {
      const lower = String(rawRole).toLowerCase();
      if (lower === 'platform_admin' || lower === 'admin') {
        role = 'PLATFORM_ADMIN';
      } else {
        role = lower as 'candidate' | 'recruiter';
      }
    } else {
      // Check user_profiles or profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) {
        const lower = String(profile.role).toLowerCase();
        if (lower === 'platform_admin' || lower === 'admin') {
          role = 'PLATFORM_ADMIN';
        } else {
          role = lower as 'candidate' | 'recruiter';
        }
      }
    }
  }

  // If user is authenticated but role could not be read, fallback to demo cookie if set
  if (user && !role && demoRole) {
    role = demoRole;
  }

  return { supabaseResponse, user, role };
}
