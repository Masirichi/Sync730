// app/about/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { BrandLogo } from '@/components/site/brand-logo';

export const metadata: Metadata = {
  title: 'About | Sync730',
  description: 'Learn about Sync730: Empowering recruitment in the Age of AI.',
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

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="inline-block px-3 py-1 bg-[#edf3ec] text-[#346538] text-xs font-semibold rounded-[4px] uppercase tracking-wider mb-6">
          Draft, pending legal review
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#111] mb-4">
          About Sync730
        </h1>
        <p className="text-sm text-[#6a6a64] mb-8">
          Empowering recruitment in the Age of AI.
        </p>

        <div className="space-y-8 text-base text-[#111] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">Our Mission</h2>
            <p className="text-[#333]">
              Sync730 is built to empower organizations to hire with clarity, speed, and fairness. By interviewing every applicant through structured, AI-moderated video interviews and generating ranked, evidence-backed reports, we eliminate the noise of résumé volume while ensuring every candidate gets a real, unbiased opportunity to speak for themselves.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">The Core Philosophy: AI Scores, Humans Decide</h2>
            <p className="text-[#333]">
              We believe artificial intelligence should never be the final judge of human potential. On Sync730, AI serves as an objective analyst—highlighting technical depth, communication clarity, and specific interview timestamps. Hiring teams always review the evidence, make the decisions, and lead the conversations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Built for Africa, Open to the World</h2>
            <p className="text-[#333]">
              Headquartered in Nigeria and connecting talent across Africa with forward-thinking local and global employers, Sync730 is building the foundational hiring infrastructure for high-growth economies.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
