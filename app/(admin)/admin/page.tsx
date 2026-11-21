import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function AdminRootPage() {
  const cookieStore = cookies();
  const adminRoleCookie = cookieStore.get('sync730_admin_role')?.value;
  const adminEmailCookie = cookieStore.get('sync730_admin_email')?.value;

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPlatformAdmin =
      user?.email?.toLowerCase() === 'ajahmalachy@gmail.com' ||
      user?.user_metadata?.role === 'PLATFORM_ADMIN' ||
      adminRoleCookie === 'super_admin' ||
      adminEmailCookie?.toLowerCase() === 'ajahmalachy@gmail.com';

    if (isPlatformAdmin) {
      redirect('/command');
    }
  } catch {}

  if (adminRoleCookie === 'super_admin' || adminEmailCookie?.toLowerCase() === 'ajahmalachy@gmail.com') {
    redirect('/command');
  }

  // Not signed in as administrator: redirect to WordPress-style admin login portal
  redirect('/admin/login');
}
