import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1"><BrandLogo /><p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">A more human way to discover work, build teams, and move careers forward.</p></div>
          <div><h3 className="text-sm font-semibold">Explore</h3><ul className="mt-5 space-y-3 text-sm"><li><Link href="/#features" className="text-muted-foreground hover:text-foreground">How it works</Link></li><li><Link href="/candidate" className="text-muted-foreground hover:text-foreground">For candidates</Link></li><li><Link href="/recruiter" className="text-muted-foreground hover:text-foreground">For recruiters</Link></li></ul></div>
          <div><h3 className="text-sm font-semibold">Company</h3><ul className="mt-5 space-y-3 text-sm"><li><Link href="/" className="text-muted-foreground hover:text-foreground">About</Link></li><li><Link href="/" className="text-muted-foreground hover:text-foreground">Journal</Link></li><li><Link href="/" className="text-muted-foreground hover:text-foreground">Contact</Link></li></ul></div>
          <div><h3 className="text-sm font-semibold">Legal</h3><ul className="mt-5 space-y-3 text-sm"><li><Link href="/" className="text-muted-foreground hover:text-foreground">Privacy</Link></li><li><Link href="/" className="text-muted-foreground hover:text-foreground">Terms</Link></li></ul></div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-7 sm:flex-row"><p className="text-sm text-muted-foreground">© 2026 Sync730. All rights reserved.</p><div className="flex items-center gap-4"><Link href="/" className="text-muted-foreground hover:text-foreground"><Twitter className="h-4 w-4" /></Link><Link href="/" className="text-muted-foreground hover:text-foreground"><Linkedin className="h-4 w-4" /></Link><Link href="/" className="text-muted-foreground hover:text-foreground"><Github className="h-4 w-4" /></Link></div></div>
      </div>
    </footer>
  );
}
