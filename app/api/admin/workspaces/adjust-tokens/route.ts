import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { savePlatformTransaction } from '@/lib/admin/store';
import { getLocalWorkspace, saveLocalWorkspace } from '@/lib/recruiter/store';
import { PlatformTransaction } from '@/lib/admin/types';
import { requireReason, recordDangerousAuditLog } from '@/lib/admin/audit';
import { MAX_TOKEN_ADJUSTMENT, getClientIp, assertStepUpAuth } from '@/lib/admin/security';
import { assertServerPermission } from '@/lib/admin/permissions';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(req: NextRequest) {
  try {
    // Phase 8: Scoped role check - Only Super admin can adjust token balances
    const permission = await assertServerPermission(req, 'employers:adjust_tokens');
    if (!permission.authorized) {
      return permission.response;
    }

    const body = await req.json();
    const { workspace_id, direction, amount, token_adjustment, reason, notes } = body;

    // 1. Mandatory Parameter Validation
    if (!workspace_id) {
      return NextResponse.json(
        { success: false, error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // 2. Reason Validation (min 10 characters)
    let validatedReason: string;
    try {
      validatedReason = requireReason(reason || notes, 10);
    } catch (reasonErr: any) {
      return NextResponse.json(
        { success: false, error: reasonErr.message || 'A valid reason of at least 10 characters is required.' },
        { status: 400 }
      );
    }

    // Resolve Actor
    let actorId = 'usr-platform-admin';
    let actorName = 'Platform Admin';
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        actorName = user.user_metadata?.full_name || user.email || actorName;
      }
    } catch {}
    const headerActorId = req.headers.get('x-admin-user-id');
    if (headerActorId) actorId = headerActorId;

    // Step-Up Authentication Guard (5-minute fresh TOTP)
    const stepUpCheck = await assertStepUpAuth(req, 'token_adjust', actorId, body.step_up_token || body.reauth_token);
    if (!stepUpCheck.authorized) {
      return stepUpCheck.response!;
    }

    // 3. Amount & Direction Calculation
    let resolvedAmount = typeof amount === 'number' ? amount : parseInt(token_adjustment, 10);
    let resolvedDirection: 'ADD' | 'REMOVE' = direction || (resolvedAmount < 0 ? 'REMOVE' : 'ADD');
    resolvedAmount = Math.abs(resolvedAmount);

    if (isNaN(resolvedAmount) || resolvedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Token adjustment amount must be a positive integer greater than zero.' },
        { status: 400 }
      );
    }

    // 4. Configurable Upper Limit Check
    if (resolvedAmount > MAX_TOKEN_ADJUSTMENT) {
      return NextResponse.json(
        {
          success: false,
          error: `Adjustment amount exceeds the maximum allowed limit of ${MAX_TOKEN_ADJUSTMENT} tokens per transaction.`,
        },
        { status: 400 }
      );
    }

    const delta = resolvedDirection === 'REMOVE' ? -resolvedAmount : resolvedAmount;

    // 5. Fetch Current Workspace & Balance
    let currentBalance = 0;
    let companyName = 'Corporate Workspace';

    try {
      const supabase = await createServerClient();
      const { data: ws } = await supabase
        .from('corporate_workspaces')
        .select('*')
        .eq('id', workspace_id)
        .maybeSingle();

      if (ws) {
        companyName = ws.company_name || companyName;
        currentBalance = ws.token_balance || 0;
      }
    } catch {}

    const localWs = getLocalWorkspace();
    if (localWs && localWs.id === workspace_id) {
      companyName = localWs.company_name || companyName;
      currentBalance = localWs.token_balance || currentBalance;
    }

    // 6. Block Result Below Zero
    const updatedBalance = currentBalance + delta;
    if (updatedBalance < 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Adjustment would result in a negative token balance (${updatedBalance}). Operation blocked.`,
        },
        { status: 400 }
      );
    }

    // 7. Execute Atomic Postgres RPC: adjust_tokens
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      try {
        await serviceClient.rpc('adjust_tokens', {
          p_actor_id: actorId,
          p_actor_name: actorName,
          p_workspace_id: workspace_id,
          p_delta: delta,
          p_reason: validatedReason,
          p_ip: getClientIp(req),
        });
      } catch (rpcErr) {
        console.warn('Notice: adjust_tokens RPC fallback:', rpcErr);
      }
    }

    // Update Balance in Supabase
    try {
      const supabase = await createServerClient();
      await supabase
        .from('corporate_workspaces')
        .update({ token_balance: updatedBalance })
        .eq('id', workspace_id);
    } catch {}

    // Update in local store
    if (localWs && localWs.id === workspace_id) {
      saveLocalWorkspace({ ...localWs, token_balance: updatedBalance });
    }

    // 8. Create Platform Transaction
    const txRecord: PlatformTransaction = {
      id: `tx-adj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      workspace_id,
      company_name: companyName,
      amount_ngn: delta > 0 ? delta * 20000 : 0, // ₦20,000 per token valuation
      transaction_type: 'ADMIN_ADJUSTMENT',
      payment_reference: `adj_ref_${Date.now()}`,
      status: 'SUCCESS',
      notes: `${validatedReason} (${delta > 0 ? '+' : ''}${delta} tokens)`,
    };

    try {
      const supabase = await createServerClient();
      await supabase.from('platform_transactions').insert({
        id: txRecord.id,
        created_at: txRecord.created_at,
        workspace_id: txRecord.workspace_id,
        amount_ngn: txRecord.amount_ngn,
        transaction_type: txRecord.transaction_type,
        payment_reference: txRecord.payment_reference,
        status: txRecord.status,
      });
    } catch {}
    savePlatformTransaction(txRecord);

    // 10. Record Append-Only Audit Log
    const auditRecord = await recordDangerousAuditLog({
      actor_id: actorId,
      actor_name: actorName,
      action: 'WORKSPACE_TOKEN_ADJUSTMENT',
      target_type: 'WORKSPACE_TOKENS',
      target_id: workspace_id,
      target_label: companyName,
      reason: validatedReason,
      before: { token_balance: currentBalance },
      after: { token_balance: updatedBalance, delta, direction: resolvedDirection },
      ip: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      message: `Token balance for ${companyName} adjusted from ${currentBalance} to ${updatedBalance}.`,
      token_balance: updatedBalance,
      transaction: txRecord,
      audit_log: auditRecord,
    });
  } catch (error: any) {
    console.error('Adjust tokens error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to adjust tokens' },
      { status: 500 }
    );
  }
}
