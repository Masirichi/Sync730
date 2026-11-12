import { NextRequest, NextResponse } from 'next/server';
import {
  findOrderByReference,
  verifyAndConfirmPayment,
  calculateLedgerBalance,
} from '@/lib/recruiter/billing';
import { saveAdminAuditLog, savePlatformTransaction } from '@/lib/admin/store';

/**
 * POST /api/admin/billing/confirm-transfer
 * Super Admin manual confirmation of wire/bank transfers.
 * Converts order from PENDING_CONFIRMATION to CONFIRMED and credits tokens to ledger.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference, notes, admin_id = 'usr-platform-admin' } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference is required.' },
        { status: 400 }
      );
    }

    const order = findOrderByReference(reference);
    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order ${reference} not found.` },
        { status: 404 }
      );
    }

    if (order.status === 'CONFIRMED') {
      return NextResponse.json({
        success: true,
        message: 'Order has already been confirmed.',
        order,
        token_balance: calculateLedgerBalance(order.workspace_id),
      });
    }

    // Confirm payment and issue tokens to ledger
    const confirmResult = verifyAndConfirmPayment({
      reference,
      paidAmountKobo: order.amount_kobo,
      currency: order.currency,
      confirmedBy: `super-admin:${admin_id}`,
    });

    if (!confirmResult.success) {
      return NextResponse.json(
        { success: false, error: confirmResult.error },
        { status: 400 }
      );
    }

    // Record audit log
    const auditLog = {
      id: `log-transfer-${Date.now().toString(36)}`,
      created_at: new Date().toISOString(),
      admin_id,
      action_type: 'MANUAL_BANK_TRANSFER_CONFIRMED',
      target_id: order.id,
      notes: `Confirmed bank transfer for order ${reference} (₦${order.amount.toLocaleString()} - ${order.tokens} tokens). Reason/Bank Ref: ${notes || 'Verified against bank statement'}`,
    };
    saveAdminAuditLog(auditLog);

    // Record platform transaction
    savePlatformTransaction({
      id: `tx-${order.id}`,
      created_at: new Date().toISOString(),
      workspace_id: order.workspace_id,
      company_name: 'Acme Global Ventures',
      amount_ngn: order.amount,
      transaction_type: 'TOKEN_PURCHASE',
      payment_reference: reference,
      status: 'SUCCESS',
      notes: `Bank transfer confirmed by Super Admin. ${order.tokens} tokens issued.`,
    });

    return NextResponse.json({
      success: true,
      message: `Bank transfer confirmed. ${order.tokens} tokens credited to organization.`,
      order: confirmResult.order,
      token_balance: confirmResult.newBalance,
    });
  } catch (error: any) {
    console.error('Confirm transfer error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to confirm bank transfer' },
      { status: 500 }
    );
  }
}
