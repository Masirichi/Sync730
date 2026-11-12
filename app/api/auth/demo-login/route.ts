import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/demo-login?role=admin|recruiter|candidate&redirect=/console/talent
 * Instant Demo Sign-In without registration to test features and updates.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedRole = (searchParams.get('role') || 'admin').toLowerCase();
  const redirectParam = searchParams.get('redirect');

  let demoRoleValue = 'platform_admin';
  let defaultRedirect = '/command/metrics';

  if (requestedRole === 'recruiter' || requestedRole === 'recruiter_admin') {
    demoRoleValue = 'recruiter';
    defaultRedirect = '/console/talent';
  } else if (requestedRole === 'candidate') {
    demoRoleValue = 'candidate';
    defaultRedirect = '/dashboard/crawler';
  } else {
    // Admin
    demoRoleValue = 'platform_admin';
    defaultRedirect = redirectParam || '/command/metrics';
  }

  const destination = redirectParam || defaultRedirect;
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUrl = new URL(destination, `${protocol}://${host}`);

  const res = NextResponse.redirect(redirectUrl);

  // Set demo cookies with 24-hour lifetime
  res.cookies.set('sync730-demo-role', demoRoleValue, {
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
