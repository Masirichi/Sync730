'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  BadgeCheck,
  Check,
  Copy,
  Download,
  ArrowRight,
  Briefcase,
  Building2,
  Video,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Columns3,
} from 'lucide-react';
import { toast } from 'sonner';
import { getLocalTrackerItems } from '@/lib/tracker';
import { analyzeResumeATS, ATSAnalysisResult } from '@/lib/resume/analyzer';
import { generateTemplateResume, DEFAULT_CANDIDATE_RESUME_PROFILE } from '@/lib/resume/tailorer';
import { getCandidateProfile } from '@/lib/candidate/profile';

type StudioMode = 'ANALYZER' | 'GENERATOR';

const SAMPLE_RESUME_TEXT = `# JANE DOE
Lagos, Nigeria | Email: jane.doe@sync730.com | Phone: +234 812 345 6789
LinkedIn: linkedin.com/in/sync730-candidate | GitHub: github.com/sync730-candidate

## PROFESSIONAL SUMMARY
Results-driven Senior Frontend & Full Stack Engineer with 5+ years of international remote experience designing resilient, mobile-first web applications. Proven track record of improving Largest Contentful Paint (LCP) by 45%, building scalable design systems, and maintaining 99.9% uptime across asynchronous global teams.

## CORE COMPETENCIES & TECHNICAL EXPERTISE
- Languages & Frameworks: React, Next.js, TypeScript, JavaScript, Node.js, Tailwind CSS
- Tooling & Cloud: Docker, Git, GitHub Actions, AWS, REST APIs, GraphQL, PostgreSQL
- Architecture: Micro-frontends, Server Components, State Management, Core Web Vitals

## PROFESSIONAL WORK EXPERIENCE
### Lead Remote Engineer | International High-Growth SaaS
2022 — Present | Remote (Global Overlap)
- Architected and deployed responsive Next.js and TypeScript micro-frontends serving over 350,000 active monthly users with 99.95% SLA reliability.
- Spearheaded Core Web Vitals optimization initiative, slashing Largest Contentful Paint from 3.2s to 1.1s and boosting conversion by 28%.
- Championed comprehensive design token architecture using Tailwind CSS, standardizing 40+ reusable accessible components across web clients.

### Senior Frontend Developer | Distributed Remote Team
2020 — 2022 | Remote
- Built real-time operational dashboards and webhook event streaming pipelines with zero dropped payloads across peak traffic spikes.
- Mentored 4 mid-level developers, established automated testing pipelines using Jest and Playwright, and elevated automated test coverage to 88%.
- Integrated secure, PCI-compliant payment gateways and third-party SaaS APIs, reducing checkout drop-off rates by 19%.

## EDUCATION & CERTIFICATIONS
- B.Sc. in Computer Science — First Class Honors (2019)
- AWS Certified Solutions Architect & Advanced Next.js Certified`;

