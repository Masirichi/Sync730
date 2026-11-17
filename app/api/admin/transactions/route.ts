import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPlatformTransactions } from '@/lib/admin/store';
import { assertServerPermission } from '@/lib/admin/permissions';

export async function GET(req: NextRequest) {
  try {
    // Phase 8: Scoped role check - Only Super admin & Finance
    const permission = await assertServerPermission(req, 'money:read');
    if (!permission.authorized) {
      return permission.response;
    }

    let transactions = getPlatformTransactions();

    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('platform_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        // Merge with local store transactions without duplicates
        const existingIds = new Set(data.map((d: any) => d.id));
        const localOnly = transactions.filter((t) => !existingIds.has(t.id));
        transactions = [...data, ...localOnly];
      }
    } catch {}

    // Sort newest first
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list transactions' },
      { status: 500 }
    );
  }
}
