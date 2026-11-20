// components/site/site-header.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Bookmark, User, LayoutDashboard, LogOut, Columns3 } from 'lucide-react';
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

  // User auth state & real saved jobs count
  const [user, setUser] = useState<{ id: string; email?: string; name?: string; avatar?: string } | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [totalSyncFlowCount, setTotalSyncFlowCount] = useState<number>(0);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Auto-hide navigation on scroll down, return on scroll up (when not controlled by parent)
  useEffect(() => {
    if (propIsNavVisible !== undefined) return;

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 70) {
        setInternalNavVisible(false);
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
    // 1. Check Supabase auth session
    try {
      const supabase = createBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: (data.user.user_metadata?.full_name as string) || (data.user.email?.split('@')[0] as string),
            avatar: data.user.user_metadata?.avatar_url as string,
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
    }
    if (avatarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [avatarMenuOpen]);

  // Navigation: Find Work · Products · Solutions · Hiring
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

  const handleOpenDemo = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'header' });
    setDemoOpen(true);
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

  const handleOpenSyncFlow = () => {
    window.dispatchEvent(new CustomEvent('sync730_open_syncflow'));
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

          {/* Center: Desktop Navigation links with active state */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
            {links.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded px-1.5 py-1",
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

          {/* Right: SyncFlow (Columns3 + count badge) · Sign in · Primary button */}
          <div className="hidden items-center gap-4 md:flex">
            {/* SyncFlow button with Columns3 icon and count badge */}
            <button
              type="button"
              onClick={handleOpenSyncFlow}
              aria-label={`Open SyncFlow pipeline (${totalSyncFlowCount} roles)`}
              title="Open SyncFlow pipeline"
              className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              <Columns3 className="h-4 w-4 stroke-[1.5]" />
              <span>{homeCopy.nav.syncFlowLabel}</span>
              {totalSyncFlowCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background tabular-nums">
                  {totalSyncFlowCount}
                </span>
              )}
            </button>

            {user ? (
              // LOGGED IN STATE
              <div className="flex items-center gap-4">
                {/* Avatar menu with user's uploaded photo or initials (NO stock photos) */}
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
                        <p className="font-semibold truncate">{user.name || 'Candidate'}</p>
                        <p className="text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/candidate"
                          onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 stroke-[1.5]" />
                          <span>Candidate Dashboard</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarMenuOpen(false);
                            handleOpenSyncFlow();
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Columns3 className="h-4 w-4 stroke-[1.5]" />
                            <span>SyncFlow</span>
                          </div>
                          {totalSyncFlowCount > 0 && (
                            <span className="text-[10px] rounded-full bg-secondary px-1.5 py-0.5 font-semibold tabular-nums">
                              {totalSyncFlowCount}
                            </span>
                          )}
                        </button>
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

                <Link
                  href={homeCopy.nav.createProfileHref}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 shadow-xs"
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

        {/* Mobile Navigation Drawer */}
        <div className={cn('md:hidden border-t border-border/70 bg-background', open ? 'block' : 'hidden')}>
          <div className="space-y-1 px-5 py-4">
            {links.map((link) => {
              const active = isLinkActive(link.href);
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

            {/* Mobile SyncFlow Button */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleOpenSyncFlow();
              }}
              className="flex items-center justify-between w-full py-2.5 text-base font-medium text-muted-foreground hover:text-foreground rounded"
            >
              <div className="flex items-center gap-2">
                <Columns3 className="h-4 w-4 stroke-[1.5]" />
                <span>{homeCopy.nav.syncFlowLabel}</span>
              </div>
              {totalSyncFlowCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-xs font-semibold text-background tabular-nums">
                  {totalSyncFlowCount}
                </span>
              )}
            </button>

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
                    className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
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
