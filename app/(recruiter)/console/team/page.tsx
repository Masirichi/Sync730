'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Users,
  Plus,
  ShieldCheck,
  Building2,
  Mail,
  CheckCircle2,
  Check,
  Shield,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CorporateWorkspace,
  WorkspaceMember,
  RecruiterRole,
} from '@/lib/recruiter/types';
import {
  getLocalWorkspace,
  saveLocalWorkspace,
  getLocalMembers,
  saveLocalMember,
} from '@/lib/recruiter/store';
import { toast } from 'sonner';

export default function ConsoleTeamPage() {
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(getLocalWorkspace());
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<'5' | '15' | '50'>('5');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'INTERVIEWER'>('INTERVIEWER');
  const [isInviting, setIsInviting] = useState(false);

  // Current active role
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

  useEffect(() => {
    const ws = getLocalWorkspace();
    setWorkspace(ws);
    setMembers(getLocalMembers(ws.id));

    const updateRole = () => {
      const el = document.querySelector('[data-active-role]');
      if (el) {
        const r = el.getAttribute('data-active-role') as RecruiterRole;
        if (r) setCurrentRole(r);
      }
    };
    updateRole();

    const handleUpdate = () => {
      const updatedWs = getLocalWorkspace();
      setWorkspace(updatedWs);
      setMembers(getLocalMembers(updatedWs.id));
    };

    window.addEventListener('sync730_workspace_updated', handleUpdate);
    window.addEventListener('sync730_members_updated', handleUpdate);
    const interval = setInterval(updateRole, 500);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleUpdate);
      window.removeEventListener('sync730_members_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Buy / Top Up Token Packs
  const handleBuyTokens = async (amount: number, packName: string) => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/recruiter/tokens/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          amount,
          reason: `Purchased ${packName} (${amount} Tokens)`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedWs = { ...workspace, token_balance: data.new_balance };
        setWorkspace(updatedWs);
        saveLocalWorkspace(updatedWs);
        setIsBuyModalOpen(false);
        toast.success(`Success! Added ${amount} tokens to ${workspace.company_name}.`);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment processing error.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Instant +5 Dev Test Tokens
  const handleQuickTestTokens = async () => {
    await handleBuyTokens(5, 'Dev Test Pack (+5 Tokens)');
  };

  // Invite Colleague Action
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      toast.error('Permission denied: Only Owners and Admins can invite team members.');
      return;
    }
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address.');
      return;
    }

    setIsInviting(true);
    try {
      const newMember: WorkspaceMember = {
        id: `mem-${Date.now().toString(36)}`,
        workspace_id: workspace.id,
        user_id: `user-${Date.now().toString(36)}`,
        role: inviteRole,
        email: inviteEmail.trim(),
        full_name: inviteName.trim() || inviteEmail.split('@')[0],
        created_at: new Date().toISOString(),
      };

      saveLocalMember(newMember);
      setMembers(getLocalMembers(workspace.id));
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      toast.success(`Invitation sent to ${inviteEmail} as ${inviteRole}!`);
    } catch (err: any) {
      toast.error('Failed to send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  const PACKS = {
    '5': { tokens: 5, price: '₦100,000', perToken: '₦20,000', label: 'Starter Pack', discount: null },
    '15': { tokens: 15, price: '₦270,000', perToken: '₦18,000', label: 'Growth Pack', discount: '10% Savings' },
    '50': { tokens: 50, price: '₦800,000', perToken: '₦16,000', label: 'Enterprise Scale', discount: '20% Savings' },
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Token Billing & Team Management
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your candidate unlock tokens, view billing history, and coordinate team interview permissions.
        </p>
      </div>

      {/* Token Balance & Billing Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500 stroke-[1.5]" />
              <span>Available Candidate Unlock Balance</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-baseline gap-2">
              <span>{workspace.token_balance}</span>
              <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                Tokens Remaining
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Standard pricing: <strong>₦20,000 per token</strong>. Each token unlocks complete verified candidate dossiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Test Tokens Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickTestTokens}
              disabled={isProcessingPayment}
              className="text-xs h-9 px-3 rounded-xl border-amber-500/30 text-amber-800 dark:text-amber-300 bg-amber-500/10 font-semibold gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 fill-amber-500" />
              <span>+5 Dev Test Tokens</span>
            </Button>

            {isOwnerOrAdmin ? (
              <Button
                onClick={() => setIsBuyModalOpen(true)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-4 rounded-xl shadow-xs gap-1.5"
              >
                <CreditCard className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>Buy Token Pack (₦20,000 / Token)</span>
              </Button>
            ) : (
              <div className="text-xs text-amber-600 italic">
                Only Owners & Admins can purchase tokens.
              </div>
            )}
          </div>
        </div>

        {/* Pricing Tier Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-1">
            <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Starter Pack</div>
            <div className="text-lg font-bold text-neutral-900 dark:text-white">5 Tokens</div>
            <div className="text-xs text-neutral-500">₦100,000 (₦20,000 / candidate)</div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-white/5 space-y-1 relative">
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              10% Off
            </span>
            <div className="text-xs font-semibold text-neutral-900 dark:text-white">Growth Pack</div>
            <div className="text-lg font-bold text-neutral-900 dark:text-white">15 Tokens</div>
            <div className="text-xs text-neutral-500">₦270,000 (₦18,000 / candidate)</div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-1 relative">
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
              20% Off
            </span>
            <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Enterprise Pack</div>
            <div className="text-lg font-bold text-neutral-900 dark:text-white">50 Tokens</div>
            <div className="text-xs text-neutral-500">₦800,000 (₦16,000 / candidate)</div>
          </div>
        </div>
      </div>

      {/* Team Members Management Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Workspace Team & Role Permissions
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Control permissions across your hiring squad. Interviewers can watch candidate videos and leave internal notes.
            </p>
          </div>

          {isOwnerOrAdmin && (
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-3.5 rounded-xl shadow-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>Invite Colleague</span>
            </Button>
          )}
        </div>

        {/* Members List */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {members.map((m) => (
            <div key={m.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-700 dark:text-neutral-300">
                  {m.full_name?.charAt(0) || m.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    {m.full_name || 'Team Member'}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                    <Mail className="h-3 w-3 stroke-[1.5]" />
                    <span>{m.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                    m.role === 'OWNER'
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                      : m.role === 'ADMIN'
                      ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                      : 'border-neutral-300 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800'
                  }`}
                >
                  {m.role}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paystack Checkout Modal */}
      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 fill-amber-500 stroke-[1.5]" />
            </div>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
              Buy Candidate Unlock Tokens
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Each token unlocks 1 full candidate profile with verified contact details, resume, and code repos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3 text-xs">
            {/* Packs selector */}
            <div className="space-y-2">
              {(Object.keys(PACKS) as ('5' | '15' | '50')[]).map((key) => {
                const p = PACKS[key];
                const isSelected = selectedPack === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedPack(key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900 ring-1 ring-neutral-900 dark:ring-white'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {p.label} ({p.tokens} Tokens)
                        </span>
                        {p.discount && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {p.discount}
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-500 text-[11px] mt-0.5">
                        {p.perToken} per candidate unlock
                      </div>
                    </div>
                    <div className="text-right font-extrabold text-neutral-900 dark:text-white">
                      {p.price}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note on Paystack test key */}
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-[11px] flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 stroke-[1.5]" />
              <span>
                Simulated Paystack B2B Gateway active. Clicking below will instantly confirm transaction and credit your workspace balance.
              </span>
            </div>

            <Button
              onClick={() => handleBuyTokens(PACKS[selectedPack].tokens, PACKS[selectedPack].label)}
              disabled={isProcessingPayment}
              className="w-full h-10 bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold text-xs rounded-xl shadow-xs gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <span>Pay {PACKS[selectedPack].price} with Paystack</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
              Invite Colleague to Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Add hiring managers or technical interviewers from your company.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Colleague Name
              </Label>
              <Input
                placeholder="e.g. Sarah Chen"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Work Email *
              </Label>
              <Input
                type="email"
                required
                placeholder="sarah@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Role Permission
              </Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-xs text-neutral-900 dark:text-neutral-100"
              >
                <option value="INTERVIEWER">INTERVIEWER (Watch video assessments & leave notes)</option>
                <option value="ADMIN">ADMIN (Post jobs, buy tokens, invite members)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-xs h-9 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isInviting}
                className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold h-9 px-4 rounded-xl shadow-xs"
              >
                {isInviting ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
