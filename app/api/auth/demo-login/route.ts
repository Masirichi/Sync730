import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/demo-login?role=admin|super_admin|recruiter|candidate&email=...&redirect=...
 * Instant Super Admin & Demo Sign-In without registration to test features and updates.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedRole = (searchParams.get('role') || 'super_admin').toLowerCase();
  const requestedEmail = searchParams.get('email')?.toLowerCase();
  const redirectParam = searchParams.get('redirect');

  let demoRoleValue = 'platform_admin';
  let defaultRedirect = '/command/metrics';

  if (requestedRole === 'recruiter' || requestedRole === 'recruiter_admin') {
    demoRoleValue = 'recruiter';
    defaultRedirect = '/console/talent';
  } else if (requestedRole === 'candidate') {
    demoRoleValue = 'candidate';
    defaultRedirect = '/candidate';
  } else {
    // Admin / Super Admin
    demoRoleValue = 'platform_admin';
    defaultRedirect = redirectParam || '/command/metrics';
  }

  const destination = redirectParam || defaultRedirect;
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUrl = new URL(destination, `${protocol}://${host}`);

  const res = NextResponse.redirect(redirectUrl);

  const isAjahSuperAdmin =
    requestedEmail === 'ajahmalachy@gmail.com' ||
    requestedRole === 'super_admin' ||
    requestedRole === 'admin';

  const userEmail = isAjahSuperAdmin
    ? 'ajahmalachy@gmail.com'
    : requestedEmail || `${demoRoleValue}@sync730.com`;

  // Set demo cookies with 24-hour lifetime
  res.cookies.set('sync730-demo-role', demoRoleValue, {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });

  res.cookies.set(
    'sync730_admin_role',
    isAjahSuperAdmin ? 'super_admin' : requestedRole === 'platform_admin' ? 'super_admin' : requestedRole,
    {
      path: '/',
      maxAge: 86400,
      sameSite: 'lax',
    }
  );

  res.cookies.set('sync730_admin_email', userEmail, {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });

  res.cookies.set('sync730_user_email', userEmail, {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });

  res.cookies.set('sync730-recruiter-role', 'OWNER', {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });

  return res;
}
