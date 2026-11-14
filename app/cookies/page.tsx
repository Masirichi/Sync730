// app/cookies/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { BrandLogo } from '@/components/site/brand-logo';

export const metadata: Metadata = {
  title: 'Cookie Policy | Sync730',
  description: 'Sync730 Cookie Policy and privacy-focused session management.',
};

export default function CookiesPage() {
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
          Cookie Policy
        </h1>
        <p className="text-sm text-[#6a6a64] mb-8">
          Last updated: November 2026 · Version 1.0 (Draft)
        </p>

        <div className="space-y-8 text-base text-[#111] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. How We Use Cookies</h2>
            <p className="text-[#333]">
              Sync730 uses strictly necessary cookies and browser storage technologies to maintain secure authentication sessions, protect against CSRF attacks, and remember basic accessibility preferences. We do not use third-party tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Types of Cookies in Use</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#333]">
              <li>
                <strong>Essential Authentication Cookies:</strong> Managed via Supabase Auth to verify your identity when accessing recruiter or candidate consoles.
              </li>
              <li>
                <strong>Security & CSRF Tokens:</strong> Temporary tokens used to prevent unauthorized request forging on forms and application portals.
              </li>
              <li>
                <strong>Preferences:</strong> Local browser storage keys remembering reduced motion, tab states, and cookie preference selections.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Managing Your Preferences</h2>
            <p className="text-[#333]">
              You can configure your browser to block or alert you about all cookies. However, blocking essential cookies will prevent authentication and secure dashboard access.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
