'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, ShieldCheck, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatLagosDateTime } from '@/lib/admin/date';
import { useAdminHeader } from '@/components/admin/admin-header-context';

interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  target_label: string;
  reason: string;
  before: any;
  after: any;
  created_at: string;
  ip: string;
}

export default function CommandAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { lastUpdated } = useAdminHeader();

  useEffect(() => {
    document.title = 'Audit log | Command Center';
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.audit_logs)) {
        setLogs(data.audit_logs);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, lastUpdated]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.actor_name?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.target_label?.toLowerCase().includes(q) ||
      log.reason?.toLowerCase().includes(q) ||
      log.target_type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Audit log
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Immutable append-only record of all administrative permissions and token adjustments.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 stroke-[2]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, reason..."
            className="pl-9 h-10 text-xs bg-neutral-900 border-neutral-800 text-white rounded-xl placeholder:text-neutral-500"
          />
        </div>
        <div className="text-xs text-neutral-400 tabular-nums">
          Total recorded events: <strong className="text-white font-semibold">{filteredLogs.length}</strong>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Timestamp (Lagos)</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4 min-w-[200px]">Required reason</th>
                <th className="py-3.5 px-4">IP address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-neutral-400 tabular-nums whitespace-nowrap">
                      {formatLagosDateTime(log.created_at).formatted}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {log.actor_name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                      {log.target_label || log.target_id}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300 max-w-sm">
                      {log.reason || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 tabular-nums whitespace-nowrap">
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
