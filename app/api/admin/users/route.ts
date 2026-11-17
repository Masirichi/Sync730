import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getAdminUsers,
  saveAdminUsers,
} from '@/lib/admin/store';
import { AdminUserProfile } from '@/lib/admin/types';
import { requireReason, recordDangerousAuditLog } from '@/lib/admin/audit';
import { verifyAdminReauth, getClientIp } from '@/lib/admin/security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeDemo = searchParams.get('include_demo') === 'true';

    let users = getAdminUsers();

    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const existingIds = new Set(data.map((d: any) => d.id));
        const localOnly = users.filter((u) => !existingIds.has(u.id));
        users = [
          ...data.map((d: any) => ({
            id: d.id,
            email: d.email,
            full_name: d.full_name || 'Sync730 User',
            role: d.role,
            created_at: d.created_at,
            phone: d.phone,
            avatar_url: d.avatar_url,
            is_demo: Boolean(d.is_demo),
            status: d.status || 'ACTIVE',
            last_active: d.last_sign_in_at || d.updated_at || d.created_at,
          })),
          ...localOnly,
        ];
      }
    } catch {}

    // Exclude demo users unless include_demo is explicitly true
    if (!includeDemo) {
      users = users.filter((u) => {
        if (u.is_demo) return false;
        const email = (u.email || '').toLowerCase();
        if (email.includes('@test.') || email.includes('@example.') || email.includes('demo')) {
          return false;
        }
        return true;
      });
    }

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, new_role, action, status, reason, reauth_password, reauth_token } = body;

    // 1. Mandatory Parameter Validation
    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // 2. Server-side Reason Validation (min 10 characters)
    let validatedReason: string;
    try {
      validatedReason = requireReason(reason || body.notes, 10);
    } catch (reasonErr: any) {
      return NextResponse.json(
        { success: false, error: reasonErr.message || 'A valid reason of at least 10 characters is required.' },
        { status: 400 }
      );
    }

    // 3. Resolve Current Session / Actor
    let actorId = 'usr-platform-admin';
    let actorEmail = 'admin@sync730.com';
    let actorName = 'Platform Admin';

    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        actorEmail = user.email || actorEmail;
        actorName = user.user_metadata?.full_name || actorEmail;
      }
    } catch {}

    const headerActorId = req.headers.get('x-admin-user-id');
    if (headerActorId) {
      actorId = headerActorId;
    }

    const allUsers = getAdminUsers();
    const existingUser = allUsers.find((u) => u.id === user_id || u.email === user_id);

    // -------------------------------------------------------------------------
    // A. SUSPEND / RESTORE FLOW
    // -------------------------------------------------------------------------
    if (action === 'SUSPEND' || action === 'RESTORE' || status === 'SUSPENDED' || status === 'ACTIVE') {
      const newStatus = action === 'SUSPEND' || status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
      const prevStatus = existingUser?.status || 'ACTIVE';

      // Block self-suspension
      if (actorId === user_id && newStatus === 'SUSPENDED') {
        return NextResponse.json(
          { success: false, error: 'Self-suspension is prohibited. You cannot suspend your own account.' },
          { status: 400 }
        );
      }

      // Update in Supabase
      try {
        const supabase = await createServerClient();
        await supabase
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', user_id);
      } catch {}

      // Update in local store
      let updatedUser: AdminUserProfile | null = null;
      const updatedUsers = allUsers.map((u) => {
        if (u.id === user_id || u.email === user_id) {
          updatedUser = { ...u, status: newStatus };
          return updatedUser;
        }
        return u;
      });

      if (!updatedUser && existingUser) {
        updatedUser = { ...existingUser, status: newStatus };
        updatedUsers.unshift(updatedUser);
      }

      saveAdminUsers(updatedUsers);

      // Record Audit Log
      const auditRecord = await recordDangerousAuditLog({
        actor_id: actorId,
        actor_name: actorName,
        action: newStatus === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_RESTORED',
        target_type: 'USER',
        target_id: user_id,
        target_label: `${updatedUser?.full_name || 'User'} (${updatedUser?.email || user_id})`,
        reason: validatedReason,
        before: { status: prevStatus },
        after: { status: newStatus },
        ip: getClientIp(req),
      });

      return NextResponse.json({
        success: true,
        message: `User account successfully ${newStatus === 'SUSPENDED' ? 'suspended' : 'restored'}.`,
        user: updatedUser,
        audit_log: auditRecord,
      });
    }

    // -------------------------------------------------------------------------
    // B. ROLE CHANGE FLOW
    // -------------------------------------------------------------------------
    if (!new_role) {
      return NextResponse.json(
        { success: false, error: 'new_role is required for role modification' },
        { status: 400 }
      );
    }

    const validRoles = ['candidate', 'recruiter', 'PLATFORM_ADMIN', 'admin'];
    if (!validRoles.includes(new_role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const currentRole = existingUser?.role || 'candidate';

    const isTargetAdmin =
      currentRole === 'PLATFORM_ADMIN' ||
      (currentRole as string).toLowerCase() === 'admin';
    const isNewAdmin =
      new_role === 'PLATFORM_ADMIN' ||
      new_role.toLowerCase() === 'admin';

    // Enforce Re-Authentication for Role Changes To or From Admin
    const isElevatingToAdmin = !isTargetAdmin && isNewAdmin;
    const isRevokingAdmin = isTargetAdmin && !isNewAdmin;
    const requiresReauth = isElevatingToAdmin || isRevokingAdmin;

    if (requiresReauth) {
      const reauthCheck = await verifyAdminReauth(req, actorEmail, reauth_password, reauth_token);
      if (!reauthCheck.verified) {
        return NextResponse.json(
          {
            success: false,
            error: reauthCheck.message || 'Re-authentication is required to grant or revoke platform admin access.',
          },
          { status: 403 }
        );
      }
    }

    // Block Self-Demotion Server-Side
    if (actorId === user_id && isTargetAdmin && !isNewAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Self-demotion is prohibited. You cannot remove your own platform admin privileges.',
        },
        { status: 400 }
      );
    }

    // Block Removing the Last Remaining Platform Admin Server-Side
    if (isRevokingAdmin) {
      const adminCount = allUsers.filter(
        (u) => u.role === 'PLATFORM_ADMIN' || (u.role as string).toLowerCase() === 'admin'
      ).length;

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot remove the last remaining platform admin. At least one platform admin must always exist.',
          },
          { status: 400 }
        );
      }
    }

    // Update Profile in Supabase
    try {
      const supabase = await createServerClient();
      await supabase
        .from('profiles')
        .update({ role: isNewAdmin ? 'admin' : new_role })
        .eq('id', user_id);
    } catch {}

    // Update in Admin Store
    let updatedUser: AdminUserProfile | null = null;
    const updatedUsers = allUsers.map((u) => {
      if (u.id === user_id || u.email === user_id) {
        updatedUser = { ...u, role: new_role as any };
        return updatedUser;
      }
      return u;
    });

    if (!updatedUser) {
      updatedUser = {
        id: user_id,
        email: user_id.includes('@') ? user_id : `${user_id}@sync730.com`,
        full_name: existingUser?.full_name || 'Updated User',
        role: new_role as any,
        created_at: existingUser?.created_at || new Date().toISOString(),
      };
      updatedUsers.unshift(updatedUser);
    }
    saveAdminUsers(updatedUsers);

    // Record Append-Only Audit Log
    const auditRecord = await recordDangerousAuditLog({
      actor_id: actorId,
      actor_name: actorName,
      action: isNewAdmin
        ? 'USER_ROLE_PROMOTION'
        : isRevokingAdmin
        ? 'USER_ROLE_DEMOTION'
        : 'USER_ROLE_CHANGE',
      target_type: 'USER_ROLE',
      target_id: user_id,
      target_label: `${updatedUser.full_name || 'User'} (${updatedUser.email})`,
      reason: validatedReason,
      before: { role: currentRole },
      after: { role: new_role },
      ip: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      message: `User role successfully updated to ${new_role}.`,
      user: updatedUser,
      audit_log: auditRecord,
    });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user role' },
      { status: 500 }
    );
  }
}
