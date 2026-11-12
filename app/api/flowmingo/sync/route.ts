import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession } from '@/lib/recruiter/auth';
import { getLocalJobs } from '@/lib/recruiter/store';

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const body = await req.json().catch(() => ({}));
    const { workspace_id, force_fail } = body;

    const wsId = session?.workspaceId || workspace_id || 'ws-sync730-demo';

    if (force_fail) {
      return NextResponse.json(
        {
          success: false,
          status: 'Error',
          error: 'Flowmingo AI API Gateway timed out: Project screening webhook unreachable.',
          last_synced: null,
        },
        { status: 502 }
      );
    }

    const jobs = getLocalJobs().filter((j) => j.workspace_id === wsId);
    const nowIso = new Date().toISOString();

    return NextResponse.json({
      success: true,
      status: 'Synced',
      last_synced: nowIso,
      active_projects_checked: jobs.map((j) => j.flowmingo_project_id),
      message: `Synchronized ${jobs.length} Flowmingo assessment project(s).`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'Error',
        error: error.message || 'Flowmingo sync failed',
      },
      { status: 500 }
    );
  }
}
