import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLocalWorkspace } from '@/lib/recruiter/store';
import { AdminCorporateWorkspace } from '@/lib/admin/types';

// Seed demo workspaces for fallback
const SEED_WORKSPACES: AdminCorporateWorkspace[] = [
  {
    id: 'ws-fintech-01',
    company_name: 'Fintech Global Ventures',
    billing_email: 'elena.rostova@fintechglobal.co',
    token_balance: 7,
    industry: 'Fintech',
    company_size: '50-200',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'ws-sync730-demo',
    company_name: 'Acme Global Ventures',
    billing_email: 'recruiting@acmeglobal.com',
    token_balance: 2,
    industry: 'Cloud Software',
    company_size: '20-50',
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
  },
  {
    id: 'ws-cloudscale-03',
    company_name: 'CloudScale Africa Ltd',
    billing_email: 'talent@cloudscale.africa',
    token_balance: 15,
    industry: 'Infrastructure & AI',
    company_size: '100-500',
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    let workspaces: AdminCorporateWorkspace[] = [];

    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('corporate_workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        workspaces = data;
      }
    } catch {}

    // Merge with current local workspace if active
    const localWs = getLocalWorkspace();
    if (localWs && localWs.id && localWs.company_name) {
      const idx = workspaces.findIndex((w) => w.id === localWs.id);
      const wsObj: AdminCorporateWorkspace = {
        id: localWs.id,
        company_name: localWs.company_name,
        billing_email: localWs.billing_email || 'hiring@company.com',
        token_balance: localWs.token_balance ?? 2,
        industry: localWs.industry || 'Technology',
        company_size: localWs.company_size || '10-50',
        created_at: localWs.created_at || new Date().toISOString(),
      };
      if (idx >= 0) {
        workspaces[idx] = { ...workspaces[idx], ...wsObj };
      } else {
        workspaces.unshift(wsObj);
      }
    }

    if (workspaces.length === 0) {
      workspaces = [...SEED_WORKSPACES];
    }

    return NextResponse.json({ success: true, workspaces });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list workspaces' },
      { status: 500 }
    );
  }
}
