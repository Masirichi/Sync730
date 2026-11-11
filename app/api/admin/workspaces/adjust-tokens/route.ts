import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  saveAdminAuditLog,
  savePlatformTransaction,
} from '@/lib/admin/store';
import { getLocalWorkspace, saveLocalWorkspace } from '@/lib/recruiter/store';
import { PlatformTransaction, AdminAuditLog } from '@/lib/admin/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspace_id, token_adjustment, notes } = body;

    if (!workspace_id) {
      return NextResponse.json({ success: false, error: 'workspace_id is required' }, { status: 400 });
    }

    const adjustment = parseInt(token_adjustment, 10);
    if (isNaN(adjustment) || adjustment === 0) {
      return NextResponse.json(
        { success: false, error: 'token_adjustment must be a non-zero integer' },
        { status: 400 }
      );
    }

    if (!notes || notes.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'A mandatory notes explanation is required for admin token adjustments' },
        { status: 400 }
      );
    }

    let updatedBalance = 0;
    let companyName = 'Workspace';

    // 1. Fetch current workspace & update token_balance in Supabase
    try {
      const supabase = await createServerClient();
      const { data: ws } = await supabase
        .from('corporate_workspaces')
        .select('*')
        .eq('id', workspace_id)
        .maybeSingle();

      if (ws) {
        companyName = ws.company_name;
        updatedBalance = Math.max(0, (ws.token_balance || 0) + adjustment);

        await supabase
          .from('corporate_workspaces')
          .update({ token_balance: updatedBalance })
          .eq('id', workspace_id);
      }
    } catch {}

    // Also update local workspace if matches
    const localWs = getLocalWorkspace();
    if (localWs && localWs.id === workspace_id) {
      companyName = localWs.company_name;
      updatedBalance = Math.max(0, (localWs.token_balance || 0) + adjustment);
      const updated = { ...localWs, token_balance: updatedBalance };
      saveLocalWorkspace(updated);
    }

    // 2. Create Platform Transaction
    const txRecord: PlatformTransaction = {
      id: `tx-adj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      workspace_id,
      company_name: companyName,
      amount_ngn: adjustment > 0 ? adjustment * 20000 : 0, // ₦20,000 per token valuation
      transaction_type: 'ADMIN_ADJUSTMENT',
      payment_reference: `adj_ref_${Date.now()}`,
      status: 'SUCCESS',
      notes: `${notes.trim()} (${adjustment > 0 ? '+' : ''}${adjustment} tokens)`,
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

    // 3. Write to Admin Audit Log
    const auditRecord: AdminAuditLog = {
      id: `log-adj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      admin_id: 'usr-platform-admin',
      action_type: 'TOKEN_ADJUSTMENT',
      target_id: workspace_id,
      notes: `Adjusted tokens by ${adjustment > 0 ? '+' : ''}${adjustment} for ${companyName}. Reason: ${notes.trim()}`,
    };

    try {
      const supabase = await createServerClient();
      await supabase.from('admin_audit_logs').insert({
        id: auditRecord.id,
        created_at: auditRecord.created_at,
        admin_id: auditRecord.admin_id,
        action_type: auditRecord.action_type,
        target_id: auditRecord.target_id,
        notes: auditRecord.notes,
      });
    } catch {}
    saveAdminAuditLog(auditRecord);

    return NextResponse.json({
      success: true,
      message: `Successfully adjusted tokens by ${adjustment > 0 ? '+' : ''}${adjustment} for ${companyName}.`,
      token_balance: updatedBalance,
      transaction: txRecord,
      audit_log: auditRecord,
    });
  } catch (error: any) {
    console.error('Adjust tokens error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to adjust workspace tokens' },
      { status: 500 }
    );
  }
}
