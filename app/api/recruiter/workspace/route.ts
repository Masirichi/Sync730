import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  DEFAULT_WORKSPACE,
  getLocalWorkspace,
  saveLocalWorkspace,
} from '@/lib/recruiter/store';
import { CorporateWorkspace } from '@/lib/recruiter/types';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check query param or active workspace cookie
    const workspaceId = req.nextUrl.searchParams.get('workspace_id');

    // 1. Try Supabase
    if (supabase) {
      try {
        let query = supabase.from('corporate_workspaces').select('*');
        if (workspaceId) {
          query = query.eq('id', workspaceId);
        }
        const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
        if (!error && data && data.length > 0) {
          return NextResponse.json({ success: true, workspace: data[0] });
        }
      } catch (err) {
        // Fallback
      }
    }

    // 2. Fallback to Local/Memory Store
    const ws = getLocalWorkspace();
    return NextResponse.json({ success: true, workspace: ws });
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
    const { company_name, billing_email, token_balance = 2, industry, company_size } = body;

    if (!company_name) {
      return NextResponse.json(
        { success: false, error: 'company_name is required' },
        { status: 400 }
      );
    }

    const newWorkspace: CorporateWorkspace = {
      id: `ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      company_name: company_name.trim(),
      billing_email: (billing_email || 'recruiting@' + company_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com').trim(),
      token_balance: Number(token_balance) || 2,
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
          company_name: newWorkspace.company_name,
          billing_email: newWorkspace.billing_email,
          token_balance: newWorkspace.token_balance,
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
