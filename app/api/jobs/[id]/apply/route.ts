import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCandidateProfileServer } from '@/lib/candidate/profile-store';
import { evaluateApplyReady } from '@/lib/candidate/apply-ready-config';
import { submitEmployerApplication, checkDailyLimit } from '@/lib/jobs/application-store';
import { getPublicJobBySlugOrId } from '@/lib/jobs/service';

export const dynamic = 'force-dynamic';

export async function POST(
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
        { error: 'Unauthorized: You must be logged in to apply.' },
        { status: 401 }
      );
    }

    // 2. Load candidate profile and evaluate apply_ready strictly on the server
    const profile = getCandidateProfileServer(effectiveUserId);
    const applyReadyResult = evaluateApplyReady(profile);

    if (!applyReadyResult.is_apply_ready) {
      return NextResponse.json(
        {
          error: 'Profile not apply-ready. Please complete the missing requirements before applying.',
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

    // 4. Verify job exists
    const { job, isClosed } = getPublicJobBySlugOrId(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    if (isClosed) {
      return NextResponse.json({ error: 'This job is closed and no longer accepting applications.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const coverNote = typeof body.cover_note === 'string' ? body.cover_note : undefined;

    // 5. Submit application
    const result = submitEmployerApplication({
      user_id: effectiveUserId,
      job_id: job.id,
      cover_note: coverNote,
      candidate_name: profile.full_name,
      candidate_email: profile.email,
      candidate_track: profile.role_track,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status_code }
      );
    }

    return NextResponse.json({
      success: true,
      application: result.application,
    });
  } catch (err: any) {
    console.error('Error in POST /api/jobs/[id]/apply:', err);
    return NextResponse.json(
      { error: 'Failed to process application.' },
      { status: 500 }
    );
  }
}
