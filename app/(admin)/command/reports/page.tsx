'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Flag, Search, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatLagosDateTime } from '@/lib/admin/date';
import { useAdminHeader } from '@/components/admin/admin-header-context';

interface ReportItem {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  reason: string;
  note: string;
  reporter_ip: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
}

export default function CommandReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { includeDemo, lastUpdated } = useAdminHeader();

  useEffect(() => {
    document.title = 'Reports | Command Center';
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?include_demo=${includeDemo ? 'true' : 'false'}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch (err) {
      console.warn('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [includeDemo]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, lastUpdated]);

  const filteredReports = reports.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.job_title?.toLowerCase().includes(q) ||
      r.company?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q) ||
      r.note?.toLowerCase().includes(q)
    );
  });

  const openReports = filteredReports.filter((r) => r.status === 'OPEN');

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Reports
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Community inaccuracy flags, closed role notices, and candidate reports.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 stroke-[2]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report, role, company..."
            className="pl-9 h-10 text-xs bg-neutral-900 border-neutral-800 text-white rounded-xl placeholder:text-neutral-500"
          />
        </div>
        <div className="text-xs text-neutral-400 tabular-nums">
          Open reports:{' '}
          <strong className="text-white font-semibold">
            {openReports.length === 0 ? 'All clear' : openReports.length}
          </strong>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6 stroke-[2]" />
            </div>
            <h2 className="text-base font-semibold text-white">
              All clear in reports queue
            </h2>
            <p className="text-sm text-neutral-400">
              There are no open community flags or reported listings requiring triage.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Role & Company</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Note</th>
                  <th className="py-3.5 px-4">Reported</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {filteredReports.map((r) => {
                  const lagosTime = formatLagosDateTime(r.created_at);
                  return (
                    <tr key={r.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{r.job_title}</div>
                        <div className="text-[11px] text-neutral-400">{r.company}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                          <AlertTriangle className="h-3 w-3 stroke-[2]" />
                          {r.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-neutral-400">
                        {r.note || 'No notes provided'}
                      </td>
                      <td className="py-3 px-4 text-neutral-400 tabular-nums">
                        {lagosTime.relative}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.status === 'OPEN'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/command/roles?status=needs_review`}
                          className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-white font-medium"
                        >
                          <span>Inspect role</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
