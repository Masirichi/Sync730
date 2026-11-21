'use strict';
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Briefcase,
  Flag,
  Globe,
  Users,
  Building2,
  Video,
  Coins,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  Lock,
  KeyRound,
  Copy,
  Check,
  ChevronDown,
  Eye,
  Loader2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createBrowserClient } from '@/lib/supabase/client';
import { AdminHeaderProvider, useAdminHeader } from '@/components/admin/admin-header-context';
import type { AdminMetricsData } from '@/lib/admin/types';
import {
  AdminRole,
  AdminAction,
  can,
  getRoleDisplayName,
  normalizeAdminRole,
} from '@/lib/admin/permissions-matrix';
import { toast } from 'sonner';

// Derive initials from full name matching the displayed name
function getInitials(name: string): string {
  if (!name) return 'PA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: 'roles' | 'reports' | 'video';
  action: AdminAction;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const ALL_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        name: 'Overview',
        href: '/command',
        icon: ShieldCheck,
        action: 'page:overview',
      },
    ],
  },
  {
    label: 'Verification',
    items: [
      {
        name: 'Roles',
        href: '/command/roles',
        icon: Briefcase,
        badgeKey: 'roles',
        action: 'page:roles',
      },
      {
        name: 'Reports',
        href: '/command/reports',
        icon: Flag,
        badgeKey: 'reports',
        action: 'page:reports',
      },
      {
        name: 'Sources',
        href: '/command/sources',
        icon: Globe,
        action: 'page:sources',
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        name: 'Users and roles',
        href: '/command/users',
        icon: Users,
        action: 'page:users',
      },
      {
        name: 'Employers',
        href: '/command/employers',
        icon: Building2,
        action: 'page:employers',
      },
    ],
  },
  {
    label: 'Vetting',
    items: [
      {
        name: 'Video review',
        href: '/command/video-review',
        icon: Video,
        badgeKey: 'video',
        action: 'page:video_review',
      },
    ],
  },
  {
    label: 'Money',
    items: [
      {
        name: 'Tokens and payments',
        href: '/command/money',
        icon: Coins,
        action: 'page:money',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        name: 'Audit log',
        href: '/command/audit',
        icon: Clock,
        action: 'page:audit',
      },
      {
        name: 'Settings',
        href: '/command/settings',
        icon: Settings,
        action: 'page:settings',
      },
    ],
  },
];

const ROLE_USERS: Record<AdminRole, { name: string; email: string }> = {
  super_admin: { name: 'Ajah Malachy', email: 'ajahmalachy@gmail.com' },
  moderator: { name: 'Amara Okonkwo', email: 'amara.o@sync730.com' },
  vetting_reviewer: { name: 'Dr. Kweku Mensah', email: 'vetting.lead@sync730.com' },
  finance: { name: 'Folake Adeleke', email: 'finance@sync730.com' },
  support: { name: 'Chidi Eze', email: 'support@sync730.com' },
};

function CommandLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { includeDemo, setIncludeDemo, triggerRefresh, isRefreshing } = useAdminHeader();
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);

  // Active Role state (supports simulation & switching among all 5 scoped roles)
  const [currentRole, setCurrentRole] = useState<AdminRole>('super_admin');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  // MFA state
  const [mfaStatus, setMfaStatus] = useState<{
    requires_mfa: boolean;
    mfa_enabled: boolean;
    grace_days_remaining: number;
    is_grace_expired: boolean;
  } | null>(null);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<{
    secret: string;
    uri: string;
    recovery_codes: string[];
  } | null>(null);
  const [mfaTokenInput, setMfaTokenInput] = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Initial role detection from cookie
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)sync730_admin_role=([^;]+)/);
      if (match) {
        const normalized = normalizeAdminRole(decodeURIComponent(match[1]));
        if (normalized) setCurrentRole(normalized);
      }
    }
  }, []);

  // Fetch MFA status
  const fetchMfaStatus = async () => {
    try {
      const res = await fetch('/api/admin/mfa');
      if (res.ok) {
        const data = await res.json();
        setMfaStatus(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMfaStatus();
  }, [currentRole]);

  const handleRoleChange = (newRole: AdminRole) => {
    setCurrentRole(newRole);
    if (typeof document !== 'undefined') {
      document.cookie = `sync730_admin_role=${newRole}; path=/; max-age=86400; SameSite=Lax`;
    }
    setIsRoleMenuOpen(false);
    toast.success(`Switched role to ${getRoleDisplayName(newRole)}`);
    router.refresh();
  };

  const handleStartViewAs = async (targetRole: 'candidate' | 'recruiter') => {
    if (!can(currentRole, 'impersonate')) {
      toast.error('Permission denied: Only Super admin and Support can use View-As impersonation.');
      return;
    }

    try {
      const res = await fetch('/api/admin/view-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'START',
          target_id: targetRole === 'candidate' ? 'cand-sim-01' : 'rec-sim-01',
          target_name: targetRole === 'candidate' ? 'Amina Bello' : 'Elena Rostova (Fintech Global)',
          target_role: targetRole,
        }),
      });

      if (res.ok) {
        toast.info(`View-As mode started (${targetRole}). Read-only mode active.`);
        router.push(targetRole === 'candidate' ? '/candidate' : '/console/jobs');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to start View-As session');
      }
    } catch {
      toast.error('Network error starting View-As session');
    }
  };

  // Setup MFA flow
  const handleOpenMfaSetup = async () => {
    setShowMfaModal(true);
    setMfaTokenInput('');
    setCopiedCodes(false);
    try {
      const res = await fetch('/api/admin/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SETUP' }),
      });
      if (res.ok) {
        const data = await res.json();
        setMfaSetupData(data);
      }
    } catch {
      toast.error('Failed to initiate MFA setup');
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSetupData || !mfaTokenInput.trim()) return;

    setIsVerifyingMfa(true);
    try {
      const res = await fetch('/api/admin/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ENROLL',
          token: mfaTokenInput,
          secret: mfaSetupData.secret,
          recovery_codes: mfaSetupData.recovery_codes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Multi-Factor Authentication enrolled successfully!');
        setMfaStatus((prev) => (prev ? { ...prev, mfa_enabled: true } : null));
        setShowMfaModal(false);
      } else {
        toast.error(data.error || 'Invalid verification code. Please check your authenticator.');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const currentUserData = ROLE_USERS[currentRole] || ROLE_USERS.super_admin;
  const userName = currentUserData.name;
  const userRole = getRoleDisplayName(currentRole);
  const initials = getInitials(userName);

  // Filter Nav Groups based on active role permissions
  const filteredNavGroups = useMemo(() => {
    return ALL_NAV_GROUPS.map((group) => {
      const allowedItems = group.items.filter((item) => can(currentRole, item.action));
      return {
        ...group,
        items: allowedItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [currentRole]);

  // Fetch telemetry badges from Phase 2 single query layer
  useEffect(() => {
    let active = true;
    const fetchBadgeMetrics = async () => {
      try {
        const res = await fetch(`/api/admin/metrics?include_demo=${includeDemo ? 'true' : 'false'}`);
        const data = await res.json();
        if (active && data.success && data.metrics) {
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.warn('Failed to load nav badges:', err);
      }
    };

    fetchBadgeMetrics();
    window.addEventListener('sync730_admin_refresh_metrics', fetchBadgeMetrics);
    return () => {
      active = false;
      window.removeEventListener('sync730_admin_refresh_metrics', fetchBadgeMetrics);
    };
  }, [includeDemo]);

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      if (typeof document !== 'undefined') {
        document.cookie = 'sync730_admin_role=; path=/; max-age=0';
        document.cookie = 'sync730_view_as=; path=/; max-age=0';
      }
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const getBadgeCount = (key?: 'roles' | 'reports' | 'video'): number => {
    if (!key || !metrics) return 0;
    if (key === 'roles') return metrics.attention?.roles_to_verify ?? metrics.roles?.needs_review ?? 0;
    if (key === 'video') return metrics.attention?.flagged_videos ?? metrics.flagged_videos?.total ?? 0;
    if (key === 'reports') return metrics.attention?.open_reports ?? metrics.reports?.open ?? 0;
    return 0;
  };

  const getHeaderLabel = () => {
    if (pathname === '/command') return 'Overview';
    if (pathname.startsWith('/command/roles')) return 'Verification / Roles';
    if (pathname.startsWith('/command/reports')) return 'Verification / Reports';
    if (pathname.startsWith('/command/sources')) return 'Verification / Sources';
    if (pathname.startsWith('/command/users')) return 'People / Users and roles';
    if (pathname.startsWith('/command/employers')) return 'People / Employers';
    if (pathname.startsWith('/command/video-review')) return 'Vetting / Video review';
    if (pathname.startsWith('/command/money')) return 'Money / Tokens and payments';
    if (pathname.startsWith('/command/audit')) return 'System / Audit log';
    if (pathname.startsWith('/command/settings')) return 'System / Settings';
    return 'Command Center';
  };

  const isCurrentActive = (href: string) => {
    if (href === '/command') {
      return pathname === '/command';
    }
    return pathname.startsWith(href);
  };

  // Phase 9 Compliance: Enforce permission matrix on direct URL visits
  const currentAction = useMemo<AdminAction | null>(() => {
    if (pathname === '/command') return 'page:overview';
    if (pathname.startsWith('/command/roles')) return 'page:roles';
    if (pathname.startsWith('/command/reports')) return 'page:reports';
    if (pathname.startsWith('/command/sources')) return 'page:sources';
    if (pathname.startsWith('/command/users')) return 'page:users';
    if (pathname.startsWith('/command/employers')) return 'page:employers';
    if (pathname.startsWith('/command/video-review')) return 'page:video_review';
    if (pathname.startsWith('/command/money')) return 'page:money';
    if (pathname.startsWith('/command/audit')) return 'page:audit';
    if (pathname.startsWith('/command/settings')) return 'page:settings';
    return null;
  }, [pathname]);

  const isPageAuthorized = currentAction ? can(currentRole, currentAction) : true;

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col">
      {/* MFA Grace Period Alert Banner (Phase 8 Requirement) */}
      {mfaStatus?.requires_mfa && !mfaStatus?.mfa_enabled && (
        <aside
          role="region"
          aria-label="Multi-Factor Authentication Required"
          className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 px-4 sm:px-8 py-2 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Two-Factor Authentication Required:</strong> Your role ({userRole}) mandates
              MFA. You have{' '}
              <span className="font-bold underline">
                {mfaStatus.grace_days_remaining} day{mfaStatus.grace_days_remaining === 1 ? '' : 's'}
              </span>{' '}
              remaining in your grace period before account lock.
            </span>
          </div>
          <button
            onClick={handleOpenMfaSetup}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded text-[11px] transition-colors shrink-0"
          >
            Enroll Now
          </button>
        </aside>
      )}

      <div className="flex-1 flex min-h-0">
        {/* 1. STICKY SIDEBAR */}
        <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col h-screen sticky top-0 bg-[#0e0e12] border-r border-neutral-800/80 select-none overflow-hidden">
          {/* Scrollable Navigation Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Brand Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800/80">
              <Link href="/command" className="flex items-center gap-2.5">
                <span className="text-xl tracking-tight">
                  <span className="font-extrabold text-white">Sync</span>
                  <span className="font-semibold text-neutral-400">730</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Command Center
                </span>
              </Link>
            </div>

            {/* Operational Pulse */}
            <div className="px-3.5 py-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">All Systems Operational</p>
                  <p className="text-[11px] text-neutral-400">Global Cluster: Lagos & US-East</p>
                </div>
              </div>
              <ShieldCheck className="h-4 w-4 text-neutral-500 stroke-[2]" />
            </div>

            {/* Grouped Navigation Links (Filtered by Role Permissions) */}
            <nav className="space-y-4">
              {filteredNavGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  {group.label && (
                    <p className="text-[11px] uppercase font-semibold tracking-wider text-neutral-400 px-3.5 pt-2 pb-1">
                      {group.label}
                    </p>
                  )}

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isCurrentActive(item.href);
                      const Icon = item.icon;
                      const badgeCount = getBadgeCount(item.badgeKey);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px] ${
                            active
                              ? 'bg-neutral-800 text-white font-semibold border border-neutral-700/60 shadow-xs'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 stroke-[2] shrink-0" />
                            <span>{item.name}</span>
                          </div>

                          {badgeCount > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-white border border-neutral-700 tabular-nums">
                              {badgeCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* PINNED ACCOUNT BLOCK AT BOTTOM */}
          <div className="p-4 border-t border-neutral-800 bg-[#0e0e12] shrink-0 space-y-3">
            {/* User info & Role Switcher */}
            <div className="relative">
              <div
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-neutral-900/80 cursor-pointer transition-colors border border-transparent hover:border-neutral-800"
                title="Click to switch simulated admin role"
              >
                <Avatar className="h-9 w-9 rounded-full ring-1 ring-neutral-700 bg-neutral-800">
                  <AvatarFallback className="bg-neutral-800 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate leading-tight">
                    {userName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <span className="text-neutral-300 font-medium">{userRole}</span>
                    <ChevronDown className="w-3 h-3 text-neutral-500" />
                  </div>
                </div>
              </div>

              {/* Role Switcher Menu */}
              {isRoleMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-neutral-900 border border-neutral-700 rounded-xl p-1.5 shadow-xl z-50 text-xs">
                  <p className="px-2 py-1 text-[10px] uppercase font-semibold text-neutral-400">
                    Switch Admin Persona
                  </p>
                  {(['super_admin', 'moderator', 'vetting_reviewer', 'finance', 'support'] as AdminRole[]).map(
                    (r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          currentRole === r
                            ? 'bg-neutral-800 text-white font-semibold'
                            : 'text-neutral-300 hover:bg-neutral-800/60'
                        }`}
                      >
                        <span>{getRoleDisplayName(r)}</span>
                        {currentRole === r && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Action links: View As Candidate / Recruiter */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleStartViewAs('candidate')}
                disabled={!can(currentRole, 'impersonate')}
                className="flex items-center justify-center h-10 px-3 rounded-lg border border-neutral-800 bg-neutral-900 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={can(currentRole, 'impersonate') ? 'View candidate portal in read-only mode' : 'Restricted to Super admin & Support'}
              >
                Candidate view
              </button>
              <button
                type="button"
                onClick={() => handleStartViewAs('recruiter')}
                disabled={!can(currentRole, 'impersonate')}
                className="flex items-center justify-center h-10 px-3 rounded-lg border border-neutral-800 bg-neutral-900 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={can(currentRole, 'impersonate') ? 'View recruiter console in read-only mode' : 'Restricted to Super admin & Support'}
              >
                Recruiter view
              </button>
            </div>

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 stroke-[2]" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3 flex items-center justify-between min-h-[56px]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  {getHeaderLabel()}
                </span>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-3">
              {/* Include Demo Data Toggle */}
              <label
                htmlFor="include-demo-toggle"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs text-neutral-300 cursor-pointer select-none hover:border-neutral-700 transition-colors min-h-[40px]"
              >
                <input
                  id="include-demo-toggle"
                  type="checkbox"
                  checked={includeDemo}
                  onChange={(e) => setIncludeDemo(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-neutral-100 focus:ring-0 cursor-pointer"
                />
                <span className="font-medium text-xs">Include demo data</span>
              </label>

              {/* Unified Refresh Button */}
              <Button
                onClick={triggerRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="h-10 px-4 rounded-xl border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white"
              >
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </header>

          {/* Demo Data Included Visible Banner */}
          {includeDemo && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 sm:px-8 py-2 text-xs font-semibold text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 stroke-[2]" />
                <span>Demo data included</span>
              </div>
              <span className="text-[11px] text-amber-400/80 font-normal hidden sm:inline">
                Metrics, listings, and records include sandbox workspaces and test entries.
              </span>
            </div>
          )}

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex">
              <div className="w-72 bg-[#0e0e12] text-white p-4 flex flex-col justify-between h-full overflow-y-auto">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <span className="text-base font-bold">
                      <span className="text-white">Sync</span>
                      <span className="text-neutral-400">730</span>
                    </span>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <nav className="space-y-4">
                    {filteredNavGroups.map((group, groupIdx) => (
                      <div key={groupIdx} className="space-y-1">
                        {group.label && (
                          <p className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 px-3 pt-1">
                            {group.label}
                          </p>
                        )}
                        <div className="space-y-0.5">
                          {group.items.map((item) => {
                            const active = isCurrentActive(item.href);
                            const Icon = item.icon;
                            const badgeCount = getBadgeCount(item.badgeKey);

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                                  active
                                    ? 'bg-neutral-800 text-white font-semibold'
                                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Icon className="h-4 w-4 stroke-[2]" />
                                  <span>{item.name}</span>
                                </div>

                                {badgeCount > 0 && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-white tabular-nums">
                                    {badgeCount}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Mobile pinned account block */}
                <div className="pt-4 border-t border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 rounded-full bg-neutral-800">
                      <AvatarFallback className="text-xs font-bold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{userName}</p>
                      <p className="text-[11px] text-neutral-400">{userRole}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleStartViewAs('candidate');
                      }}
                      disabled={!can(currentRole, 'impersonate')}
                      className="flex items-center justify-center h-9 px-2 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-300 disabled:opacity-40"
                    >
                      Candidate view
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleStartViewAs('recruiter');
                      }}
                      disabled={!can(currentRole, 'impersonate')}
                      className="flex items-center justify-center h-9 px-2 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-300 disabled:opacity-40"
                    >
                      Recruiter view
                    </button>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300"
                  >
                    <LogOut className="h-3.5 w-3.5 stroke-[2]" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
              <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
            </div>
          )}

          {/* Main Content Body: Direct URL Access Protection */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {!isPageAuthorized ? (
              <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    HTTP 403 Forbidden
                  </span>
                  <h2 className="text-xl font-bold text-white">Access Restricted</h2>
                </div>
                <p className="text-sm text-neutral-400">
                  Your role ({userRole}) does not have permission to access {getHeaderLabel()}. Contact a Super admin if you require elevated privileges.
                </p>
                <div className="pt-2">
                  <Link
                    href="/command"
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold border border-neutral-700 transition-colors"
                  >
                    Return to Overview
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>

      {/* MFA ENROLLMENT MODAL */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-neutral-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-neutral-800 rounded-lg text-emerald-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Enroll Two-Factor Authentication</h3>
                  <p className="text-xs text-neutral-400">Mandatory security requirement for {userRole}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMfaModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mfaSetupData ? (
              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Step 1: Scan QR or Enter Base32 Secret Key in Authenticator
                  </label>
                  <p className="text-xs text-neutral-400">
                    Add this key to Google Authenticator, Authy, or 1Password:
                  </p>
                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-center text-sm font-bold tracking-widest text-amber-400 select-all">
                    {mfaSetupData.secret}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Step 2: Emergency Recovery Codes (Save these securely)
                  </label>
                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 grid grid-cols-2 gap-2 text-xs font-mono text-neutral-300">
                    {mfaSetupData.recovery_codes.map((c, i) => (
                      <span key={i} className="text-neutral-400 select-all">
                        {c}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(mfaSetupData.recovery_codes.join('\n'));
                      setCopiedCodes(true);
                      toast.success('Recovery codes copied to clipboard');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodes ? 'Codes copied' : 'Copy all recovery codes'}</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Step 3: Enter 6-digit Code from Authenticator
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={mfaTokenInput}
                    onChange={(e) => setMfaTokenInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMfaModal(false)}
                    className="border-neutral-800 text-neutral-300 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isVerifyingMfa || mfaTokenInput.length < 6}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    {isVerifyingMfa ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Activate MFA'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CommandClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminHeaderProvider>
      <CommandLayoutShell>{children}</CommandLayoutShell>
    </AdminHeaderProvider>
  );
}
