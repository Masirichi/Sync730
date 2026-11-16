import { NextRequest, NextResponse } from 'next/server';
import { getAdminMetrics } from '@/lib/admin/metrics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const includeDemo = url.searchParams.get('include_demo') === 'true';

    const metrics = await getAdminMetrics({ includeDemo });

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load platform metrics' },
      { status: 500 }
    );
  }
}
