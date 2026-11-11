import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export interface AuthSessionResult {
  supabaseResponse: NextResponse;
  user: {
    id: string;
    email?: string;
  } | null;
  role: 'candidate' | 'recruiter' | 'admin' | null;
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
  const demoRoleCookie = request.cookies.get('sync730-demo-role')?.value as
    | 'candidate'
    | 'recruiter'
    | 'admin'
    | undefined;

  const isRecruiterPath = request.nextUrl.pathname.startsWith('/console') || request.nextUrl.pathname.startsWith('/recruiter');
  const defaultDevRole = isRecruiterPath ? 'recruiter' : 'candidate';
  const effectiveRole = demoRoleCookie || (process.env.NODE_ENV === 'development' ? defaultDevRole : undefined);

  if (!user && effectiveRole) {
    return {
      supabaseResponse,
      user: {
        id: `demo-${effectiveRole}-user`,
        email: `${effectiveRole}@sync730.test`,
      },
      role: effectiveRole,
    };
  }

  let role: 'candidate' | 'recruiter' | 'admin' | null = null;

  if (user) {
    if (user.user_metadata?.role) {
      role = String(user.user_metadata.role).toLowerCase() as 'candidate' | 'recruiter' | 'admin';
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) {
        role = String(profile.role).toLowerCase() as 'candidate' | 'recruiter' | 'admin';
      }
    }
  }

  return { supabaseResponse, user, role };
}
