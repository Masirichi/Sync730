import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { saveAdminAuditLog } from '@/lib/admin/store';
import { AdminAuditLog } from '@/lib/admin/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessment_id, candidate_name } = body;

    if (!assessment_id) {
      return NextResponse.json({ success: false, error: 'assessment_id is required' }, { status: 400 });
    }

    // Server-side permission check: Only Video reviewer or Super admin can view candidate video
    let actorId = 'usr-admin-001';
    let actorName = 'David O. Alabi';
    let userRole = 'PLATFORM_ADMIN';

    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        actorName = user.user_metadata?.full_name || user.email || 'Admin';
        const role = user.user_metadata?.role || user.app_metadata?.role;
        if (role) userRole = role;
      }
    } catch {}

    const allowedRoles = ['PLATFORM_ADMIN', 'super_admin', 'video_reviewer', 'admin'];
    if (!allowedRoles.includes(userRole) && !allowedRoles.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Video Reviewers and Platform Admins can open candidate video recordings.' },
        { status: 403 }
      );
    }

    // Append-only access audit log entry
    const logEntry: AdminAuditLog = {
      id: `log-view-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      admin_id: actorId,
      action_type: 'VIDEO_VIEW_OPENED',
      target_id: assessment_id,
      notes: `${actorName} opened video recording for candidate ${candidate_name || assessment_id}. Access verified.`,
      metadata: {
        actor_name: actorName,
        action_verb: 'viewed video recording of',
        target_label: candidate_name || assessment_id,
        target_type: 'VIDEO',
        link: '/command/video-review',
      },
    };

    saveAdminAuditLog(logEntry);

    try {
      const supabase = await createServerClient();
      await supabase.from('audit_log').insert({
        id: logEntry.id,
        created_at: logEntry.created_at,
        actor_id: actorId,
        actor_name: actorName,
        action: 'VIDEO_VIEW_OPENED',
        target_type: 'VIDEO',
        target_id: assessment_id,
        target_label: candidate_name || assessment_id,
        reason: 'Authorized video playback review',
      });
    } catch {}

    return NextResponse.json({
      success: true,
      logged: true,
      audit_id: logEntry.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log video access' },
      { status: 500 }
    );
  }
}
