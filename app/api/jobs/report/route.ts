// app/api/jobs/report/route.ts
// Community reporting endpoint for Sync730 verified roles.
// Rate limited per IP/user per job per 24 hours.

import { NextRequest, NextResponse } from 'next/server';
import { submitJobReport, CanonicalReportReason } from '@/lib/jobs/reports-and-alerts';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.ip || '127.0.0.1';
    const body = await req.json();

    const { jobId, reason, note } = body;

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'jobId is required.' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid report reason is required.' },
        { status: 400 }
      );
    }

    const result = submitJobReport({
      jobId,
      reason,
      note,
      reporterIp: ip,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Rate limit exceeded.' },
        { status: 429, headers: { 'Retry-After': '86400' } }
      );
    }

    // Optional asynchronous persistence to Supabase if database available
    try {
      const supabase = await createServerClient();
      await supabase.from('job_reports').insert({
        job_id: jobId,
        reason,
        note: note ? note.slice(0, 1000) : null,
        reporter_ip: ip,
      });
    } catch {
      // In-memory and file persistence is already handled
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully. Thank you for helping keep Sync730 verified.',
        totalReports: result.totalReports,
        isHidden: result.isHidden,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Job report submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process job report.' },
      { status: 500 }
    );
  }
}
