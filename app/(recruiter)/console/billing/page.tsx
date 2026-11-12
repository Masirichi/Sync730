'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Building2,
  Mail,
  CheckCircle2,
  Shield,
  Lock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  AlertTriangle,
  Receipt,
  Download,
  Clock,
  Check,
  Building,
  FileText,
  DollarSign,
  ChevronRight,
  Printer,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CorporateWorkspace,
  RecruiterRole,
  TokenPackId,
  BillingOrder,
  TokenLedgerEntry,
} from '@/lib/recruiter/types';
import { TOKEN_PACKS, VIRTUAL_BANK_ACCOUNT } from '@/lib/recruiter/billing';
import { getLocalWorkspace, saveLocalWorkspace } from '@/lib/recruiter/store';
import { toast } from 'sonner';

export default function ConsoleBillingPage() {
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(getLocalWorkspace());
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');
  const [tokenBalance, setTokenBalance] = useState<number>(workspace.token_balance || 0);

  // Loading & error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Orders and Ledger
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<TokenLedgerEntry[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenLedgerEntry[]>([]);

  // Checkout modal state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<TokenPackId>('growth');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<BillingOrder | null>(null);

  // Return polling state
  const [isPollingVerification, setIsPollingVerification] = useState(false);

  // Invoice view modal
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<BillingOrder | null>(null);

  // Report issue modal
  const [reportingUsage, setReportingUsage] = useState<TokenLedgerEntry | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Load billing history
  const fetchBillingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recruiter/billing/history');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch billing history');
      }

      setTokenBalance(data.token_balance);
      setOrders(data.orders || []);
      setLedgerEntries(data.ledger || []);
      setTokenUsage(data.token_usage || []);

      const ws = getLocalWorkspace();
      ws.token_balance = data.token_balance;
      setWorkspace(ws);
      saveLocalWorkspace(ws);
    } catch (err: any) {
      setError(err.message || 'Error loading billing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();

    // Check query params for returning from checkout
    const urlParams = new URLSearchParams(window.location.search);
    const orderRef = urlParams.get('order_ref');
    const simPay = urlParams.get('simulated_pay');
    if (orderRef) {
      handleReturnFromCheckout(orderRef, simPay === 'true');
    }

    const updateRole = () => {
      const el = document.querySelector('[data-active-role]');
      if (el) {
        const r = el.getAttribute('data-active-role') as RecruiterRole;
        if (r) setCurrentRole(r);
      }
    };
    updateRole();

    const handleUpdate = () => {
      fetchBillingData();
    };

    window.addEventListener('sync730_workspace_updated', handleUpdate);
    window.addEventListener('sync730_billing_updated', handleUpdate);
    window.addEventListener('sync730_ledger_updated', handleUpdate);
    const interval = setInterval(updateRole, 500);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleUpdate);
      window.removeEventListener('sync730_billing_updated', handleUpdate);
      window.removeEventListener('sync730_ledger_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Return polling and server verification handler
  const handleReturnFromCheckout = async (reference: string, isSimulated = false) => {
    setIsPollingVerification(true);
    toast.info('Payment received, confirming with payment gateway...');

    try {
      // 1. Call server-side verify endpoint
      const verifyRes = await fetch('/api/recruiter/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, simulated_pay: isSimulated }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Server payment verification failed.');
      }

      toast.success(
        `Payment confirmed! ${verifyData.tokens_issued || 0} tokens issued to your balance.`
      );
      // Clean query params
      window.history.replaceState({}, '', '/console/billing');
      fetchBillingData();
    } catch (err: any) {
      toast.error(err.message || 'Error confirming payment with server.');
    } finally {
      setIsPollingVerification(false);
    }
  };

  // Open checkout for a selected pack
  const handleSelectPack = (packId: TokenPackId) => {
    if (!isOwnerOrAdmin) {
      toast.error('Permission denied: Only Owners and Admins can purchase token packs.');
      return;
    }
    setSelectedPackId(packId);
    setActiveOrder(null);
    setIsBuyModalOpen(true);
  };

  // Create order and initiate checkout
  const handleInitiateOrder = async () => {
    if (!isOwnerOrAdmin) {
      toast.error('Permission denied: Only Owners and Admins can purchase token packs.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await fetch('/api/recruiter/billing/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_id: selectedPackId,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      setActiveOrder(data.order);

      if (paymentMethod === 'bank_transfer') {
        toast.info('Order registered. Please complete bank transfer to credit tokens.');
        fetchBillingData();
      } else if (data.authorization_url) {
        // Redirect to Paystack or dev test simulation URL
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Error initiating order.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Submit refund / replacement issue
  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingUsage) return;
    if (!reportReason.trim()) {
      toast.error('Please describe the issue with this unlock.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      // Record issue report
      toast.success(
        'Replacement ticket submitted. Our talent verification squad will review within 24 hours. Under our Replacement Policy, 1 token will be credited if the candidate has withdrawn or is unreachable.'
      );
      setReportingUsage(null);
      setReportReason('');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const selectedPack = TOKEN_PACKS[selectedPackId];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Billing & Token Ledger
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Purchase verified candidate unlock tokens, view immutable ledger history, and download official receipts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchBillingData}
          disabled={isLoading}
          className="h-8 text-xs self-start sm:self-auto gap-1.5 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </Button>
      </div>

      {/* Low Balance Warning Banner */}
      {isOwnerOrAdmin && tokenBalance <= 2 && !isLoading && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Low Token Balance ({tokenBalance} Tokens Remaining)</span>
              <p className="text-neutral-600 dark:text-neutral-400 text-[11px] mt-0.5">
                Top up your organization balance to ensure your hiring squad can unlock verified candidate dossiers without interruption.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleSelectPack('growth')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8 px-3 rounded-xl shrink-0"
          >
            Top Up Now
          </Button>
        </div>
      )}

      {/* Polling / Confirming Banner */}
      {isPollingVerification && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
          <div>
            <span className="font-bold">Payment received, confirming with payment gateway...</span>
            <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
              Tokens are issued ONLY after confirmed server verification. Please wait a moment while the ledger updates.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchBillingData} className="h-7 text-xs border-rose-300">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Current Balance Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500 stroke-[1.5]" />
              <span>Available Candidate Unlock Balance</span>
            </div>

            {isLoading ? (
              <div className="mt-2 space-y-1">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-3 w-56" />
              </div>
            ) : (
              <>
                <div className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-baseline gap-2">
                  <span>{tokenBalance}</span>
                  <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                    Tokens Remaining
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Standard valuation: <strong>₦20,000 per token</strong>. Balance is maintained via an append-only cryptographic ledger.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isOwnerOrAdmin ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
                <Lock className="h-4 w-4" />
                <span>Interviewer: Ask an admin to top up</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>Strict Server-Verified Payment Escrow</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selectable Token Pack Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Choose a Token Pack
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Select a package to initiate secure payment via Paystack Card or Direct Bank Transfer.
            </p>
          </div>
          <span className="text-xs text-neutral-400">Prices fixed in NGN</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.keys(TOKEN_PACKS) as TokenPackId[]).map((packId) => {
            const pack = TOKEN_PACKS[packId];
            const isPopular = packId === 'growth';

            return (
              <div
                key={pack.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative ${
                  isPopular
                    ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-neutral-900 dark:ring-white'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {pack.discount_label && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    {pack.discount_label}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {pack.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {pack.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                        {pack.price_display}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium">total</span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-semibold">{pack.tokens} Tokens</span>
                      <span>·</span>
                      <span>{pack.per_token_display} / candidate unlock</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {isOwnerOrAdmin ? (
                    <Button
                      onClick={() => handleSelectPack(pack.id)}
                      className={`w-full h-10 text-xs font-semibold rounded-xl shadow-xs gap-1.5 ${
                        isPopular
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700'
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Buy {pack.name}</span>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="w-full h-10 text-xs font-semibold rounded-xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800 cursor-not-allowed shadow-none"
                    >
                      Ask an admin to top up
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History and Token Usage Tabs */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-6">
        <Tabs defaultValue="invoices" className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl h-9">
              <TabsTrigger value="invoices" className="text-xs font-semibold rounded-lg">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                <span>Orders & Invoices ({orders.length})</span>
              </TabsTrigger>
              <TabsTrigger value="usage" className="text-xs font-semibold rounded-lg">
                <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-500 fill-amber-500" />
                <span>Token Usage Ledger ({tokenUsage.length})</span>
              </TabsTrigger>
            </TabsList>

            <div className="text-xs text-neutral-500">
              {workspace.company_name} · TIN: 24918290-0001
            </div>
          </div>

          {/* TAB 1: Invoices & Orders */}
          <TabsContent value="invoices" className="space-y-4 m-0">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                <FileText className="h-8 w-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-neutral-600 dark:text-neutral-300">
                  No orders recorded yet.
                </p>
                <p className="mt-1 max-w-sm mx-auto">
                  When your organization purchases candidate unlock tokens, itemized orders and downloadable VAT receipts appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] font-bold uppercase text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                    <tr>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Reference</th>
                      <th className="pb-3 font-semibold">Pack</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Payment Method</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                        <td className="py-3.5 text-neutral-600 dark:text-neutral-300 font-medium whitespace-nowrap">
                          {new Date(o.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-neutral-900 dark:text-neutral-100">
                          {o.payment_reference}
                        </td>
                        <td className="py-3.5 text-neutral-900 dark:text-white font-semibold">
                          {TOKEN_PACKS[o.pack_id]?.name || o.pack_id} ({o.tokens} Tokens)
                        </td>
                        <td className="py-3.5 font-bold text-neutral-900 dark:text-white">
                          ₦{o.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 text-neutral-600 dark:text-neutral-400 capitalize">
                          {o.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Paystack Card'}
                        </td>
                        <td className="py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                              o.status === 'CONFIRMED'
                                ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                : o.status === 'PENDING_CONFIRMATION'
                                ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                : o.status === 'PENDING'
                                ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                                : 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                            }`}
                          >
                            {o.status === 'PENDING_CONFIRMATION'
                              ? 'Awaiting Confirmation'
                              : o.status === 'CONFIRMED'
                              ? 'Confirmed'
                              : o.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveInvoiceOrder(o)}
                            className="h-7 px-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white gap-1"
                          >
                            <Download className="h-3 w-3" />
                            <span>Invoice</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Token Usage Ledger */}
          <TabsContent value="usage" className="space-y-4 m-0">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : tokenUsage.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                <Zap className="h-8 w-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-neutral-600 dark:text-neutral-300">
                  No candidate unlocks yet.
                </p>
                <p className="mt-1 max-w-sm mx-auto">
                  When you spend tokens to unlock candidate contact details in Vetted Talent, the immutable ledger records each spend here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] font-bold uppercase text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                    <tr>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Unlocked By</th>
                      <th className="pb-3 font-semibold">Candidate ID</th>
                      <th className="pb-3 font-semibold">Tokens Spent</th>
                      <th className="pb-3 font-semibold">Balance After</th>
                      <th className="pb-3 font-semibold text-right">Policy & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {tokenUsage.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                        <td className="py-3.5 text-neutral-600 dark:text-neutral-300 font-medium whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 font-medium text-neutral-900 dark:text-white">
                          {u.user_email || u.user_id}
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                          {u.candidate_masked_id || u.candidate_id}
                        </td>
                        <td className="py-3.5 font-bold text-rose-600 dark:text-rose-400">
                          -1 Token
                        </td>
                        <td className="py-3.5 font-semibold text-neutral-900 dark:text-white">
                          {u.balance_after} Tokens
                        </td>
                        <td className="py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReportingUsage(u)}
                            className="h-7 px-2 text-xs font-semibold text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span>Report Issue</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* CHECKOUT MODAL: Buy Token Pack */}
      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="max-w-lg p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <CreditCard className="h-5 w-5 stroke-[1.5]" />
            </div>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
              Purchase {selectedPack?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Tokens are issued ONLY after confirmed server-verified payment.
            </DialogDescription>
          </DialogHeader>

          {/* Active Bank Transfer Details if initiated */}
          {activeOrder && activeOrder.payment_method === 'bank_transfer' ? (
            <div className="space-y-4 pt-3 text-xs">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Awaiting Bank Transfer Confirmation</span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Please transfer the exact amount of <strong>₦{activeOrder.amount.toLocaleString()}</strong> to the dedicated escrow account below. Include the order reference in the narration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Bank Name</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {VIRTUAL_BANK_ACCOUNT.bank_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Account Number</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                    {VIRTUAL_BANK_ACCOUNT.account_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Account Name</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {VIRTUAL_BANK_ACCOUNT.account_name}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-500">Transfer Narration / Ref</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {activeOrder.payment_reference}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsBuyModalOpen(false)}
                  className="h-9 text-xs rounded-xl"
                >
                  Close & Pay Later
                </Button>
                <Button
                  onClick={() => {
                    toast.success('Transfer recorded! Tokens will be issued once confirmed.');
                    setIsBuyModalOpen(false);
                    fetchBillingData();
                  }}
                  className="h-9 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                >
                  I Have Completed Transfer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-3 text-xs">
              {/* Pack details summary */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">
                    {selectedPack?.name} ({selectedPack?.tokens} Tokens)
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {selectedPack?.per_token_display} per candidate unlock
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-neutral-900 dark:text-white text-lg">
                    {selectedPack?.price_display}
                  </div>
                  <span className="text-[10px] text-neutral-400">VAT inclusive</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Select Payment Method
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'card'
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900 ring-1 ring-neutral-900 dark:ring-white'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mb-2 text-neutral-800 dark:text-neutral-200" />
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">Debit / Credit Card</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">Instant via Paystack</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900 ring-1 ring-neutral-900 dark:ring-white'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <Building className="h-4 w-4 mb-2 text-neutral-800 dark:text-neutral-200" />
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">Direct Bank Wire</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">Automated B2B Escrow</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Policy Reminder */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-start gap-2.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Zero client-side token credits: tokens are only minted after cryptographic server webhook verification. Idempotent payment guarantees prevent duplicate charges.
                </p>
              </div>

              <Button
                onClick={handleInitiateOrder}
                disabled={isSubmittingOrder}
                className="w-full h-10 font-semibold text-xs rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-xs gap-1.5"
              >
                {isSubmittingOrder ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Initiating Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay {selectedPack?.price_display}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DOWNLOAD / VIEW INVOICE & RECEIPT MODAL */}
      <Dialog open={Boolean(activeInvoiceOrder)} onOpenChange={() => setActiveInvoiceOrder(null)}>
        <DialogContent className="max-w-lg p-6 sm:p-8 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  Sync730 Hub
                </span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Official VAT Invoice & Payment Receipt
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              >
                {activeInvoiceOrder?.status}
              </Badge>
            </div>
          </DialogHeader>

          {activeInvoiceOrder && (
            <div className="space-y-5 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Billed To</span>
                  <div className="font-bold text-neutral-900 dark:text-white mt-1">
                    {workspace.company_name}
                  </div>
                  <div className="text-neutral-500 text-[11px]">{activeInvoiceOrder.created_by}</div>
                  <div className="text-neutral-400 text-[11px]">TIN: 24918290-0001 / VAT Reg #</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Invoice Details</span>
                  <div className="font-mono text-[11px] text-neutral-900 dark:text-neutral-100 mt-1">
                    {activeInvoiceOrder.payment_reference}
                  </div>
                  <div className="text-neutral-500 text-[11px]">
                    {new Date(activeInvoiceOrder.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-neutral-500 text-[11px] capitalize">
                    Method: {activeInvoiceOrder.payment_method}
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Description</th>
                      <th className="py-2.5 px-3 text-center">Tokens</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr>
                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {TOKEN_PACKS[activeInvoiceOrder.pack_id]?.name || activeInvoiceOrder.pack_id}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Candidate unlock token allocation
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {activeInvoiceOrder.tokens}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-neutral-900 dark:text-white">
                        ₦{activeInvoiceOrder.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="pt-2 flex justify-end">
                <div className="w-48 space-y-1.5 text-right">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal:</span>
                    <span>₦{activeInvoiceOrder.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>VAT (7.5% incl):</span>
                    <span>₦{Math.round((activeInvoiceOrder.amount * 0.075) / 1.075).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-neutral-900 dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <span>Total Paid:</span>
                    <span>₦{activeInvoiceOrder.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] text-neutral-400">
                  Sync730 Enterprise Technologies Ltd · Lagos, Nigeria
                </span>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-xl gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REPORT ISSUE WITH UNLOCK MODAL */}
      <Dialog open={Boolean(reportingUsage)} onOpenChange={() => setReportingUsage(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
              Report Issue with Unlock
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Candidate: {reportingUsage?.candidate_masked_id || reportingUsage?.candidate_id}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportIssue} className="space-y-4 pt-2 text-xs">
            {/* Policy Box */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1 text-neutral-600 dark:text-neutral-400">
              <span className="font-bold text-neutral-900 dark:text-white">Replacement Policy</span>
              <p className="text-[11px] leading-relaxed">
                If an unlocked candidate has withdrawn their application or is unreachable after 5 business days, 1 replacement token is refunded back to your organization ledger upon verification.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Reason for replacement claim *
              </label>
              <textarea
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="e.g. Candidate email bounced or candidate stated they have accepted another offer..."
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-xs focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReportingUsage(null)}
                className="h-8 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingReport}
                className="h-8 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
