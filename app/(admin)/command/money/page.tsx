'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Coins,
  Search,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Calendar,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { PlatformTransaction } from '@/lib/admin/types';
import { formatLagosDateTime } from '@/lib/admin/date';
import { useAdminHeader } from '@/components/admin/admin-header-context';
import { toast } from 'sonner';

export default function CommandMoneyPage() {
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | '7D' | '30D' | 'THIS_MONTH'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { includeDemo, lastUpdated } = useAdminHeader();

  // Refund dialog state
  const [selectedTx, setSelectedTx] = useState<PlatformTransaction | null>(null);
  const [refundAmountStr, setRefundAmountStr] = useState('');
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  useEffect(() => {
    document.title = 'Tokens and payments | Command Center';
  }, []);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setPermissionDenied(null);
    try {
      const res = await fetch('/api/admin/transactions');
      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        setPermissionDenied(errData.error || 'Your role does not have permission to view Tokens and payments.');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.warn('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, lastUpdated]);

  useEffect(() => {
    const handleRefresh = () => fetchTransactions();
    window.addEventListener('sync730_transactions_updated', handleRefresh);
    window.addEventListener('sync730_admin_refresh_metrics', handleRefresh);
    return () => {
      window.removeEventListener('sync730_transactions_updated', handleRefresh);
      window.removeEventListener('sync730_admin_refresh_metrics', handleRefresh);
    };
  }, [fetchTransactions]);

  // Compute live revenue numbers (excluding mock/test always)
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // STRICT: Live only, non-demo only
    const liveTxs = transactions.filter((t) => {
      if (t.is_demo || t.mode === 'TEST') return false;
      const ref = (t.paystack_reference || t.payment_reference || '').toLowerCase();
      if (ref.includes('test') || ref.includes('mock') || ref.includes('demo')) return false;
      return true;
    });

    const thisMonthTxs = liveTxs.filter((t) => {
      const d = new Date(t.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // 1. Revenue this month split: Employer tokens vs Candidate tools
    let employerTokensNGN = 0;
    let employerTokensUSD = 0;
    let candidateToolsNGN = 0;
    let candidateToolsUSD = 0;

    let refundsThisMonthNGN = 0;
    let refundsThisMonthUSD = 0;
    let refundsCount = 0;

    thisMonthTxs.forEach((t) => {
      const amt = t.amount ?? t.amount_ngn ?? 0;
      const curr = t.currency === 'USD' ? 'USD' : 'NGN';

      if (t.status === 'REFUNDED') {
        const refAmt = t.refunded_amount ?? amt;
        if (curr === 'USD') refundsThisMonthUSD += refAmt;
        else refundsThisMonthNGN += refAmt;
        refundsCount += 1;
        return;
      }

      if (t.status === 'PAID' || t.status === 'SUCCESS') {
        const isCandidateTool =
          t.transaction_type === 'INTERVIEW_PREP' ||
          t.transaction_type === 'RESUME_GENERATOR' ||
          t.transaction_type === 'LINKEDIN_OPTIMIZATION' ||
          t.transaction_type === 'MOCK_PREP_FEE';

        if (isCandidateTool) {
          if (curr === 'USD') candidateToolsUSD += amt;
          else candidateToolsNGN += amt;
        } else if (t.transaction_type === 'TOKEN_PURCHASE') {
          if (curr === 'USD') employerTokensUSD += amt;
          else employerTokensNGN += amt;
        }
      }
    });

    return {
      employerTokensNGN,
      employerTokensUSD,
      candidateToolsNGN,
      candidateToolsUSD,
      refundsThisMonthNGN,
      refundsThisMonthUSD,
      refundsCount,
      transactionsThisMonthCount: thisMonthTxs.length,
    };
  }, [transactions]);

  // Format type label
  const getTypeLabel = (t: PlatformTransaction) => {
    switch (t.transaction_type) {
      case 'TOKEN_PURCHASE':
        return 'Token purchase';
      case 'INTERVIEW_PREP':
        return 'Interview Prep';
      case 'RESUME_GENERATOR':
        return 'Résumé Generator';
      case 'LINKEDIN_OPTIMIZATION':
        return 'LinkedIn Profile Optimization';
      case 'ADMIN_ADJUSTMENT':
        return 'Adjustment';
      case 'REFUND':
        return 'Refund';
      case 'MOCK_PREP_FEE':
        return 'Interview Prep';
      default:
        return t.tool_name || t.transaction_type;
    }
  };

  // Filter transactions for ledger
  const filteredTransactions = useMemo(() => {
    const now = Date.now();

    return transactions.filter((t) => {
      // Demo toggle guard: hide demo unless includeDemo is true
      if (!includeDemo && (t.is_demo || t.mode === 'TEST')) return false;

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const ref = (t.paystack_reference || t.payment_reference || '').toLowerCase();
        const payer = (t.payer_name || t.company_name || '').toLowerCase();
        const email = (t.payer_email || '').toLowerCase();
        const notes = (t.notes || '').toLowerCase();
        if (!ref.includes(q) && !payer.includes(q) && !email.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'ALL') {
        const typeStr = getTypeLabel(t).toLowerCase();
        if (!typeStr.includes(typeFilter.toLowerCase())) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const stat = (t.status || '').toUpperCase();
        if (statusFilter === 'PAID' && stat !== 'PAID' && stat !== 'SUCCESS') return false;
        if (statusFilter === 'REFUNDED' && !stat.includes('REFUND')) return false;
        if (statusFilter === 'FAILED' && stat !== 'FAILED') return false;
      }

      // Date Range filter
      if (dateRangeFilter !== 'ALL') {
        const txTime = new Date(t.created_at).getTime();
        if (dateRangeFilter === '7D' && now - txTime > 7 * 86400000) return false;
        if (dateRangeFilter === '30D' && now - txTime > 30 * 86400000) return false;
        if (dateRangeFilter === 'THIS_MONTH') {
          const d = new Date(t.created_at);
          const cur = new Date();
          if (d.getMonth() !== cur.getMonth() || d.getFullYear() !== cur.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, statusFilter, dateRangeFilter, includeDemo]);

  // CSV Export action (Audit-logged)
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/transactions/export');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to export CSV');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sync730-transactions-${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Ledger exported to CSV. Action recorded in audit log.');
    } catch (err: any) {
      toast.error(err.message || 'Error exporting CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  // Open refund dialog
  const handleOpenRefund = (tx: PlatformTransaction) => {
    setSelectedTx(tx);
    const originalAmt = tx.amount ?? tx.amount_ngn ?? 0;
    setRefundAmountStr(String(originalAmt));
    setIsRefundDialogOpen(true);
  };

  // Submit refund
  const handleConfirmRefund = async (reason: string) => {
    if (!selectedTx) return;

    const parsedRefund = parseFloat(refundAmountStr);
    const maxAmt = selectedTx.amount ?? selectedTx.amount_ngn ?? 0;

    if (isNaN(parsedRefund) || parsedRefund <= 0) {
      toast.error('Refund amount must be a positive number.');
      return;
    }
    if (parsedRefund > maxAmt) {
      toast.error(`Refund amount cannot exceed original transaction total (${maxAmt}).`);
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const res = await fetch('/api/admin/transactions/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: selectedTx.id,
          refund_amount: parsedRefund,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === selectedTx.id ? data.transaction : t))
        );
        toast.success(
          `Refund recorded for ${selectedTx.currency || 'NGN'} ${parsedRefund.toLocaleString()}. ${data.paystack_instruction || ''}`,
          { duration: 8000 }
        );
        setIsRefundDialogOpen(false);
        setSelectedTx(null);
      } else {
        throw new Error(data.error || 'Failed to process refund');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing refund');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  if (permissionDenied) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-sm text-neutral-400">{permissionDenied}</p>
        <div className="pt-2">
          <Button asChild variant="outline" className="border-neutral-800 text-xs text-neutral-300 hover:text-white">
            <a href="/command">Return to Overview</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Tokens and payments
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Financial ledger, revenue breakdown, token settlements, and transaction audits.
          </p>
        </div>

        {/* CSV Export Button (Finance & Super Admin only, Audit-logged) */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="h-9 px-3 rounded-xl border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold gap-1.5 self-start sm:self-auto min-h-[36px]"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export CSV (Audit-logged)'}</span>
        </Button>
      </div>

      {/* Header Numbers: Revenue this month, Refunds this month, Transactions this month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue This Month Card */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm space-y-2">
          <div className="text-xs text-neutral-400 font-medium">Revenue this month (Live)</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            ₦{(stats.employerTokensNGN + stats.candidateToolsNGN).toLocaleString()}
            {stats.employerTokensUSD + stats.candidateToolsUSD > 0 && (
              <span className="text-neutral-400 text-sm ml-2">
                + ${(stats.employerTokensUSD + stats.candidateToolsUSD).toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-400 pt-1 space-y-0.5 border-t border-neutral-800/80">
            <div className="flex justify-between">
              <span>Employer tokens:</span>
              <strong className="text-neutral-200">
                ₦{stats.employerTokensNGN.toLocaleString()}
                {stats.employerTokensUSD > 0 ? ` + $${stats.employerTokensUSD}` : ''}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Candidate tools:</span>
              <strong className="text-neutral-200">
                ₦{stats.candidateToolsNGN.toLocaleString()}
                {stats.candidateToolsUSD > 0 ? ` + $${stats.candidateToolsUSD}` : ''}
              </strong>
            </div>
          </div>
        </Card>

        {/* Refunds This Month Card */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm space-y-2">
          <div className="text-xs text-neutral-400 font-medium">Refunds this month (Live)</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            ₦{stats.refundsThisMonthNGN.toLocaleString()}
            {stats.refundsThisMonthUSD > 0 && (
              <span className="text-neutral-400 text-sm ml-2">
                + ${stats.refundsThisMonthUSD.toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-400 pt-1 border-t border-neutral-800/80">
            {stats.refundsCount > 0 ? (
              <span>{stats.refundsCount} refund(s) recorded</span>
            ) : (
              <span className="text-neutral-500">Zero refunds recorded this month</span>
            )}
          </div>
        </Card>

        {/* Transactions This Month Card */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm space-y-2">
          <div className="text-xs text-neutral-400 font-medium">Transactions this month (Live)</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {stats.transactionsThisMonthCount}{' '}
            <span className="text-sm font-normal text-neutral-400">settlements</span>
          </div>
          <div className="text-xs text-neutral-400 pt-1 border-t border-neutral-800/80">
            All mock and demo test purchases excluded
          </div>
        </Card>
      </div>

      {/* Ledger Table Card */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm space-y-4">
        {/* Filter Controls Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {[
                { id: 'ALL', label: 'All types' },
                { id: 'Token purchase', label: 'Token purchases' },
                { id: 'Interview Prep', label: 'Interview Prep' },
                { id: 'Résumé Generator', label: 'Résumé Generator' },
                { id: 'LinkedIn', label: 'LinkedIn' },
                { id: 'Refund', label: 'Refunds' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === t.id
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {[
                { id: 'ALL', label: 'All status' },
                { id: 'PAID', label: 'Paid' },
                { id: 'REFUNDED', label: 'Refunded' },
                { id: 'FAILED', label: 'Failed' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === s.id
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {[
                { id: 'ALL', label: 'All time' },
                { id: 'THIS_MONTH', label: 'This month' },
                { id: '30D', label: 'Last 30d' },
                { id: '7D', label: 'Last 7d' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDateRangeFilter(d.id as any)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeFilter === d.id
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full xl:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, payer, notes..."
              className="h-10 pl-9 pr-3 text-sm rounded-xl bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs font-semibold">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Payer</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Paystack reference</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Mode</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-neutral-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const dateInfo = formatLagosDateTime(tx.created_at);
                  const isPaid = tx.status === 'PAID' || tx.status === 'SUCCESS';
                  const isRefunded = tx.status === 'REFUNDED' || (tx.status as string) === 'PARTIALLY_REFUNDED';
                  const isTestMode = tx.mode === 'TEST' || tx.is_demo;
                  const amt = tx.amount ?? tx.amount_ngn ?? 0;
                  const curr = tx.currency || 'NGN';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 text-xs text-neutral-400 whitespace-nowrap" title={`Recorded: ${dateInfo.relative}`}>
                        {dateInfo.formatted}
                      </td>

                      {/* Payer */}
                      <td className="py-3.5 text-xs text-white">
                        <div className="font-semibold">{tx.payer_name || tx.company_name || 'Sync730 Payer'}</div>
                        <div className="text-neutral-500 text-[11px]">{tx.payer_email || '—'}</div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 text-xs text-neutral-200">
                        <span>{getTypeLabel(tx)}</span>
                        {tx.tool_name && (
                          <div className="text-[11px] text-neutral-500">{tx.tool_name}</div>
                        )}
                      </td>

                      {/* Amount with Currency */}
                      <td className="py-3.5 text-xs font-semibold text-white tabular-nums whitespace-nowrap">
                        {curr === 'USD' ? '$' : '₦'}{amt.toLocaleString()}
                        {isRefunded && tx.refunded_amount && (
                          <div className="text-[10px] text-amber-400">
                            Refunded: {curr === 'USD' ? '$' : '₦'}{tx.refunded_amount.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Paystack Reference */}
                      <td className="py-3.5 text-xs font-mono text-neutral-400">
                        {tx.paystack_reference || tx.payment_reference || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 text-xs">
                        <span
                          className={`font-semibold ${
                            isPaid
                              ? 'text-emerald-400'
                              : isRefunded
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {isPaid ? 'Paid' : isRefunded ? 'Refunded' : 'Failed'}
                        </span>
                      </td>

                      {/* Mode: Live vs Test */}
                      <td className="py-3.5 text-xs">
                        <span
                          className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                            isTestMode
                              ? 'bg-neutral-800 text-neutral-400'
                              : 'bg-neutral-800 text-emerald-400'
                          }`}
                        >
                          {isTestMode ? 'Test' : 'Live'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg min-h-[32px]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 bg-neutral-900 border-neutral-800 text-neutral-200">
                            <DropdownMenuLabel className="text-xs font-semibold text-neutral-400 px-3 py-2">
                              Transaction
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-800" />

                            {/* Refund Action */}
                            {isPaid && !isRefunded && (
                              <DropdownMenuItem
                                onClick={() => handleOpenRefund(tx)}
                                className="text-xs cursor-pointer text-amber-400 hover:text-amber-300 hover:bg-neutral-800 focus:bg-neutral-800"
                              >
                                Refund transaction...
                              </DropdownMenuItem>
                            )}

                            {/* Copy reference */}
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(tx.paystack_reference || tx.payment_reference || tx.id);
                                toast.success('Paystack reference copied to clipboard.');
                              }}
                              className="text-xs cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800"
                            >
                              Copy reference
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Dialog: Refund */}
      <ConfirmationDialog
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
        title={
          selectedTx
            ? `Refund ${selectedTx.currency || 'NGN'} ${(selectedTx.amount ?? selectedTx.amount_ngn ?? 0).toLocaleString()} to ${
                selectedTx.payer_name || selectedTx.company_name
              }?`
            : 'Refund transaction'
        }
        description="This reverses the settlement in the Sync730 financial ledger and logs the transaction for bank reversal."
        requireReason={true}
        actionLabel="Process refund"
        isDestructive={true}
        isLoading={isSubmittingRefund}
        onConfirm={handleConfirmRefund}
      >
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              Refund amount ({selectedTx?.currency || 'NGN'})
            </label>
            <Input
              type="number"
              min="1"
              max={selectedTx?.amount ?? selectedTx?.amount_ngn ?? 0}
              value={refundAmountStr}
              onChange={(e) => setRefundAmountStr(e.target.value)}
              placeholder="e.g. 5000"
              className="h-10 text-sm rounded-xl bg-neutral-950 border-neutral-800 text-white"
            />
            <p className="text-[11px] text-neutral-500">
              Original transaction:{' '}
              <strong className="text-neutral-300">
                {selectedTx?.currency || 'NGN'} {(selectedTx?.amount ?? selectedTx?.amount_ngn ?? 0).toLocaleString()}
              </strong>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-1">
            <div className="font-semibold text-white">Paystack Integration Notice</div>
            <p className="leading-relaxed">
              Reference: <span className="font-mono text-neutral-300">{selectedTx?.paystack_reference || selectedTx?.payment_reference}</span>.
              The ledger will record the reversal and log an audit trail entry. If your Paystack secret key does not have an active merchant reserve balance, complete the debit reversal directly in your Paystack Dashboard.
            </p>
          </div>
        </div>
      </ConfirmationDialog>
    </div>
  );
}
