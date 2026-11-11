import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getAdminUsers,
  saveAdminUsers,
  saveAdminAuditLog,
} from '@/lib/admin/store';
import { AdminUserProfile, AdminAuditLog } from '@/lib/admin/types';

export async function GET(req: NextRequest) {
  try {
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
          })),
          ...localOnly,
        ];
      }
    } catch {}

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
    const { user_id, new_role, notes } = body;

    if (!user_id || !new_role) {
      return NextResponse.json(
        { success: false, error: 'user_id and new_role are required' },
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

    // 1. Update in Supabase
    try {
      const supabase = await createServerClient();
      await supabase
        .from('profiles')
        .update({ role: new_role.toLowerCase() === 'platform_admin' ? 'admin' : new_role })
        .eq('id', user_id);
    } catch {}

    // 2. Update in Admin Store
    const allUsers = getAdminUsers();
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
        full_name: 'Updated User',
        role: new_role as any,
        created_at: new Date().toISOString(),
      };
      updatedUsers.unshift(updatedUser);
    }
    saveAdminUsers(updatedUsers);

    // 3. Write to Admin Audit Log
    const auditRecord: AdminAuditLog = {
      id: `log-usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      admin_id: 'usr-platform-admin',
      action_type: 'USER_ROLE_PROMOTION',
      target_id: user_id,
      notes: `Promoted/Updated user role to ${new_role}. ${notes ? `Notes: ${notes}` : ''}`,
    };

    try {
      const supabase = await createServerClient();
      await supabase.from('admin_audit_logs').insert({
        id: auditRecord.id,
        created_at: auditRecord.created_at,
        admin_id: auditRecord.admin_id,
        action_type: auditRecord.action_type,
        target_id: auditRecord.target_id,
        notes: auditRecord.notes,
      });
    } catch {}
    saveAdminAuditLog(auditRecord);

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
