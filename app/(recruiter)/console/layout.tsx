'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Briefcase,
  Users,
  Receipt,
  UserCheck,
  Zap,
  Bell,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
  ExternalLink,
  Shield,
  HelpCircle,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Sliders,
  Mail,
  Phone,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CorporateWorkspace,
  RecruiterRole,
  ConsoleNotification,
  NotificationSettings,
  NotificationType,
} from '@/lib/recruiter/types';
import {
  getLocalWorkspace,
  saveLocalWorkspace,
  DEFAULT_WORKSPACE,
  getLocalNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  getLocalNotificationSettings,
  saveLocalNotificationSettings,
  getLocalAssessments,
  getLocalJobs,
  getLocalMembers,
} from '@/lib/recruiter/store';
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

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<ConsoleNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getLocalNotificationSettings());
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Help & Support Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Inactivity timeout tracking (30 minutes)
  const lastActiveRef = useRef<number>(Date.now());

  // Load and sync notifications
  const reloadNotifications = () => {
    try {
      const notifs = getLocalNotifications(workspace.id);
      setNotifications(notifs);
    } catch {}
  };

  // Sync workspace and server role
  useEffect(() => {
    const ws = getLocalWorkspace();
    if (!ws || !ws.company_name || ws.company_name.trim() === '') {
      setShowOnboardModal(true);
    } else {
      setWorkspace(ws);
    }

    reloadNotifications();
    setNotifSettings(getLocalNotificationSettings());

    // Fetch server-validated workspace and role
    fetch('/api/recruiter/workspace')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.workspace) setWorkspace(data.workspace);
          if (data.role) setActiveRole(data.role as RecruiterRole);
        }
      })
      .catch(() => {});

    const handleUpdate = () => {
      setWorkspace(getLocalWorkspace());
      reloadNotifications();
    };
    window.addEventListener('sync730_workspace_updated', handleUpdate);
    window.addEventListener('sync730_unlocks_updated', handleUpdate);
    window.addEventListener('sync730_notifications_updated', reloadNotifications);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleUpdate);
      window.removeEventListener('sync730_unlocks_updated', handleUpdate);
      window.removeEventListener('sync730_notifications_updated', reloadNotifications);
    };
  }, []);

  // Dismiss dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 30-minute Session Inactivity Auto-Logout
  useEffect(() => {
    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

    const resetTimer = () => {
      lastActiveRef.current = Date.now();
      try {
        localStorage.setItem('sync730_last_recruiter_activity', String(Date.now()));
      } catch {}
    };

    const checkInactivity = async () => {
      let lastActive = lastActiveRef.current;
      try {
        const stored = localStorage.getItem('sync730_last_recruiter_activity');
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > lastActive) {
            lastActive = parsed;
            lastActiveRef.current = parsed;
          }
        }
      } catch {}

      if (Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
        toast.error('Session expired due to 30 minutes of inactivity. Please sign in again.');
        try {
          const supabase = createBrowserClient();
          await supabase.auth.signOut();
        } catch {}
        if (typeof document !== 'undefined') {
          document.cookie = 'sync730-demo-role=; path=/; max-age=0';
        }
        router.push('/login?timeout=true');
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    window.addEventListener('visibilitychange', checkInactivity);

    const interval = setInterval(checkInactivity, 30000);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
      window.removeEventListener('visibilitychange', checkInactivity);
      clearInterval(interval);
    };
  }, [router]);

  // Workspace Onboarding Initializer
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
            'hiring@' + newCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        }),
      });

      const json = await res.json();
      if (json.success && json.workspace) {
        setWorkspace(json.workspace);
        saveLocalWorkspace(json.workspace);
        if (json.role) setActiveRole(json.role);
        setShowOnboardModal(false);
        toast.success(`Welcome ${newCompanyName}! 2 free candidate unlock tokens granted.`);
      } else {
        throw new Error(json.error || 'Failed to initialize workspace');
      }
    } catch {
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
        document.cookie = 'sync730-recruiter-role=; path=/; max-age=0';
      }
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  // Nav Items scoped by role permissions
  const allNavLinks = [
    {
      name: 'Home',
      href: '/console',
      exact: true,
      icon: Home,
      badge: null,
      roles: ['OWNER', 'ADMIN', 'INTERVIEWER'],
    },
    {
      name: 'Hire & Onboard',
      href: '/console/jobs',
      exact: false,
      icon: Briefcase,
      badge: null,
      roles: ['OWNER', 'ADMIN', 'INTERVIEWER'],
    },
    {
      name: 'Vetted Talent',
      href: '/console/talent',
      exact: false,
      icon: Users,
      badge: 'Live',
      roles: ['OWNER', 'ADMIN', 'INTERVIEWER'],
    },
    {
      name: 'Team',
      href: '/console/team',
      exact: false,
      icon: UserCheck,
      badge: null,
      roles: ['OWNER', 'ADMIN', 'INTERVIEWER'],
    },
    {
      name: 'Billing',
      href: '/console/billing',
      exact: false,
      icon: Receipt,
      badge: null,
      roles: ['OWNER', 'ADMIN'],
    },
    {
      name: 'Audit Log',
      href: '/console/audit',
      exact: false,
      icon: Shield,
      badge: null,
      roles: ['OWNER', 'ADMIN'],
    },
  ];

  const navLinks = allNavLinks.filter((item) => item.roles.includes(activeRole));

  // Derive current header title based on pathname
  let pageTitle = 'Dashboard Overview';
  if (pathname.startsWith('/console/jobs')) pageTitle = 'Hire & Job Postings';
  else if (pathname.startsWith('/console/talent')) pageTitle = 'Vetted Talent Pool';
  else if (pathname.startsWith('/console/billing')) pageTitle = 'Billing & Token Ledger';
  else if (pathname.startsWith('/console/team')) pageTitle = 'Team & Permissions';
  else if (pathname.startsWith('/console/audit')) pageTitle = 'Security & Audit Ledger';

  const userInitials = (workspace.company_name || 'HR')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Global Search Calculations
  const sq = globalSearchQuery.trim().toLowerCase();
  const searchResults = {
    candidates: sq
      ? getLocalAssessments()
          .filter(
            (c) =>
              c.candidate_name?.toLowerCase().includes(sq) ||
              c.target_role?.toLowerCase().includes(sq) ||
              c.skills?.some((s) => s.toLowerCase().includes(sq))
          )
          .slice(0, 3)
      : [],
    jobs: sq
      ? getLocalJobs()
          .filter(
            (j) =>
              j.job_title?.toLowerCase().includes(sq) ||
              j.department?.toLowerCase().includes(sq) ||
              j.flowmingo_project_id?.toLowerCase().includes(sq)
          )
          .slice(0, 3)
      : [],
    team: sq
      ? getLocalMembers()
          .filter(
            (m) =>
              m.full_name?.toLowerCase().includes(sq) ||
              m.email?.toLowerCase().includes(sq) ||
              m.role?.toLowerCase().includes(sq)
          )
          .slice(0, 3)
      : [],
  };

  const hasSearchResults =
    sq.length > 0 &&
    (searchResults.candidates.length > 0 ||
      searchResults.jobs.length > 0 ||
      searchResults.team.length > 0);

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = (n: ConsoleNotification) => {
    markNotificationRead(n.id);
    reloadNotifications();
    setIsNotificationsOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(workspace.id);
    reloadNotifications();
    toast.success('All notifications marked as read.');
  };

  const handleClearNotifications = () => {
    clearAllNotifications(workspace.id);
    reloadNotifications();
    toast.success('Notification feed cleared.');
  };

  const handleSaveNotifSettings = () => {
    saveLocalNotificationSettings(notifSettings);
    setIsNotifSettingsOpen(false);
    toast.success('Notification preferences saved.');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0a0a0c] flex">
      {/* Skip to Main Content Link for WCAG Keyboard Navigation */}
      <a
        href="#main-console-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold shadow-lg"
      >
        Skip to main content
      </a>

      {/* Sleek Floating Dark Sidebar - Fixed & Never Scrolls Away */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col justify-between bg-[#0e0e11] text-white border-r border-neutral-900/80 p-5 select-none sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
            <Link href="/console" className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-white rounded-lg">
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                    {activeRole}
                  </span>
                  <span className="text-[10px] text-neutral-400 truncate">
                    {workspace.billing_email || 'hiring@company.com'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2" aria-label="Console navigation">
            {navLinks.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || (item.href !== '/console' && pathname.startsWith(item.href));

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-white ${
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
                    <span
                      title="Real-time sync to Flowmingo AI screening engine active"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-help"
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
        <div className="space-y-3 pt-6 border-t border-neutral-900">
          {/* Token Balance Pill - Role Guarded */}
          {activeRole === 'INTERVIEWER' ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400 stroke-[1.5]" />
                <span className="text-xs font-bold">{workspace.token_balance} Tokens</span>
              </div>
              <span className="text-[10px] font-medium text-amber-400/80">
                Ask an admin to top up
              </span>
            </div>
          ) : (
            <Link
              href="/console/billing"
              className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition-all focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400 stroke-[1.5]" />
                <span className="text-xs font-bold">{workspace.token_balance} Tokens</span>
              </div>
              <span className="text-[10px] uppercase font-semibold text-amber-400/90 underline">
                Top Up
              </span>
            </Link>
          )}

          {/* Help & Support Button */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-white"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-4 w-4 stroke-[1.5] text-neutral-400" />
              <span>Help & Support</span>
            </div>
            <span className="text-[10px] text-neutral-500">FAQ & Contact</span>
          </button>

          {/* Log Out Button */}
          <button
            onClick={handleSignOut}
            aria-label="Sign out of workspace"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-white"
          >
            <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#f8f9fc]/95 dark:bg-[#0a0a0c]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation drawer"
              className="lg:hidden p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Central Global Search Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block max-w-md w-full mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
              <Input
                aria-label="Global search across candidates, jobs, and team"
                value={globalSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchFocused(false);
                }}
                placeholder="Search candidates, roles, skills, or squad..."
                className="pl-9 h-9 text-xs rounded-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xs focus-visible:ring-2 focus-visible:ring-neutral-900"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Global Search Autocomplete Dropdown */}
            {isSearchFocused && sq.length > 0 && (
              <div className="absolute top-11 left-0 right-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-3 z-50 text-xs space-y-3">
                {!hasSearchResults ? (
                  <div className="p-4 text-center text-neutral-500">
                    No candidates, jobs, or team members match "{globalSearchQuery}".
                  </div>
                ) : (
                  <>
                    {/* Candidates Results */}
                    {searchResults.candidates.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-2">
                          Vetted Candidates
                        </div>
                        {searchResults.candidates.map((cand) => (
                          <button
                            key={cand.id}
                            onClick={() => {
                              setIsSearchFocused(false);
                              router.push(`/console/talent?search=${encodeURIComponent(cand.candidate_name || '')}`);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-white">
                                {cand.candidate_name}
                              </div>
                              <div className="text-[11px] text-neutral-500 truncate">
                                {cand.target_role} · {cand.overall_match_score}% Match
                              </div>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Jobs Results */}
                    {searchResults.jobs.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-2">
                          Job Openings
                        </div>
                        {searchResults.jobs.map((job) => (
                          <button
                            key={job.id}
                            onClick={() => {
                              setIsSearchFocused(false);
                              router.push(`/console/jobs/${job.id}/pipeline`);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-white">
                                {job.job_title}
                              </div>
                              <div className="text-[11px] text-neutral-500">
                                {job.department || 'Engineering'} · Status: {job.status}
                              </div>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Team Members Results */}
                    {searchResults.team.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-2">
                          Team Squad
                        </div>
                        {searchResults.team.map((mem) => (
                          <button
                            key={mem.id}
                            onClick={() => {
                              setIsSearchFocused(false);
                              router.push('/console/team');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-white">
                                {mem.full_name || mem.email}
                              </div>
                              <div className="text-[11px] text-neutral-500">
                                {mem.email} · Role: {mem.role}
                              </div>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons & User Pill */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Interactive Notification Bell */}
            <div ref={notifDropdownRef} className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label={`View notifications (${unreadNotifCount} unread)`}
                className="relative p-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <Bell className="h-4 w-4 stroke-[1.5]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-neutral-950">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 z-50 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        Notifications
                      </span>
                      {unreadNotifCount > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                          {unreadNotifCount} new
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          setIsNotifSettingsOpen(true);
                        }}
                        aria-label="Notification channels and delivery settings"
                        className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Notification Settings"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-neutral-400">
                        <Bell className="h-6 w-6 text-neutral-300 mx-auto mb-1.5 opacity-50" />
                        <span>No alerts right now.</span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`py-2.5 px-1.5 rounded-xl transition-colors cursor-pointer flex items-start gap-2.5 ${
                            n.is_read
                              ? 'opacity-70 hover:opacity-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                              : 'bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'NEW_VETTED_CANDIDATE' && (
                              <Users className="h-4 w-4 text-emerald-600" />
                            )}
                            {n.type === 'VIDEO_AWAITING_REVIEW' && (
                              <Clock className="h-4 w-4 text-blue-600" />
                            )}
                            {n.type === 'PAYMENT_CONFIRMED' && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            )}
                            {n.type === 'LOW_TOKENS' && (
                              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                            {n.type === 'TEAMMATE_COMMENT' && (
                              <Check className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                              <span className="truncate">{n.title}</span>
                              {!n.is_read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 ml-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-0.5">
                              {n.description}
                            </p>
                            <span className="text-[10px] text-neutral-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[11px]">
                      <button
                        onClick={handleClearNotifications}
                        className="text-neutral-400 hover:text-rose-600 flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear all</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          setIsNotifSettingsOpen(true);
                        }}
                        className="text-neutral-600 dark:text-neutral-400 hover:underline"
                      >
                        Channel preferences
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Team / Workspace Settings Gear */}
            {activeRole !== 'INTERVIEWER' && (
              <Link
                href="/console/team"
                aria-label="Workspace team and role permissions"
                className="p-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <Settings className="h-4 w-4 stroke-[1.5]" />
              </Link>
            )}

            {/* User Avatar Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800">
              <Avatar className="h-8 w-8 rounded-full ring-2 ring-neutral-200/70 dark:ring-neutral-800">
                <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {workspace.company_name || 'Hiring Lead'}
                </div>
                <div className="text-[10px] text-neutral-500 font-medium">
                  {activeRole}
                </div>
              </div>
            </div>

            {/* Preview as Candidate Button */}
            <a
              href="/dashboard/crawler?preview=true"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 rounded-full border-neutral-200 dark:border-neutral-800 font-semibold gap-1.5 shadow-2xs hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-900"
                title="Preview candidate job board in a new tab (read-only)"
              >
                <span>Candidate View</span>
                <ExternalLink className="h-3 w-3 stroke-[1.5]" />
              </Button>
            </a>
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
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation drawer"
                    className="text-neutral-400 p-1"
                  >
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
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsHelpModalOpen(true);
                    }}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 text-left"
                  >
                    <HelpCircle className="h-4 w-4 stroke-[1.5]" />
                    <span>Help & Support</span>
                  </button>
                  <a
                    href="/dashboard/crawler?preview=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-300 hover:bg-neutral-800"
                  >
                    <ExternalLink className="h-4 w-4 stroke-[1.5]" />
                    <span>Candidate View</span>
                  </a>
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
        <main id="main-console-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <div data-active-role={activeRole}>{children}</div>
        </main>
      </div>

      {/* DIALOG 1: Notification Channel Preferences Modal */}
      <Dialog open={isNotifSettingsOpen} onOpenChange={setIsNotifSettingsOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
              Notification Channel Preferences
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Configure how you receive recruitment alerts across in-app, email, and WhatsApp channels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                    <th className="py-2 px-1">Alert Event</th>
                    <th className="py-2 text-center">In-App</th>
                    <th className="py-2 text-center">Email</th>
                    <th className="py-2 text-center">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {(
                    [
                      { key: 'NEW_VETTED_CANDIDATE', label: 'New Vetted Candidate Matches' },
                      { key: 'VIDEO_AWAITING_REVIEW', label: 'Candidate Video Submitted' },
                      { key: 'PAYMENT_CONFIRMED', label: 'Token Payment Confirmed' },
                      { key: 'LOW_TOKENS', label: 'Low Tokens Balance (< 2)' },
                      { key: 'TEAMMATE_COMMENT', label: 'Teammate Scorecards & Notes' },
                    ] as const
                  ).map((item) => (
                    <tr key={item.key}>
                      <td className="py-2.5 px-1 font-medium text-neutral-800 dark:text-neutral-200">
                        {item.label}
                      </td>
                      <td className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={notifSettings.in_app[item.key]}
                          onChange={(e) =>
                            setNotifSettings({
                              ...notifSettings,
                              in_app: { ...notifSettings.in_app, [item.key]: e.target.checked },
                            })
                          }
                          className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={notifSettings.email[item.key]}
                          onChange={(e) =>
                            setNotifSettings({
                              ...notifSettings,
                              email: { ...notifSettings.email, [item.key]: e.target.checked },
                            })
                          }
                          className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={notifSettings.whatsapp[item.key]}
                          onChange={(e) =>
                            setNotifSettings({
                              ...notifSettings,
                              whatsapp: { ...notifSettings.whatsapp, [item.key]: e.target.checked },
                            })
                          }
                          className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNotifSettingsOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNotifSettings}
                className="h-8 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                Save Preferences
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Help & Support Modal */}
      <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
        <DialogContent className="max-w-lg p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              <span>Sync730 Recruiter Support & FAQs</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Assistance with token billing, candidate video screening, and team roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                <p className="font-bold text-neutral-900 dark:text-white">
                  How do candidate tokens work?
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  1 token unlocks 1 pre-vetted candidate profile permanently for your company. You receive their full real name, email, verified phone, and portfolio. If a candidate is unreachable, 1 replacement token is refunded upon review.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                <p className="font-bold text-neutral-900 dark:text-white">
                  How does the candidate match score work?
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Match scores compare candidate skills, seniority level, and location against your role. AI scores are strictly advisory guidance—human video review is mandatory before deciding.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                <p className="font-bold text-neutral-900 dark:text-white">
                  Need direct assistance?
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Contact our dedicated enterprise hiring desk anytime at{' '}
                  <a href="mailto:support@sync730.com" className="font-bold text-blue-600 underline">
                    support@sync730.com
                  </a>
                  . We typically respond within 2 hours during business hours.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-500 text-[11px]">
              <Link
                href="/scoring-methodology"
                onClick={() => setIsHelpModalOpen(false)}
                className="hover:underline flex items-center gap-1"
              >
                <span>Scoring Methodology</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/data-processing"
                onClick={() => setIsHelpModalOpen(false)}
                className="hover:underline flex items-center gap-1"
              >
                <span>Sub-processors & NDPA</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
