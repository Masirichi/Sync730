import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { toggleServerJobActive, saveServerAuditLog } from '@/lib/admin/server-store';
import { assertServerPermission } from '@/lib/admin/permissions';
import { requireReason, recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp, assertStepUpAuth } from '@/lib/admin/security';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, is_employer_job, is_active, reason, notes } = body;

    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'Missing job_id' },
        { status: 400 }
      );
    }

    const isTakedown = Boolean(is_active);

    // Permission check: Super admin & Moderator
    const requiredPermission = isTakedown ? 'roles:delete' : 'roles:verify';
    const permission = await assertServerPermission(request, requiredPermission);
    if (!permission.authorized) {
      return permission.response;
    }

    const { actor } = permission;

    // Enforce mandatory reason and step-up auth for takedown dangerous action (min 10 chars)
    let validatedReason = 'Role status update';
    if (isTakedown) {
      try {
        validatedReason = requireReason(reason || notes, 10);
      } catch (err: any) {
        return NextResponse.json(
          {
            success: false,
            error: err.message || 'A valid reason of at least 10 characters is required for role takedown.',
          },
          { status: 400 }
        );
      }

      // Step-up authentication guard
      const stepUpCheck = await assertStepUpAuth(request, 'takedown', actor.id, body.step_up_token || body.reauth_token);
      if (!stepUpCheck.authorized) {
        return stepUpCheck.response!;
      }

      // Execute Atomic Postgres RPC
      const serviceClient = getServiceRoleClient();
      if (serviceClient) {
        try {
          await serviceClient.rpc('take_down_role', {
            p_actor_id: actor.id,
            p_actor_name: actor.name,
            p_job_id: job_id,
            p_reason: validatedReason,
            p_ip: getClientIp(request),
          });
        } catch (rpcErr) {
          console.warn('Notice: take_down_role RPC fallback:', rpcErr);
        }
      }
    }

    if (is_employer_job) {
      // Toggle employer job status
      const nextStatus = is_active ? 'closed' : 'active';
      try {
        const supabase = await createServerClient();
        await supabase
          .from('employer_jobs')
          .update({
            status: nextStatus,
            is_active: !is_active,
          })
          .eq('id', job_id);
      } catch (e) {
        console.warn('Employer job DB update notice:', e);
      }

      await recordDangerousAuditLog({
        actor_id: actor.id,
        actor_name: actor.name,
        action: isTakedown ? 'JOB_TAKEDOWN' : 'JOB_REPUBLISH',
        target_type: 'EMPLOYER_JOB',
        target_id: job_id,
        target_label: `Employer Job ${job_id}`,
        reason: validatedReason,
        before: { is_active: true, status: 'active' },
        after: { is_active: !is_active, status: nextStatus },
        ip: getClientIp(request),
      });

      return NextResponse.json({
        success: true,
        is_active: !is_active,
        action: isTakedown ? 'TAKEDOWN' : 'REPUBLISH',
      });
    }

    // Toggle Remote Job in server persistent store
    const res = toggleServerJobActive(job_id, is_active);

    // Try DB update as well
    try {
      const supabase = await createServerClient();
      await supabase
        .from('remote_jobs')
        .update({ is_active: res.is_active })
        .eq('id', job_id);
    } catch (e) {
      console.warn('Remote job DB update notice:', e);
    }

    await recordDangerousAuditLog({
      actor_id: actor.id,
      actor_name: actor.name,
      action: isTakedown ? 'JOB_TAKEDOWN' : 'JOB_REPUBLISH',
      target_type: 'REMOTE_JOB',
      target_id: job_id,
      target_label: `Remote Job ${job_id}`,
      reason: validatedReason,
      before: { is_active: is_active },
      after: { is_active: res.is_active },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      is_active: res.is_active,
      action: isTakedown ? 'TAKEDOWN' : 'REPUBLISH',
    });
  } catch (err: any) {
    console.error('Error in toggle-status route:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
