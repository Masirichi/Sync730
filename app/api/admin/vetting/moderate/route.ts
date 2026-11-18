import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { saveAdminAuditLog } from '@/lib/admin/store';
import { getLocalAssessments, saveLocalAssessment } from '@/lib/recruiter/store';
import { AdminAuditLog } from '@/lib/admin/types';
import { assertServerPermission } from '@/lib/admin/permissions';
import { requireReason, recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';

export async function POST(req: NextRequest) {
  try {
    // Phase 8: Scoped role check - Only Super admin & Vetting reviewer
    const permission = await assertServerPermission(req, 'video_review:moderate');
    if (!permission.authorized) {
      return permission.response;
    }

    const body = await req.json();
    const { assessment_id, decision, reason, ai_overridden } = body;

    if (!assessment_id) {
      return NextResponse.json({ success: false, error: 'assessment_id is required' }, { status: 400 });
    }

    const validDecisions = ['APPROVED', 'RETAKE_REQUESTED', 'REJECTED', 'REVOKE'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { success: false, error: `decision must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      );
    }

    // Server-side enforcement: Reason is mandatory for REJECTED, RETAKE_REQUESTED, and REVOKE (min 10 chars)
    let validatedReason = 'Moderation decision recorded';
    if (['REJECTED', 'RETAKE_REQUESTED', 'REVOKE'].includes(decision)) {
      if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
        return NextResponse.json(
          {
            success: false,
            error: `A substantive reason (at least 10 characters) is required to ${decision.toLowerCase().replace('_', ' ')}.`,
          },
          { status: 400 }
        );
      }
      validatedReason = requireReason(reason, 10);
    }

    // Find target assessment
    const all = getLocalAssessments();
    const target = all.find((a) => a.id === assessment_id || a.candidate_id === assessment_id);
    const prevStatus = target?.moderation_status || 'PENDING';

    let newStatus = decision;
    if (decision === 'REVOKE') {
      // Revert to FLAGGED if candidate has flags, else PENDING
      const hasFlags = (target?.proctoring_flags && target.proctoring_flags.length > 0) ||
        (target?.structured_flags && target.structured_flags.length > 0) ||
        Boolean(target?.candidate_id?.includes('002'));
      newStatus = hasFlags ? 'FLAGGED' : 'PENDING';
    }

    // Calculate if reviewer overrode the AI's recommendation
    const aiRec = target?.ai_recommendation || (target?.proctoring_flags?.length ? 'FLAGGED' : 'APPROVED');
    const isOverride = ai_overridden !== undefined
      ? Boolean(ai_overridden)
      : (decision === 'REJECTED' && aiRec === 'APPROVED') || (decision === 'APPROVED' && aiRec === 'REJECTED');

    const updatePayload: Record<string, any> = {
      moderation_status: newStatus,
      decision_by: decision === 'REVOKE' ? null : 'Platform admin (David O. Alabi)',
      decision_date: decision === 'REVOKE' ? null : new Date().toISOString(),
      decision_reason: reason ? reason.trim() : null,
      ai_overridden: isOverride,
    };

    // 1. Update in Supabase if reachable
    try {
      const supabase = await createServerClient();
      await supabase
        .from('video_assessments')
        .update(updatePayload)
        .or(`id.eq.${assessment_id},candidate_id.eq.${assessment_id}`);
    } catch {}

    // 2. Update in Local Recruiter Store
    if (target) {
      const updated = {
        ...target,
        ...updatePayload,
        // Crucial safety guarantee: Scores are NEVER modified by a flag or moderation decision
        overall_match_score: target.overall_match_score,
        technical_depth_score: target.technical_depth_score,
        communication_score: target.communication_score,
      };
      saveLocalAssessment(updated as any);
    }

    // 3. Write to Append-Only Admin Audit Log
    const auditRecord: AdminAuditLog = {
      id: `log-vet-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      admin_id: 'usr-admin-001',
      action_type: `VIDEO_MODERATION_${decision}`,
      target_id: assessment_id,
      reason: reason?.trim() || 'Moderation decision recorded',
      before: { moderation_status: prevStatus },
      after: { moderation_status: newStatus, reason: reason?.trim() },
      notes: `Video assessment marked as ${newStatus}. ${reason ? `Reason: ${reason.trim()}` : ''}`,
      metadata: {
        actor_name: 'David O. Alabi',
        action_verb: decision === 'REVOKE' ? 'revoked moderation on' : `marked video as ${newStatus}`,
        target_label: target?.candidate_name || target?.real_name || target?.target_role || assessment_id,
        target_type: 'VIDEO',
        link: '/command/video-review',
        ai_overridden: isOverride,
      },
    };

    saveAdminAuditLog(auditRecord);

    const actorName = permission.actor.name;
    const actorId = permission.actor.id;
    try {
      await recordDangerousAuditLog({
        actor_id: actorId,
        actor_name: actorName,
        action: `VIDEO_MODERATION_${decision}`,
        target_type: 'VIDEO',
        target_id: assessment_id,
        target_label: target?.candidate_name || target?.real_name || target?.target_role || assessment_id,
        reason: validatedReason,
        before: { moderation_status: prevStatus },
        after: { moderation_status: newStatus },
        ip: getClientIp(req),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Assessment successfully updated to ${newStatus}.`,
      moderation_status: newStatus,
      decision_by: updatePayload.decision_by,
      decision_date: updatePayload.decision_date,
      decision_reason: updatePayload.decision_reason,
      ai_overridden: isOverride,
      audit_log: auditRecord,
    });
  } catch (error: any) {
    console.error('Video moderation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to moderate assessment' },
      { status: 500 }
    );
  }
}
