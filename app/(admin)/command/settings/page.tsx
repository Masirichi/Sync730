'use client';

import { useEffect } from 'react';
import { Settings, Shield, Clock, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function CommandSettingsPage() {
  useEffect(() => {
    document.title = 'Settings | Command Center';
  }, []);

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Platform operational parameters, rate limits, and crawl configurations.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Operator Model */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
            <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
              <Shield className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Operator Model</h2>
              <p className="text-xs text-neutral-400">Platform administrative authority structure</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Active Operator Mode</span>
              <span className="font-semibold text-white">Single Admin (Super admin)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Authorisation Source</span>
              <span className="font-mono text-emerald-400">admin_roles table (Postgres RLS)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Candidate Video Review</span>
              <span className="font-semibold text-white">Super admin only</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-neutral-400">Permissions Map</span>
              <span className="text-neutral-300">Extensible scoped roles (5 tiers)</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Interview Recording Retention */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
            <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
              <Clock className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Interview Recording Retention</h2>
              <p className="text-xs text-neutral-400">Candidate video privacy and lifecycle policy</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Configured Per Workspace</span>
              <span className="font-semibold text-white">Yes (corporate_workspaces)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Default Retention Period</span>
              <span className="font-semibold text-white">90 days</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Maximum Allowed Retention</span>
              <span className="font-semibold text-amber-300">90 days (strict upper ceiling)</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-neutral-400">Retention Expiry Action</span>
              <span className="text-neutral-300">Automatic recording purge & access revocation</span>
            </div>
          </div>
        </Card>

        {/* Card 3: Security & Database Controls */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
            <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
              <KeyRound className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Security & Database Architecture</h2>
              <p className="text-xs text-neutral-400">Supabase Row Level Security (RLS) & transactional RPC enforcement</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-medium">Row Level Security</span>
              <p className="text-sm font-semibold text-white">Primary Control Layer</p>
              <p className="text-[11px] text-neutral-500">Public anon key blocked from all sensitive tables by Postgres policies.</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-medium">Service Role Key</span>
              <p className="text-sm font-semibold text-white">Server-Only</p>
              <p className="text-[11px] text-neutral-500">Never exposed in client bundles or NEXT_PUBLIC_ variables.</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-medium">Atomic RPC Functions</span>
              <p className="text-sm font-semibold text-white">7 Dangerous Actions</p>
              <p className="text-[11px] text-neutral-500">Each action executes change + audit_log insert in a single Postgres transaction.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
