import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCandidateProfileServer } from '@/lib/candidate/profile-store';
import { evaluateApplyReady } from '@/lib/candidate/apply-ready-config';
import { recordExternalApplyClick, checkDailyLimit } from '@/lib/jobs/application-store';
import { getPublicJobBySlugOrId } from '@/lib/jobs/service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // 1. Authentication check
    let userId: string | undefined;
    try {
      const supabase = await createServerClient();
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id;
    } catch {}

    const demoHeader = request.headers.get('x-demo-user-id') || request.cookies.get('sync730-demo-user-id')?.value;
    const effectiveUserId = userId || demoHeader;

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to view apply links.' },
        { status: 401 }
      );
    }

    // 2. Load candidate profile and evaluate apply_ready strictly on the server
    const profile = getCandidateProfileServer(effectiveUserId);
    const applyReadyResult = evaluateApplyReady(profile);

    if (!applyReadyResult.is_apply_ready) {
      return NextResponse.json(
        {
          error: 'Profile not apply-ready. Please complete your profile to access external applications.',
          missing_items: applyReadyResult.missing_items,
          apply_ready: applyReadyResult,
        },
        { status: 403 }
      );
    }

    // 3. Check daily limit (20 per day)
    const limitCheck = checkDailyLimit(effectiveUserId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'You have reached your daily limit of 20 applications/links for today. Please check back tomorrow.' },
        { status: 429 }
      );
    }

    // 4. Retrieve job
    const { job, isClosed } = getPublicJobBySlugOrId(jobId, {
      isAuthenticated: true,
      isApplyReady: true,
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    if (isClosed) {
      return NextResponse.json({ error: 'This job is closed and no longer accepting applications.' }, { status: 400 });
    }

    const applyUrl = job.apply_url;
    if (!applyUrl) {
      return NextResponse.json({ error: 'No application URL available for this role.' }, { status: 404 });
    }

    // 5. Log external apply click
    recordExternalApplyClick(effectiveUserId, job.id);

    return NextResponse.json({
      success: true,
      apply_url: applyUrl,
    });
  } catch (err: any) {
    console.error('Error in GET /api/jobs/[id]/apply-url:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve application link.' },
      { status: 500 }
    );
  }
}
