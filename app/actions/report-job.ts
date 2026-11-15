// app/actions/report-job.ts
'use server';

import { submitJobReport } from '@/lib/jobs/reports-and-alerts';
import { headers } from 'next/headers';

export async function reportJob(params: {
  jobId?: string;
  reason?: string;
  note?: string;
} | FormData): Promise<{ success: boolean; error?: string; message?: string; reportId?: string }> {
  try {
    let ip = '127.0.0.1';
    try {
      const headerList = await headers();
      const forwarded = headerList.get('x-forwarded-for');
      if (forwarded) ip = forwarded.split(',')[0].trim();
    } catch {
      // In testing environments outside Next request scope
    }

    let jobId = '';
    let reason = '';
    let note: string | undefined;

    if (params instanceof FormData) {
      jobId = (params.get('jobId') as string) || '';
      reason = (params.get('reason') as string) || '';
      note = (params.get('notes') as string) || (params.get('note') as string) || undefined;
    } else if (params && typeof params === 'object') {
      jobId = params.jobId || '';
      reason = params.reason || '';
      note = params.note;
    }

    const result = submitJobReport({
      jobId,
      reason,
      note,
      reporterIp: ip,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'You have already reported this role today.',
      };
    }

    return {
      success: true,
      reportId: result.reportId || result.report?.id,
      message: 'Thank you for reporting this role. Our team will review it.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to submit report. Please try again.',
    };
  }
}
