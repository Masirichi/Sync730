import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { BrandLogo } from '@/components/site/brand-logo';

export const metadata: Metadata = {
  title: 'Terms of Service | Sync730',
  description: 'Sync730 Terms of Service and user agreement.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#111] flex flex-col font-sans">
      <header className="border-b border-[#e6e6e1] bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo />
          <Link
            href="/waitlist"
            className="text-sm font-medium text-[#6a6a64] hover:text-[#111] transition-colors"
          >
            Back to Waitlist
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="inline-block px-3 py-1 bg-[#edf3ec] text-[#346538] text-xs font-semibold rounded-[4px] uppercase tracking-wider mb-6">
          Draft, pending legal review
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#111] mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-[#6a6a64] mb-8">
          Last updated: November 2026 · Version 1.0 (Draft)
        </p>

        <div className="space-y-8 text-base text-[#111] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Agreement to Terms</h2>
            <p className="text-[#333]">
              By signing up for the Sync730 talent waitlist or accessing our platform, you agree to these
              pre-launch terms. Sync730 is currently in pre-launch development, connecting verified
              African talent with forward-thinking employers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Waitlist Participation</h2>
            <p className="text-[#333]">
              Joining our waitlist does not guarantee immediate access, job placement, or employment
              offers. Invitations to create full candidate profiles and participate in assessments are
              issued in phased batches based on open roles and employer availability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Accurate Information</h2>
            <p className="text-[#333]">
              You agree to provide true, current, and complete information when submitting your waitlist
              entry and when creating subsequent candidate profiles. Misleading credentials or false
              identity details may result in removal from the waitlist and platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Modifications</h2>
            <p className="text-[#333]">
              We reserve the right to modify or replace these terms as the platform approaches public
              launch. Continued use of our waitlist and updates indicates acceptance of revised terms.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#e6e6e1] py-8 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-xs text-[#6a6a64] flex flex-wrap gap-4 items-center justify-between">
          <p>© 2026 Sync730. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#111] underline">Privacy</Link>
            <Link href="/waitlist" className="hover:text-[#111] underline">Waitlist</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
