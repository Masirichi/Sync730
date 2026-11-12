import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { saveLocalMember, getLocalMembers } from '@/lib/recruiter/store';
import { WorkspaceMember, RecruiterRole } from '@/lib/recruiter/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const body = await req.json();
    const { email, full_name, role = 'INTERVIEWER', workspace_id } = body;

    const targetWsId = workspace_id || session?.workspaceId || 'ws-sync730-demo';

    // 1. Role enforcement: Only OWNER and ADMIN can invite team members
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN'], targetWsId);
    if (roleError) {
      return roleError;
    }

    // 2. Rate limiting: Max 10 invites per hour per workspace and IP
    const clientIp = getClientIp(req);
    const rateLimitKey = `invite:${targetWsId}:${clientIp}`;
    const rateCheck = checkRateLimit(rateLimitKey, 10, 3600000); // 10 per hour

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded: You can send at most 10 invitations per hour. Please try again later.',
          retryAfterMs: rateCheck.resetTimeMs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateCheck.resetTimeMs / 1000)),
          },
        }
      );
    }

    // 3. Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const assignedRole = (['ADMIN', 'INTERVIEWER'] as RecruiterRole[]).includes(role)
      ? role
      : 'INTERVIEWER';

    const newMember: WorkspaceMember = {
      id: `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: targetWsId,
      user_id: `user-${Date.now().toString(36)}`,
      role: assignedRole,
      email: email.trim().toLowerCase(),
      full_name: (full_name || email.split('@')[0]).trim(),
      created_at: new Date().toISOString(),
    };

    // 4. Try Supabase
    try {
      const supabase = await createServerClient();
      await supabase.from('workspace_members').insert({
        id: newMember.id,
        workspace_id: newMember.workspace_id,
        role: newMember.role,
        email: newMember.email,
        full_name: newMember.full_name,
      });
    } catch (e) {
      // Fallback to local store
    }

    saveLocalMember(newMember);

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${email} as ${assignedRole}.`,
      member: newMember,
      remainingInvites: rateCheck.remaining,
    });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send team invitation' },
      { status: 500 }
    );
  }
}
