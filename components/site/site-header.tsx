// components/site/site-header.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Bookmark, User, LayoutDashboard, LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';
import { BookDemoModal } from '@/components/modals/book-demo-modal';
import { trackEvent } from '@/lib/analytics';
import { createBrowserClient } from '@/lib/supabase/client';
import { getLocalTrackerItems } from '@/lib/tracker';
import { cn } from '@/lib/utils';

export interface SiteHeaderProps {
  ctaMode?: 'profile' | 'demo';
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

export function SiteHeader({ ctaMode = 'profile' }: SiteHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // User auth state & real saved jobs count
  const [user, setUser] = useState<{ id: string; email?: string; name?: string; avatar?: string } | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

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

    // 2. Check real saved jobs count from candidate tracker
    const updateSavedCount = () => {
      try {
        const items = getLocalTrackerItems();
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

  const links = [
    { label: 'Find Work', href: '/jobs' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'For recruiters', href: '/#for-recruiters' },
    { label: 'For candidates', href: '/#for-candidates' },
  ];

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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Left: Wordmark and logo mark */}
          <BrandLogo />

          {/* Center: Desktop Navigation links */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: State-Aware Controls */}
          <div className="hidden items-center gap-5 md:flex">
            {user ? (
              // LOGGED IN STATE
              <div className="flex items-center gap-4">
                {/* Saved jobs icon with real count */}
                <Link
                  href="/candidate/saved"
                  className="relative inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  aria-label={`Saved jobs (${savedCount})`}
                  title="View saved jobs"
                >
                  <Bookmark className="h-5 w-5 stroke-[1.5]" />
                  {savedCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background tabular-nums">
                      {savedCount}
                    </span>
                  )}
                </Link>

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
                        <Link
                          href="/candidate/saved"
                          onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Bookmark className="h-4 w-4 stroke-[1.5]" />
                            <span>Saved Roles</span>
                          </div>
                          {savedCount > 0 && (
                            <span className="text-[10px] rounded-full bg-secondary px-1.5 py-0.5 font-semibold tabular-nums">
                              {savedCount}
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
              <div className="flex items-center gap-5">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded px-2 py-1"
                >
                  Sign in
                </Link>

                {ctaMode === 'demo' ? (
                  <button
                    type="button"
                    onClick={handleOpenDemo}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                  >
                    Book a demo
                  </button>
                ) : (
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                  >
                    Create your free profile
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Under 860px / Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded p-2 md:hidden text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
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
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-base font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
              >
                {link.label}
              </Link>
            ))}

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
                  <Link
                    href="/candidate/saved"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Saved Roles ({savedCount})
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
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  >
                    Create your free profile
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </>
  );
}