function ResumeStudioContent() {
  const searchParams = useSearchParams();
  const queryRole = searchParams.get('role') || '';
  const queryCompany = searchParams.get('company') || '';

  // Mode Selection
  const [activeMode, setActiveMode] = useState<StudioMode>('ANALYZER');

  // Role & Company inputs
  const [targetRole, setTargetRole] = useState(queryRole || 'Senior Frontend Engineer');
  const [companyName, setCompanyName] = useState(queryCompany || '');
  const [jobDescription, setJobDescription] = useState('');
  const [showJdInput, setShowJdInput] = useState(false);
  const [trackerRoles, setTrackerRoles] = useState<{ id: string; title: string; company: string; notes?: string }[]>([]);

  // Analyzer State
  const [resumeInput, setResumeInput] = useState(SAMPLE_RESUME_TEXT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(() =>
    analyzeResumeATS(SAMPLE_RESUME_TEXT, queryRole || 'Senior Frontend Engineer', queryCompany || '')
  );

  // Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [editorTab, setEditorTab] = useState<'preview' | 'markdown'>('preview');
  const [copied, setCopied] = useState(false);

  // Load SyncFlow Tracker items on mount for 1-click import
  useEffect(() => {
    try {
      const items = getLocalTrackerItems();
      setTrackerRoles(
        items.map((i) => ({
          id: i.id,
          title: i.title,
          company: i.company,
          notes: i.notes || '',
        }))
      );
    } catch {}
  }, []);

  // Update analysis when role or company changes
  useEffect(() => {
    if (resumeInput.trim()) {
      const res = analyzeResumeATS(resumeInput, targetRole, companyName, jobDescription);
      setAnalysisResult(res);
    }
  }, [targetRole, companyName, jobDescription]);

  // Execute ATS Analysis
  const handleRunAnalysis = () => {
    if (!resumeInput.trim()) {
      toast.error('Please paste your resume text to run an ATS analysis.');
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      const res = analyzeResumeATS(resumeInput, targetRole, companyName, jobDescription);
      setAnalysisResult(res);
      setIsAnalyzing(false);
      toast.success('ATS analysis complete! Review your score and recommendations below.');
    }, 600);
  };

  // Execute AI Tailored Resume Generation
  const handleGenerateResume = async () => {
    setIsGenerating(true);
    try {
      const profile = getCandidateProfile();
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: targetRole,
          company_name: companyName || 'Global Partner',
          job_description: jobDescription || '',
          candidate_profile: profile
            ? {
                fullName: profile.fullName,
                email: profile.email,
                phone: profile.phone || DEFAULT_CANDIDATE_RESUME_PROFILE.phone,
                location: profile.location || DEFAULT_CANDIDATE_RESUME_PROFILE.location,
                coreSkills: profile.skills.map((s) => s.name),
                yearsExperience: profile.yearsOfExperience || 5,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.markdown) {
        setGeneratedResume(data.markdown);
        setEditorTab('preview');
        toast.success(`Tailored ATS resume created for ${companyName || targetRole}!`);
      } else {
        // Fallback to client template generator
        const fallback = generateTemplateResume(
          {
            title: targetRole,
            company: companyName || 'Global Partner',
            description: jobDescription,
          },
          DEFAULT_CANDIDATE_RESUME_PROFILE
        );
        setGeneratedResume(fallback);
        toast.success('Tailored ATS resume generated successfully.');
      }
    } catch {
      const fallback = generateTemplateResume(
        {
          title: targetRole,
          company: companyName || 'Global Partner',
          description: jobDescription,
        },
        DEFAULT_CANDIDATE_RESUME_PROFILE
      );
      setGeneratedResume(fallback);
      toast.success('Tailored ATS resume generated successfully.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async (contentToCopy: string) => {
    if (!contentToCopy) return;
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  // Download helper
  const handleDownload = (content: string, format: 'md' | 'txt') => {
    if (!content) return;
    const sanitizedCompany = (companyName || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedTitle = targetRole.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Resume_${sanitizedCompany}_${sanitizedTitle}.${format}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header & Pro Tool Banner */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <FileText className="h-4 w-4 stroke-[2]" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
                Resume Studio
              </h1>
              <Badge variant="secondary" className="text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                Candidate Arsenal · Paid Suite
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              ATS keyword density audit, metric-driven bullet optimization, and tailored resume generation designed for verified remote roles.
            </p>
          </div>

          {/* Quick Cross-Tool Navigation to Interview Coach & SyncFlow */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/coach?role=${encodeURIComponent(targetRole)}&company=${encodeURIComponent(companyName)}`}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-neutral-950 dark:hover:border-white transition-colors"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Interview Coach</span>
            </Link>
            <Link
              href="/dashboard/syncflow"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-neutral-950 dark:hover:border-white transition-colors"
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span>SyncFlow</span>
            </Link>
          </div>
        </div>

        {/* Target Role & 1-Click Import Controls */}
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Target Role Title *
            </label>
            <Input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Company Name (Optional)
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Paystack, Moniepoint"
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            {trackerRoles.length > 0 && (
              <div className="relative flex-1">
                <select
                  onChange={(e) => {
                    const found = trackerRoles.find((r) => r.id === e.target.value);
                    if (found) {
                      setTargetRole(found.title);
                      setCompanyName(found.company);
                      if (found.notes) setJobDescription(found.notes);
                      toast.success(`Imported ${found.title} from SyncFlow!`);
                    }
                  }}
                  defaultValue=""
                  className="w-full h-10 pl-3 pr-8 rounded-xl text-xs font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 appearance-none cursor-pointer"
                  aria-label="Import from SyncFlow"
                >
                  <option value="" disabled>Import from SyncFlow...</option>
                  {trackerRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.company} · {r.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowJdInput(!showJdInput)}
              className="h-10 px-3 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
              {showJdInput ? 'Hide JD' : 'Add JD'}
            </Button>
          </div>

          {showJdInput && (
            <div className="md:col-span-12 mt-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Job Description / Required Tech Stack (Paste for accurate ATS keyword density scoring)
              </label>
              <Textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job requirements, responsibilities, or stack here..."
                className="text-xs rounded-xl font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Studio Mode Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setActiveMode('ANALYZER')}
          className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'ANALYZER'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 shadow-sm border border-neutral-200/50 dark:border-neutral-700'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <BadgeCheck className="h-4 w-4" />
          <span>ATS Resume Analyzer & Audit</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('GENERATOR');
            if (!generatedResume) handleGenerateResume();
          }}
          className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'GENERATOR'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 shadow-sm border border-neutral-200/50 dark:border-neutral-700'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Tailored ATS Resume Generator</span>
        </button>
      </div>

      {/* 3. MODE: ATS RESUME ANALYZER */}
      {activeMode === 'ANALYZER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Input Textarea */}
            <div className="lg:col-span-6 space-y-3">
              <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Your Current CV / Resume Text
                  </span>
                  <button
                    type="button"
                    onClick={() => setResumeInput(SAMPLE_RESUME_TEXT)}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 inline-flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset Sample
                  </button>
                </div>

                <Textarea
                  rows={16}
                  value={resumeInput}
                  onChange={(e) => setResumeInput(e.target.value)}
                  placeholder="Paste your CV or resume in plain text or markdown..."
                  className="text-xs font-mono rounded-xl leading-relaxed resize-y"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-400">
                    {resumeInput.split(/\s+/).filter(Boolean).length} words parsed
                  </span>
                  <Button
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="min-h-[44px] px-5 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-xs font-bold"
                  >
                    {isAnalyzing ? 'Auditing ATS Score...' : 'Run ATS Audit'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Analysis Scorecard & Findings */}
            <div className="lg:col-span-6 space-y-4">
              {analysisResult && (
                <>
                  {/* Top Score Tile */}
                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-neutral-900 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          Overall ATS Match Score
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-3xl font-extrabold text-neutral-950 dark:text-neutral-50">
                            {analysisResult.overallScore}%
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                            {analysisResult.tier}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-neutral-400">Calibrated for</span>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]">
                          {targetRole}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown 4 Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 text-center">
                        <div className="text-[10px] text-neutral-500 font-medium">Keywords</div>
                        <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                          {analysisResult.breakdown.keywordMatch}%
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 text-center">
                        <div className="text-[10px] text-neutral-500 font-medium">Action & Impact</div>
                        <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                          {analysisResult.breakdown.impactScore}%
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 text-center">
                        <div className="text-[10px] text-neutral-500 font-medium">Readability</div>
                        <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                          {analysisResult.breakdown.readabilityScore}%
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 text-center">
                        <div className="text-[10px] text-neutral-500 font-medium">Sections</div>
                        <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                          {analysisResult.breakdown.sectionCompleteness}%
                        </div>
                      </div>
                    </div>

                    {/* Matched & Missing Keywords */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Matched Keywords ({analysisResult.matchedKeywords.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.matchedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {analysisResult.missingKeywords.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>Missing High-Priority Keywords ({analysisResult.missingKeywords.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.missingKeywords.map((kw) => (
                              <span
                                key={kw}
                                className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50"
                              >
                                + {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Weak Bullet Rewrites */}
                  <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Metric-Driven Bullet Rewrites
                    </h2>

                    <div className="space-y-3">
                      {analysisResult.weakBulletsWithFixes.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-2"
                        >
                          <div className="text-xs text-rose-700 dark:text-rose-400 line-through opacity-80">
                            {item.original}
                          </div>
                          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                            <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
                            <span>{item.suggestedRewrite}</span>
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                            Why: {item.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODE: TAILORED ATS RESUME GENERATOR */}
      {activeMode === 'GENERATOR' && (
        <div className="space-y-4">
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5">
              <div>
                <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Tailored ATS Resume for {companyName || 'Target Role'}
                </CardTitle>
                <p className="text-xs text-neutral-500 mt-0.5">
                  High-converting markdown resume structured to pass enterprise ATS scans.
                </p>
              </div>

              {/* View & Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800 p-0.5 bg-white dark:bg-neutral-950">
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors min-h-[36px] ${
                      editorTab === 'preview'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Formatted Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('markdown')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors min-h-[36px] ${
                      editorTab === 'markdown'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Edit Markdown
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(generatedResume)}
                  className="min-h-[44px] px-3 rounded-xl text-xs font-semibold"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(generatedResume, 'md')}
                  className="min-h-[44px] px-3 rounded-xl text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download .MD
                </Button>

                <Button
                  onClick={handleGenerateResume}
                  disabled={isGenerating}
                  className="min-h-[44px] px-4 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-xs font-bold"
                >
                  <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {editorTab === 'preview' ? (
                <div className="bg-white dark:bg-neutral-950 p-6 sm:p-8 rounded-xl border border-neutral-100 dark:border-neutral-800 font-sans leading-relaxed text-neutral-800 dark:text-neutral-200 space-y-4">
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                    {generatedResume}
                  </pre>
                </div>
              ) : (
                <Textarea
                  rows={20}
                  value={generatedResume}
                  onChange={(e) => setGeneratedResume(e.target.value)}
                  className="font-mono text-xs rounded-xl p-4 leading-relaxed resize-y"
                  placeholder="Markdown resume contents..."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ResumeStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-8 text-center text-sm text-neutral-500">
          Loading Resume Studio...
        </div>
      }
    >
      <ResumeStudioContent />
    </Suspense>
  );
}
