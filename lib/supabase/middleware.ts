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

  // IMPORTANT: Avoid running logic between createServerClient and getUser to prevent token issues
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: 'candidate' | 'recruiter' | 'admin' | null = null;

  if (user) {
    // Check role from user_metadata or profiles/user_profiles table
    if (user.user_metadata?.role) {
      role = user.user_metadata.role as 'candidate' | 'recruiter' | 'admin';
    } else {
      // Query role from user_profiles table / profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role as 'candidate' | 'recruiter' | 'admin';
      }
    }
  }

  return { supabaseResponse, user, role };
}
