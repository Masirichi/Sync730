import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPlatformTransactions, savePlatformTransaction } from '@/lib/admin/store';
import { PlatformTransaction } from '@/lib/admin/types';
import { requireReason, recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';
import { assertServerPermission } from '@/lib/admin/permissions';

export async function POST(req: NextRequest) {
  try {
    // Phase 8: Scoped role check - Only Super admin & Finance
    const permission = await assertServerPermission(req, 'money:refund');
    if (!permission.authorized) {
      return permission.response;
    }

    const body = await req.json();
    const { transaction_id, refund_amount, reason } = body;

    // 1. Mandatory validation
    if (!transaction_id) {
      return NextResponse.json(
        { success: false, error: 'transaction_id is required' },
        { status: 400 }
      );
    }

    // 2. Reason validation (min 10 characters)
    let validatedReason: string;
    try {
      validatedReason = requireReason(reason, 10);
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || 'A valid reason of at least 10 characters is required for refunds.' },
        { status: 400 }
      );
    }

    // 3. Find original transaction
    const allTransactions = getPlatformTransactions();
    const tx = allTransactions.find((t) => t.id === transaction_id);

    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (tx.status === 'REFUNDED') {
      return NextResponse.json(
        { success: false, error: 'Transaction has already been fully refunded.' },
        { status: 400 }
      );
    }

    const originalAmount = tx.amount ?? tx.amount_ngn ?? 0;
    const requestedRefund = typeof refund_amount === 'number' ? refund_amount : originalAmount;

    if (requestedRefund <= 0) {
      return NextResponse.json(
        { success: false, error: 'Refund amount must be greater than zero.' },
        { status: 400 }
      );
    }

    if (requestedRefund > originalAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Refund amount (${requestedRefund}) cannot exceed original transaction total (${originalAmount}).`,
        },
        { status: 400 }
      );
    }

    // 4. Resolve Actor
    let actorId = 'usr-admin-001';
    let actorName = 'David O. Alabi';

    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        actorName = user.user_metadata?.full_name || user.email || 'Platform Admin';
      }
    } catch {}

    const isPartial = requestedRefund < originalAmount;
    const newStatus = isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED';

    // 5. Paystack API check & instructions
    // Paystack requires merchant balance reserve & 2FA on API secret key for automated programmatic refunds.
    // When not configured, the system marks the transaction as REFUNDED in the platform ledger and reports
    // the reference for reversal in the Paystack dashboard.
    let paystackNotice = '';
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const hasLivePaystack = secretKey && !secretKey.includes('placeholder') && !secretKey.startsWith('sk_test_your');

    if (hasLivePaystack && tx.paystack_reference) {
      try {
        const paystackRes = await fetch('https://api.paystack.co/refund', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction: tx.paystack_reference,
            amount: Math.round(requestedRefund * 100), // In kobo
            merchant_note: validatedReason,
          }),
        });
        const paystackData = await paystackRes.json();
        if (paystackData.status) {
          paystackNotice = 'Paystack API refund submitted successfully.';
        } else {
          paystackNotice = `Paystack refund notice: ${paystackData.message || 'Reserve debited or manual settlement needed'}. Reference: ${tx.paystack_reference}`;
        }
      } catch (pErr: any) {
        paystackNotice = `Paystack API unreachable. Reference ${tx.paystack_reference} logged for manual dashboard reversal.`;
      }
    } else {
      paystackNotice = `Transaction marked as Refunded in Sync730 ledger. Paystack reference: ${tx.paystack_reference || tx.payment_reference}. Please process bank reversal in your Paystack Dashboard (Transactions → Refunds).`;
    }

    // 6. Update transaction in DB & local store
    const updatedTx: PlatformTransaction = {
      ...tx,
      status: newStatus as any,
      refunded_amount: requestedRefund,
      refund_reason: validatedReason,
      refunded_at: new Date().toISOString(),
      notes: `${tx.notes || ''} [REFUNDED: ${tx.currency || 'NGN'} ${requestedRefund.toLocaleString()} by ${actorName} - Reason: ${validatedReason}]`.trim(),
    };

    savePlatformTransaction(updatedTx);

    // 7. Write to append-only audit log
    const auditRecord = await recordDangerousAuditLog({
      actor_id: actorId,
      actor_name: actorName,
      action: 'PAYMENT_REFUNDED',
      target_type: 'TRANSACTION',
      target_id: tx.id,
      target_label: `${tx.currency || 'NGN'} ${requestedRefund.toLocaleString()} refund for ${tx.payer_name || tx.company_name} (${tx.paystack_reference || tx.payment_reference})`,
      reason: validatedReason,
      before: { status: tx.status, amount: originalAmount },
      after: { status: newStatus, refunded_amount: requestedRefund },
      ip: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      message: `Transaction ${tx.id} successfully refunded.`,
      transaction: updatedTx,
      paystack_instruction: paystackNotice,
      audit_log: auditRecord,
    });
  } catch (error: any) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
