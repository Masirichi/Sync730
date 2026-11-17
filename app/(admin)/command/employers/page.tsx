'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  MoreHorizontal,
  Coins,
  ExternalLink,
  Plus,
  Minus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { AdminCorporateWorkspace } from '@/lib/admin/types';
import { formatLagosDateTime } from '@/lib/admin/date';
import { useAdminHeader } from '@/components/admin/admin-header-context';
import { toast } from 'sonner';

export default function CommandEmployersPage() {
  const [employers, setEmployers] = useState<AdminCorporateWorkspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { includeDemo, lastUpdated } = useAdminHeader();

  // Dialog state for token adjustment
  const [selectedWs, setSelectedWs] = useState<AdminCorporateWorkspace | null>(null);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [tokenAdjustment, setTokenAdjustment] = useState<string>('5');
  const [direction, setDirection] = useState<'ADD' | 'REMOVE'>('ADD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Employers | Command Center';
  }, []);

  const fetchEmployers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/employers?include_demo=${includeDemo ? 'true' : 'false'}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.employers)) {
        setEmployers(data.employers);
      }
    } catch (err) {
      console.warn('Failed to fetch employers list:', err);
    } finally {
      setIsLoading(false);
    }
  }, [includeDemo]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers, lastUpdated]);

  useEffect(() => {
    const handleRefresh = () => fetchEmployers();
    window.addEventListener('sync730_admin_refresh_metrics', handleRefresh);
    window.addEventListener('sync730_transactions_updated', handleRefresh);
    return () => {
      window.removeEventListener('sync730_admin_refresh_metrics', handleRefresh);
      window.removeEventListener('sync730_transactions_updated', handleRefresh);
    };
  }, [fetchEmployers]);

  // Open Token Adjustment Dialog
  const handleOpenAdjustTokens = (ws: AdminCorporateWorkspace) => {
    setSelectedWs(ws);
    setTokenAdjustment('5');
    setDirection('ADD');
    setIsTokenDialogOpen(true);
  };

  // Confirm Token Adjustment
  const handleConfirmAdjustTokens = async (reason: string) => {
    if (!selectedWs) return;

    const numTokens = parseInt(tokenAdjustment, 10);
    if (isNaN(numTokens) || numTokens <= 0) {
      toast.error('Token adjustment amount must be a positive integer greater than zero.');
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
          amount: numTokens,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmployers((prev) =>
          prev.map((w) =>
            w.id === selectedWs.id
              ? {
                  ...w,
                  token_balance: data.new_balance,
                }
              : w
          )
        );
        toast.success(
          `${direction === 'ADD' ? 'Added' : 'Deducted'} ${numTokens} tokens for ${selectedWs.company_name}. New balance: ${data.new_balance}`
        );
        setIsTokenDialogOpen(false);
        setSelectedWs(null);
      } else {
        throw new Error(data.error || 'Failed to adjust tokens');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error adjusting tokens');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter employers by search
  const filteredEmployers = useMemo(() => {
    return employers.filter((e) => {
      if (!includeDemo && e.is_demo) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        e.company_name.toLowerCase().includes(q) ||
        (e.billing_email || '').toLowerCase().includes(q) ||
        (e.id || '').toLowerCase().includes(q)
      );
    });
  }, [employers, searchQuery, includeDemo]);

  // Preview token calculations for dialog
  const currentTokens = selectedWs?.token_balance ?? 0;
  const numAdj = parseInt(tokenAdjustment, 10) || 0;
  const previewNewBalance =
    direction === 'ADD' ? currentTokens + numAdj : Math.max(0, currentTokens - numAdj);

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Employers
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Corporate workspaces, talent search seats, and active employer accounts.
        </p>
      </div>

      {/* Directory Card */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="text-xs text-neutral-400">
            Total Employers:{' '}
            <strong className="text-white font-semibold">{filteredEmployers.length}</strong>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company or workspace ID..."
              className="h-10 pl-9 pr-3 text-sm rounded-xl bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Employers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs font-semibold">
                <th className="pb-3 font-semibold">Company</th>
                <th className="pb-3 font-semibold">Workspace</th>
                <th className="pb-3 font-semibold text-center">Roles posted</th>
                <th className="pb-3 font-semibold text-center">Roles live</th>
                <th className="pb-3 font-semibold text-center">Interviews run</th>
                <th className="pb-3 font-semibold text-center">Token balance</th>
                <th className="pb-3 font-semibold">Last active</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredEmployers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-neutral-500">
                    No employers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEmployers.map((emp) => {
                  const lastActiveInfo = emp.last_active
                    ? formatLagosDateTime(emp.last_active)
                    : formatLagosDateTime(emp.created_at);

                  return (
                    <tr key={emp.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Company */}
                      <td className="py-3.5 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{emp.company_name}</span>
                          {emp.is_demo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 font-mono">
                              demo
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400 font-normal">{emp.billing_email}</div>
                      </td>

                      {/* Workspace */}
                      <td className="py-3.5 text-xs text-neutral-400 font-mono">
                        {emp.id}
                      </td>

                      {/* Roles Posted */}
                      <td className="py-3.5 text-xs text-white text-center tabular-nums font-semibold">
                        {emp.roles_posted ?? 0}
                      </td>

                      {/* Roles Live */}
                      <td className="py-3.5 text-xs text-emerald-400 text-center tabular-nums font-semibold">
                        {emp.roles_live ?? 0}
                      </td>

                      {/* Interviews Run */}
                      <td className="py-3.5 text-xs text-neutral-300 text-center tabular-nums font-semibold">
                        {emp.interviews_run ?? 0}
                      </td>

                      {/* Token Balance */}
                      <td className="py-3.5 text-xs text-center tabular-nums">
                        <span className="inline-flex items-center gap-1 font-bold text-white bg-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-700">
                          <Coins className="h-3 w-3 text-amber-400 stroke-[2]" />
                          {emp.token_balance}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 text-xs text-neutral-400" title={`Active: ${lastActiveInfo.relative}`}>
                        {lastActiveInfo.relative}
                      </td>

                      {/* Row Menu: Adjust tokens, View as */}
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
                          <DropdownMenuContent align="end" className="w-48 bg-neutral-900 border-neutral-800 text-neutral-200">
                            <DropdownMenuLabel className="text-xs font-semibold text-neutral-400 px-3 py-2">
                              Workspace Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-800" />

                            {/* Adjust Tokens Action */}
                            <DropdownMenuItem
                              onClick={() => handleOpenAdjustTokens(emp)}
                              className="text-xs cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800"
                            >
                              Adjust tokens...
                            </DropdownMenuItem>

                            {/* View As Recruiter Action */}
                            <DropdownMenuItem asChild>
                              <Link
                                href="/console"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 flex items-center justify-between w-full"
                              >
                                <span>View as employer</span>
                                <ExternalLink className="h-3 w-3 opacity-60 ml-1" />
                              </Link>
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

      {/* Confirmation Dialog: Adjust Tokens (Phase 1 Dialog) */}
      <ConfirmationDialog
        open={isTokenDialogOpen}
        onOpenChange={setIsTokenDialogOpen}
        title={selectedWs ? `Adjust tokens for ${selectedWs.company_name}` : 'Adjust tokens'}
        description={`Modify the balance of candidate unlock tokens for this corporate workspace. Current balance: ${currentTokens} tokens.`}
        requireReason={true}
        actionLabel={direction === 'ADD' ? 'Add tokens' : 'Deduct tokens'}
        isDestructive={direction === 'REMOVE'}
        isLoading={isSubmitting}
        onConfirm={handleConfirmAdjustTokens}
      >
        <div className="space-y-4 pt-2">
          {/* Direction Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('ADD')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all min-h-[40px] ${
                direction === 'ADD'
                  ? 'border-neutral-600 bg-neutral-800 text-white'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Credit tokens
            </button>
            <button
              type="button"
              onClick={() => setDirection('REMOVE')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all min-h-[40px] ${
                direction === 'REMOVE'
                  ? 'border-red-900/60 bg-red-950/40 text-red-300'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
              }`}
            >
              <Minus className="h-3.5 w-3.5" /> Deduct tokens
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              Number of tokens
            </label>
            <Input
              type="number"
              min="1"
              max="50"
              value={tokenAdjustment}
              onChange={(e) => setTokenAdjustment(e.target.value)}
              placeholder="e.g. 5"
              className="h-10 text-sm rounded-xl bg-neutral-950 border-neutral-800 text-white"
            />
          </div>

          {/* Balance Preview */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Projected new balance:</span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 line-through tabular-nums">{currentTokens}</span>
              <span className="text-neutral-400">→</span>
              <span className="font-bold text-white tabular-nums">{previewNewBalance} tokens</span>
            </div>
          </div>
        </div>
      </ConfirmationDialog>
    </div>
  );
}
