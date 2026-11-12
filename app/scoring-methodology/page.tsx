import Link from 'next/link';
import {
  ShieldCheck,
  Scale,
  BrainCircuit,
  UserCheck,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'How Candidate Scoring Works | Sync730 AI Transparency',
  description:
    'Our commitment to algorithmic fairness, objective technical vetting, advisory AI scores, and candidate review procedures under NDPA 2023.',
};

export default function ScoringMethodologyPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sync730</span>
            </Button>
          </Link>

          <Link href="/data-processing">
            <span className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline">
              View Data Sub-processors
            </span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>AI Transparency & Algorithmic Fairness Guarantee</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            How Candidate Scoring Works
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
            At Sync730, we believe AI should illuminate human competence, never substitute human empathy. Learn how our video screening and matching models evaluate technical mastery, how scores remain strictly advisory, and how every candidate can request an independent human review.
          </p>
        </div>

        {/* Section 1: What the AI Evaluates */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center font-bold">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                1. Objective Evaluation Signals
              </h2>
              <p className="text-xs text-neutral-500">
                What Flowmingo AI and Sync730 examine during candidate video screening
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Technical Depth & Architecture</span>
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                The model inspects candidate problem formulations, trade-off evaluations (e.g. state management vs streaming chunks, PostgreSQL indexing, API rate-limiting), and adherence to engineering best practices.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Communication & Clarity</span>
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Evaluates structured articulation of past decisions, ability to explain complex technical concepts simply, and collaborative empathy. Does not penalize regional accents or non-native phrasing.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Framework Mastery</span>
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Scores practical fluency with tools declared in the job requirement (e.g. Next.js App Router, Go concurrency, Supabase RLS policies, Figma design system tokens).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Relative Role Overlap</span>
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Calculates skill overlap against the specific requirements of the open role (e.g. Matches 6 of 8 required skills, Seniority fits, Open to remote in Africa).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Prohibited Signals (Algorithmic Fairness) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center font-bold">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                2. Strictly Prohibited Signals (Code-Level Guarantee)
              </h2>
              <p className="text-xs text-neutral-500">
                Non-discrimination commitments hardcoded in our matching algorithms
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-2">
            <p className="font-bold text-rose-800 dark:text-rose-300">
              Zero Protected Characteristic Ingestion:
            </p>
            <p>
              Under our algorithmic fairness policy and the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>, our screening models and matching pipelines NEVER parse, store, weight, or ingest:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-800 dark:text-neutral-200">
              <li>Candidate gender, sex, or sexual orientation</li>
              <li>Age, date of birth, or graduation years used as age proxies</li>
              <li>Candidate full name, surname ethnicity, or marital status</li>
              <li>Facial geometry, skin tone, hair texture, or photographic appearance</li>
              <li>Accent classification or linguistic heritage</li>
              <li>Tribal, ethnic, religious, or political affiliations</li>
            </ul>
            <p className="pt-1 text-[11px] text-neutral-500">
              This rule is mathematically enforced in our scoring functions (<code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded text-[10px]">lib/recruiter/matching.ts</code>).
            </p>
          </div>
        </div>

        {/* Section 3: Advisory AI & Mandatory Human Review */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                3. Advisory Scores · Mandatory Human Evaluation
              </h2>
              <p className="text-xs text-neutral-500">
                Why automated rejections are prohibited across all Sync730 workspaces
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <p>
              AI scores are generated solely as <strong>advisory guidance</strong> to help hiring managers prioritize screening queues. They are heuristics, not ultimate verdicts.
            </p>
            <p className="font-semibold text-neutral-900 dark:text-white">
              Key Platform Policy Requirements for Employers:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Employers must watch candidate video responses and review submitted code before advancing or rejecting any applicant.</li>
              <li>Automated rejection filters based purely on numerical scores without human oversight are disabled on the Sync730 recruiter console.</li>
              <li>When rejecting a candidate in the pipeline, hiring managers are required to select a specific, constructive feedback category to support candidate growth.</li>
            </ul>
          </div>
        </div>

        {/* Section 4: Candidate Appeal & Human Review Flow */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center font-bold">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                4. Candidate Right of Review & Score Appeal
              </h2>
              <p className="text-xs text-neutral-500">
                How candidates can dispute an evaluation or request human re-grading
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <p>
              If you have completed a video screening and believe the AI assessment or transcript did not accurately reflect your answers (for example, due to audio distortion or technical glitches), you have the right to request a manual human re-grade at zero cost.
            </p>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-2">
              <p className="font-bold text-neutral-900 dark:text-white">
                How to Submit an Appeal:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Send an email from your registered account to <a href="mailto:support@sync730.com" className="font-bold text-blue-600 underline">support@sync730.com</a> with the subject: <strong>"Scoring Appeal - [Your Application ID]"</strong>.</li>
                <li>Specify the assessment question or timestamp where the transcript or summary was inaccurate.</li>
                <li>A Senior Technical Reviewer from Sync730 will manually watch your submission and issue an updated evaluation within <strong>48 business hours</strong>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2026 Sync730 Global Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/data-processing" className="hover:underline">
              Data Processing & Sub-processors
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
