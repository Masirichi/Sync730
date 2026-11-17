import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAllReports } from '@/lib/jobs/reports-and-alerts';
import { getServerJobs } from '@/lib/admin/server-store';
import { recordDangerousAuditLog } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const includeDemo = url.searchParams.get('include_demo') === 'true';

    let reports: any[] = getAllReports();

    try {
      const supabase = await createServerClient();
      const { data } = await supabase
        .from('job_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        reports = data;
      }
    } catch {}

    const jobs = getServerJobs();
    const jobMap = new Map<string, any>();
    jobs.forEach((j) => {
      jobMap.set(j.id, j);
      if (j.external_id) jobMap.set(j.external_id, j);
    });

    const filteredReports = reports
      .filter((r) => {
        if (includeDemo) return true;
        const jId = (r.jobId || r.job_id || '').toLowerCase();
        const reason = (r.reason || '').toLowerCase();
        if (jId.includes('test') || reason.includes('test')) return false;
        return true;
      })
      .map((r) => {
        const jobId = r.jobId || r.job_id;
        const job = jobMap.get(jobId);
        return {
          id: r.id,
          job_id: jobId,
          job_title: job?.title || 'Unknown Role',
          company: job?.company || job?.company_name || 'Unknown Company',
          reason: r.reason,
          note: r.note || '',
          reporter_ip: r.reporter_ip || 'Anonymized',
          status: (r.status || 'OPEN').toUpperCase(),
          created_at: r.createdAt || r.created_at || new Date().toISOString(),
        };
      });

    return NextResponse.json({
      success: true,
      reports: filteredReports,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list reports' },
      { status: 500 }
    );
  }
}
