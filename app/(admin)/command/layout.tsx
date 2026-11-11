'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  CreditCard,
  ShieldAlert,
  Users,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Menu,
  X,
  ExternalLink,
  Bell,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      icon: Activity,
      badge: 'Live',
    },
    {
      name: 'Financial & Tokens',
      href: '/command/finance',
      icon: CreditCard,
      badge: null,
    },
    {
      name: 'Anti-Cheat & Vetting',
      href: '/command/vetting',
      icon: ShieldAlert,
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
  if (pathname.startsWith('/command/finance')) pageTitle = 'Financial & Token Management';
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
            <Cpu className="h-4 w-4 text-neutral-500 stroke-[1.5]" />
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

          {/* Log Out Pill */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Terminate Admin Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-rose-400 stroke-[1.5]" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {pageTitle}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Admin Profile & Notifications */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.info('System Audit: All health checks green.')}
              className="relative p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            >
              <Bell className="h-4 w-4 stroke-[1.5]" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
            </button>

            {/* Admin User Badge */}
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-neutral-800">
              <Avatar className="h-9 w-9 rounded-full ring-2 ring-rose-500/40">
                <AvatarFallback className="bg-rose-950 text-rose-300 text-xs font-bold">
                  PA
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  David O. Alabi
                </div>
                <div className="text-[11px] text-rose-400 font-medium">
                  PLATFORM_ADMIN
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex">
            <div className="w-72 bg-[#0e0e12] text-white p-5 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <span className="text-lg font-bold">
                    <span className="text-white">Sync</span>
                    <span className="text-neutral-400">730</span>
                  </span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-neutral-400">
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
                <span>Log Out</span>
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
