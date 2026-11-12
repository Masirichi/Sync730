import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, success } = body;
    const clientIp = getClientIp(req);

    // If client reported a successful login, we do not increment failed attempts
    if (success) {
      return NextResponse.json({ allowed: true });
    }

    const identifier = (email || clientIp).trim().toLowerCase();
    const rateLimitKey = `login-fail:${identifier}:${clientIp}`;

    // Rate limit: Max 5 failed login attempts per 15 minutes (900000 ms)
    const rateCheck = checkRateLimit(rateLimitKey, 5, 900000);

    if (!rateCheck.allowed) {
      const waitMinutes = Math.ceil(rateCheck.resetTimeMs / 60000);
      return NextResponse.json(
        {
          allowed: false,
          error: `Too many failed login attempts. Please wait ${waitMinutes} minute${waitMinutes === 1 ? '' : 's'} before trying again.`,
          resetTimeMs: rateCheck.resetTimeMs,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      allowed: true,
      remainingAttempts: rateCheck.remaining,
    });
  } catch (error: any) {
    return NextResponse.json({ allowed: true });
  }
}
