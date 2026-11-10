import Link from 'next/link';
import { Briefcase, Github, Linkedin, Twitter } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">TalentHub</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The modern recruitment platform connecting talented candidates with world-class companies.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="/#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link href="/register" className="text-muted-foreground hover:text-foreground">Get started</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">For You</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/candidate" className="text-muted-foreground hover:text-foreground">Candidates</Link></li>
              <li><Link href="/recruiter" className="text-muted-foreground hover:text-foreground">Recruiters</Link></li>
              <li><Link href="/admin" className="text-muted-foreground hover:text-foreground">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 TalentHub. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground"><Twitter className="h-5 w-5" /></Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground"><Linkedin className="h-5 w-5" /></Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground"><Github className="h-5 w-5" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
