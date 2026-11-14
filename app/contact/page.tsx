// app/contact/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { BrandLogo } from '@/components/site/brand-logo';

export const metadata: Metadata = {
  title: 'Contact | Sync730',
  description: 'Get in touch with the Sync730 recruitment and platform support team.',
};

export default function ContactPage() {
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
          Contact Us
        </h1>
        <p className="text-sm text-[#6a6a64] mb-8">
          We’re here to assist hiring teams, candidates, and partners.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base text-[#111] leading-relaxed">
          <div className="border border-border p-6 bg-background rounded">
            <h2 className="text-lg font-bold mb-2">Hiring Teams & Enterprise</h2>
            <p className="text-sm text-[#4d4d4d] mb-4">
              To request a custom demo or discuss high-volume role assessments:
            </p>
            <p className="font-semibold text-sm">Email: <a href="mailto:sales@sync730.com" className="underline hover:opacity-80">sales@sync730.com</a></p>
          </div>

          <div className="border border-border p-6 bg-background rounded">
            <h2 className="text-lg font-bold mb-2">Candidate Support & Data Privacy</h2>
            <p className="text-sm text-[#4d4d4d] mb-4">
              For assistance with profile evaluations, video interviews, or NDPA data requests:
            </p>
            <p className="font-semibold text-sm">Email: <a href="mailto:support@sync730.com" className="underline hover:opacity-80">support@sync730.com</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
