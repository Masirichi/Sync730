// components/site/site-header.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';
import { BookDemoModal } from '@/components/modals/book-demo-modal';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

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

          {/* Right: Sign in (text) and black pill "Book a demo" (no icon) */}
          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded px-2 py-1"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={handleOpenDemo}
              className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              Book a demo
            </button>
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
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                Sign in
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleOpenDemo();
                }}
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                Book a demo
              </button>
            </div>
          </div>
        </div>
      </header>

      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </>
  );
}
