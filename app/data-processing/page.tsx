import Link from 'next/link';
import {
  Shield,
  Server,
  CreditCard,
  Video,
  Database,
  Mail,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Data Processing & Sub-processors | Sync730',
  description:
    'List of third-party data sub-processors and Data Protection Officer contact details under the Nigeria Data Protection Act 2023.',
};

export default function DataProcessingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Button>
          </Link>

          <Link href="/scoring-methodology">
            <span className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline">
              AI Scoring Methodology
            </span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
            <Shield className="h-3.5 w-3.5 text-blue-600" />
            <span>NDPA 2023 Compliance & Data Governance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Data Processing & Authorized Sub-processors
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
            This Data Processing Agreement notice provides transparency into how candidate and employer data is processed, stored, and protected across the Sync730 infrastructure in compliance with the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>.
          </p>
        </div>

        {/* Legal Placeholder Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Legal Review Notice</span>
          </div>
          <p className="leading-relaxed">
            [PLACEHOLDER: legal text to be reviewed by a Nigerian lawyer]
          </p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
            The provisions below represent our operational data architecture and standard terms, pending formal review by accredited Nigerian privacy legal counsel.
          </p>
        </div>

        {/* Sub-processors Table */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Authorized Third-Party Sub-processors
              </h2>
              <p className="text-xs text-neutral-500">
                Entities that process data on behalf of Sync730 to deliver our services
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300">
                  <th className="py-3 px-4 font-bold">Sub-processor</th>
                  <th className="py-3 px-4 font-bold">Service Category</th>
                  <th className="py-3 px-4 font-bold">Data Processed</th>
                  <th className="py-3 px-4 font-bold">Hosting Location</th>
                  <th className="py-3 px-4 font-bold">Security Certification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                    Flowmingo AI
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Video Assessment & Speech-to-Text Screening
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Interview video recordings, audio tracks, technical transcripts, and AI-generated assessment summaries.
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    United States / EU (Cloud microservices)
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    SOC 2 Type II, TLS 1.3 encryption at rest and in transit
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                    Vercel Inc.
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Application Hosting & Edge Content Delivery
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Web requests, session tokens, IP routing, edge caching, serverless compute execution logs.
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Global Edge Network (including African points of presence)
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    SOC 2 Type II, ISO 27001, PCI-DSS compliant edge
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                    Supabase Inc.
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Database & Authentication Infrastructure
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Recruiter credentials, workspace memberships, token ledger balances, pipeline stages, encrypted contact records.
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    EU (Frankfurt) / US East (PostgreSQL RLS)
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    SOC 2 Type II, HIPAA eligible, AES-256 storage encryption
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                    Paystack Payments Ltd (Stripe subsidiary) / Flutterwave
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Payment Gateway & Billing
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Billing organization email, transaction references, token pack amounts. Card data is tokenized directly on PCI-DSS certified gateway servers.
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    Nigeria (Lagos) & Global
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    PCI-DSS Level 1 certified, CBN licensed
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Protection Officer Contact */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="h-9 w-9 rounded-xl bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 flex items-center justify-center font-bold">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Contact Our Data Protection Officer (DPO)
              </h2>
              <p className="text-xs text-neutral-500">
                Submit subject access requests, deletion demands, or compliance inquiries
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <p>
              Candidates and organizational customers may exercise their rights under the Nigeria Data Protection Act 2023—including the right to access, rectify, restrict processing of, or erase their personal data—by writing directly to our designated compliance office:
            </p>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-1.5 font-medium text-neutral-900 dark:text-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Direct Email:</span>
                <a href="mailto:dpo@sync730.com" className="font-bold text-blue-600 underline">
                  dpo@sync730.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Physical Address:</span>
                <span>Sync730 Data Protection Office, Victoria Island, Lagos State, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Response SLA:</span>
                <span>Within 5 business days of verified identity confirmation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2026 Sync730 Global Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/scoring-methodology" className="hover:underline">
              AI Scoring Methodology
            </Link>
            <Link href="/console" className="hover:underline">
              Recruiter Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
