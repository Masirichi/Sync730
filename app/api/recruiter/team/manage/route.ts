import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import {
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  revokeWorkspaceInvite,
  resendWorkspaceInvite,
  getLocalMembers,
} from '@/lib/recruiter/store';
import { RecruiterRole } from '@/lib/recruiter/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const body = await req.json();
    const { action, member_id, new_role, workspace_id } = body;

    const targetWsId = workspace_id || session?.workspaceId || 'ws-sync730-demo';

    // Must be OWNER or ADMIN to manage team
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN'], targetWsId);
    if (roleError) {
      return roleError;
    }

    const actor = {
      id: session?.userId || 'recruiter-admin-user',
      name: session?.email?.split('@')[0] || 'Alex Morgan',
      email: session?.email || 'alex.morgan@acmeglobal.com',
      role: (session?.role as RecruiterRole) || 'OWNER',
    };

    if (!action || !member_id) {
      return NextResponse.json(
        { success: false, error: 'Both action and member_id are required.' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'change_role': {
        if (!new_role || !['OWNER', 'ADMIN', 'INTERVIEWER'].includes(new_role)) {
          return NextResponse.json(
            { success: false, error: 'Invalid or missing new_role.' },
            { status: 400 }
          );
        }

        const result = updateWorkspaceMemberRole(
          targetWsId,
          member_id,
          new_role as RecruiterRole,
          actor
        );

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Role successfully updated to ${new_role}.`,
          member: result.member,
          members: getLocalMembers(targetWsId),
        });
      }

      case 'remove_member': {
        const result = removeWorkspaceMember(targetWsId, member_id, actor);
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Member removed from organization.',
          members: getLocalMembers(targetWsId),
        });
      }

      case 'revoke_invite': {
        const result = revokeWorkspaceInvite(targetWsId, member_id, actor);
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Invitation revoked.',
          members: getLocalMembers(targetWsId),
        });
      }

      case 'resend_invite': {
        const result = resendWorkspaceInvite(targetWsId, member_id, actor);
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Invitation resent. 7-day expiration clock reset.',
          expires_at: result.expires_at,
          members: getLocalMembers(targetWsId),
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported team management action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Team manage error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
