'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { AdminUserProfile, PlatformRole, AdminMetricsData } from '@/lib/admin/types';
import { formatLagosDateTime } from '@/lib/admin/date';
import { useAdminHeader } from '@/components/admin/admin-header-context';
import { toast } from 'sonner';

export default function CommandUsersPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PLATFORM_ADMIN' | 'recruiter' | 'candidate'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const { includeDemo, lastUpdated } = useAdminHeader();

  // Dialog state for role change confirmation
  const [targetUser, setTargetUser] = useState<AdminUserProfile | null>(null);
  const [pendingRole, setPendingRole] = useState<PlatformRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsersAndMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, metricsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch(`/api/admin/metrics?include_demo=${includeDemo ? 'true' : 'false'}`),
      ]);
      const usersData = await usersRes.json();
      const metricsData = await metricsRes.json();

      if (usersData.success && Array.isArray(usersData.users)) {
        setUsers(usersData.users);
      }
      if (metricsData.success && metricsData.metrics) {
        setMetrics(metricsData.metrics);
      }
    } catch (err) {
      console.warn('Failed to fetch users directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [includeDemo]);

  useEffect(() => {
    fetchUsersAndMetrics();
  }, [fetchUsersAndMetrics, lastUpdated]);

  useEffect(() => {
    const handleRefresh = () => fetchUsersAndMetrics();
    window.addEventListener('sync730_admin_refresh_metrics', handleRefresh);
    return () => window.removeEventListener('sync730_admin_refresh_metrics', handleRefresh);
  }, [fetchUsersAndMetrics]);

  const handleOpenRoleChange = (user: AdminUserProfile, newRole: PlatformRole) => {
    setTargetUser(user);
    setPendingRole(newRole);
    setReauthPassword('');
    setIsDialogOpen(true);
  };

  const handleConfirmRoleChange = async (reason: string) => {
    if (!targetUser || !pendingRole) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: targetUser.id,
          new_role: pendingRole,
          reason,
          reauth_password: reauthPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: pendingRole } : u))
        );
        toast.success(`Role for ${targetUser.full_name || targetUser.email} updated to ${getRoleLabel(pendingRole)}.`);
        setIsDialogOpen(false);
        setTargetUser(null);
        setPendingRole(null);
      } else {
        throw new Error(data.error || 'Failed to update user role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const rLower = role.toLowerCase();
    if (rLower === 'platform_admin' || rLower === 'admin') return 'Platform admin';
    if (rLower === 'recruiter') return 'Recruiter';
    return 'Candidate';
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'PLATFORM_ADMIN') {
      return u.role === 'PLATFORM_ADMIN' || (u.role as string).toLowerCase() === 'admin';
    }
    return u.role === roleFilter;
  });

  // Dialog configuration helpers
  const isTargetAdmin =
    targetUser?.role === 'PLATFORM_ADMIN' ||
    (targetUser?.role as string)?.toLowerCase() === 'admin';
  const isElevatingToAdmin = pendingRole === 'PLATFORM_ADMIN' || pendingRole === 'admin';
  const isRevokingAdmin = isTargetAdmin && !isElevatingToAdmin;
  const requiresReauth = isElevatingToAdmin || isRevokingAdmin;

  let dialogTitle = 'Change role?';
  let dialogDescription = 'Update the permissions assigned to this user.';
  let dialogActionLabel = 'Change role';

  if (targetUser && pendingRole) {
    const userName = targetUser.full_name || targetUser.email;
    if (isElevatingToAdmin) {
      dialogTitle = `Give ${userName} full admin access?`;
      dialogDescription = 'This grants platform-wide administrative privileges to manage all jobs, workspaces, and permissions.';
      dialogActionLabel = 'Make admin';
    } else if (isRevokingAdmin) {
      dialogTitle = `Revoke admin access from ${userName}?`;
      dialogDescription = `This removes administrative privileges and resets access to ${getRoleLabel(pendingRole)}.`;
      dialogActionLabel = 'Revoke admin';
    } else {
      dialogTitle = `Change ${userName}'s role to ${getRoleLabel(pendingRole)}?`;
      dialogDescription = `This modifies account privileges to the ${getRoleLabel(pendingRole)} level.`;
      dialogActionLabel = 'Save role change';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-neutral-400">
              Identity & Access Management
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            User directory
          </h1>
          <p className="text-sm text-neutral-400">
            Review accounts, manage ecosystem permissions, and audit role elevation.
          </p>
        </div>
      </div>

      {/* Directory Table Card */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'PLATFORM_ADMIN', 'recruiter', 'candidate'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  roleFilter === r
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {r === 'ALL'
                  ? 'All roles'
                  : r === 'PLATFORM_ADMIN'
                  ? 'Platform admins'
                  : r === 'recruiter'
                  ? 'Recruiters'
                  : 'Candidates'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..."
              className="h-10 pl-9 pr-3 text-sm rounded-xl bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs font-semibold">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Joined</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredUsers.map((u) => {
                const isAdmin =
                  u.role === 'PLATFORM_ADMIN' ||
                  (u.role as string).toLowerCase() === 'admin';
                const isRecruiter = u.role === 'recruiter';

                const initials = (u.full_name || u.email)
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                const dateInfo = formatLagosDateTime(u.created_at);

                return (
                  <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                    {/* User Profile */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-full border border-neutral-800">
                          <AvatarFallback className="bg-neutral-800 text-white text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-white">
                            {u.full_name || 'Sync730 User'}
                          </div>
                          <span className="text-xs text-neutral-500 font-mono">{u.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 text-neutral-300 font-mono text-xs">
                      {u.email}
                    </td>

                    {/* Current Role Badge */}
                    <td className="py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${
                          isAdmin
                            ? 'border-neutral-700 bg-neutral-800 text-white'
                            : isRecruiter
                            ? 'border-neutral-700 bg-neutral-900 text-neutral-300'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        {getRoleLabel(u.role)}
                      </Badge>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 text-neutral-400 text-xs" title={`Joined: ${dateInfo.relative}`}>
                      {dateInfo.formatted}
                    </td>

                    {/* Quiet Row Menu (No pink pill) */}
                    <td className="py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
                            aria-label={`Open actions for ${u.full_name || u.email}`}
                          >
                            <MoreHorizontal className="h-4 w-4 stroke-[1.5]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200 w-48">
                          <DropdownMenuLabel className="text-xs text-neutral-400">
                            Change role
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          <DropdownMenuItem
                            onClick={() => handleOpenRoleChange(u, 'candidate')}
                            disabled={u.role === 'candidate'}
                            className="text-xs min-h-[36px]"
                          >
                            Set as Candidate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenRoleChange(u, 'recruiter')}
                            disabled={u.role === 'recruiter'}
                            className="text-xs min-h-[36px]"
                          >
                            Set as Recruiter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          {!isAdmin ? (
                            <DropdownMenuItem
                              onClick={() => handleOpenRoleChange(u, 'PLATFORM_ADMIN')}
                              className="text-xs min-h-[36px] font-semibold text-white focus:text-white"
                            >
                              Make Platform admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleOpenRoleChange(u, 'candidate')}
                              className="text-xs min-h-[36px] font-semibold text-red-400 focus:text-red-400"
                            >
                              Revoke admin access
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Dialog for Role Changes */}
      <ConfirmationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={dialogTitle}
        description={dialogDescription}
        actionLabel={dialogActionLabel}
        isDestructive={isRevokingAdmin}
        requireReason={true}
        isLoading={isSubmitting}
        onConfirm={handleConfirmRoleChange}
      >
        {requiresReauth && (
          <div className="space-y-1.5 pt-1">
            <label htmlFor="admin-reauth" className="text-xs font-semibold text-neutral-300 block">
              Admin password re-authentication <span className="text-rose-400">*</span>
            </label>
            <Input
              id="admin-reauth"
              type="password"
              placeholder="Enter your administrator password to confirm..."
              value={reauthPassword}
              onChange={(e) => setReauthPassword(e.target.value)}
              className="h-10 text-xs bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
              required
            />
            <p className="text-[11px] text-neutral-500">
              Role changes involving platform administrator access require active credential step-up.
            </p>
          </div>
        )}
      </ConfirmationDialog>
    </div>
  );
}
