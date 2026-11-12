'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export interface TargetJobContext {
  id?: string | null;
  title: string;
  company: string;
  location?: string | null;
  description?: string | null;
  url?: string | null;
  tags?: string[] | null;
  salary?: string | null;
  category?: string | null;
}

interface ResumeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: TargetJobContext | null;
}

export function ResumeGeneratorModal({ isOpen, onClose, job }: ResumeGeneratorModalProps) {
  const [candidateName, setCandidateName] = useState('Jane Doe');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  if (!job) return null;

  // Handle AI Resume Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: job.title,
          company_name: job.company,
          job_description: job.description || '',
          job_location: job.location || 'Remote',
          job_tags: job.tags || [],
          candidate_profile: {
            fullName: candidateName,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.markdown) {
        setGeneratedResume(data.markdown);
        setMatchScore(data.match_score || 95);
        setActiveTab('preview');
        toast.success(`Tailored ATS resume created for ${job.company}!`);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      console.warn('Resume generation notice:', err);
      toast.error('Unable to reach server. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!generatedResume) return;
    try {
      await navigator.clipboard.writeText(generatedResume);
      setCopied(true);
      toast.success('Resume copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  // Download file helper
  const handleDownload = (format: 'md' | 'txt') => {
    if (!generatedResume) return;
    const sanitizedCompany = job.company.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedTitle = job.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Resume_${sanitizedCompany}_${sanitizedTitle}.${format}`;

    const blob = new Blob([generatedResume], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-950">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-900 bg-neutral-50/60 dark:bg-neutral-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium mb-1.5">
                <Sparkles className="h-3 w-3 stroke-[1.5]" />
                <span>AI Resume & ATS Studio</span>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Tailor Resume for {job.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Targeting <strong>{job.company}</strong> · {job.location || 'Remote'}
              </DialogDescription>
            </div>

            {matchScore && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shrink-0">
                <ShieldCheck className="h-4 w-4 stroke-[1.5]" />
                <span>{matchScore}% ATS Keyword Match</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Controls Bar */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Candidate Name
            </label>
            <Input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Candidate Full Name"
              className="h-8 text-xs bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 max-w-sm"
            />
          </div>

          {/* Not Generated State: Launch CTA */}
          {!generatedResume && !isGenerating && (
            <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 p-8 sm:p-10 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto text-neutral-800 dark:text-neutral-200">
                <FileText className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Ready to align your credentials with {job.company}?
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Our ATS specialist model analyzes this job&apos;s exact requirements, re-indexes your experience bullets, and structures your achievements with high-impact quantifiable metrics.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                className="bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-xs font-semibold px-5 h-9 rounded-lg gap-1.5 shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 stroke-[1.5]" />
                Generate Tailored ATS Resume
              </Button>
            </div>
          )}

          {/* Generating State */}
          {isGenerating && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-12 text-center space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent animate-spin mx-auto" />
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Tailoring Resume for {job.company}...
              </h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Extracting role keywords, optimizing bullet points with metrics, and formatting ATS markdown.
              </p>
            </div>
          )}

          {/* Generated State: Tabs & Editor */}
          {generatedResume && !isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="h-8 bg-neutral-100 dark:bg-neutral-900">
                    <TabsTrigger value="preview" className="text-xs px-3 h-7">
                      Formatted Preview
                    </TabsTrigger>
                    <TabsTrigger value="edit" className="text-xs px-3 h-7">
                      Edit Markdown / Text
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 h-8 gap-1"
                >
                  <RotateCcw className="h-3 w-3 stroke-[1.5]" /> Re-generate
                </Button>
              </div>

              {activeTab === 'preview' ? (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 bg-neutral-50/40 dark:bg-neutral-900/20 max-h-[420px] overflow-y-auto space-y-4 font-sans text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap select-text">
                  {generatedResume}
                </div>
              ) : (
                <Textarea
                  rows={16}
                  value={generatedResume}
                  onChange={(e) => setGeneratedResume(e.target.value)}
                  className="font-mono text-xs border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 leading-relaxed"
                />
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/60 dark:bg-neutral-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!generatedResume}
              className="text-xs h-9 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[1.5] text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
                  Copy Resume
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('md')}
              disabled={!generatedResume}
              className="text-xs h-9 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium gap-1.5"
            >
              <Download className="h-3.5 w-3.5 stroke-[1.5]" />
              .MD
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('txt')}
              disabled={!generatedResume}
              className="text-xs h-9 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium gap-1.5"
            >
              <Download className="h-3.5 w-3.5 stroke-[1.5]" />
              .TXT
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-3 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Close
            </Button>

            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <Button
                  size="sm"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs font-semibold h-9 px-4 rounded-lg gap-1.5 shadow-sm"
                >
                  <span>Apply with this Resume</span>
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[1.5]" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
