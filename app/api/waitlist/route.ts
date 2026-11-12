import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import {
  ALLOWED_COUNTRIES,
  ALLOWED_TRACKS,
  ALLOWED_PRIORITIES,
} from '@/lib/waitlist/constants';
import { saveWaitlistEntry, getWaitlistEntries, clearWaitlistStore } from '@/lib/waitlist/store';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (5 requests per 10 minutes)
    // Client IP is hashed with SHA-256 to ensure no raw IP addresses are ever stored
    const ip = getClientIp(req);
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    const rateLimit = checkRateLimit(`waitlist:${ipHash}`, 5, 10 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimit.resetTimeMs / 1000).toString(),
          },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const {
      full_name,
      email,
      country,
      track,
      priorities,
      consent,
      company, // Honeypot field
      source,
    } = body;

    // 2. Honeypot check: If company is filled, pretend success immediately without saving
    if (typeof company === 'string' && company.trim().length > 0) {
      return NextResponse.json({ success: true, duplicate: false });
    }

    // 3. Validate and sanitize full_name
    if (!full_name || typeof full_name !== 'string') {
      return NextResponse.json(
        { error: 'Please enter your full name.' },
        { status: 400 }
      );
    }
    const cleanName = full_name.trim();
    if (cleanName.length < 1 || cleanName.length > 100) {
      return NextResponse.json(
        { error: 'Full name must be between 1 and 100 characters.' },
        { status: 400 }
      );
    }

    // 4. Validate and sanitize email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Please enter your email address.' },
        { status: 400 }
      );
    }
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // 5. Validate country if provided
    let cleanCountry: string | null = null;
    if (country) {
      if (typeof country !== 'string' || !ALLOWED_COUNTRIES.some(c => c.value === country)) {
        return NextResponse.json(
          { error: 'Please select a valid country.' },
          { status: 400 }
        );
      }
      cleanCountry = country;
    }

    // 6. Validate track if provided
    let cleanTrack: string | null = null;
    if (track) {
      if (typeof track !== 'string' || !ALLOWED_TRACKS.some(t => t.value === track)) {
        return NextResponse.json(
          { error: 'Please select a valid track.' },
          { status: 400 }
        );
      }
      cleanTrack = track;
    }

    // 7. Validate priorities if provided (max 3 allowed)
    let cleanPriorities: string[] = [];
    if (priorities) {
      if (!Array.isArray(priorities)) {
        return NextResponse.json(
          { error: 'Priorities must be an array.' },
          { status: 400 }
        );
      }
      if (priorities.length > 3) {
        return NextResponse.json(
          { error: 'You can select up to 3 priorities.' },
          { status: 400 }
        );
      }
      for (const p of priorities) {
        if (typeof p !== 'string' || !ALLOWED_PRIORITIES.includes(p as any)) {
          return NextResponse.json(
            { error: `Invalid priority selection: ${p}` },
            { status: 400 }
          );
        }
      }
      cleanPriorities = priorities;
    }

    // 8. Validate consent
    if (consent !== true) {
      return NextResponse.json(
        { error: 'You must agree to the privacy policy to join.' },
        { status: 400 }
      );
    }

    // 9. Save entry securely via service-role / server store
    const result = await saveWaitlistEntry({
      full_name: cleanName,
      email: cleanEmail,
      country: cleanCountry,
      track: cleanTrack,
      priorities: cleanPriorities,
      consent: true,
      source: typeof source === 'string' ? source.slice(0, 100) : 'waitlist_page',
    });

    if (!result.success && !result.duplicate) {
      return NextResponse.json(
        { error: 'We couldn’t save your details. Check your connection and try again.' },
        { status: 500 }
      );
    }

    // Generic success for duplicates (unique violation) so email existence is never leaked
    return NextResponse.json({
      success: true,
      duplicate: Boolean(result.duplicate),
    });
  } catch (error) {
    console.error('[POST /api/waitlist] Internal error:', error);
    return NextResponse.json(
      { error: 'We couldn’t save your details. Check your connection and try again.' },
      { status: 500 }
    );
  }
}

// Development and test verification endpoints protected by internal header
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('x-sync730-test-key');
  if (process.env.NODE_ENV !== 'production' && authHeader === 'sync730-test-verify') {
    const entries = getWaitlistEntries();
    return NextResponse.json({ entries });
  }

  // Strictly no public select allowed
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('x-sync730-test-key');
  if (process.env.NODE_ENV !== 'production' && authHeader === 'sync730-test-verify') {
    clearWaitlistStore();
    return NextResponse.json({ cleared: true });
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
