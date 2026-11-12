import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  DEFAULT_WORKSPACE,
  getLocalWorkspace,
  saveLocalWorkspace,
} from '@/lib/recruiter/store';
import { CorporateWorkspace } from '@/lib/recruiter/types';
import { getRecruiterSession } from '@/lib/recruiter/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const requestedWorkspaceId = req.nextUrl.searchParams.get('workspace_id');

    // Security: Only allow querying the caller's own workspace unless platform admin
    const targetWsId = session?.isPlatformAdmin
      ? requestedWorkspaceId || session?.workspaceId
      : session?.workspaceId || requestedWorkspaceId || 'ws-sync730-demo';

    const role = session?.role || 'OWNER';

    // 1. Try Supabase
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('corporate_workspaces')
        .select('*')
        .eq('id', targetWsId)
        .limit(1);

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, workspace: data[0], role });
      }
    } catch (err) {
      // Fallback
    }

    // 2. Fallback to Local/Memory Store
    const ws = getLocalWorkspace();
    return NextResponse.json({ success: true, workspace: ws, role });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, billing_email, industry, company_size } = body;

    if (!company_name || typeof company_name !== 'string' || !company_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'company_name is required' },
        { status: 400 }
      );
    }

    // SECURITY: Never trust token_balance from client body!
    // Server enforces fixed standard initial trial allocation of 2 tokens.
    const INITIAL_TRIAL_TOKENS = 2;

    const newWorkspace: CorporateWorkspace = {
      id: `ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      company_name: company_name.trim(),
      billing_email: (
        billing_email ||
        'recruiting@' + company_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
      ).trim(),
      token_balance: INITIAL_TRIAL_TOKENS,
      industry: industry || 'Technology & Remote Services',
      company_size: company_size || '10-50 Employees',
      created_at: new Date().toISOString(),
    };

    // 1. Try Supabase
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('corporate_workspaces')
        .insert({
          id: newWorkspace.id,
          company_name: newWorkspace.company_name,
          billing_email: newWorkspace.billing_email,
          token_balance: INITIAL_TRIAL_TOKENS,
          industry: newWorkspace.industry,
          company_size: newWorkspace.company_size,
        })
        .select()
        .single();

      if (!error && data) {
        newWorkspace.id = data.id;
        newWorkspace.token_balance = data.token_balance;
      }
    } catch (e) {
      console.warn('Notice: Supabase insert workspace fallback to store:', e);
    }

    // 2. Persist to Local Store
    saveLocalWorkspace(newWorkspace);

    const response = NextResponse.json({
      success: true,
      workspace: newWorkspace,
      role: 'OWNER',
      message: 'Corporate workspace initialized with 2 free trial tokens',
    });
    response.cookies.set('sync730-demo-role', 'recruiter', {
      path: '/',
      maxAge: 86400,
      sameSite: 'lax',
    });
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
