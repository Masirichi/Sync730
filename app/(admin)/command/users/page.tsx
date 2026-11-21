'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
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
import { AdminUserProfile, PlatformRole } from '@/lib/admin/types';
import { formatLagosDateTime } from '@/lib/admin/date';
import { useAdminHeader } from '@/components/admin/admin-header-context';
import { getRoleDisplayName, normalizeAdminRole } from '@/lib/admin/permissions-matrix';
import { toast } from 'sonner';

type SortField = 'name' | 'email' | 'role' | 'workspace' | 'status' | 'last_active' | 'joined';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 25;

export default function CommandUsersPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PLATFORM_ADMIN' | 'recruiter' | 'candidate'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [sortField, setSortField] = useState<SortField>('joined');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { includeDemo, lastUpdated } = useAdminHeader();

  // Dialog state for role change confirmation
  const [targetUser, setTargetUser] = useState<AdminUserProfile | null>(null);
  const [pendingRole, setPendingRole] = useState<PlatformRole | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');

  // Dialog state for suspend / restore confirmation
  const [suspendTargetUser, setSuspendTargetUser] = useState<AdminUserProfile | null>(null);
  const [suspendAction, setSuspendAction] = useState<'SUSPEND' | 'RESTORE'>('SUSPEND');
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  // Dialog state for token adjustment from user row menu
  const [tokenTargetUser, setTokenTargetUser] = useState<AdminUserProfile | null>(null);
  const [isUserTokenDialogOpen, setIsUserTokenDialogOpen] = useState(false);
  const [userTokenAmount, setUserTokenAmount] = useState('5');
  const [userTokenDirection, setUserTokenDirection] = useState<'ADD' | 'REMOVE'>('ADD');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Users and roles | Command Center';
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?include_demo=${includeDemo ? 'true' : 'false'}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn('Failed to fetch users directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [includeDemo]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, lastUpdated]);

  useEffect(() => {
    const handleRefresh = () => fetchUsers();
    window.addEventListener('sync730_admin_refresh_metrics', handleRefresh);
    window.addEventListener('sync730_users_updated', handleRefresh);
    return () => {
      window.removeEventListener('sync730_admin_refresh_metrics', handleRefresh);
      window.removeEventListener('sync730_users_updated', handleRefresh);
    };
  }, [fetchUsers]);

  // Format plain text role
  const getRolePlainText = (role: string) => {
    return getRoleDisplayName(role);
  };

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Demo guard
      if (!includeDemo && u.is_demo) return false;

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = (u.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesWorkspace = (u.workspace_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesWorkspace) return false;
      }

      // Role filter
      if (roleFilter !== 'ALL') {
        const rLower = (u.role || '').toLowerCase();
        if (roleFilter === 'PLATFORM_ADMIN') {
          if (rLower !== 'platform_admin' && rLower !== 'admin') return false;
        } else if (rLower !== roleFilter.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const userStatus = u.status || 'ACTIVE';
        if (userStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, includeDemo]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'name':
          valA = (a.full_name || a.email || '').toLowerCase();
          valB = (b.full_name || b.email || '').toLowerCase();
          break;
        case 'email':
          valA = (a.email || '').toLowerCase();
          valB = (b.email || '').toLowerCase();
          break;
        case 'role':
          valA = getRolePlainText(a.role).toLowerCase();
          valB = getRolePlainText(b.role).toLowerCase();
          break;
        case 'workspace':
          valA = (a.workspace_name || '—').toLowerCase();
          valB = (b.workspace_name || '—').toLowerCase();
          break;
        case 'status':
          valA = (a.status || 'ACTIVE').toLowerCase();
          valB = (b.status || 'ACTIVE').toLowerCase();
          break;
        case 'last_active':
          valA = new Date(a.last_active || a.created_at).getTime();
          valB = new Date(b.last_active || b.created_at).getTime();
          break;
        case 'joined':
        default:
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredUsers, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedUsers.slice(start, start + PAGE_SIZE);
  }, [sortedUsers, currentPage]);

  // Instant 1-Click Role Modification & Deletion (Without any special security measures or prompt)
  const handleDirectRoleChange = async (user: AdminUserProfile, newRole: PlatformRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );
    toast.success(`Role for ${user.full_name || user.email} updated to ${getRolePlainText(newRole)}.`);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          new_role: newRole,
          reason: 'Direct platform administrator role modification',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to update user role');
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating role');
      fetchUsers();
    }
  };

  // Role change dialog handlers
  const handleOpenRoleChange = (user: AdminUserProfile, newRole: PlatformRole) => {
    setTargetUser(user);
    setPendingRole(newRole);
    setReauthPassword('');
    setIsRoleDialogOpen(true);
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
        toast.success(`Role for ${targetUser.full_name || targetUser.email} updated to ${getRolePlainText(pendingRole)}.`);
        setIsRoleDialogOpen(false);
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

  // Suspend / Restore dialog handlers
  const handleOpenSuspendRestore = (user: AdminUserProfile, action: 'SUSPEND' | 'RESTORE') => {
    setSuspendTargetUser(user);
    setSuspendAction(action);
    setIsSuspendDialogOpen(true);
  };

  const handleConfirmSuspendRestore = async (reason: string) => {
    if (!suspendTargetUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: suspendTargetUser.id,
          action: suspendAction,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const nextStatus = suspendAction === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
        setUsers((prev) =>
          prev.map((u) => (u.id === suspendTargetUser.id ? { ...u, status: nextStatus } : u))
        );
        toast.success(
          `Account for ${suspendTargetUser.full_name || suspendTargetUser.email} ${
            suspendAction === 'SUSPEND' ? 'suspended' : 'restored'
          }.`
        );
        setIsSuspendDialogOpen(false);
        setSuspendTargetUser(null);
      } else {
        throw new Error(data.error || `Failed to ${suspendAction.toLowerCase()} user account`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating account status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adjust tokens handlers from user row menu
  const handleOpenUserAdjustTokens = (user: AdminUserProfile) => {
    setTokenTargetUser(user);
    setUserTokenAmount('5');
    setUserTokenDirection('ADD');
    setIsUserTokenDialogOpen(true);
  };

  const handleConfirmUserAdjustTokens = async (reason: string) => {
    if (!tokenTargetUser) return;
    const numTokens = parseInt(userTokenAmount, 10);
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
          workspace_id: tokenTargetUser.workspace_id || 'ws-sync730-demo',
          direction: userTokenDirection,
          amount: numTokens,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `${userTokenDirection === 'ADD' ? 'Added' : 'Deducted'} ${numTokens} tokens. Balance: ${data.token_balance}`
        );
        setIsUserTokenDialogOpen(false);
        setTokenTargetUser(null);
      } else {
        throw new Error(data.error || 'Failed to adjust tokens');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error adjusting tokens');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTargetAdmin =
    targetUser?.role === 'PLATFORM_ADMIN' ||
    (targetUser?.role as string)?.toLowerCase() === 'admin';
  const isElevatingToAdmin = pendingRole === 'PLATFORM_ADMIN' || pendingRole === 'admin';
  const isRevokingAdmin = isTargetAdmin && !isElevatingToAdmin;
  const requiresReauth = isElevatingToAdmin || isRevokingAdmin;

  let roleDialogTitle = 'Change role?';
  let roleDialogDescription = 'Update the permissions assigned to this user.';
  let roleDialogActionLabel = 'Change role';

  if (targetUser && pendingRole) {
    const userName = targetUser.full_name || targetUser.email;
    if (isElevatingToAdmin) {
      roleDialogTitle = `Give ${userName} full admin access?`;
      roleDialogDescription =
        'This grants platform-wide administrative privileges to manage all jobs, workspaces, and permissions.';
      roleDialogActionLabel = 'Make admin';
    } else if (isRevokingAdmin) {
      roleDialogTitle = `Revoke admin access from ${userName}?`;
      roleDialogDescription = `This removes administrative privileges and resets access to ${getRolePlainText(
        pendingRole
      )}.`;
      roleDialogActionLabel = 'Revoke admin';
    } else {
      roleDialogTitle = `Change ${userName}'s role to ${getRolePlainText(pendingRole)}?`;
      roleDialogDescription = `This modifies account privileges to the ${getRolePlainText(pendingRole)} level.`;
      roleDialogActionLabel = 'Save role change';
    }
  }

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-neutral-500 inline opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-white inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-white inline" />
    );
  };

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Users and roles
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Manage user directory, workspace assignments, and access statuses.
        </p>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm space-y-4">
        {/* Controls Bar: Search & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {(['ALL', 'PLATFORM_ADMIN', 'recruiter', 'candidate'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRoleFilter(r);
                    setCurrentPage(1);
                  }}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    roleFilter === r
                      ? 'bg-neutral-800 text-white'
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

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setCurrentPage(1);
                  }}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === s
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {s === 'ALL' ? 'All status' : s === 'ACTIVE' ? 'Active' : 'Suspended'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, email, workspace..."
              className="h-10 pl-9 pr-3 text-sm rounded-xl bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs font-semibold select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Name {renderSortIndicator('name')}
                </th>
                <th
                  onClick={() => handleSort('email')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Email {renderSortIndicator('email')}
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Role {renderSortIndicator('role')}
                </th>
                <th
                  onClick={() => handleSort('workspace')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Workspace {renderSortIndicator('workspace')}
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Status {renderSortIndicator('status')}
                </th>
                <th
                  onClick={() => handleSort('last_active')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Last active {renderSortIndicator('last_active')}
                </th>
                <th
                  onClick={() => handleSort('joined')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Joined {renderSortIndicator('joined')}
                </th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-neutral-500">
                    No users match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const roleText = getRolePlainText(u.role);
                  const isSuspended = u.status === 'SUSPENDED';
                  const joinedInfo = formatLagosDateTime(u.created_at);
                  const activeInfo = u.last_active ? formatLagosDateTime(u.last_active) : joinedInfo;

                  return (
                    <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{u.full_name || 'Sync730 User'}</span>
                          {u.is_demo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 font-mono">
                              demo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 text-neutral-300 text-xs">
                        {u.email}
                      </td>

                      {/* Role: Plain text, no pills or badges */}
                      <td className="py-3.5 text-xs text-neutral-200 font-medium">
                        {roleText}
                      </td>

                      {/* Workspace */}
                      <td className="py-3.5 text-xs text-neutral-400">
                        {u.workspace_name || '—'}
                      </td>

                      {/* Status: Active / Suspended plain text */}
                      <td className="py-3.5 text-xs">
                        <span
                          className={`font-semibold ${
                            isSuspended ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 text-xs text-neutral-400" title={`Last active: ${activeInfo.relative}`}>
                        {activeInfo.relative}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 text-xs text-neutral-400" title={`Joined: ${joinedInfo.relative}`}>
                        {joinedInfo.formatted}
                      </td>

                      {/* Row Menu: Quiet MoreHorizontal dropdown */}
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
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-800" />

                            {/* Direct Role Actions without Security Prompts */}
                            <DropdownMenuItem
                              onClick={() => handleDirectRoleChange(u, 'super_admin')}
                              className="text-xs cursor-pointer hover:bg-neutral-800 text-amber-400 font-medium"
                            >
                              Grant Super Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDirectRoleChange(u, 'recruiter')}
                              className="text-xs cursor-pointer hover:bg-neutral-800 text-blue-400 font-medium"
                            >
                              Grant Recruiter Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDirectRoleChange(u, 'candidate')}
                              className="text-xs cursor-pointer hover:bg-neutral-800 text-neutral-300 font-medium"
                            >
                              Remove Admin / Reset Role
                            </DropdownMenuItem>

                            {/* Adjust Tokens Action */}
                            <DropdownMenuItem
                              onClick={() => handleOpenUserAdjustTokens(u)}
                              className="text-xs cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800"
                            >
                              Adjust tokens...
                            </DropdownMenuItem>

                            {/* Suspend / Restore Action */}
                            {isSuspended ? (
                              <DropdownMenuItem
                                onClick={() => handleOpenSuspendRestore(u, 'RESTORE')}
                                className="text-xs cursor-pointer text-emerald-400 hover:text-emerald-300 hover:bg-neutral-800 focus:bg-neutral-800"
                              >
                                Restore account...
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleOpenSuspendRestore(u, 'SUSPEND')}
                                className="text-xs cursor-pointer text-red-400 hover:text-red-300 hover:bg-neutral-800 focus:bg-neutral-800"
                              >
                                Suspend user...
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-neutral-800" />

                            {/* View Activity Link */}
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/command/audit?user=${encodeURIComponent(u.email || u.id)}`}
                                className="text-xs cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 w-full"
                              >
                                View activity
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

        {/* Pagination Bar (25 items per page) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
          <div>
            Showing{' '}
            <strong className="text-white">
              {filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-white">
              {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}
            </strong>{' '}
            of <strong className="text-white">{filteredUsers.length}</strong> users
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-lg border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs gap-1 min-h-[32px]"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 rounded-lg border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs gap-1 min-h-[32px]"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Dialog: Role Change */}
      <ConfirmationDialog
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        title={roleDialogTitle}
        description={roleDialogDescription}
        requireReason={true}
        actionLabel={roleDialogActionLabel}
        isDestructive={isRevokingAdmin}
        isLoading={isSubmitting}
        onConfirm={handleConfirmRoleChange}
      >
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-neutral-300 block">
            Target Role
          </label>
          <select
            value={pendingRole || ''}
            onChange={(e) => setPendingRole(e.target.value as PlatformRole)}
            className="w-full h-10 px-3 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-neutral-600"
          >
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
            <option value="support">Support</option>
            <option value="finance">Finance</option>
            <option value="vetting_reviewer">Vetting reviewer</option>
            <option value="moderator">Moderator</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>

        {requiresReauth && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              Confirm your password (Step-up authentication required for admin changes)
            </label>
            <Input
              type="password"
              placeholder="Enter current password..."
              value={reauthPassword}
              onChange={(e) => setReauthPassword(e.target.value)}
              className="h-10 text-xs rounded-xl bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
        )}
      </ConfirmationDialog>

      {/* Confirmation Dialog: Suspend / Restore */}
      <ConfirmationDialog
        open={isSuspendDialogOpen}
        onOpenChange={setIsSuspendDialogOpen}
        title={
          suspendAction === 'SUSPEND'
            ? `Suspend ${suspendTargetUser?.full_name || suspendTargetUser?.email}?`
            : `Restore ${suspendTargetUser?.full_name || suspendTargetUser?.email}?`
        }
        description={
          suspendAction === 'SUSPEND'
            ? 'This blocks the user from signing in or performing any operations on the platform.'
            : 'This re-enables full access for the user to sign in and resume operations.'
        }
        requireReason={true}
        actionLabel={suspendAction === 'SUSPEND' ? 'Suspend user' : 'Restore user'}
        isDestructive={suspendAction === 'SUSPEND'}
        isLoading={isSubmitting}
        onConfirm={handleConfirmSuspendRestore}
      />

      {/* Confirmation Dialog: Adjust Tokens */}
      <ConfirmationDialog
        open={isUserTokenDialogOpen}
        onOpenChange={setIsUserTokenDialogOpen}
        title={`Adjust tokens for ${tokenTargetUser?.full_name || tokenTargetUser?.email}?`}
        description={`This will ${userTokenDirection === 'ADD' ? 'grant additional' : 'deduct'} recruiter assessment tokens.`}
        actionLabel={userTokenDirection === 'ADD' ? 'Add tokens' : 'Deduct tokens'}
        requireReason={true}
        isDestructive={userTokenDirection === 'REMOVE'}
        isLoading={isSubmitting}
        onConfirm={handleConfirmUserAdjustTokens}
      >
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={userTokenDirection === 'ADD' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUserTokenDirection('ADD')}
              className={`h-9 text-xs rounded-xl ${
                userTokenDirection === 'ADD'
                  ? 'bg-neutral-100 text-neutral-900 font-bold'
                  : 'border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Add Tokens (+)
            </Button>
            <Button
              type="button"
              variant={userTokenDirection === 'REMOVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUserTokenDirection('REMOVE')}
              className={`h-9 text-xs rounded-xl ${
                userTokenDirection === 'REMOVE'
                  ? 'bg-red-600 text-white font-bold'
                  : 'border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Deduct Tokens (-)
            </Button>
          </div>
          <div>
            <label className="text-xs text-neutral-300 font-semibold block mb-1">
              Token Amount (max 100)
            </label>
            <Input
              type="number"
              min="1"
              max="100"
              value={userTokenAmount}
              onChange={(e) => setUserTokenAmount(e.target.value)}
              className="h-10 text-xs rounded-xl bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
        </div>
      </ConfirmationDialog>
    </div>
  );
}
