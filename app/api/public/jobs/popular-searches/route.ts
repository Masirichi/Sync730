// app/api/public/jobs/popular-searches/route.ts
// Retrieves and logs qualifying popular searches.

import { NextRequest, NextResponse } from 'next/server';
import { getQualifyingPopularSearches, recordSearchQuery } from '@/lib/jobs/popular-searches';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const terms = getQualifyingPopularSearches();
    return NextResponse.json(
      { terms },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ terms: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, sessionId } = body;
    if (query && typeof query === 'string') {
      const ip = req.headers.get('x-forwarded-for') || req.ip || 'anon-session';
      recordSearchQuery(query, sessionId || ip);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
