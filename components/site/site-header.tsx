'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Briefcase, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">TalentHub</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/#for-candidates" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            For Candidates
          </Link>
          <Link href="/#for-recruiters" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            For Recruiters
          </Link>
          <Link href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>

        <button
          className="flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn('md:hidden', open ? 'block' : 'hidden')}>
        <div className="space-y-2 border-t border-border/60 px-4 py-4">
          <Link href="/#features" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Features
          </Link>
          <Link href="/#for-candidates" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            For Candidates
          </Link>
          <Link href="/#for-recruiters" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            For Recruiters
          </Link>
          <Link href="/#pricing" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Pricing
          </Link>
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full" size="sm">Sign in</Button>
            </Link>
            <Link href="/register" className="flex-1" onClick={() => setOpen(false)}>
              <Button className="w-full" size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
