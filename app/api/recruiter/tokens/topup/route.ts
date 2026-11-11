import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLocalWorkspace, saveLocalWorkspace } from '@/lib/recruiter/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount = 5, workspace_id, reason = 'Direct Token Pack Purchase' } = body;

    const tokenCount = Math.max(1, Number(amount) || 5);
    const wsId = workspace_id || 'ws-sync730-demo';

    const ws = getLocalWorkspace();
    const newBalance = (ws.token_balance || 0) + tokenCount;
    ws.token_balance = newBalance;

    try {
      const supabase = await createServerClient();
      await supabase
        .from('corporate_workspaces')
        .update({ token_balance: newBalance })
        .eq('id', wsId);
    } catch (e) {
      // fallback
    }

    saveLocalWorkspace(ws);

    return NextResponse.json({
      success: true,
      added_tokens: tokenCount,
      new_balance: newBalance,
      reason,
      message: `Successfully added ${tokenCount} candidate unlock tokens to workspace.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Token topup failed' },
      { status: 500 }
    );
  }
}
