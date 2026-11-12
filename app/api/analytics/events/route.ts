import { NextRequest, NextResponse } from 'next/server';
import {
  recordServerAnalyticsEvent,
  getFunnelMetrics,
  AnalyticsEventType,
} from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.type) {
      return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
    }

    const { type, properties } = body;
    recordServerAnalyticsEvent(type as AnalyticsEventType, properties);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const funnel = getFunnelMetrics();
    return NextResponse.json({ success: true, ...funnel });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve funnel metrics' }, { status: 500 });
  }
}
