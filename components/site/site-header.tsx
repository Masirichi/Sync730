// components/site/site-header.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  User,
  LayoutDashboard,
  LogOut,
  Columns3,
  ChevronDown,
  Users2,
  Video,
  MessageSquare,
  FileText,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  DollarSign,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';
import { BookDemoModal } from '@/components/modals/book-demo-modal';
import { SyncFlowDrawer } from '@/components/syncflow/syncflow-drawer';
import { trackEvent } from '@/lib/analytics';
import { createBrowserClient } from '@/lib/supabase/client';
import { getLocalTrackerItems } from '@/lib/tracker';
import { homeCopy } from '@/content/home';
import { cn } from '@/lib/utils';

export interface SiteHeaderProps {
  ctaMode?: 'profile' | 'demo';
  isNavVisible?: boolean;
  compact?: boolean;
}

const PRODUCT_SUB_LINKS = [
  {
    label: 'AI Talent Marketplace',
    description: 'Reach out to vetted African engineers in real time',
    href: '/products#sourcing',
    icon: Users2,
  },
  {
    label: 'AI Video Interviewer',
    description: 'Calibrated 20-min STAR interviews with automated scoring',
    href: '/products#interview',
    icon: Video,
  },
  {
    label: 'SyncFlow ATS Pipeline',
    description: 'Track applications, candidate stages, and offers in one board',
    href: '/products#syncflow',
    icon: Columns3,
  },
  {
    label: 'Direct Recruiter Chat',
    description: 'Real-time candidate messaging and offer discussions',
    href: '/products#chat',
    icon: MessageSquare,
  },
  {
    label: 'Resume Studio',
    description: 'AI resume analysis, GitHub scoring, and stack audit',
    href: '/dashboard/resume',
    icon: FileText,
  },
  {
    label: 'View All Products',
    description: 'Full-cycle autonomous technical recruitment engine',
    href: '/products',
    icon: ArrowRight,
  },
];

const RESOURCE_SUB_LINKS = [
  {
    label: 'Employer Guide',
    description: 'Framework for hiring and onboarding remote African tech talent',
    href: '/employer-guide',
    icon: BookOpen,
  },
  {
    label: 'Scoring Methodology',
    description: 'STAR rubric evaluation and technical assessment benchmarks',
    href: '/scoring-methodology',
    icon: ShieldCheck,
  },
  {
    label: 'Compensation & Pricing',
    description: 'Salary benchmarks across Nigeria, Kenya, Ghana & South Africa',
    href: '/hiring#pricing',
    icon: DollarSign,
  },
  {
    label: 'Candidate Interview Prep',
    description: 'Interactive AI coaching and mock technical questions',
    href: '/dashboard/prep',
    icon: Sparkles,
  },
];

