import { NextRequest, NextResponse } from 'next/server';
import { fetchActiveRemoteJobs } from '@/lib/crawler/jobs-fetcher';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const deduplicated = await fetchActiveRemoteJobs();

    return NextResponse.json(
      {
        success: true,
        jobs: deduplicated,
        total: deduplicated.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err: any) {
    console.error('Error in /api/jobs GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load remote jobs' },
      { status: 500 }
    );
  }
}
