import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { BrandLogo } from '@/components/site/brand-logo';

export const metadata: Metadata = {
  title: 'Privacy Policy | Sync730',
  description: 'Sync730 Privacy Policy and data protection commitments.',
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-[#6a6a64] mb-8">
          Last updated: November 2026 · Version 1.0 (Draft)
        </p>

        <div className="space-y-8 text-base text-[#111] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Overview</h2>
            <p className="text-[#333]">
              Sync730 is committed to respecting your privacy and safeguarding your personal information.
              This document outlines how we collect, handle, and store data gathered through our waitlist
              and platform in alignment with the Nigeria Data Protection Act 2023 (NDPA) and applicable
              data protection regulations across Africa.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Information We Collect</h2>
            <p className="text-[#333]">
              When you join our talent waitlist, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#333]">
              <li>Your full name and primary email address.</li>
              <li>Your location (country of residence) and professional discipline or track.</li>
              <li>Your workplace priorities (for example, remote work, fair pay, or growth).</li>
              <li>Timestamp of your submission and explicit consent confirmation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. How We Use Your Data</h2>
            <p className="text-[#333]">
              We use your contact details solely to send platform launch notifications, invite you to
              create a candidate profile, and provide updates regarding recruitment opportunities. We
              do not sell, rent, or lease your personal information to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Your Rights</h2>
            <p className="text-[#333]">
              You have the right to request access to the personal data we hold about you, request
              corrections, or request immediate removal of your details from our waitlist at any time.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#e6e6e1] py-8 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-xs text-[#6a6a64] flex flex-wrap gap-4 items-center justify-between">
          <p>© 2026 Sync730. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[#111] underline">Terms</Link>
            <Link href="/waitlist" className="hover:text-[#111] underline">Waitlist</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
