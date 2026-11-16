'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Bell,
  Coins,
  Flag,
  Clock,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createBrowserClient } from '@/lib/supabase/client';
import { AdminHeaderProvider, useAdminHeader } from '@/components/admin/admin-header-context';
import { toast } from 'sonner';

function CommandLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { includeDemo, setIncludeDemo, triggerRefresh, isRefreshing } = useAdminHeader();

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

  const navLinks = [
    {
      name: 'Operations & Metrics',
      href: '/command/metrics',
      icon: Clock,
      badge: 'Live',
    },
    {
      name: 'Job Board',
      href: '/command/jobs',
      icon: Briefcase,
      badge: 'Live',
    },
    {
      name: 'Financial & Tokens',
      href: '/command/finance',
      icon: Coins,
      badge: null,
    },
    {
      name: 'Anti-Cheat & Vetting',
      href: '/command/vetting',
      icon: Flag,
      badge: 'Queue',
    },
    {
      name: 'User & Role Directory',
      href: '/command/users',
      icon: Users,
      badge: null,
    },
  ];

  let pageTitle = 'Global Operations';
  if (pathname.startsWith('/command/jobs')) pageTitle = 'Job Board Manager & Moderation';
  else if (pathname.startsWith('/command/finance')) pageTitle = 'Financial & Token Management';
  else if (pathname.startsWith('/command/vetting')) pageTitle = 'Anti-Cheat Video Moderation';
  else if (pathname.startsWith('/command/users')) pageTitle = 'User & Role Directory';

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex">
      {/* Sleek Dark Command Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col justify-between bg-[#0e0e12] border-r border-neutral-800/80 p-5 select-none">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <Link href="/command/metrics" className="flex items-center gap-2.5">
              <span className="text-xl tracking-tight">
                <span className="font-extrabold text-white">Sync</span>
                <span className="font-semibold text-neutral-400">730</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                Command Center
              </span>
            </Link>
          </div>

          {/* Platform Status Pulse */}
          <div className="px-3.5 py-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-xs font-bold text-white leading-tight">All Systems Operational</p>
                <p className="text-[10px] text-neutral-400">Global Cluster: Lagos & US-East</p>
              </div>
            </div>
            <ShieldCheck className="h-4 w-4 text-neutral-500 stroke-[1.5]" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navLinks.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700/60'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 stroke-[1.5] shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.badge === 'Queue'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="space-y-4 pt-6 border-t border-neutral-800">
          {/* Admin Clearance Badge */}
          <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-rose-400 stroke-[1.5]" />
              <span>Role Clearance</span>
            </div>
            <p className="text-xs font-extrabold text-white">PLATFORM_ADMIN</p>
            <p className="text-[10px] text-neutral-400">Root operational privileges active</p>
          </div>

          {/* Portal Switchers */}
          <div className="grid grid-cols-2 gap-1.5">
            <Link href="/dashboard/crawler">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-[11px] rounded-xl border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              >
                Candidate View
              </Button>
            </Link>
            <Link href="/console/jobs">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-[11px] rounded-xl border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              >
                Recruiter View
              </Button>
            </Link>
          </div>

          {/* Sign Out Action */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-rose-400 stroke-[1.5]" />
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {pageTitle}
                </h1>
              </div>
            </div>
          </div>

          {/* Header Controls: Include Demo Data Toggle + Single Unified Refresh Button */}
          <div className="flex items-center gap-3">
            {/* Include Demo Data Toggle */}
            <label
              htmlFor="include-demo-toggle"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs text-neutral-300 cursor-pointer select-none hover:border-neutral-700 transition-colors"
            >
              <input
                id="include-demo-toggle"
                type="checkbox"
                checked={includeDemo}
                onChange={(e) => setIncludeDemo(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-neutral-700 bg-neutral-800 text-rose-500 focus:ring-0 cursor-pointer"
              />
              <span className="font-medium text-[11px] sm:text-xs">Include demo data</span>
            </label>

            {/* Single Header Refresh Button */}
            <Button
              onClick={triggerRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="h-9 px-3.5 rounded-xl border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white"
            >
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>

            {/* Notifications */}
            <button
              onClick={() => toast.info('System Audit: All platform services operational.')}
              className="relative p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
              aria-label="System notifications"
            >
              <Bell className="h-4 w-4 stroke-[1.5]" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
            </button>

            {/* Admin User Badge */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-neutral-800">
              <Avatar className="h-8 w-8 rounded-full ring-2 ring-rose-500/40">
                <AvatarFallback className="bg-rose-950 text-rose-300 text-xs font-bold">
                  PA
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  David O. Alabi
                </div>
                <div className="text-[10px] text-rose-400 font-medium">
                  PLATFORM_ADMIN
                </div>
              </div>
            </div>
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
            <div className="w-72 bg-[#0e0e12] text-white p-5 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <span className="text-lg font-bold">
                    <span className="text-white">Sync</span>
                    <span className="text-neutral-400">730</span>
                  </span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-neutral-400" aria-label="Close menu">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800"
                    >
                      <item.icon className="h-4 w-4 stroke-[1.5]" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300"
              >
                <LogOut className="h-4 w-4 stroke-[1.5]" />
                <span>Sign out</span>
              </button>
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

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminHeaderProvider>
      <CommandLayoutInner>{children}</CommandLayoutInner>
    </AdminHeaderProvider>
  );
}
