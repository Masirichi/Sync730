import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { saveAdminAuditLog } from '@/lib/admin/store';
import { AdminAuditLog } from '@/lib/admin/types';
import { assertServerPermission } from '@/lib/admin/permissions';
import { recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessment_id, candidate_name } = body;

    if (!assessment_id) {
      return NextResponse.json({ success: false, error: 'assessment_id is required' }, { status: 400 });
    }

    // Permission check: Only Super admin (PLATFORM_ADMIN) & Vetting reviewer (video_reviewer)
    const permission = await assertServerPermission(req, 'video_review:read');
    if (!permission.authorized) {
      return permission.response;
    }

    const { actor } = permission;

    // Append-only access audit log entry
    const logEntry: AdminAuditLog = {
      id: `log-view-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      admin_id: actor.id,
      action_type: 'VIDEO_VIEW_OPENED',
      target_id: assessment_id,
      notes: `${actor.name} opened video recording for candidate ${candidate_name || assessment_id}. Access verified.`,
      metadata: {
        actor_name: actor.name,
        action_verb: 'viewed video recording of',
        target_label: candidate_name || assessment_id,
        target_type: 'VIDEO',
        link: '/command/video-review',
      },
    };

    saveAdminAuditLog(logEntry);

    try {
      await recordDangerousAuditLog({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'VIDEO_VIEW_OPENED',
        target_type: 'VIDEO',
        target_id: assessment_id,
        target_label: candidate_name || assessment_id,
        reason: 'Authorized candidate video playback review',
        ip: getClientIp(req),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      logged: true,
      access_id: logEntry.id,
      actor: actor.name,
    });
  } catch (error: any) {
    console.error('Failed to log video access:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log video access' },
      { status: 500 }
    );
  }
}
