// app/actions/report-job.ts
'use server';

import { submitJobReport } from '@/lib/jobs/reports-and-alerts';
import { headers } from 'next/headers';

export async function reportJob(params: {
  jobId: string;
  reason: string;
  note?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const result = submitJobReport({
      jobId: params.jobId,
      reason: params.reason,
      note: params.note,
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
      message: 'Thank you for reporting this role. Our team will review it.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to submit report. Please try again.',
    };
  }
}
