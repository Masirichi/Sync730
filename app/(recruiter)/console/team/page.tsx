'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Mail,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  RotateCw,
  Trash2,
  ExternalLink,
  ChevronRight,
  FileText,
  Lock,
  Zap,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CorporateWorkspace,
  WorkspaceMember,
  RecruiterRole,
} from '@/lib/recruiter/types';
import {
  getLocalWorkspace,
  getLocalMembers,
  saveLocalMember,
} from '@/lib/recruiter/store';
import { toast } from 'sonner';

export default function ConsoleTeamPage() {
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(getLocalWorkspace());
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<WorkspaceMember | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<RecruiterRole>('INTERVIEWER');
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'INTERVIEWER'>('INTERVIEWER');
  const [isInviting, setIsInviting] = useState(false);

  const loadTeamData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ws = getLocalWorkspace();
      setWorkspace(ws);
      const mems = getLocalMembers(ws.id);
      setMembers(mems);
    } catch (err: any) {
      setError(err.message || 'Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();

    const updateRole = () => {
      const el = document.querySelector('[data-active-role]');
      if (el) {
        const r = el.getAttribute('data-active-role') as RecruiterRole;
        if (r) setCurrentRole(r);
      }
    };
    updateRole();

    const handleUpdate = () => {
      loadTeamData();
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

  const isOwner = currentRole === 'OWNER';
  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  const activeMembers = members.filter((m) => m.status === 'Active');
  const pendingInvites = members.filter((m) => m.status === 'Invited');
  const ownerCount = activeMembers.filter((m) => m.role === 'OWNER').length;

  // Invite Colleague Form Submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      toast.error('Permission denied: Only Owners and Admins can invite team members.');
      return;
    }
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address.');
      return;
    }
    if (inviteRole === 'ADMIN' && !isOwner) {
      toast.error('Permission denied: Only workspace Owners can invite Admins.');
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch('/api/recruiter/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          email: inviteEmail.trim(),
          full_name: inviteName.trim() || inviteEmail.split('@')[0],
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      if (data.success && data.member) {
        saveLocalMember(data.member);
        setMembers(getLocalMembers(workspace.id));
        setIsInviteModalOpen(false);
        setInviteEmail('');
        setInviteName('');
        toast.success(`Invitation sent to ${inviteEmail} as ${inviteRole}! Link valid for 7 days.`);
      } else {
        throw new Error(data.error || 'Failed to invite colleague');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending invite.');
    } finally {
      setIsInviting(false);
    }
  };

  // Execute Role Change
  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;

    if (roleChangeTarget.role === 'OWNER' && newSelectedRole !== 'OWNER' && ownerCount <= 1) {
      toast.error('Cannot remove or demote the last workspace Owner. Assign another Owner first.');
      return;
    }

    if (!isOwner && (roleChangeTarget.role === 'OWNER' || newSelectedRole === 'OWNER' || newSelectedRole === 'ADMIN')) {
      toast.error('Permission denied: Only Owners can manage Admin and Owner roles.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch('/api/recruiter/team/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_role',
          member_id: roleChangeTarget.id,
          new_role: newSelectedRole,
          workspace_id: workspace.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change role');
      }

      toast.success(`Role updated to ${newSelectedRole} for ${roleChangeTarget.full_name || roleChangeTarget.email}.`);
      setRoleChangeTarget(null);
      loadTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Could not update role.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Execute Remove Member
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    if (memberToRemove.role === 'OWNER' && ownerCount <= 1) {
      toast.error('Cannot remove or demote the last workspace Owner. Your organization must retain at least one Owner.');
      return;
    }

    if (!isOwner && (memberToRemove.role === 'OWNER' || memberToRemove.role === 'ADMIN')) {
      toast.error('Permission denied: Only Owners can remove Admins or Owners.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch('/api/recruiter/team/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_member',
          member_id: memberToRemove.id,
          workspace_id: workspace.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      toast.success(`${memberToRemove.full_name || memberToRemove.email} removed from workspace.`);
      setMemberToRemove(null);
      loadTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Could not remove member.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Revoke Invitation
  const handleRevokeInvite = async (invite: WorkspaceMember) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${invite.email}?`)) return;

    try {
      const res = await fetch('/api/recruiter/team/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_invite',
          member_id: invite.id,
          workspace_id: workspace.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to revoke invite');
      }

      toast.success(`Invitation for ${invite.email} has been revoked.`);
      loadTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Could not revoke invite.');
    }
  };

  // Resend Invitation
  const handleResendInvite = async (invite: WorkspaceMember) => {
    try {
      const res = await fetch('/api/recruiter/team/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_invite',
          member_id: invite.id,
          workspace_id: workspace.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend invite');
      }

      toast.success(`Invitation resent to ${invite.email}. 7-day expiration clock reset.`);
      loadTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Could not resend invite.');
    }
  };

  const getExpiryDaysLeft = (expiresAt?: string) => {
    if (!expiresAt) return '7 days';
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Workspace Team & Role Permissions
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your company hiring squad, assign roles, enforce security boundaries, and track member activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isOwnerOrAdmin && (
            <Link href="/console/audit">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-semibold rounded-xl border-neutral-300 dark:border-neutral-700 gap-1.5 focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <Shield className="h-3.5 w-3.5 stroke-[1.5] text-neutral-600" />
                <span>View Audit Log</span>
              </Button>
            </Link>
          )}

          {isOwnerOrAdmin && (
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-3.5 rounded-xl shadow-xs gap-1.5 focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>Invite Colleague</span>
            </Button>
          )}
        </div>
      </div>

      {/* Role Governance & Security Safeguard Callout */}
      <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-neutral-900 dark:text-white">
            Organizational Role Governance Rules
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            • <strong>Last Owner Protection:</strong> The workspace must retain at least one active Owner at all times. The sole Owner cannot be demoted or removed.<br />
            • <strong>Privilege Hierarchy:</strong> Only Owners can invite, promote, or remove other Admins and Owners. Admins may invite and coordinate Interviewers.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={loadTeamData} className="h-7 text-xs border-rose-300">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* SECTION 1: Active Team Members */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              Active Team Members ({activeMembers.length})
            </span>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            {workspace.company_name} · {ownerCount} {ownerCount === 1 ? 'Owner' : 'Owners'}
          </div>
        </div>

        {/* Members List with Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : activeMembers.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            <Users className="h-6 w-6 text-neutral-400 mx-auto mb-1 opacity-50" />
            <span>No active members found.</span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {activeMembers.map((m) => {
              const isSoleOwner = m.role === 'OWNER' && ownerCount <= 1;
              const canEditRole = isOwner || (isOwnerOrAdmin && m.role === 'INTERVIEWER');
              const canRemove = isOwner ? !isSoleOwner : m.role === 'INTERVIEWER';

              return (
                <div key={m.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-800 dark:text-neutral-200 shrink-0 border border-neutral-200 dark:border-neutral-700">
                      {m.full_name?.charAt(0) || m.email?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {m.full_name || 'Team Member'}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 shrink-0 ${
                            m.role === 'OWNER'
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                              : m.role === 'ADMIN'
                              ? 'border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-500/10'
                              : 'border-neutral-300 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800'
                          }`}
                        >
                          {m.role}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 stroke-[1.5] text-neutral-400 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0 text-neutral-500">
                          <Clock className="h-3 w-3 stroke-[1.5] text-neutral-400" />
                          <span>Active {m.last_active || 'Recently'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {canEditRole && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRoleChangeTarget(m);
                          setNewSelectedRole(m.role);
                        }}
                        className="h-8 text-xs font-medium rounded-xl border-neutral-300 dark:border-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900"
                        title={isSoleOwner ? 'Sole owner cannot be demoted' : 'Change member permissions'}
                      >
                        Change Role
                      </Button>
                    )}

                    {canRemove ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMemberToRemove(m)}
                        className="h-8 text-xs font-medium rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        <span>Remove</span>
                      </Button>
                    ) : isSoleOwner ? (
                      <span className="text-[11px] text-neutral-500 italic px-2" title="Organization must keep at least 1 owner">
                        Sole Owner (Protected)
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Pending Invitations with 7-Day Expiry */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              Pending Invitations ({pendingInvites.length})
            </span>
          </div>

          <span className="text-xs text-neutral-500">
            Invites automatically expire after 7 days
          </span>
        </div>

        {pendingInvites.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1 opacity-70" />
            <span>All invited squad members have accepted and joined.</span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200 dark:border-amber-800/60">
                    <Mail className="h-4 w-4 stroke-[1.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {inv.full_name || inv.email}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        Invited ({inv.role})
                      </Badge>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        {getExpiryDaysLeft(inv.expires_at)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-3 mt-0.5">
                      <span className="truncate">{inv.email}</span>
                      {inv.invited_by && (
                        <span className="text-neutral-500">· Invited by {inv.invited_by}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {isOwnerOrAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendInvite(inv)}
                        className="h-8 text-xs font-semibold rounded-xl border-neutral-300 dark:border-neutral-700 gap-1 focus-visible:ring-2 focus-visible:ring-neutral-900"
                      >
                        <RotateCw className="h-3 w-3 stroke-[2]" />
                        <span>Resend Invite</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokeInvite(inv)}
                        className="h-8 text-xs font-semibold rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        <span>Revoke</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Explicit Permissions Matrix Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              <span>Workspace Role & Permissions Matrix</span>
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Strict cryptographic and server-enforced privileges for each team tier.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="py-3 px-4 font-bold text-neutral-800 dark:text-neutral-200">
                  Console Capability / Action
                </th>
                <th className="py-3 px-4 font-bold text-neutral-900 dark:text-white text-center w-36">
                  Owner
                </th>
                <th className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 text-center w-36">
                  Admin
                </th>
                <th className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-center w-36">
                  Interviewer
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  Workspace Settings & Company Profile
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full Access</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full Access</td>
                <td className="py-3 px-4 text-center text-neutral-400">— Restricted</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  Token Purchases & Billing Invoices
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Buy & View Orders</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Buy & View Orders</td>
                <td className="py-3 px-4 text-center text-neutral-400">— View Balance Only</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  Invite & Manage Team Squad
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ All Roles (Owners & Admins)</td>
                <td className="py-3 px-4 text-center font-bold text-blue-600">✓ Interviewers Only</td>
                <td className="py-3 px-4 text-center text-neutral-400">— Restricted</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  Post, Edit, Pause & Close Job Openings
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full Management</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full Management</td>
                <td className="py-3 px-4 text-center text-neutral-400">— View Only</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  Review Candidate Videos & Scorecards
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Yes</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Yes</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Yes</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  Unlock Candidate Profiles (Spend Tokens)
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Yes (1 Token)</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Yes (1 Token)</td>
                <td className="py-3 px-4 text-center text-neutral-400">— Restricted</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  Candidate Pipeline Kanban & Scheduling
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full Access</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full Access</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Move & Schedule</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  Export Pipeline Data (CSV)
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Allowed</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Allowed</td>
                <td className="py-3 px-4 text-center text-neutral-400">— Restricted</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                  View Immutable Workspace Audit Logs
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full History</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">✓ Full History</td>
                <td className="py-3 px-4 text-center text-neutral-400">— Restricted</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG 1: Invite Member Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
              Invite Colleague to Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Add technical interviewers or hiring managers. Invitations expire in 7 days.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Colleague Name
              </Label>
              <Input
                placeholder="e.g. Amara Nwosu"
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
                placeholder="amara@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Squad Role *
              </Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-xs"
              >
                <option value="INTERVIEWER">INTERVIEWER (Video Review, Notes & Scoring)</option>
                {isOwner && (
                  <option value="ADMIN">ADMIN (Job Management, Tokens & Candidate Unlocks)</option>
                )}
              </select>
              {!isOwner && (
                <p className="text-[11px] text-neutral-500 italic">
                  Note: Only workspace Owners can invite new Admins.
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isInviting}
                className="h-9 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Change Role Modal */}
      <Dialog open={Boolean(roleChangeTarget)} onOpenChange={(open) => !open && setRoleChangeTarget(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
              Change Role for {roleChangeTarget?.full_name || roleChangeTarget?.email}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Current role: <span className="font-bold">{roleChangeTarget?.role}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                New Role Designation
              </Label>
              <select
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value as RecruiterRole)}
                className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-xs"
              >
                <option value="INTERVIEWER">INTERVIEWER (Video Review & Scoring)</option>
                {isOwner && <option value="ADMIN">ADMIN (Job Management & Unlocks)</option>}
                {isOwner && <option value="OWNER">OWNER (Full Workspace Authority)</option>}
              </select>
            </div>

            {roleChangeTarget?.role === 'OWNER' && ownerCount <= 1 && newSelectedRole !== 'OWNER' && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>This user is currently the sole Owner. Demoting them is prohibited.</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoleChangeTarget(null)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRoleChange}
                disabled={
                  isSubmittingAction ||
                  (roleChangeTarget?.role === 'OWNER' && ownerCount <= 1 && newSelectedRole !== 'OWNER')
                }
                className="h-9 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                {isSubmittingAction ? 'Updating...' : 'Confirm Role Update'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Remove Member Confirmation Modal */}
      <Dialog open={Boolean(memberToRemove)} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
              Remove Member from Organization
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Are you sure you want to remove <span className="font-bold text-neutral-900 dark:text-white">{memberToRemove?.full_name || memberToRemove?.email}</span> ({memberToRemove?.role})?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              This action revokes all workspace access, token privileges, and video screening permissions immediately. An immutable record will be appended to the organization audit log.
            </p>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMemberToRemove(null)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveMember}
                disabled={isSubmittingAction}
                className="h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isSubmittingAction ? 'Removing...' : 'Confirm Removal'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
