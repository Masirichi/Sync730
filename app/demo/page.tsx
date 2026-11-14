// app/demo/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { DemoPageClient } from './demo-client';

export const metadata: Metadata = {
  title: 'Book a Demo | Sync730',
  description:
    'Experience how Sync730 empowers organizations with AI-moderated video interviews and evidence-backed candidate shortlists.',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <SiteHeader />
      <main id="main-content" className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-xl px-5 sm:px-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              Recruiter Demo
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Book a Sync730 Demo
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Discover how AI-moderated video interviews deliver scored, evidence-backed shortlists for your hiring team.
            </p>
          </div>

          <div className="border border-border bg-background p-6 sm:p-8 rounded shadow-sm">
            <DemoPageClient />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
