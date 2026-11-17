import { NextRequest, NextResponse } from 'next/server';
import { assertServerPermission, resolveAdminActor } from '@/lib/admin/permissions';
import { recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';

export interface ViewAsSession {
  target_id: string;
  target_name: string;
  target_role: string;
  started_at: string;
  actor_id: string;
  actor_name: string;
}

export async function GET(req: NextRequest) {
  try {
    const raw = req.cookies.get('sync730_view_as')?.value;
    if (!raw) {
      return NextResponse.json({ success: true, active: false, session: null });
    }

    try {
      const session = JSON.parse(decodeURIComponent(raw)) as ViewAsSession;
      return NextResponse.json({ success: true, active: true, session });
    } catch {
      return NextResponse.json({ success: true, active: false, session: null });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check View-As status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, target_id, target_name, target_role } = body;
    const actor = await resolveAdminActor(req);

    // 1. Terminate / Stop session
    if (action === 'STOP') {
      const raw = req.cookies.get('sync730_view_as')?.value;
      let prevTargetLabel = 'User';
      let prevTargetId = 'unknown';

      if (raw) {
        try {
          const parsed = JSON.parse(decodeURIComponent(raw));
          prevTargetLabel = `${parsed.target_name || 'User'} (${parsed.target_role || 'role'})`;
          prevTargetId = parsed.target_id || prevTargetId;
        } catch {}
      }

      await recordDangerousAuditLog({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'VIEW_AS_STOPPED',
        target_type: 'USER',
        target_id: prevTargetId,
        target_label: prevTargetLabel,
        reason: 'Terminated read-only View-As session and returned to administrator context.',
        ip: getClientIp(req),
      });

      const response = NextResponse.json({
        success: true,
        active: false,
        message: 'View-As session exited successfully.',
      });

      // Clear cookie
      response.cookies.set('sync730_view_as', '', {
        path: '/',
        maxAge: 0,
        httpOnly: false,
        sameSite: 'lax',
      });

      return response;
    }

    // 2. Start session (Requires impersonate permission: Super admin or Support)
    if (action === 'START') {
      const permissionCheck = await assertServerPermission(req, 'impersonate');
      if (!permissionCheck.authorized) {
        return permissionCheck.response;
      }

      if (!target_id || !target_role) {
        return NextResponse.json(
          { success: false, error: 'target_id and target_role are required to start View-As.' },
          { status: 400 }
        );
      }

      const session: ViewAsSession = {
        target_id,
        target_name: target_name || 'Sync730 User',
        target_role: target_role.toLowerCase(),
        started_at: new Date().toISOString(),
        actor_id: actor.id,
        actor_name: actor.name,
      };

      await recordDangerousAuditLog({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'VIEW_AS_STARTED',
        target_type: 'USER',
        target_id: target_id,
        target_label: `${session.target_name} (${session.target_role})`,
        reason: `Administrator started read-only View-As session impersonating ${session.target_name}.`,
        ip: getClientIp(req),
      });

      const response = NextResponse.json({
        success: true,
        active: true,
        session,
        message: `Viewing as ${session.target_name} (read-only mode active).`,
      });

      // Set cookie (valid for 4 hours, readable by client banner component)
      response.cookies.set('sync730_view_as', encodeURIComponent(JSON.stringify(session)), {
        path: '/',
        maxAge: 4 * 60 * 60,
        httpOnly: false,
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Expected START or STOP.' }, { status: 400 });
  } catch (error: any) {
    console.error('View-As operation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process View-As request' },
      { status: 500 }
    );
  }
}
