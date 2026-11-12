import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getCandidateProfileServer,
  saveCandidateProfileServer,
  ExtendedCandidateProfile,
} from '@/lib/candidate/profile-store';
import { evaluateApplyReady } from '@/lib/candidate/apply-ready-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let userId: string | undefined;

    try {
      const supabase = await createServerClient();
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id;
    } catch {
      // In dev or offline demo
    }

    const demoHeader = request.headers.get('x-demo-user-id') || request.cookies.get('sync730-demo-user-id')?.value;
    const effectiveUserId = userId || demoHeader || 'default-candidate-user';

    const profile = getCandidateProfileServer(effectiveUserId);
    const applyReadyResult = evaluateApplyReady(profile);

    return NextResponse.json({
      success: true,
      profile,
      apply_ready: applyReadyResult,
    });
  } catch (err: any) {
    console.error('Error in GET /api/candidate/profile:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | undefined;

    try {
      const supabase = await createServerClient();
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id;
    } catch {
      // In dev or offline demo
    }

    const demoHeader = request.headers.get('x-demo-user-id') || request.cookies.get('sync730-demo-user-id')?.value;
    const effectiveUserId = userId || demoHeader || 'default-candidate-user';

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid profile data' },
        { status: 400 }
      );
    }

    // Save profile and compute apply_ready strictly on the server
    const { profile, apply_ready_result } = saveCandidateProfileServer(body, effectiveUserId);

    return NextResponse.json({
      success: true,
      profile,
      apply_ready: apply_ready_result,
    });
  } catch (err: any) {
    console.error('Error in POST /api/candidate/profile:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save candidate profile' },
      { status: 500 }
    );
  }
}
