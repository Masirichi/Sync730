// components/site/site-footer.tsx
import React from 'react';
import Link from 'next/link';
import { Linkedin, Twitter } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background text-foreground" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <BrandLogo />
            <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
              A more human way to discover work, build teams, and move careers forward.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Explore
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/jobs" className="text-muted-foreground transition-colors hover:text-foreground">
                  Find Work
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#for-candidates" className="text-muted-foreground transition-colors hover:text-foreground">
                  For candidates
                </Link>
              </li>
              <li>
                <Link href="/#for-recruiters" className="text-muted-foreground transition-colors hover:text-foreground">
                  For recruiters
                </Link>
              </li>
              <li>
                <Link href="/scoring-methodology" className="text-muted-foreground transition-colors hover:text-foreground">
                  Scoring Methodology
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Company
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contact
                </Link>
              </li>
              {/* Journal omitted as no published editorial content currently exists */}
            </ul>
          </div>

          {/* Column 4: Legal and Compliance */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Legal & Compliance
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground transition-colors hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/scoring-methodology" className="text-muted-foreground transition-colors hover:text-foreground">
                  AI Transparency (NDPA)
                </Link>
              </li>
              <li>
                <Link href="/data-processing" className="text-muted-foreground transition-colors hover:text-foreground">
                  Data Processing Agreement
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 Sync730. All rights reserved.
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
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-foreground rounded"
            >
              <Linkedin className="h-4 w-4 stroke-[1.5]" />
            </a>
            {/* GitHub icon removed per prompt policy */}
          </div>
        </div>
      </div>
    </footer>
  );
}
