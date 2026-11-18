// lib/admin/permissions.ts
// Phase 8: Scoped roles and centralized permission matrix.
// Roles: Super admin, Moderator, Vetting reviewer, Finance, Support.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';

export * from './permissions-matrix';
import {
  AdminRole,
  AdminAction,
  can,
  normalizeAdminRole,
  getRoleDisplayName,
} from './permissions-matrix';

/**
 * Resolves the authenticated or simulated admin actor from an incoming NextRequest.
 */
export async function resolveAdminActor(req: NextRequest): Promise<{
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isSuperAdmin: boolean;
}> {
  let actorId = 'usr-admin-001';
  let actorName = 'David O. Alabi';
  let actorEmail = 'admin@sync730.com';
  let rawRole: string = 'super_admin';

  // 1. Check override cookie (for role simulation / testing)
  const cookieRole = req.cookies.get('sync730_admin_role')?.value;
  if (cookieRole) {
    rawRole = cookieRole;
  }

  // 2. Check override header
  const headerRole = req.headers.get('x-admin-role');
  if (headerRole) {
    rawRole = headerRole;
  }

  // 3. Supabase Auth user check
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      actorId = user.id;
      actorEmail = user.email || actorEmail;
      actorName = user.user_metadata?.full_name || actorEmail;
      if (!cookieRole && !headerRole) {
        // Security rule: NEVER base authorization on user_metadata (users can edit it).
        // Authoritative role must be read from the admin_roles table.
        const { data: adminRoleRow } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminRoleRow?.role) {
          rawRole = adminRoleRow.role;
        } else {
          // Fallback to app_metadata (service_role only, immutable by user) or default super_admin
          rawRole = user.app_metadata?.role || rawRole;
        }
      }
    }
  } catch {}

  const normalized = normalizeAdminRole(rawRole) || 'super_admin';

  return {
    id: actorId,
    name: actorName,
    email: actorEmail,
    role: normalized,
    isSuperAdmin: normalized === 'super_admin',
  };
}

/**
 * Server-side guard: validates permission and automatically logs unauthorized access attempts.
 */
export async function assertServerPermission(
  req: NextRequest,
  action: AdminAction
): Promise<
  | { authorized: true; actor: { id: string; name: string; email: string; role: AdminRole; isSuperAdmin: boolean } }
  | { authorized: false; response: NextResponse; actor: { id: string; name: string; email: string; role: AdminRole; isSuperAdmin: boolean } }
> {
  const actor = await resolveAdminActor(req);

  if (can(actor.role, action)) {
    return { authorized: true, actor };
  }

  // Log unauthorized access violation to append-only audit trail
  try {
    await recordDangerousAuditLog({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      target_type: 'SYSTEM',
      target_id: action,
      target_label: `${getRoleDisplayName(actor.role)} denied permission for ${action}`,
      reason: `Direct access attempt to restricted action "${action}" on ${req.nextUrl?.pathname || req.url} without permission.`,
      ip: getClientIp(req),
    });
  } catch (err) {
    console.error('Failed to log unauthorized access audit record:', err);
  }

  return {
    authorized: false,
    actor,
    response: NextResponse.json(
      {
        success: false,
        error: `Forbidden: Your role (${getRoleDisplayName(actor.role)}) does not have permission to access ${action}.`,
        code: 'FORBIDDEN_ROLE_INSUFFICIENT',
      },
      { status: 403 }
    ),
  };
}
