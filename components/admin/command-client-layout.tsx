'use client';

import { useState, useEffect } from 'react';
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
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createBrowserClient } from '@/lib/supabase/client';
import { AdminHeaderProvider, useAdminHeader } from '@/components/admin/admin-header-context';
import type { AdminMetricsData } from '@/lib/admin/types';

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
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        name: 'Overview',
        href: '/command',
        icon: ShieldCheck,
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
      },
      {
        name: 'Reports',
        href: '/command/reports',
        icon: Flag,
        badgeKey: 'reports',
      },
      {
        name: 'Sources',
        href: '/command/sources',
        icon: Globe,
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
      },
      {
        name: 'Employers',
        href: '/command/employers',
        icon: Building2,
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
      },
      {
        name: 'Settings',
        href: '/command/settings',
        icon: Settings,
      },
    ],
  },
];

function CommandLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { includeDemo, setIncludeDemo, triggerRefresh, isRefreshing } = useAdminHeader();
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);

  // Authenticated user state
  const userName = 'David O. Alabi';
  const userRole = 'Platform admin';
  const initials = getInitials(userName);

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
        document.cookie = 'sync730-demo-role=; path=/; max-age=0';
      }
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  // Helper to get number badge (hidden when 0)
  const getBadgeCount = (key?: 'roles' | 'reports' | 'video'): number => {
    if (!key || !metrics) return 0;
    if (key === 'roles') return metrics.roles?.needs_review || 0;
    if (key === 'video') return metrics.flagged_videos?.total || 0;
    if (key === 'reports') return 0; // Not tracked yet / open reports in future phase
    return 0;
  };

  // Breadcrumb / indicator text for header bar (not an h1)
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

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex">
      {/* 1. STICKY SIDEBAR (Full viewport height, own scroll, pinned account block) */}
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

          {/* Grouped Navigation Links */}
          <nav className="space-y-4">
            {NAV_GROUPS.map((group, groupIdx) => (
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

                        {/* Count badge: number only, hidden when zero */}
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
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-full ring-1 ring-neutral-700 bg-neutral-800">
              <AvatarFallback className="bg-neutral-800 text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {userName}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {userRole}
              </p>
            </div>
          </div>

          {/* Action links */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Link
              href="/candidate"
              className="flex items-center justify-center h-10 px-3 rounded-lg border border-neutral-800 bg-neutral-900 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Candidate view
            </Link>
            <Link
              href="/console/jobs"
              className="flex items-center justify-center h-10 px-3 rounded-lg border border-neutral-800 bg-neutral-900 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Recruiter view
            </Link>
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
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {/* Breadcrumb section indicator (NOT an h1) */}
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
                  {NAV_GROUPS.map((group, groupIdx) => (
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
                  <Link
                    href="/candidate"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-9 px-2 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-300"
                  >
                    Candidate view
                  </Link>
                  <Link
                    href="/console/jobs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-9 px-2 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-300"
                  >
                    Recruiter view
                  </Link>
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

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
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
