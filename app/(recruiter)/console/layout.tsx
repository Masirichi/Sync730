'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Briefcase,
  Users,
  CreditCard,
  UserCheck,
  Zap,
  Bell,
  Settings,
  ChevronRight,
  LogOut,
  Sparkles,
  Building2,
  Menu,
  X,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CorporateWorkspace, RecruiterRole } from '@/lib/recruiter/types';
import {
  getLocalWorkspace,
  saveLocalWorkspace,
  DEFAULT_WORKSPACE,
} from '@/lib/recruiter/store';
import { BrandLogo } from '@/components/site/brand-logo';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase/client';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(DEFAULT_WORKSPACE);
  const [activeRole, setActiveRole] = useState<RecruiterRole>('OWNER');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newBillingEmail, setNewBillingEmail] = useState('');
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync workspace from store & server
  useEffect(() => {
    const ws = getLocalWorkspace();
    if (!ws || !ws.company_name || ws.company_name.trim() === '') {
      setShowOnboardModal(true);
    } else {
      setWorkspace(ws);
    }

    const handleUpdate = () => {
      setWorkspace(getLocalWorkspace());
    };
    window.addEventListener('sync730_workspace_updated', handleUpdate);
    window.addEventListener('sync730_unlocks_updated', handleUpdate);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleUpdate);
      window.removeEventListener('sync730_unlocks_updated', handleUpdate);
    };
  }, []);

  // 1-Step Onboarding Workspace Initializer
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      toast.error('Please enter your company name.');
      return;
    }

    setIsOnboardingLoading(true);
    try {
      const res = await fetch('/api/recruiter/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: newCompanyName.trim(),
          billing_email:
            newBillingEmail.trim() ||
            'hiring@' +
              newCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') +
              '.com',
          token_balance: 2,
        }),
      });

      const json = await res.json();
      if (json.success && json.workspace) {
        setWorkspace(json.workspace);
        saveLocalWorkspace(json.workspace);
        setShowOnboardModal(false);
        toast.success(`Welcome ${newCompanyName}! 2 free candidate unlock tokens granted.`);
      } else {
        throw new Error(json.error || 'Failed to initialize workspace');
      }
    } catch (err: any) {
      console.warn('Workspace initialization fallback:', err);
      const fallbackWs: CorporateWorkspace = {
        id: `ws-${Date.now().toString(36)}`,
        company_name: newCompanyName.trim(),
        billing_email: newBillingEmail.trim() || 'recruiting@company.com',
        token_balance: 2,
        created_at: new Date().toISOString(),
      };
      setWorkspace(fallbackWs);
      saveLocalWorkspace(fallbackWs);
      setShowOnboardModal(false);
      toast.success(`Workspace activated with 2 trial unlock tokens.`);
    } finally {
      setIsOnboardingLoading(false);
    }
  };

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

  // Nav Items borrowed from HireHR design logic
  const navLinks = [
    {
      name: 'Home',
      href: '/console',
      exact: true,
      icon: Home,
      badge: null,
    },
    {
      name: 'Hire & Onboard',
      href: '/console/jobs',
      exact: false,
      icon: Briefcase,
      badge: null,
    },
    {
      name: 'Vetted Talent',
      href: '/console/talent',
      exact: false,
      icon: Users,
      badge: 'Live',
    },
    {
      name: 'Team',
      href: '/console/team',
      exact: false,
      icon: UserCheck,
      badge: null,
    },
    {
      name: 'Payroll & Tokens',
      href: '/console/team#tokens',
      exact: false,
      icon: CreditCard,
      badge: null,
    },
  ];

  // Derive current header title based on pathname
  let pageTitle = 'Dashboard Overview';
  if (pathname.startsWith('/console/jobs')) pageTitle = 'Hire & Job Postings';
  else if (pathname.startsWith('/console/talent')) pageTitle = 'Vetted Talent Pool';
  else if (pathname.startsWith('/console/team')) pageTitle = 'Team & Token Billing';

  const userInitials = (workspace.company_name || 'HR')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0a0a0c] flex">
      {/* Sleek Floating Dark Sidebar - HireHR Design Logic */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col justify-between bg-[#0e0e11] text-white border-r border-neutral-900/80 p-5 select-none">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
            <Link href="/console" className="flex items-center gap-2.5">
              <span className="text-xl tracking-tight">
                <span className="font-extrabold text-white">Sync</span>
                <span className="font-semibold text-neutral-400">730</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                Console
              </span>
            </Link>
          </div>

          {/* Current Workspace Pill */}
          <div className="px-3.5 py-3 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-neutral-800 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-neutral-700">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {workspace.company_name || 'My Company'}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  {workspace.billing_email || 'hiring@company.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navLinks.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || (item.href !== '/console' && pathname.startsWith(item.href));

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-neutral-800/95 text-white shadow-xs border border-neutral-700/60'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 stroke-[1.5] shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer (HireHR Style) */}
        <div className="space-y-4 pt-6 border-t border-neutral-900">
          {/* Token Balance Pill */}
          <Link
            href="/console/team"
            className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition-all"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400 stroke-[1.5]" />
              <span className="text-xs font-bold">{workspace.token_balance} Tokens</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-amber-400/90 underline">
              Top Up
            </span>
          </Link>

          {/* Role Switcher Pill for Testing */}
          <div className="bg-neutral-900/90 border border-neutral-800/80 rounded-2xl p-1.5">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[10px] text-neutral-400 font-semibold">Demo Role:</span>
              <span className="text-[10px] font-bold text-white">{activeRole}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['OWNER', 'ADMIN', 'INTERVIEWER'] as RecruiterRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setActiveRole(r);
                    toast.info(`Switched console demo role to ${r}`);
                  }}
                  className={`py-1 text-[10px] rounded-lg font-bold transition-all ${
                    activeRole === r
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Log Out Pill */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar - HireHR Design Logic */}
        <header className="sticky top-0 z-30 bg-[#f8f9fc]/95 dark:bg-[#0a0a0c]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right Action Icons & Daniel Cohen Style Profile Pill */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => toast.info('No new notifications')}
              className="relative p-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-2xs"
            >
              <Bell className="h-4 w-4 stroke-[1.5]" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-neutral-950" />
            </button>

            {/* Settings Gear */}
            <Link
              href="/console/team"
              className="p-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-2xs"
            >
              <Settings className="h-4 w-4 stroke-[1.5]" />
            </Link>

            {/* Daniel Cohen User Pill */}
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-neutral-200 dark:border-neutral-800">
              <Avatar className="h-9 w-9 rounded-full ring-2 ring-neutral-200/70 dark:ring-neutral-800">
                <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                  {workspace.company_name || 'Hiring Lead'}
                </div>
                <div className="text-[11px] text-neutral-400 font-medium">
                  {workspace.billing_email || 'New York, USA'}
                </div>
              </div>
            </div>

            {/* Candidate Portal Link */}
            <Link href="/dashboard/crawler" className="hidden md:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 rounded-full border-neutral-200 dark:border-neutral-800 font-semibold gap-1.5 ml-2 shadow-2xs"
              >
                <span>Candidate View</span>
                <ChevronRight className="h-3 w-3 stroke-[1.5]" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
            <div className="w-72 bg-[#0e0e11] text-white p-5 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
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
          <div data-active-role={activeRole}>{children}</div>
        </main>
      </div>

      {/* 1-Step Onboarding Modal Fallback */}
      <Dialog open={showOnboardModal} onOpenChange={setShowOnboardModal}>
        <DialogContent className="max-w-md p-6 rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5 stroke-[1.5]" />
            </div>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
              Initialize Your Employer Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Welcome to the Sync730 Recruiter Console! Name your company workspace to receive your 2 free candidate unlock tokens immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteOnboarding} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Company / Agency Name *
              </label>
              <Input
                required
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g. Fintech Global Ventures"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Hiring / Billing Email
              </label>
              <Input
                type="email"
                value={newBillingEmail}
                onChange={(e) => setNewBillingEmail(e.target.value)}
                placeholder="hiring@fintechglobal.co"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
              <span>
                You will immediately receive <strong>2 free trial tokens</strong> to unlock candidate profiles.
              </span>
            </div>

            <Button
              type="submit"
              disabled={isOnboardingLoading}
              className="w-full h-10 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs rounded-2xl shadow-xs"
            >
              {isOnboardingLoading ? 'Activating Workspace...' : 'Activate Workspace (2 Tokens)'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