function getInitials(nameOrEmail?: string): string {
  if (!nameOrEmail) return 'U';
  const clean = nameOrEmail.split('@')[0].trim();
  const parts = clean.split(/[._\s-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function SiteHeader({ ctaMode = 'profile', isNavVisible: propIsNavVisible, compact = false }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [internalNavVisible, setInternalNavVisible] = useState(true);

  // Nav Dropdowns
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  const productsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resourcesTimerRef = useRef<NodeJS.Timeout | null>(null);

  // User auth state & real saved jobs count
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    role?: string;
  } | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [totalSyncFlowCount, setTotalSyncFlowCount] = useState<number>(0);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);

  // Auto-hide navigation on scroll down, return on scroll up (when not controlled by parent)
  useEffect(() => {
    if (propIsNavVisible !== undefined) return;

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 70) {
        setInternalNavVisible(false);
        setProductsOpen(false);
        setResourcesOpen(false);
      } else if (currentScrollY < lastScrollY) {
        setInternalNavVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [propIsNavVisible]);

  const effectiveNavVisible = propIsNavVisible !== undefined ? propIsNavVisible : internalNavVisible;

  useEffect(() => {
    // Check Super Admin cookie or email for Ajah Malachy
    if (typeof document !== 'undefined') {
      const isSuperAdminCookie =
        document.cookie.includes('sync730-demo-role=platform_admin') ||
        document.cookie.includes('ajahmalachy@gmail.com') ||
        document.cookie.includes('sync730_admin_role=super_admin');

      if (isSuperAdminCookie) {
        setUser({
          id: 'usr-admin-super-ajah',
          email: 'ajahmalachy@gmail.com',
          name: 'Ajah Malachy',
          role: 'super_admin',
        });
      }
    }

    // 1. Check Supabase auth session
    try {
      const supabase = createBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const isSuperAdmin = data.user.email?.toLowerCase() === 'ajahmalachy@gmail.com';
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: isSuperAdmin
              ? 'Ajah Malachy'
              : (data.user.user_metadata?.full_name as string) || (data.user.email?.split('@')[0] as string),
            avatar: data.user.user_metadata?.avatar_url as string,
            role: isSuperAdmin ? 'super_admin' : (data.user.user_metadata?.role as string),
          });
        }
      });
    } catch {}

    // 2. Check real counts from candidate tracker (SyncFlow)
    const updateSavedCount = () => {
      try {
        const items = getLocalTrackerItems();
        setTotalSyncFlowCount(items.length);
        const count = items.filter((i) => i.status === 'SAVED').length;
        setSavedCount(count);
      } catch {}
    };

    updateSavedCount();
    window.addEventListener('sync730_tracker_updated', updateSavedCount);
    return () => window.removeEventListener('sync730_tracker_updated', updateSavedCount);
  }, []);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setProductsOpen(false);
        setResourcesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route changes
  useEffect(() => {
    setProductsOpen(false);
    setResourcesOpen(false);
    setOpen(false);
  }, [pathname]);

  // Navigation: Find Work · Products · Solutions · Hiring · Resources
  const links = homeCopy.nav.links;

  const isLinkActive = (href: string) => {
    if (href === '/find-work') {
      return pathname === '/find-work' || (pathname ? pathname.startsWith('/jobs') : false);
    }
    if (href.startsWith('/#')) {
      return false;
    }
    return pathname === href || (pathname ? pathname.startsWith(href) : false);
  };

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setAvatarMenuOpen(false);
    router.refresh();
  };

  const handleProductsEnter = () => {
    if (productsTimerRef.current) clearTimeout(productsTimerRef.current);
    if (resourcesTimerRef.current) clearTimeout(resourcesTimerRef.current);
    setResourcesOpen(false);
    setProductsOpen(true);
  };

  const handleProductsLeave = () => {
    productsTimerRef.current = setTimeout(() => {
      setProductsOpen(false);
    }, 180);
  };

  const handleResourcesEnter = () => {
    if (resourcesTimerRef.current) clearTimeout(resourcesTimerRef.current);
    if (productsTimerRef.current) clearTimeout(productsTimerRef.current);
    setProductsOpen(false);
    setResourcesOpen(true);
  };

  const handleResourcesLeave = () => {
    resourcesTimerRef.current = setTimeout(() => {
      setResourcesOpen(false);
    }, 180);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur-md transition-transform duration-200",
          !effectiveNavVisible && "-translate-y-full"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10 transition-all",
            compact ? "h-16" : "h-16 sm:h-[76px]"
          )}
        >
          {/* Left: Wordmark and logo mark */}
          <BrandLogo />

          {/* Center: Desktop Navigation links with CoreShift dropdown menus */}
          <nav
            ref={navContainerRef}
            className="hidden items-center gap-7 md:flex"
            aria-label="Primary navigation"
          >
            {links.map((link) => {
              const active = isLinkActive(link.href);

              // 1. PRODUCTS DROPDOWN
              if (link.label === 'Products') {
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={handleProductsEnter}
                    onMouseLeave={handleProductsLeave}
                  >
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        // Allow clicking to go to /products or toggle dropdown
                      }}
                      aria-expanded={productsOpen}
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded px-2 py-1",
                        active || productsOpen
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200 opacity-70",
                          productsOpen && "rotate-180 opacity-100 text-orange-500"
                        )}
                      />
                    </Link>

                    {/* Products Popover Menu */}
                    {productsOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[460px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/10 z-50 text-foreground animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="grid grid-cols-1 gap-1">
                          {PRODUCT_SUB_LINKS.map((sub) => {
                            const IconComponent = sub.icon;
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                onClick={() => setProductsOpen(false)}
                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-secondary/70 hover:border hover:border-orange-500/20"
                              >
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground group-hover:border-orange-500/30 group-hover:text-orange-500 group-hover:shadow-xs transition-colors">
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-foreground group-hover:text-orange-500 transition-colors">
                                      {sub.label}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-1">
                                    {sub.description}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // 2. RESOURCES DROPDOWN
              if (link.label === 'Resources') {
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={handleResourcesEnter}
                    onMouseLeave={handleResourcesLeave}
                  >
                    <Link
                      href={link.href}
                      aria-expanded={resourcesOpen}
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded px-2 py-1",
                        active || resourcesOpen
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200 opacity-70",
                          resourcesOpen && "rotate-180 opacity-100 text-orange-500"
                        )}
                      />
                    </Link>

                    {/* Resources Popover Menu */}
                    {resourcesOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[420px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/10 z-50 text-foreground animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="grid grid-cols-1 gap-1">
                          {RESOURCE_SUB_LINKS.map((sub) => {
                            const IconComponent = sub.icon;
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                onClick={() => setResourcesOpen(false)}
                                className="group flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-secondary/70 hover:border hover:border-orange-500/20"
                              >
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground group-hover:border-orange-500/30 group-hover:text-orange-500 group-hover:shadow-xs transition-colors">
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-foreground group-hover:text-orange-500 transition-colors">
                                      {sub.label}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-1">
                                    {sub.description}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // 3. STANDARD LINKS (Find Work · Solutions · Hiring)
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded px-2 py-1",
                    active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Sign in · Primary Brand Orange Free Trial Button */}
          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              // LOGGED IN STATE
              <div className="flex items-center gap-4">
                <div className="relative" ref={avatarMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 overflow-hidden"
                    aria-label="User account menu"
                    aria-expanded={avatarMenuOpen}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || 'User'} className="h-full w-full object-cover" />
                    ) : (
                      <span>{getInitials(user.name || user.email)}</span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {avatarMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-background p-1.5 shadow-lg z-50 text-foreground animate-in fade-in slide-in-from-top-1">
                      <div className="px-3 py-2 border-b border-border text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold truncate">{user.name || 'Candidate'}</p>
                          {(user.role === 'super_admin' || user.email?.toLowerCase() === 'ajahmalachy@gmail.com') && (
                            <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 whitespace-nowrap">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        {(user.role === 'super_admin' || user.email?.toLowerCase() === 'ajahmalachy@gmail.com') && (
                          <>
                            <Link
                              href="/command/metrics"
                              onClick={() => setAvatarMenuOpen(false)}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
                            >
                              <ShieldCheck className="h-4 w-4 stroke-[1.5] text-orange-500" />
                              <span>Admin Command Center</span>
                            </Link>
                            <Link
                              href="/console/syncflow"
                              onClick={() => setAvatarMenuOpen(false)}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                            >
                              <Briefcase className="h-4 w-4 stroke-[1.5] text-amber-500" />
                              <span>Recruiter Console & SyncFlow</span>
                            </Link>
                          </>
                        )}
                        <Link
                          href="/candidate"
                          onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 stroke-[1.5]" />
                          <span>Candidate Dashboard</span>
                        </Link>
                        <Link
                          href="/dashboard/syncflow"
                          onClick={() => setAvatarMenuOpen(false)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Columns3 className="h-4 w-4 stroke-[1.5]" />
                            <span>SyncFlow Pipeline</span>
                          </div>
                          {totalSyncFlowCount > 0 && (
                            <span className="text-[10px] rounded-full bg-secondary px-1.5 py-0.5 font-semibold tabular-nums">
                              {totalSyncFlowCount}
                            </span>
                          )}
                        </Link>
                      </div>

                      <div className="border-t border-border pt-1">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="h-4 w-4 stroke-[1.5]" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // LOGGED OUT STATE
              <div className="flex items-center gap-4">
                <Link
                  href={homeCopy.nav.signInHref}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded px-2 py-1"
                >
                  {homeCopy.nav.signInLabel}
                </Link>

                {/* Free Trial Button */}
                <Link
                  href={homeCopy.nav.createProfileHref}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  {homeCopy.nav.createProfileLabel}
                </Link>
              </div>
            )}
          </div>

          {/* Under 860px / Mobile Menu Button (44x44) */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2.5 md:hidden text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground min-h-[44px] min-w-[44px] h-11 w-11"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close main menu' : 'Open main menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6 stroke-[1.5]" /> : <Menu className="h-6 w-6 stroke-[1.5]" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer with Dropdown Accordions */}
        <div className={cn('md:hidden border-t border-border/70 bg-background max-h-[calc(100vh-64px)] overflow-y-auto', open ? 'block' : 'hidden')}>
          <div className="space-y-1 px-5 py-4">
            {links.map((link) => {
              const active = isLinkActive(link.href);

              // Mobile Products Accordion
              if (link.label === 'Products') {
                return (
                  <div key={link.label} className="border-b border-border/40 py-1">
                    <button
                      type="button"
                      onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                      className="flex w-full items-center justify-between py-2 text-base font-medium text-foreground"
                    >
                      <span>Products</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform text-muted-foreground",
                          mobileProductsOpen && "rotate-180 text-orange-500"
                        )}
                      />
                    </button>
                    {mobileProductsOpen && (
                      <div className="pl-3 pb-2 space-y-2 pt-1">
                        {PRODUCT_SUB_LINKS.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={() => setOpen(false)}
                            className="block py-1.5 text-sm text-muted-foreground hover:text-foreground font-medium"
                          >
                            <span className="block text-foreground text-xs font-semibold">{sub.label}</span>
                            <span className="block text-[11px] text-muted-foreground">{sub.description}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Mobile Resources Accordion
              if (link.label === 'Resources') {
                return (
                  <div key={link.label} className="border-b border-border/40 py-1">
                    <button
                      type="button"
                      onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                      className="flex w-full items-center justify-between py-2 text-base font-medium text-foreground"
                    >
                      <span>Resources</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform text-muted-foreground",
                          mobileResourcesOpen && "rotate-180 text-orange-500"
                        )}
                      />
                    </button>
                    {mobileResourcesOpen && (
                      <div className="pl-3 pb-2 space-y-2 pt-1">
                        {RESOURCE_SUB_LINKS.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={() => setOpen(false)}
                            className="block py-1.5 text-sm text-muted-foreground hover:text-foreground font-medium"
                          >
                            <span className="block text-foreground text-xs font-semibold">{sub.label}</span>
                            <span className="block text-[11px] text-muted-foreground">{sub.description}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    "block py-2.5 text-base font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
                    active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="flex flex-col gap-2.5 pt-4 border-t border-border/70">
              {user ? (
                <>
                  <Link
                    href="/candidate"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Candidate Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleSignOut();
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={homeCopy.nav.signInHref}
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  >
                    {homeCopy.nav.signInLabel}
                  </Link>
                  <Link
                    href={homeCopy.nav.createProfileHref}
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-4 text-sm font-semibold text-white shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    {homeCopy.nav.createProfileLabel}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global SyncFlow Slide-Over Drawer */}
      <SyncFlowDrawer />

      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </>
  );
}
