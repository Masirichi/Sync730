import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import {
  getLocalJobs,
  saveLocalJobs,
  updateJobStatus,
  duplicateJob,
  updateJob,
} from '@/lib/recruiter/store';
import { JobStatus } from '@/lib/recruiter/types';
import { formatSalaryDisplay } from '@/lib/salary/formatSalary';

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const body = await req.json();
    const { action, job_id, status, updates } = body;

    const targetWsId = session?.workspaceId || 'ws-sync730-demo';

    // RBAC: Only OWNER and ADMIN can manage jobs (edit, pause, close, duplicate)
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN'], targetWsId);
    if (roleError) {
      return roleError;
    }

    if (!job_id) {
      return NextResponse.json({ success: false, error: 'job_id is required' }, { status: 400 });
    }

    if (action === 'status') {
      if (!status || !['active', 'draft', 'paused', 'closed'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      const updated = updateJobStatus(job_id, status as JobStatus);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Job status updated to ${status}.`,
        job: updated,
      });
    }

    if (action === 'duplicate') {
      const duplicated = duplicateJob(job_id);
      if (!duplicated) {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Job duplicated as draft: "${duplicated.job_title}".`,
        job: duplicated,
      });
    }

    if (action === 'edit') {
      if (!updates || typeof updates !== 'object') {
        return NextResponse.json({ success: false, error: 'updates object required' }, { status: 400 });
      }

      if (updates.salary_min !== undefined || updates.salary_max !== undefined || updates.salary_currency) {
        updates.salary_range = formatSalaryDisplay(updates);
      }

      const updated = updateJob(job_id, updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Job "${updated.job_title}" updated successfully.`,
        job: updated,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Job management error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Job operation failed' },
      { status: 500 }
    );
  }
}
