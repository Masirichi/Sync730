// components/site/site-footer.tsx
import React from 'react';
import Link from 'next/link';
import { Linkedin, Twitter } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';
import { homeCopy } from '@/content/home';

export function SiteFooter() {
  const content = homeCopy.footer;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-background text-foreground" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Column 1: Brand & Tagline */}
          <div className="sm:col-span-2 md:col-span-1">
            <BrandLogo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {content.tagline}
            </p>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              {content.columns.explore.title}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {content.columns.explore.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              {content.columns.company.title}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {content.columns.company.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              {content.columns.legal.title}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {content.columns.legal.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Row: Small print & Social links */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {currentYear} Sync730. {content.smallPrint}
          </p>

          <div className="flex items-center gap-5">
            <a
              href="https://x.com/sync730"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sync730 on X (Twitter)"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
            >
              <Twitter className="h-4 w-4 stroke-[1.5]" />
            </a>
            <a
              href="https://linkedin.com/company/sync730"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sync730 on LinkedIn"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
            >
              <Linkedin className="h-4 w-4 stroke-[1.5]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
