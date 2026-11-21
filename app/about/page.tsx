// app/about/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { BrandLogo } from '@/components/site/brand-logo';

export const metadata: Metadata = {
  title: 'About | Sync730',
  description: 'Learn about Sync730: Real jobs, open to Africa. Where you live shouldn’t decide what you can become.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#111] flex flex-col font-sans">
      <header className="border-b border-[#e6e6e1] bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo />
          <Link
            href="/"
            className="text-sm font-medium text-[#6a6a64] hover:text-[#111] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full focus:outline-none" tabIndex={-1}>
        <div className="inline-block px-3 py-1 bg-[#edf3ec] text-[#346538] text-xs font-semibold rounded-[4px] uppercase tracking-wider mb-6">
          Draft, pending legal review
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#111] mb-4">
          About Sync730
        </h1>
        <p className="text-sm text-[#6a6a64] mb-8">
          Real jobs. Open to Africa.
        </p>

        <div className="space-y-8 text-base text-[#111] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">Our Belief</h2>
            <p className="text-[#333]">
              Where you live shouldn’t decide what you can become. Talent is everywhere. Real opportunity should be too.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">What We Do</h2>
            <p className="text-[#333]">
              Sync730 verifies that every role listed on our platform is real, open, and eligible for people living in Africa. We remove ghost jobs and worldwide remote postings that actually exclude African talent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Built for How Africa Hires</h2>
            <p className="text-[#333]">
              We connect African professionals with forward-thinking employers who hire on ability, not address. Whether remote, hybrid, or onsite in Lagos, Nairobi, and beyond, we focus on genuine opportunities.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
