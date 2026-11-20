// components/site/site-footer.tsx
import React from 'react';
import Link from 'next/link';
import { Linkedin, Twitter, MapPin } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';
import { homeCopy } from '@/content/home';

export function SiteFooter() {
  const content = homeCopy.footer;
  const currentYear = new Date().getFullYear();
  const columns = content.columns;

  return (
    <footer className="border-t border-border/70 bg-background text-foreground" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-6">
          {/* Column 1: Brand & Description */}
          <div className="sm:col-span-2 md:col-span-2">
            <BrandLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {content.tagline}
            </p>
          </div>

          {/* Column 2: Products */}
          {columns.products && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {columns.products.title}
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                {columns.products.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-orange-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 3: Solutions */}
          {columns.solutions && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {columns.solutions.title}
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                {columns.solutions.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-orange-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 4: Hiring */}
          {columns.hiring && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {columns.hiring.title}
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                {columns.hiring.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-orange-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 5: Explore & Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              {columns.legal.title}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {columns.legal.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-orange-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {columns.company && columns.company.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-orange-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Row: Animated Address, Small print & Social links */}
        <div className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-border/70 pt-8 sm:flex-row">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* Animated Address Badge */}
            <div className="group inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-foreground transition-all duration-300 hover:border-orange-500/50 hover:bg-orange-500/15">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span className="tracking-wide">Abuja, Nigeria</span>
            </div>

            <p className="text-xs text-muted-foreground">
              © {currentYear} Sync730 Technologies Ltd. {content.smallPrint}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://x.com/sync730"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sync730 on X (Twitter)"
              className="text-muted-foreground transition-colors hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
            >
              <Twitter className="h-4 w-4 stroke-[1.5]" />
            </a>
            <a
              href="https://linkedin.com/company/sync730"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sync730 on LinkedIn"
              className="text-muted-foreground transition-colors hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
            >
              <Linkedin className="h-4 w-4 stroke-[1.5]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
