import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import { getLocalPipelineCandidates, getLocalJobs } from '@/lib/recruiter/store';
import { saveAdminAuditLog } from '@/lib/admin/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const targetWsId = session?.workspaceId || 'ws-sync730-demo';

    // REQUIREMENT 5: CSV export of pipeline data (admins only), recorded in the audit log.
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN'], targetWsId);
    if (roleError) {
      return roleError;
    }

    const jobId = req.nextUrl.searchParams.get('job_id');
    const jobs = getLocalJobs();
    const job = jobs.find((j) => j.id === jobId);

    const candidates = getLocalPipelineCandidates(jobId || undefined);

    // Escape helper for CSV cells
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Candidate ID',
      'Candidate Name / Masked ID',
      'Current Stage',
      'Overall Match %',
      'Technical Depth %',
      'Communication %',
      'Seniority',
      'Location',
      'Expected Salary',
      'Applied Date',
      'Rejection Reason',
      'Average Scorecard (1-5)',
      'Scheduled Interview Date',
    ];

    const rows = candidates.map((c) => {
      const avgScorecard =
        c.scorecards && c.scorecards.length > 0
          ? (
              c.scorecards.reduce((acc, s) => acc + (s.overall_rating || 0), 0) /
              c.scorecards.length
            ).toFixed(1)
          : 'No scorecards';

      const nextInterview =
        c.scheduled_interviews && c.scheduled_interviews.length > 0
          ? new Date(c.scheduled_interviews[0].scheduled_at).toLocaleString()
          : 'None scheduled';

      return [
        escapeCsv(c.candidate_id),
        escapeCsv(c.candidate_name || c.masked_id),
        escapeCsv(c.stage),
        escapeCsv(c.overall_match_score),
        escapeCsv(c.technical_depth_score),
        escapeCsv(c.communication_score),
        escapeCsv(c.seniority),
        escapeCsv(c.location || 'Remote'),
        escapeCsv(c.expected_salary || 'Competitive'),
        escapeCsv(new Date(c.applied_at).toLocaleDateString()),
        escapeCsv(c.rejection_reason || 'N/A'),
        escapeCsv(avgScorecard),
        escapeCsv(nextInterview),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    // Record in Audit Log
    const auditEntry = {
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      admin_id: session?.email || 'admin@acmeglobal.com',
      action_type: 'PIPELINE_CSV_EXPORT',
      target_id: jobId || 'all_jobs',
      notes: `Exported pipeline candidate dataset for ${job ? `"${job.job_title}"` : 'all active jobs'} (${candidates.length} records).`,
      metadata: {
        workspace_id: targetWsId,
        user_role: session?.role || 'OWNER',
        candidate_count: candidates.length,
      },
    };
    saveAdminAuditLog(auditEntry);

    const filename = `pipeline-${(job?.job_title || 'roles').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Pipeline CSV export error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}
