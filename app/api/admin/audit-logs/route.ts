import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAdminAuditLogs } from '@/lib/admin/store';

export async function GET(req: NextRequest) {
  try {
    let auditLogs = getAdminAuditLogs();

    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const existingIds = new Set(data.map((d: any) => d.id));
        const localOnly = auditLogs.filter((l) => !existingIds.has(l.id));
        auditLogs = [...data, ...localOnly];
      }
    } catch {}

    auditLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, audit_logs: auditLogs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list audit logs' },
      { status: 500 }
    );
  }
}
