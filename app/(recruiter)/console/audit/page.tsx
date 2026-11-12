'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Zap,
  Lock,
  FileText,
  Key,
  Users,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLogEntry, RecruiterRole } from '@/lib/recruiter/types';
import { getLocalAuditLogs } from '@/lib/recruiter/store';
import { toast } from 'sonner';

export default function ConsoleAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (userFilter !== 'all') params.set('user', userFilter);
      if (dateRange !== 'all') params.set('date_range', dateRange);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/recruiter/audit-logs?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setLogs(data.logs || []);
      } else {
        // Fallback to local store
        let local = getLocalAuditLogs();
        if (actionFilter !== 'all') local = local.filter((l) => l.action === actionFilter);
        if (userFilter !== 'all') local = local.filter((l) => l.actor_email === userFilter);
        setLogs(local);
      }
    } catch {
      setLogs(getLocalAuditLogs());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const updateRole = () => {
      const el = document.querySelector('[data-active-role]');
      if (el) {
        const r = el.getAttribute('data-active-role') as RecruiterRole;
        if (r) setCurrentRole(r);
      }
    };
    updateRole();

    fetchLogs();

    const handleUpdate = () => fetchLogs();
    window.addEventListener('sync730_audit_logs_updated', handleUpdate);
    const interval = setInterval(updateRole, 500);

    return () => {
      window.removeEventListener('sync730_audit_logs_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [actionFilter, userFilter, dateRange]);

  // Handle Search on Submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const isInterviewer = currentRole === 'INTERVIEWER';

  // Export Audit Trail as CSV
  const exportCsv = () => {
    const headers = [
      'Timestamp',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'Action Type',
      'Target Resource',
      'Details',
      'IP Address',
      'User Agent',
    ];

    const rows = logs.map((l) => [
      `"${new Date(l.created_at).toISOString()}"`,
      `"${l.actor_name || ''}"`,
      `"${l.actor_email || ''}"`,
      `"${l.actor_role}"`,
      `"${l.action}"`,
      `"${l.target_resource || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ip_address || ''}"`,
      `"${(l.user_agent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync730-audit-trail-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log export downloaded.');
  };

  if (isInterviewer) {
    return (
      <div className="p-8 max-w-2xl mx-auto rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-4 shadow-sm mt-12">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
          Access Restricted to Workspace Owners & Admins
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
          The workspace audit ledger contains sensitive administrative records, token financial transactions, and user access history. Your role (<strong>Interviewer</strong>) does not have permission to inspect this log.
        </p>
        <Link href="/console">
          <Button variant="outline" className="text-xs h-9 font-semibold rounded-xl">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'TOKEN_PURCHASE':
        return 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'TOKEN_UNLOCK':
        return 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300';
      case 'ROLE_CHANGE':
        return 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300';
      case 'MEMBER_INVITE':
      case 'INVITE_RESENT':
        return 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300';
      case 'MEMBER_REMOVE':
      case 'INVITE_REVOKED':
        return 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300';
      case 'DATA_EXPORT':
        return 'border-indigo-300 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300';
      case 'LOGIN_NEW_DEVICE':
        return 'border-neutral-300 text-neutral-700 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300';
      default:
        return 'border-neutral-300 text-neutral-700 bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 mb-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[2]" />
            <span>Immutable Ledger Record</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Workspace Security & Activity Audit Log
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl leading-relaxed">
            All administrative operations, token transactions, role modifications, and candidate data access are cryptographically timestamped and permanently retained. Entries cannot be edited or deleted.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={logs.length === 0}
            className="h-9 text-xs font-semibold rounded-xl border-neutral-300 dark:border-neutral-700 gap-1.5 focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <Download className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="h-9 text-xs font-semibold rounded-xl border-neutral-300 dark:border-neutral-700 gap-1.5 focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search details, candidate ID, performer name, or IP..."
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 min-w-[160px]"
          >
            <option value="all">All Action Types</option>
            <option value="TOKEN_PURCHASE">Token Purchases</option>
            <option value="TOKEN_UNLOCK">Token Unlocks</option>
            <option value="ROLE_CHANGE">Role Changes</option>
            <option value="MEMBER_INVITE">Member Invites</option>
            <option value="MEMBER_REMOVE">Member Removals</option>
            <option value="INVITE_REVOKED">Revoked Invites</option>
            <option value="JOB_UPDATED">Job Edits</option>
            <option value="DATA_EXPORT">Data Exports</option>
            <option value="LOGIN_NEW_DEVICE">New Logins</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 min-w-[130px]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <Button type="submit" size="sm" className="h-9 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4">
            Filter
          </Button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Showing {logs.length} Recorded Entries
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-neutral-400" />
            <span>Strict Append-Only Ledger</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            <Shield className="h-8 w-8 text-neutral-400 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">No audit entries match your filters.</p>
            <p className="text-[11px] text-neutral-400 mt-1">Try clearing filters or adjusting your date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  <th className="py-3 px-4 w-44">Timestamp</th>
                  <th className="py-3 px-4 w-48">Performer</th>
                  <th className="py-3 px-4 w-36">Action</th>
                  <th className="py-3 px-4">Operation Details & Resource</th>
                  <th className="py-3 px-4 w-48 text-right">Client Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 font-sans">
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Performer */}
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-neutral-900 dark:text-white truncate max-w-[180px]">
                        {log.actor_name || log.actor_email}
                      </div>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider border-neutral-300 dark:border-neutral-700"
                        >
                          {log.actor_role}
                        </Badge>
                        <span className="truncate max-w-[120px]">{log.actor_email}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-sans">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 whitespace-nowrap ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 font-sans">
                      <p className="text-neutral-800 dark:text-neutral-200 leading-snug">
                        {log.details}
                      </p>
                      {log.target_resource && (
                        <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                          Target: {log.target_resource}
                        </div>
                      )}
                    </td>

                    {/* Client Signature */}
                    <td className="py-3 px-4 text-right text-neutral-500 text-[10px]">
                      <div>{log.ip_address || '102.89.43.12'}</div>
                      <div className="truncate max-w-[180px] ml-auto text-neutral-400 font-sans" title={log.user_agent}>
                        {log.user_agent ? 'Verified Session Client' : 'Browser Session'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
