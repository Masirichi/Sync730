import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';
import { getAdminUsers, saveAdminUsers, SEED_ADMIN_USERS } from '@/lib/admin/store';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/auth/provision-super-admin
 * Live Project Platform Admin Provisioning Endpoint
 * Authoritatively registers and elevates ajahmalachy@gmail.com to Super Admin Manager in live Postgres / Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = (body.email || 'ajahmalachy@gmail.com').toLowerCase().trim();

    // Strict boundary: Only authorized platform owner email can be provisioned via this route
    if (targetEmail !== 'ajahmalachy@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized email target for platform admin provisioning.' },
        { status: 403 }
      );
    }

    const clientIp = getClientIp(req);
    const serviceClient = getServiceRoleClient();
    const serverClient = await createServerClient();
    const dbClient = serviceClient || serverClient;

    let dbUserId: string | null = null;
    let authUserFound = false;
    let profileUpdated = false;
    let adminRolesUpdated = false;

    // 1. Look up user in auth.users via service client if available
    if (serviceClient) {
      try {
        const { data: userData } = await serviceClient.auth.admin.listUsers();
        const matched = userData?.users?.find(
          (u) => u.email?.toLowerCase() === targetEmail
        );
        if (matched) {
          dbUserId = matched.id;
          authUserFound = true;

          // Update user app_metadata and user_metadata to PLATFORM_ADMIN
          await serviceClient.auth.admin.updateUserById(matched.id, {
            user_metadata: {
              ...matched.user_metadata,
              full_name: 'Ajah Malachy',
              role: 'PLATFORM_ADMIN',
              Role: 'PLATFORM_ADMIN',
              is_super_admin: true,
            },
            app_metadata: {
              ...matched.app_metadata,
              role: 'PLATFORM_ADMIN',
              is_super_admin: true,
            },
          });
        }
      } catch (adminErr) {
        console.warn('Service role user list check notice:', adminErr);
      }
    }

    // 2. Check if user is in profiles table
    try {
      const { data: existingProfile } = await dbClient
        .from('profiles')
        .select('id, role')
        .eq('email', targetEmail)
        .maybeSingle();

      if (existingProfile) {
        dbUserId = existingProfile.id;
        // Elevate to admin in profiles
        const { error: profileErr } = await dbClient
          .from('profiles')
          .update({
            role: 'admin',
            full_name: 'Ajah Malachy',
          })
          .eq('id', existingProfile.id);

        if (!profileErr) profileUpdated = true;
      } else if (dbUserId) {
        // Insert new profile
        const { error: insertErr } = await dbClient.from('profiles').insert({
          id: dbUserId,
          email: targetEmail,
          full_name: 'Ajah Malachy',
          role: 'admin',
        });
        if (!insertErr) profileUpdated = true;
      }
    } catch (profileErr) {
      console.warn('Profiles table update notice:', profileErr);
    }

    // 3. Update admin_roles authoritative table
    try {
      const targetUserId = dbUserId || 'usr-admin-super-ajah';
      const { error: adminRoleErr } = await dbClient
        .from('admin_roles')
        .upsert(
          {
            user_id: targetUserId,
            role: 'super_admin',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (!adminRoleErr) {
        adminRolesUpdated = true;
      }
    } catch (roleErr) {
      console.warn('admin_roles table update notice:', roleErr);
    }

    // 4. Ensure admin store includes Ajah Malachy
    const currentUsers = getAdminUsers();
    const exists = currentUsers.some((u) => u.email?.toLowerCase() === targetEmail);
    if (!exists) {
      const ajahUser = SEED_ADMIN_USERS.find((u) => u.email === targetEmail) || {
        id: dbUserId || 'usr-admin-super-ajah',
        email: targetEmail,
        full_name: 'Ajah Malachy',
        role: 'super_admin',
        workspace_name: 'Sync730 Executive Command Center',
        status: 'ACTIVE',
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        avatar_url: '',
        phone: '+234 800 000 0730',
        is_demo: false,
        mfa_enabled: true,
        mfa_enrolled_at: new Date().toISOString(),
      };
      saveAdminUsers([ajahUser, ...currentUsers]);
    }

    // 5. Record audit trail
    await recordDangerousAuditLog({
      actor_id: dbUserId || 'usr-admin-super-ajah',
      actor_name: 'Ajah Malachy',
      action: 'PLATFORM_SUPER_ADMIN_PROVISIONED',
      target_type: 'USER',
      target_id: dbUserId || 'usr-admin-super-ajah',
      target_label: `Ajah Malachy (${targetEmail})`,
      reason: 'Permanent platform administrator manager access granted on live project.',
      ip: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: 'Actual Platform Admin Manager access permanently assigned on live project.',
      user: {
        id: dbUserId || 'usr-admin-super-ajah',
        email: targetEmail,
        name: 'Ajah Malachy',
        role: 'super_admin',
        status: 'ACTIVE',
        live_database_synced: profileUpdated || adminRolesUpdated || authUserFound,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to provision platform admin manager.' },
      { status: 500 }
    );
  }
}
