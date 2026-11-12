import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getLocalWorkspace,
  saveLocalWorkspace,
  saveLocalUnlock,
  getLocalUnlocks,
  getLocalAssessments,
  formatMaskedCandidate,
} from '@/lib/recruiter/store';
import { TokenUnlockRecord } from '@/lib/recruiter/types';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import {
  recordTokenSpend,
  calculateLedgerBalance,
} from '@/lib/recruiter/billing';

// In-memory idempotency cache for in-flight/recent unlock calls
const recentUnlockKeys = new Map<string, { timestamp: number; response: any }>();

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const body = await req.json();
    const { candidate_id, workspace_id, idempotency_key } = body;

    const targetWsId = workspace_id || session?.workspaceId || 'ws-sync730-demo';

    // RBAC: Only OWNER and ADMIN can unlock candidates with tokens
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN'], targetWsId);
    if (roleError) {
      return roleError;
    }

    if (!candidate_id) {
      return NextResponse.json(
        { success: false, error: 'candidate_id is required' },
        { status: 400 }
      );
    }

    // 1. Idempotency Key Guard: Prevent double-click double-spend
    if (idempotency_key && recentUnlockKeys.has(idempotency_key)) {
      const cached = recentUnlockKeys.get(idempotency_key)!;
      if (Date.now() - cached.timestamp < 30000) {
        return NextResponse.json(cached.response);
      }
    }

    // 2. Candidate Already Unlocked Guard (Idempotent unlock)
    const existingUnlocks = getLocalUnlocks(targetWsId);
    const alreadyUnlocked = existingUnlocks.find((u) => u.candidate_id === candidate_id);
    const allAssessments = getLocalAssessments();
    const candidate = allAssessments.find(
      (a) => a.candidate_id === candidate_id || a.id === candidate_id
    );

    const formatCandidateResponse = () => {
      return candidate
        ? formatMaskedCandidate(candidate, true)
        : {
            id: candidate_id,
            candidate_id,
            target_role: 'Verified Candidate',
            candidate_name: 'Jane Doe',
            candidate_email: 'jane.doe@sync730.com',
            is_unlocked: true,
          };
    };

    if (alreadyUnlocked) {
      const resp = {
        success: true,
        already_unlocked: true,
        message: 'Candidate is already unlocked for your organization.',
        token_balance: calculateLedgerBalance(targetWsId),
        candidate: formatCandidateResponse(),
      };
      if (idempotency_key) {
        recentUnlockKeys.set(idempotency_key, { timestamp: Date.now(), response: resp });
      }
      return NextResponse.json(resp);
    }

    // 3. Check Authoritative Ledger Balance
    const currentBalance = calculateLedgerBalance(targetWsId);
    if (currentBalance < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient tokens. Please purchase a token pack in Billing to unlock candidates.',
          token_balance: currentBalance,
        },
        { status: 402 }
      );
    }

    // 4. Record Append-Only Ledger Debit
    const maskedId = candidate
      ? `#${(candidate.candidate_id || candidate.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`
      : `#${candidate_id.slice(-4).toUpperCase()}`;

    const spendResult = recordTokenSpend({
      workspaceId: targetWsId,
      userId: session?.userId || 'recruiter-admin',
      userEmail: session?.email || 'recruiter@company.com',
      candidateId: candidate_id,
      candidateMaskedId: maskedId,
      tokens: 1,
    });

    const newBalance = spendResult.newBalance;

    // 5. Record unlock record
    const unlockRecord: TokenUnlockRecord = {
      id: `unl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: targetWsId,
      candidate_id,
      tokens_spent: 1,
      unlocked_at: new Date().toISOString(),
    };

    try {
      const supabase = await createServerClient();
      await supabase.from('token_unlocks').insert({
        workspace_id: targetWsId,
        candidate_id,
        tokens_spent: 1,
        unlocked_at: unlockRecord.unlocked_at,
      });
      await supabase
        .from('corporate_workspaces')
        .update({ token_balance: newBalance })
        .eq('id', targetWsId);
    } catch (e) {
      // fallback
    }
    saveLocalUnlock(unlockRecord);

    const unmasked = formatCandidateResponse();

    const successResponse = {
      success: true,
      message: 'Candidate profile successfully unlocked for 1 token.',
      token_balance: newBalance,
      candidate: unmasked,
      ledger_entry: spendResult.ledgerEntry,
    };

    if (idempotency_key) {
      recentUnlockKeys.set(idempotency_key, {
        timestamp: Date.now(),
        response: successResponse,
      });
    }

    return NextResponse.json(successResponse);
  } catch (error: any) {
    console.error('Talent unlock error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unlock candidate' },
      { status: 500 }
    );
  }
}
