// components/site/site-footer.tsx
import React from 'react';
import Link from 'next/link';
import { Linkedin, Twitter, MapPin } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';
import { homeCopy } from '@/content/home';

export function SiteFooter() {
  const content = homeCopy.footer;
  const currentYear = new Date().getFullYear();

  // Extract columns dynamically or fallback
  const columns = content.columns;

  return (
    <footer className="border-t border-border/70 bg-background text-foreground" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-6">
          {/* Column 1: Brand & Physical Address */}
          <div className="sm:col-span-2 md:col-span-2">
            <BrandLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {content.tagline}
            </p>

            {/* Prominent Physical Address: Abuja, Nigeria */}
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border/70 bg-secondary/50 px-3 py-2 w-fit">
              <MapPin className="h-4 w-4 shrink-0 text-foreground" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">Sync730 HQ: </span>
                <span className="text-muted-foreground">{content.address || 'Abuja, Nigeria'}</span>
              </div>
            </div>
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
                      className="text-muted-foreground transition-colors hover:text-foreground"
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
                      className="text-muted-foreground transition-colors hover:text-foreground"
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
                      className="text-muted-foreground transition-colors hover:text-foreground"
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
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {columns.company && columns.company.links.map((link) => (
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

        {/* Bottom Row: Small print, Abuja Nigeria & Social links */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {currentYear} Sync730 Technologies Ltd. Abuja, Nigeria. {content.smallPrint}
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
