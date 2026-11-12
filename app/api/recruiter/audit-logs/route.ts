import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import { getLocalAuditLogs } from '@/lib/recruiter/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const targetWsId = session?.workspaceId || 'ws-sync730-demo';

    // REQUIREMENT: Audit Log is restricted to Admins and Owners
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN'], targetWsId);
    if (roleError) {
      return roleError;
    }

    const searchParams = req.nextUrl.searchParams;
    const actionFilter = searchParams.get('action');
    const userFilter = searchParams.get('user');
    const dateRange = searchParams.get('date_range') || 'all';
    const query = searchParams.get('q')?.toLowerCase();

    let logs = getLocalAuditLogs(targetWsId);

    // Filter by action
    if (actionFilter && actionFilter !== 'all') {
      logs = logs.filter((l) => l.action === actionFilter);
    }

    // Filter by user / actor
    if (userFilter && userFilter !== 'all') {
      logs = logs.filter(
        (l) =>
          l.actor_email?.toLowerCase() === userFilter.toLowerCase() ||
          l.actor_name?.toLowerCase() === userFilter.toLowerCase()
      );
    }

    // Filter by date range
    if (dateRange && dateRange !== 'all') {
      const now = Date.now();
      const cutoffMap: Record<string, number> = {
        today: 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const cutoff = cutoffMap[dateRange];
      if (cutoff) {
        logs = logs.filter((l) => {
          const timestamp = new Date(l.created_at).getTime();
          return now - timestamp <= cutoff;
        });
      }
    }

    // Keyword search
    if (query) {
      logs = logs.filter(
        (l) =>
          l.details?.toLowerCase().includes(query) ||
          l.target_resource?.toLowerCase().includes(query) ||
          l.actor_name?.toLowerCase().includes(query) ||
          l.actor_email?.toLowerCase().includes(query) ||
          l.action?.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
      immutable: true,
    });
  } catch (error: any) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
