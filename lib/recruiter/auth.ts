// lib/recruiter/auth.ts
// Server-side role resolution, organization scoping, and RBAC guards for the Recruiter Console.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { RecruiterRole } from './types';
import { getLocalWorkspace, getLocalMembers } from './store';

export interface RecruiterSession {
  userId: string;
  email: string;
  workspaceId: string;
  role: RecruiterRole;
  isPlatformAdmin: boolean;
}

/**
 * Resolves the authenticated recruiter session, their active workspace, and their role.
 * Ensures data is strictly scoped by organization.
 */
export async function getRecruiterSession(req: NextRequest): Promise<RecruiterSession | null> {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.ENVIRONMENT === 'production';

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. If user is authenticated in Supabase
    if (user) {
      // Check if user is platform admin
      let isPlatformAdmin = false;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role === 'admin' || profile?.role === 'PLATFORM_ADMIN') {
          isPlatformAdmin = true;
        }
      } catch {}

      // Look up workspace membership
      try {
        const { data: member } = await supabase
          .from('workspace_members')
          .select('workspace_id, role')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .limit(1)
          .maybeSingle();

        if (member && member.workspace_id) {
          return {
            userId: user.id,
            email: user.email || '',
            workspaceId: member.workspace_id,
            role: (member.role as RecruiterRole) || 'INTERVIEWER',
            isPlatformAdmin,
          };
        }

        // If no membership found, check if user is the workspace creator/owner
        const { data: workspace } = await supabase
          .from('corporate_workspaces')
          .select('id')
          .eq('billing_email', user.email)
          .limit(1)
          .maybeSingle();

        if (workspace) {
          return {
            userId: user.id,
            email: user.email || '',
            workspaceId: workspace.id,
            role: 'OWNER',
            isPlatformAdmin,
          };
        }
      } catch (dbErr) {
        console.warn('Recruiter session db query error:', dbErr);
      }
    }

    // 2. In Production: reject unauthenticated callers
    if (isProd && !user) {
      return null;
    }

    // 3. In Non-production / Local Testing: use local workspace and role header/cookie
    const localWs = getLocalWorkspace();
    const headerRole = req.headers.get('x-recruiter-role') as RecruiterRole | null;
    const cookieRole = req.cookies.get('sync730-recruiter-role')?.value as RecruiterRole | null;
    const resolvedRole: RecruiterRole = headerRole || cookieRole || 'OWNER';

    const headerWsId = req.headers.get('x-workspace-id');
    const resolvedWsId = headerWsId || localWs.id || 'ws-sync730-demo';

    return {
      userId: user?.id || 'usr-recruiter-demo',
      email: user?.email || localWs.billing_email || 'hiring@acmeglobal.com',
      workspaceId: resolvedWsId,
      role: resolvedRole,
      isPlatformAdmin: false,
    };
  } catch (error) {
    console.error('Error resolving recruiter session:', error);
    return null;
  }
}

/**
 * Server-side RBAC assertion guard.
 * Returns null if authorized, or a pre-built NextResponse error (401 or 403) if unauthorized.
 */
export function enforceRecruiterRole(
  session: RecruiterSession | null,
  allowedRoles: RecruiterRole[],
  requestedWorkspaceId?: string
): NextResponse | null {
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Authentication required.' },
      { status: 401 }
    );
  }

  // Organization Scoping Guard: A user can never access another organization's records
  if (
    requestedWorkspaceId &&
    requestedWorkspaceId !== session.workspaceId &&
    !session.isPlatformAdmin
  ) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden: You do not have permission to access data belonging to another organization.',
      },
      { status: 403 }
    );
  }

  // Role Guard
  if (!allowedRoles.includes(session.role) && !session.isPlatformAdmin) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden: This action requires ${allowedRoles.join(' or ')} privileges. Your current role is ${session.role}.`,
        currentRole: session.role,
        requiredRoles: allowedRoles,
      },
      { status: 403 }
    );
  }

  return null;
}
