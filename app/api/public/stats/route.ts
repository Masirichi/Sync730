// app/api/public/stats/route.ts
// Public platform stats endpoint
// Cache-Control: 60s at edge, stale-while-revalidate=30s
// Rate-limited by IP

import { NextRequest, NextResponse } from 'next/server';
import { getLivePublicStats } from '@/lib/stats/service';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting: max 60 req/min per IP
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRateMap.get(ip);

  if (!record || now > record.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }

  if (record.count >= 60) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please retry in a moment.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const stats = await getLivePublicStats();

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'CDN-Cache-Control': 'public, s-maxage=60',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve stats' },
      { status: 500 }
    );
  }
}
