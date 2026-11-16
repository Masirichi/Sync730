'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  Coins,
  Clock,
  MoreHorizontal,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { AdminCorporateWorkspace, PlatformTransaction } from '@/lib/admin/types';
import { formatLagosDateTime } from '@/lib/admin/date';
import { MAX_TOKEN_ADJUSTMENT } from '@/lib/admin/constants';
import { toast } from 'sonner';

export default function CommandFinancePage() {
  const [workspaces, setWorkspaces] = useState<AdminCorporateWorkspace[]>([]);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [selectedWs, setSelectedWs] = useState<AdminCorporateWorkspace | null>(null);
  const [direction, setDirection] = useState<'ADD' | 'REMOVE'>('ADD');
  const [amountStr, setAmountStr] = useState('10');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Tokens and payments | Command Center';
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [wsRes, txRes] = await Promise.all([
        fetch('/api/admin/workspaces'),
        fetch('/api/admin/transactions'),
      ]);
      const wsData = await wsRes.json();
      const txData = await txRes.json();

      if (wsData.success && wsData.workspaces) setWorkspaces(wsData.workspaces);
      if (txData.success && txData.transactions) setTransactions(txData.transactions);
    } catch (err) {
      console.warn('Failed to fetch finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('sync730_transactions_updated', fetchData);
    return () => window.removeEventListener('sync730_transactions_updated', fetchData);
  }, []);

  const handleOpenAdjustModal = (ws: AdminCorporateWorkspace) => {
    setSelectedWs(ws);
    setDirection('ADD');
    setAmountStr('10');
    setIsDialogOpen(true);
  };

  const handleExecuteAdjustment = async (reason: string) => {
    if (!selectedWs) return;

    const parsedAmount = parseInt(amountStr, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Token amount must be a positive integer.');
      return;
    }

    if (parsedAmount > MAX_TOKEN_ADJUSTMENT) {
      toast.error(`Maximum adjustment limit is ${MAX_TOKEN_ADJUSTMENT} tokens.`);
      return;
    }

    const currentBalance = selectedWs.token_balance || 0;
    const delta = direction === 'REMOVE' ? -parsedAmount : parsedAmount;
    if (currentBalance + delta < 0) {
      toast.error('Adjustment would result in a negative balance. Operation blocked.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/workspaces/adjust-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: selectedWs.id,
          direction,
          amount: parsedAmount,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Token adjustment completed successfully.');
        setIsDialogOpen(false);
        setSelectedWs(null);
        fetchData();
      } else {
        throw new Error(data.error || 'Failed to adjust tokens');
      }
    } catch (err: any) {
      toast.error(err.message || 'Adjustment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkspaces = workspaces.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      (w.company_name || '').toLowerCase().includes(q) ||
      (w.billing_email || '').toLowerCase().includes(q)
    );
  });

  // Calculate live preview
  const currentBal = selectedWs?.token_balance || 0;
  const parsedAmt = parseInt(amountStr, 10) || 0;
  const deltaPreview = direction === 'REMOVE' ? -parsedAmt : parsedAmt;
  const predictedBal = currentBal + deltaPreview;
  const isNegative = predictedBal < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Tokens and payments
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Corporate workspace token balances, Paystack transaction history, and fee auditing.
        </p>
      </div>

      {/* Section 1: Corporate Workspaces & Token Balances */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="h-4 w-4 text-neutral-300 stroke-[1.5]" />
              <span>Corporate workspaces ({filteredWorkspaces.length})</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Active employer balances available for candidate interview unlocking.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company or email..."
              className="h-10 pl-9 pr-3 text-sm rounded-xl bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Workspaces Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs font-semibold">
                <th className="pb-3 font-semibold">Company / Workspace</th>
                <th className="pb-3 font-semibold">Billing email</th>
                <th className="pb-3 font-semibold">Industry</th>
                <th className="pb-3 font-semibold">Balance</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredWorkspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3.5">
                    <div className="font-semibold text-white">
                      {ws.company_name}
                    </div>
                    <span className="text-xs text-neutral-500 tabular-nums">{ws.id}</span>
                  </td>
                  <td className="py-3.5 text-neutral-300 text-xs">
                    {ws.billing_email}
                  </td>
                  <td className="py-3.5 text-neutral-400 text-xs">
                    {ws.industry || 'Technology'}
                  </td>
                  <td className="py-3.5">
                    <span
                      data-token-balance-ws={ws.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700 tabular-nums"
                    >
                      <Coins className="h-3.5 w-3.5 text-neutral-300 stroke-[1.5]" />
                      <span>{ws.token_balance} tokens</span>
                    </span>
                  </td>
                  {/* Actions moved into Row Menu */}
                  <td className="py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
                          aria-label={`Open actions for ${ws.company_name}`}
                        >
                          <MoreHorizontal className="h-4 w-4 stroke-[1.5]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200 w-44">
                        <DropdownMenuLabel className="text-xs text-neutral-400">
                          Workspace controls
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleOpenAdjustModal(ws)}
                          className="text-xs min-h-[36px] font-semibold text-white cursor-pointer"
                        >
                          <Coins className="h-3.5 w-3.5 mr-2 stroke-[1.5]" />
                          <span>Adjust tokens</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 2: Chronological Platform Transactions Ledger */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Coins className="h-4 w-4 text-neutral-300 stroke-[1.5]" />
              <span>Platform transactions ledger</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Verified corporate payments and administrator token adjustments.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs font-semibold">
                <th className="pb-3 font-semibold">Transaction ID</th>
                <th className="pb-3 font-semibold">Workspace</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {transactions.map((tx) => {
                const isPurchase = tx.transaction_type === 'TOKEN_PURCHASE';
                const dateInfo = formatLagosDateTime(tx.created_at);

                return (
                  <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 tabular-nums text-xs text-neutral-300">
                      {tx.id}
                    </td>
                    <td className="py-3.5 text-xs text-white font-semibold">
                      {tx.company_name || tx.workspace_id}
                    </td>
                    <td className="py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${
                          isPurchase
                            ? 'border-neutral-700 bg-neutral-800 text-white'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        {isPurchase ? 'Token purchase' : 'Admin adjustment'}
                      </Badge>
                    </td>
                    <td className="py-3.5 tabular-nums text-xs text-white">
                      ₦{tx.amount_ngn.toLocaleString()}
                    </td>
                    <td className="py-3.5 text-xs text-neutral-400" title={`Recorded: ${dateInfo.relative}`}>
                      {dateInfo.formatted}
                    </td>
                    <td className="py-3.5 text-xs text-neutral-400 max-w-xs truncate">
                      {tx.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Dialog for Token Adjustment */}
      <ConfirmationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={selectedWs ? `Adjust token balance for ${selectedWs.company_name}` : 'Adjust tokens'}
        description="Add or remove interview tokens for this corporate workspace. The adjustment is logged immediately."
        actionLabel="Adjust tokens"
        isDestructive={direction === 'REMOVE'}
        requireReason={true}
        isLoading={isSubmitting}
        onConfirm={handleExecuteAdjustment}
      >
        <div className="space-y-3.5">
          {/* Direction Toggle */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Adjustment direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('ADD')}
                className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold border transition-all ${
                  direction === 'ADD'
                    ? 'border-neutral-600 bg-neutral-800 text-white'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                Add tokens (+)
              </button>
              <button
                type="button"
                onClick={() => setDirection('REMOVE')}
                className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold border transition-all ${
                  direction === 'REMOVE'
                    ? 'border-red-900 bg-red-950/40 text-red-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                Remove tokens (−)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="token-amount" className="font-semibold text-neutral-300">
                Amount (tokens)
              </label>
              <span className="text-neutral-500 tabular-nums text-[11px]">
                Max {MAX_TOKEN_ADJUSTMENT} tokens
              </span>
            </div>
            <Input
              id="token-amount"
              type="number"
              min={1}
              max={MAX_TOKEN_ADJUSTMENT}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="h-10 text-xs bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
              required
            />
          </div>

          {/* Live Balance Preview */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Balance preview:</span>
              <span className="tabular-nums font-bold text-white">
                Balance: {currentBal} →{' '}
                <span className={isNegative ? 'text-red-400' : 'text-emerald-400'}>
                  {predictedBal}
                </span>
              </span>
            </div>
            {isNegative && (
              <p className="text-[11px] text-red-400 font-medium">
                Resulting balance cannot be below zero.
              </p>
            )}
          </div>
        </div>
      </ConfirmationDialog>
    </div>
  );
}
