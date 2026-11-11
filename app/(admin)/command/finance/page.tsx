'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Zap,
  Building2,
  Plus,
  Minus,
  Coins,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AdminCorporateWorkspace, PlatformTransaction } from '@/lib/admin/types';
import { toast } from 'sonner';

export default function CommandFinancePage() {
  const [workspaces, setWorkspaces] = useState<AdminCorporateWorkspace[]>([]);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedWs, setSelectedWs] = useState<AdminCorporateWorkspace | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setAdjustmentAmount(10);
    setNotes('');
  };

  const handleExecuteAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWs) return;

    const formData = new FormData(e.currentTarget);
    const resolvedNotes = ((formData.get('notes') as string) || notes || '').trim();
    const resolvedAmt = parseInt(formData.get('amount') as string, 10) || adjustmentAmount;

    if (!resolvedNotes) {
      toast.error('A mandatory note explanation is required.');
      return;
    }

    if (resolvedAmt === 0 || isNaN(resolvedAmt)) {
      toast.error('Adjustment amount must be a non-zero integer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/workspaces/adjust-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: selectedWs.id,
          token_adjustment: resolvedAmt,
          notes: resolvedNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Token adjustment completed successfully.');
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

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Corporate Liquidity & Treasury
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Token Balances & Transaction Ledger
          </h2>
          <p className="text-xs text-neutral-400">
            Real-time balance controls, offline payment token issuance, and platform revenue audit trail.
          </p>
        </div>

        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </Button>
      </div>

      {/* Section 1: Corporate Workspaces & Token Balances */}
      <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-400 stroke-[1.5]" />
              <span>Corporate Workspaces ({filteredWorkspaces.length})</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Live enterprise token balances available for candidate unlocking.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company or email..."
              className="h-9 pl-8 pr-3 text-xs rounded-xl bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Workspaces Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] font-semibold">
                <th className="pb-3 font-semibold">Company / Workspace</th>
                <th className="pb-3 font-semibold">Billing Email</th>
                <th className="pb-3 font-semibold">Industry</th>
                <th className="pb-3 font-semibold">Current Balance</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredWorkspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{ws.company_name}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">{ws.id}</span>
                  </td>
                  <td className="py-3.5 text-neutral-300 font-mono text-[11px]">
                    {ws.billing_email}
                  </td>
                  <td className="py-3.5 text-neutral-400">
                    {ws.industry || 'Technology'}
                  </td>
                  <td className="py-3.5">
                    <span
                      data-token-balance-ws={ws.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    >
                      <Zap className="h-3 w-3 fill-amber-400 stroke-[1.5]" />
                      <span>{ws.token_balance} Tokens</span>
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <Button
                      onClick={() => handleOpenAdjustModal(ws)}
                      size="sm"
                      className="h-8 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold border border-neutral-700 gap-1.5 shadow-xs"
                    >
                      <Coins className="h-3.5 w-3.5 text-amber-400 stroke-[1.5]" />
                      <span>Adjust Tokens</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 2: Chronological Platform Transactions Ledger */}
      <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-rose-400 stroke-[1.5]" />
              <span>Platform Transactions & Payment Ledger</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Immutable chronological record of Paystack checkouts, offline bank adjustments, and prep fees.
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-bold border-neutral-700 bg-neutral-800 text-neutral-300"
          >
            {transactions.length} Records
          </Badge>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] font-semibold">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Workspace / Entity</th>
                <th className="pb-3 font-semibold">Transaction Type</th>
                <th className="pb-3 font-semibold">Amount (₦)</th>
                <th className="pb-3 font-semibold">Payment Reference</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-3 text-neutral-400 font-mono text-[11px]">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 text-white font-semibold">
                    {tx.company_name || tx.workspace_id}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        tx.transaction_type === 'ADMIN_ADJUSTMENT'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : tx.transaction_type === 'MOCK_PREP_FEE'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td className="py-3 text-white font-bold font-mono">
                    {tx.amount_ngn ? `₦${tx.amount_ngn.toLocaleString()}` : '₦0 (Promo)'}
                  </td>
                  <td className="py-3 text-neutral-400 font-mono text-[10px]">
                    {tx.payment_reference}
                  </td>
                  <td className="py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 text-neutral-400 text-[11px] max-w-xs truncate">
                    {tx.notes || 'Standard transaction'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* "Adjust Tokens" Modal */}
      <Dialog open={Boolean(selectedWs)} onOpenChange={(open) => !open && setSelectedWs(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl bg-neutral-900 border border-neutral-800 text-white">
          <DialogHeader>
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-2">
              <Coins className="h-5 w-5 stroke-[1.5]" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Adjust Tokens: {selectedWs?.company_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Grant enterprise promo tokens or record offline bank transfer token fulfillment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteAdjustment} className="space-y-4 pt-2">
            {/* Current Balance Display */}
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Current Balance:</span>
              <span className="font-extrabold text-amber-400">
                {selectedWs?.token_balance} Tokens
              </span>
            </div>

            {/* Tokens to Add or Deduct */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Tokens to Add (+) or Deduct (-) *
              </label>
              <div className="flex items-center gap-2">
                <Input
                  name="amount"
                  type="number"
                  required
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value, 10) || 0)}
                  className="h-10 text-sm font-bold bg-neutral-950 border-neutral-800 text-white rounded-xl"
                  placeholder="e.g. 10 or -5"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAdjustmentAmount(amt)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-neutral-300 hover:text-white"
                  >
                    +{amt}
                  </button>
                ))}
                {[-1, -5].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAdjustmentAmount(amt)}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-[10px] font-bold text-rose-300"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Mandatory Operational Notes / Reason *
              </label>
              <Textarea
                name="notes"
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received proof of offline bank transfer #NGN-9842 or Enterprise onboarding pilot promo."
                className="text-xs bg-neutral-950 border-neutral-800 text-white rounded-xl min-h-[80px]"
              />
            </div>

            {/* Security Notice */}
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>This adjustment writes an immutable entry into platform_transactions and admin_audit_logs.</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-2xl shadow-lg shadow-amber-950/40"
            >
              {isSubmitting ? 'Recording Adjustment...' : `Confirm Adjustment (${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount} Tokens)`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
