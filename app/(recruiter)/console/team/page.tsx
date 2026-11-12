'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Shield,
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'INTERVIEWER'>('INTERVIEWER');
  const [isInviting, setIsInviting] = useState(false);

  // Current active role
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

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

  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Server-Guarded Invite Colleague Action
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
        if (res.status === 429) {
          throw new Error(data.error || 'Too many invitations sent. Rate limit exceeded.');
        }
        throw new Error(data.error || 'Failed to send invite');
      }

      if (data.success && data.member) {
        saveLocalMember(data.member);
        setMembers(getLocalMembers(workspace.id));
        setIsInviteModalOpen(false);
        setInviteEmail('');
        setInviteName('');
        toast.success(`Invitation sent to ${inviteEmail} as ${inviteRole}!`);
      } else {
        throw new Error(data.error || 'Failed to invite colleague');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending invite.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Workspace Team & Role Permissions
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your company hiring squad, assign roles, and coordinate interviewer access.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-3.5 rounded-xl shadow-xs gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Invite Colleague</span>
          </Button>
        )}
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

      {/* Team Members Management Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              Active Team Members ({members.length})
            </span>
          </div>

          <div className="text-xs text-neutral-400">
            {workspace.company_name}
          </div>
        </div>

        {/* Role Permissions Reference Pill */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs">
          <div>
            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white" />
              <span>Owner</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Full workspace authority, billing, token top-ups, member invites, and candidate unlocking.
            </p>
          </div>
          <div>
            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Admin</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Manage open roles, purchase token packs, invite interviewers, and unlock verified dossiers.
            </p>
          </div>
          <div>
            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Interviewer</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Watch candidate screening videos, view balance, record notes and scores. Cannot spend tokens or view billing.
            </p>
          </div>
        </div>

        {/* Members List with Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            <Users className="h-6 w-6 text-neutral-400 mx-auto mb-1 opacity-50" />
            <span>No other team members invited yet.</span>
          </div>
        ) : (
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
        )}
      </div>

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
                placeholder="sarah.chen@company.com"
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
                <option value="INTERVIEWER">INTERVIEWER (Video Review & Scoring)</option>
                <option value="ADMIN">ADMIN (Job Management & Candidate Unlocks)</option>
              </select>
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
    </div>
  );
}
