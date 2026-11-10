'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/site/brand-logo';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'How it works', href: '/#features' },
    { label: 'For candidates', href: '/#for-candidates' },
    { label: 'For recruiters', href: '/#for-recruiters' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <BrandLogo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/register"><Button size="sm" className="rounded-full px-5">Join Sync730 <span className="ml-2">↗</span></Button></Link>
        </div>
        <button className="rounded-full p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <div className={cn('md:hidden', open ? 'block' : 'hidden')}>
        <div className="space-y-2 border-t border-border/70 px-5 py-4">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">{link.label}</Link>)}
          <div className="flex gap-2 pt-3"><Link href="/login" className="flex-1" onClick={() => setOpen(false)}><Button variant="outline" className="w-full" size="sm">Sign in</Button></Link><Link href="/register" className="flex-1" onClick={() => setOpen(false)}><Button className="w-full" size="sm">Join Sync730</Button></Link></div>
        </div>
      </div>
    </header>
  );
}
