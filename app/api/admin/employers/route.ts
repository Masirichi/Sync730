import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLocalWorkspace, getLocalAssessments } from '@/lib/recruiter/store';
import { getServerJobs } from '@/lib/admin/server-store';
import { AdminCorporateWorkspace } from '@/lib/admin/types';
import { assertServerPermission } from '@/lib/admin/permissions';

const SEED_EMPLOYERS: AdminCorporateWorkspace[] = [
  {
    id: 'ws-fintech-01',
    company_name: 'Fintech Global Ventures',
    billing_email: 'elena.rostova@fintechglobal.co',
    token_balance: 7,
    industry: 'Fintech',
    company_size: '50-200',
    roles_posted: 6,
    roles_live: 3,
    interviews_run: 14,
    last_active: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    is_demo: false,
  },
  {
    id: 'ws-cloudscale-03',
    company_name: 'CloudScale Africa Ltd',
    billing_email: 'talent@cloudscale.africa',
    token_balance: 15,
    industry: 'Infrastructure & AI',
    company_size: '100-500',
    roles_posted: 8,
    roles_live: 4,
    interviews_run: 22,
    last_active: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    is_demo: false,
  },
  {
    id: 'ws-payrail-04',
    company_name: 'PayRail Technologies',
    billing_email: 'recruiting@payrail.ng',
    token_balance: 4,
    industry: 'Payments & Banking',
    company_size: '50-100',
    roles_posted: 5,
    roles_live: 2,
    interviews_run: 9,
    last_active: new Date(Date.now() - 3600000 * 6).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 18).toISOString(),
    is_demo: false,
  },
  {
    id: 'ws-sterling-05',
    company_name: 'Sterling Capital Microfinance',
    billing_email: 'hr@sterlingcap.ng',
    token_balance: 0,
    industry: 'Microfinance & Credit',
    company_size: '20-50',
    roles_posted: 3,
    roles_live: 1,
    interviews_run: 5,
    last_active: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
    is_demo: false,
  },
  {
    id: 'ws-sync730-demo',
    company_name: 'Acme Global Ventures (Demo)',
    billing_email: 'recruiting@acmeglobal.com',
    token_balance: 2,
    industry: 'Cloud Software',
    company_size: '20-50',
    roles_posted: 4,
    roles_live: 1,
    interviews_run: 3,
    last_active: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    is_demo: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    // Phase 8: Scoped role check - Only Super admin, Finance & Support
    const permission = await assertServerPermission(req, 'employers:read');
    if (!permission.authorized) {
      return permission.response;
    }

    const { searchParams } = new URL(req.url);
    const includeDemo = searchParams.get('include_demo') === 'true';

    let employers: AdminCorporateWorkspace[] = [...SEED_EMPLOYERS];

    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('corporate_workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const existingIds = new Set(data.map((d: any) => d.id));
        const localOnly = employers.filter((e) => !existingIds.has(e.id));
        employers = [
          ...data.map((d: any) => ({
            id: d.id,
            company_name: d.company_name,
            billing_email: d.billing_email,
            token_balance: d.token_balance ?? 0,
            industry: d.industry,
            company_size: d.company_size,
            roles_posted: d.roles_posted ?? 0,
            roles_live: d.roles_live ?? 0,
            interviews_run: d.interviews_run ?? 0,
            last_active: d.last_active || d.created_at,
            created_at: d.created_at,
            is_demo: Boolean(d.is_demo || d.id === 'ws-sync730-demo' || /test/i.test(d.company_name)),
          })),
          ...localOnly,
        ];
      }
    } catch {}

    // Merge active recruiter workspace if exists
    const localWs = getLocalWorkspace();
    if (localWs && localWs.id && localWs.company_name) {
      const idx = employers.findIndex((e) => e.id === localWs.id);
      if (idx >= 0) {
        employers[idx] = {
          ...employers[idx],
          company_name: localWs.company_name,
          token_balance: localWs.token_balance ?? employers[idx].token_balance,
        };
      }
    }

    // Exclude demo employers unless includeDemo is true
    if (!includeDemo) {
      employers = employers.filter((e) => {
        if (e.is_demo) return false;
        if (e.id === 'ws-sync730-demo') return false;
        if (/test/i.test(e.company_name) || e.company_name.toUpperCase().includes('TEST CORP')) return false;
        return true;
      });
    }

    return NextResponse.json({ success: true, employers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list employers' },
      { status: 500 }
    );
  }
}
