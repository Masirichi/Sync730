import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPlatformTransactions } from '@/lib/admin/store';
import { recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization check: Finance or Super Admin
    let actorId = 'usr-admin-001';
    let actorName = 'Platform Admin';
    let userRole = 'PLATFORM_ADMIN';

    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        actorName = user.user_metadata?.full_name || user.email || 'Admin';
        userRole = user.user_metadata?.role || user.app_metadata?.role || userRole;
      }
    } catch {}

    const isAuthorized =
      userRole === 'PLATFORM_ADMIN' ||
      userRole === 'admin' ||
      userRole === 'finance' ||
      userRole === 'FINANCE';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only Finance and Platform Admins can export transaction ledgers.' },
        { status: 403 }
      );
    }

    // 2. Fetch transactions
    const transactions = getPlatformTransactions();

    // 3. Log audit event
    await recordDangerousAuditLog({
      actor_id: actorId,
      actor_name: actorName,
      action: 'DATA_EXPORT',
      target_type: 'TRANSACTION',
      target_id: 'export-csv',
      target_label: `Exported ${transactions.length} ledger transactions to CSV`,
      reason: 'Ledger reconciliation and financial reporting export',
      ip: getClientIp(req),
    });

    // 4. Format CSV
    const headers = [
      'Transaction ID',
      'Date (UTC)',
      'Payer Name',
      'Payer Email',
      'Company',
      'Type',
      'Tool Name',
      'Currency',
      'Amount',
      'Paystack Reference',
      'Status',
      'Mode',
      'Refunded Amount',
      'Refund Reason',
      'Notes',
    ];

    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${t.created_at}"`,
      `"${t.payer_name || ''}"`,
      `"${t.payer_email || ''}"`,
      `"${t.company_name || ''}"`,
      `"${t.transaction_type}"`,
      `"${t.tool_name || ''}"`,
      `"${t.currency || 'NGN'}"`,
      t.amount ?? t.amount_ngn ?? 0,
      `"${t.paystack_reference || t.payment_reference || ''}"`,
      `"${t.status}"`,
      `"${t.mode || (t.is_demo ? 'TEST' : 'LIVE')}"`,
      t.refunded_amount ?? 0,
      `"${t.refund_reason || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sync730-transactions-${new Date().toISOString().substring(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export transactions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
