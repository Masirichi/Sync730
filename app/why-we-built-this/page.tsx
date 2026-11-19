// app/why-we-built-this/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { HOME_CONTENT } from '@/src/content/home';
import { ArrowRight, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Why We Built Sync730 | Real remote jobs, open to Africa',
  description:
    "Where you live shouldn't decide what you can become. Why we built Sync730 for African talent.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Why We Built Sync730 | Real remote jobs, open to Africa',
    description:
      "Where you live shouldn't decide what you can become. Why we built Sync730 for African talent.",
    url: 'https://sync730.com/why-we-built-this',
    siteName: 'Sync730',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Why We Built Sync730 | Real remote jobs, open to Africa',
    description:
      "Where you live shouldn't decide what you can become. Why we built Sync730 for African talent.",
  },
};

export default function WhyWeBuiltThisPage() {
  const { belief } = HOME_CONTENT;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">
      <SiteHeader />

      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-24 w-full">
        {/* Eyebrow with leading dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>{belief.label}</span>
        </div>

        {/* Single H1 on page */}
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-foreground leading-[1.12] mb-8">
          {belief.h2}
        </h1>

        {/* Belief Story Paragraphs from Homepage Source of Truth */}
        <div className="space-y-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-3xl">
          {belief.paragraphs.map((paragraph, idx) => {
            if (idx === 2 || idx === 4) {
              return (
                <p
                  key={idx}
                  className="text-lg sm:text-xl font-semibold text-foreground tracking-tight py-1"
                >
                  {paragraph}
                </p>
              );
            }
            return (
              <p key={idx} className="leading-8">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Link to Open Roles */}
        <div className="pt-6">
          <Link
            href="/find-work"
            className="group inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground hover:underline underline-offset-4"
          >
            <span>Explore open roles on Sync730</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Clearly Marked Placeholder Section for Founders' Story & Meaning of "730" */}
        <section
          id="founder-story-placeholder"
          aria-label="Founder story placeholder"
          className="mt-16 p-8 sm:p-10 rounded-2xl border-2 border-dashed border-border/80 bg-secondary/20 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>FOUNDERS&apos; STORY &amp; THE MEANING OF &ldquo;730&rdquo;</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            The Story Behind Sync730
          </h2>

          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground italic">
            This section is reserved for the founders&apos; personal narrative and the origin of the &ldquo;730&rdquo; name. Real copy will be authored and published here by the founding team.
          </p>

          <div className="pt-2 text-xs text-muted-foreground font-mono">
            {/* TODO: Founder Story & Meaning of 730 — Awaiting founders' narrative on why Sync730 was created and the specific significance of "730". */}
            [Awaiting input from founders: story of founding team, lived experience with ghost listings, and the origin of the 730 name]
          </div>
        </section>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-border/70 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
          >
            <span>Back to homepage</span>
          </Link>
          <Link
            href="/find-work"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <span>Browse verified roles</span>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
