// app/api/jobs/report/route.ts
// Handles candidate job reports.
// Strict rule: 3 reports hides the job pending review.

import { NextRequest, NextResponse } from 'next/server';
import { submitJobReport, ReportReason } from '@/lib/jobs/reports-and-alerts';

export const dynamic = 'force-dynamic';

const VALID_REASONS: ReportReason[] = [
  'asks_for_payment',
  'fake_company',
  'misleading_pay',
  'job_is_closed',
  'other',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, reason, details } = body;

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid report reason' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

    const result = submitJobReport({
      job_id: jobId,
      reason,
      details,
      reporter_ip: ip,
    });

    return NextResponse.json({
      success: true,
      message: result.isHidden
        ? 'Thank you. This role has received multiple flags and has been hidden pending admin review.'
        : 'Thank you. Your report has been submitted to our moderation team.',
      isHidden: result.isHidden,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 500 }
    );
  }
}
