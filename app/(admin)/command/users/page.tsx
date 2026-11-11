'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  Briefcase,
  User,
  RefreshCw,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
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
import { AdminUserProfile, PlatformRole } from '@/lib/admin/types';
import { toast } from 'sonner';

export default function CommandUsersPage() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PLATFORM_ADMIN' | 'recruiter' | 'candidate'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn('Failed to fetch users directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: PlatformRole) => {
    setUpdatingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          new_role: newRole,
          notes: `Elevated / changed to ${newRole} via Platform Admin Command Center`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        toast.success(`Role for ${userId} updated to ${newRole}. Audit log recorded.`);
      } else {
        throw new Error(data.error || 'Failed to update user role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating role.');
    } finally {
      setUpdatingId(null);
    }
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

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
              Identity & Access Management (IAM)
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            User Profiles & Role Directory
          </h2>
          <p className="text-xs text-neutral-400">
            Search all registered accounts, elevate members to PLATFORM_ADMIN, and manage ecosystem permissions.
          </p>
        </div>

        <Button
          onClick={fetchUsers}
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </Button>
      </div>

      {/* Directory Table Card */}
      <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-sm space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'PLATFORM_ADMIN', 'recruiter', 'candidate'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === r
                    ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {r === 'ALL'
                  ? 'All Roles'
                  : r === 'PLATFORM_ADMIN'
                  ? 'Platform Admins'
                  : r === 'recruiter'
                  ? 'Recruiters'
                  : 'Candidates'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..."
              className="h-9 pl-8 pr-3 text-xs rounded-xl bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] font-semibold">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Current Role</th>
                <th className="pb-3 font-semibold">Joined Date</th>
                <th className="pb-3 font-semibold text-right">Role Promotion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredUsers.map((u) => {
                const isAdmin =
                  u.role === 'PLATFORM_ADMIN' ||
                  (u.role as string).toLowerCase() === 'admin';
                const isRecruiter = u.role === 'recruiter';
                const isCandidate = u.role === 'candidate';

                const initials = (u.full_name || u.email)
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <tr key={u.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* User Profile */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 rounded-full border border-neutral-800">
                          <AvatarFallback className="bg-neutral-800 text-white text-[10px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-white">
                            {u.full_name || 'Sync730 User'}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">{u.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 text-neutral-300 font-mono text-[11px]">
                      {u.email}
                    </td>

                    {/* Current Role Badge */}
                    <td className="py-3.5">
                      <Badge
                        className={`text-[10px] font-bold ${
                          isAdmin
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : isRecruiter
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {isAdmin ? 'PLATFORM_ADMIN' : u.role.toUpperCase()}
                      </Badge>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 text-neutral-400 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    {/* Action Menu */}
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isAdmin ? (
                          <Button
                            onClick={() => handleUpdateRole(u.id, 'PLATFORM_ADMIN')}
                            disabled={updatingId === u.id}
                            size="sm"
                            className="h-8 px-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-[11px] gap-1 shadow-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Make Admin</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleUpdateRole(u.id, 'candidate')}
                            disabled={updatingId === u.id}
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 rounded-xl border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white font-medium text-[11px]"
                          >
                            <span>Demote</span>
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-neutral-800 text-neutral-400"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white text-xs">
                            <DropdownMenuLabel>Reassign Role</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-neutral-800" />
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(u.id, 'PLATFORM_ADMIN')}
                              className="gap-2 cursor-pointer focus:bg-neutral-800"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
                              <span>Promote to PLATFORM_ADMIN</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(u.id, 'recruiter')}
                              className="gap-2 cursor-pointer focus:bg-neutral-800"
                            >
                              <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                              <span>Set as Recruiter</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(u.id, 'candidate')}
                              className="gap-2 cursor-pointer focus:bg-neutral-800"
                            >
                              <User className="h-3.5 w-3.5 text-blue-400" />
                              <span>Set as Candidate</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
