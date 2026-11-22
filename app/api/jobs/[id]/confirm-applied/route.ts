import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { recordConfirmedExternalApplication } from '@/lib/jobs/application-store';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json().catch(() => ({}));

    // 1. Identify candidate (authenticated user, demo user, or persistent candidate session)
    let userId: string | undefined;
    let userEmail: string | undefined;
    try {
      const supabase = await createServerClient();
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id;
      userEmail = data?.user?.email;
    } catch {}

    const demoHeader = request.headers.get('x-demo-user-id') || request.cookies.get('sync730-demo-user-id')?.value;
    const cookieCandidateId = request.cookies.get('sync730-candidate-id')?.value;
    const effectiveUserId = userId || demoHeader || cookieCandidateId || `guest-${Date.now().toString(36)}`;

    // 2. Record confirmed application in server store
    const result = recordConfirmedExternalApplication({
      user_id: effectiveUserId,
      job_id: jobId,
      job_title: body.job_title,
      company: body.company,
      external_apply_url: body.external_apply_url,
      candidate_email: userEmail || body.candidate_email,
    });

    // 3. Persist to Supabase if connected
    try {
      const serviceClient = getServiceRoleClient();
      if (serviceClient && userId) {
        await serviceClient.from('job_applications').insert({
          id: crypto.randomUUID(),
          job_id: jobId,
          candidate_id: userId,
          status: 'applied',
          created_at: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn('Notice: DB application recording fallback:', dbErr);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Application confirmed and recorded in your SyncFlow tracker.',
      application: result.application,
    });

    // Set guest candidate tracking cookie if none was present
    if (!cookieCandidateId && !userId) {
      response.cookies.set('sync730-candidate-id', effectiveUserId, {
        path: '/',
        httpOnly: true,
        maxAge: 365 * 24 * 3600,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err: any) {
    console.error('Error in POST /api/jobs/[id]/confirm-applied:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to record application confirmation.' },
      { status: 500 }
    );
  }
}
