import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getLocalWorkspace,
  saveLocalWorkspace,
  saveLocalUnlock,
  getLocalAssessments,
  formatMaskedCandidate,
} from '@/lib/recruiter/store';
import { TokenUnlockRecord } from '@/lib/recruiter/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidate_id, workspace_id } = body;

    if (!candidate_id) {
      return NextResponse.json(
        { success: false, error: 'candidate_id is required' },
        { status: 400 }
      );
    }

    const wsId = workspace_id || 'ws-sync730-demo';

    // 1. Get current workspace
    let workspace = getLocalWorkspace();

    try {
      const supabase = await createServerClient();
      const { data: dbWs } = await supabase
        .from('corporate_workspaces')
        .select('*')
        .eq('id', wsId)
        .maybeSingle();

      if (dbWs) {
        workspace = dbWs;
      }
    } catch (e) {
      // fallback
    }

    // Check balance
    if (workspace.token_balance < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient tokens. Please purchase a token pack to unlock candidate profiles.',
          token_balance: workspace.token_balance,
        },
        { status: 402 }
      );
    }

    // 2. Deduct 1 token
    const newBalance = workspace.token_balance - 1;
    workspace.token_balance = newBalance;

    try {
      const supabase = await createServerClient();
      await supabase
        .from('corporate_workspaces')
        .update({ token_balance: newBalance })
        .eq('id', wsId);
    } catch (e) {
      // fallback
    }
    saveLocalWorkspace(workspace);

    // 3. Record unlock in token_unlocks
    const unlockRecord: TokenUnlockRecord = {
      id: `unl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: wsId,
      candidate_id,
      tokens_spent: 1,
      unlocked_at: new Date().toISOString(),
    };

    try {
      const supabase = await createServerClient();
      await supabase.from('token_unlocks').insert({
        workspace_id: wsId,
        candidate_id,
        tokens_spent: 1,
        unlocked_at: unlockRecord.unlocked_at,
      });
    } catch (e) {
      // fallback
    }
    saveLocalUnlock(unlockRecord);

    // 4. Retrieve candidate and format unmasked profile
    const allAssessments = getLocalAssessments();
    const candidate = allAssessments.find((a) => a.candidate_id === candidate_id || a.id === candidate_id);

    const unmasked = candidate
      ? formatMaskedCandidate(candidate, true)
      : {
          id: candidate_id,
          candidate_id,
          target_role: 'Verified Candidate',
          candidate_name: 'Jane Doe',
          candidate_email: 'jane.doe@sync730.com',
          is_unlocked: true,
        };

    return NextResponse.json({
      success: true,
      message: 'Candidate profile successfully unlocked for 1 token.',
      token_balance: newBalance,
      candidate: unmasked,
    });
  } catch (error: any) {
    console.error('Talent unlock error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unlock candidate' },
      { status: 500 }
    );
  }
}
