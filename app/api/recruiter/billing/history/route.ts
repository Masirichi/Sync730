import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import {
  getLocalBillingOrders,
  getLocalTokenLedger,
  calculateLedgerBalance,
} from '@/lib/recruiter/billing';

/**
 * GET /api/recruiter/billing/history
 * Returns the organization's billing orders, invoices, and append-only token usage ledger.
 * Scoped strictly to the session's workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN', 'INTERVIEWER']);
    if (roleError) {
      return roleError;
    }

    const targetWsId = session!.workspaceId;
    const isInterviewer = session!.role === 'INTERVIEWER';

    // Orders are only visible to OWNER and ADMIN
    const allOrders = getLocalBillingOrders(targetWsId);
    const visibleOrders = isInterviewer ? [] : allOrders;

    // Token usage ledger entries
    const allLedger = getLocalTokenLedger(targetWsId);

    // Current authoritative balance
    const currentBalance = calculateLedgerBalance(targetWsId);

    return NextResponse.json({
      success: true,
      workspace_id: targetWsId,
      role: session!.role,
      token_balance: currentBalance,
      is_low_balance: currentBalance <= 2,
      orders: visibleOrders,
      ledger: allLedger,
      token_usage: allLedger.filter((l) => l.type === 'DEBIT'),
    });
  } catch (error: any) {
    console.error('Billing history fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}
