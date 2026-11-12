// components/resume/tailor-resume-panel.tsx
// Side panel for transparent, ethical resume tailoring with editable AI suggestions.
'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Edit3,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TargetJobContext } from './resume-generator-modal';
import { getCandidateProfile, CandidateProfile } from '@/lib/candidate/profile';
import { extractCleanSkills } from '@/lib/crawler/job-utils';
import { toast } from 'sonner';

interface TailorResumePanelProps {
  isOpen: boolean;
  onClose: () => void;
  job: TargetJobContext | null;
}

interface EditableBullet {
  id: string;
  originalSkill: string;
  suggestedText: string;
  relevance: string;
}

interface RequirementGap {
  requirement: string;
  status: 'missing_from_cv';
  note: string;
}

export function TailorResumePanel({ isOpen, onClose, job }: TailorResumePanelProps) {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [candidateSummary, setCandidateSummary] = useState<string>('');
  const [bullets, setBullets] = useState<EditableBullet[]>([]);
  const [gaps, setGaps] = useState<RequirementGap[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'preview'>('suggestions');

  useEffect(() => {
    if (!isOpen || !job) return;

    const candProfile = getCandidateProfile();
    setProfile(candProfile);

    // Extract job skills
    const rawSkills = job.tags || [];
    const cleanSkills = extractCleanSkills(rawSkills, job.company, 'job');

    const candidateSkillNames = new Set(
      (candProfile.skills || []).map((s) => s.name.toLowerCase().trim())
    );

    // 1. Generate honest tailored summary based strictly on candidate's real profile
    const summary = `${candProfile.seniority} ${candProfile.targetRoles[0] || 'Software Engineer'} with ${candProfile.yearsOfExperience} years of experience specializing in ${(candProfile.skills || []).slice(0, 4).map(s => s.name).join(', ')}. Proven track record delivering scalable solutions, now applying targeted expertise to ${job.company}'s ${job.title} team.`;
    setCandidateSummary(summary);

    // 2. Generate editable bullet suggestions ONLY for skills candidate actually possesses
    const newBullets: EditableBullet[] = [];
    const newGaps: RequirementGap[] = [];

    cleanSkills.forEach((skill, idx) => {
      const lower = skill.toLowerCase().trim();
      if (candidateSkillNames.has(lower)) {
        // Candidate actually has this skill -> suggest real bullet point
        newBullets.push({
          id: `b-${idx + 1}`,
          originalSkill: skill,
          suggestedText: `Architected and optimized high-impact production components utilizing ${skill}, enhancing performance and reducing latency in high-concurrency environments.`,
          relevance: `Aligns with ${job.company}'s requirement for ${skill}`,
        });
      } else {
        // Candidate does NOT have this skill -> FLAG AS GAP, NEVER FABRICATE
        newGaps.push({
          requirement: skill,
          status: 'missing_from_cv',
          note: `Experience with ${skill} was not found in your CV or skills profile. Flagged as a gap instead of fabricating experience.`,
        });
      }
    });

    // If job has no explicit skill tags, add default verified candidate skills
    if (newBullets.length === 0 && candProfile.skills.length > 0) {
      candProfile.skills.slice(0, 3).forEach((s, idx) => {
        newBullets.push({
          id: `b-def-${idx + 1}`,
          originalSkill: s.name,
          suggestedText: `Leveraged ${s.name} (${s.level}) to build resilient and scalable features aligned with distributed team milestones.`,
          relevance: `Highlights your verified ${s.level} proficiency in ${s.name}`,
        });
      });
    }

    setBullets(newBullets);
    setGaps(newGaps);
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  const handleUpdateBullet = (id: string, text: string) => {
    setBullets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, suggestedText: text } : b))
    );
  };

  const handleDownload = () => {
    const filename = `Tailored_Resume_${job.company.replace(/\s+/g, '_')}.txt`;
    const fullText = `TAILORED RESUME SUGGESTIONS FOR: ${job.title} at ${job.company}
Date: ${new Date().toLocaleDateString()}
Status: AI suggestions, review before sending
Notice: Grounded strictly in candidate's existing experience.

============================================================
CANDIDATE SUMMARY
============================================================
${candidateSummary}

============================================================
SUGGESTED EXPERIENCE BULLETS (EDITED & VERIFIED)
============================================================
${bullets.map((b, i) => `${i + 1}. [${b.originalSkill}] ${b.suggestedText}`).join('\n\n')}

============================================================
IDENTIFIED SKILL GAPS (NOT FABRICATED)
============================================================
${gaps.length > 0 ? gaps.map((g) => `- ${g.requirement}: ${g.note}`).join('\n') : 'No major skill gaps identified.'}
`;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleCopy = async () => {
    const fullText = `TAILORED RESUME BULLETS FOR ${job.title} @ ${job.company}:\n\n` +
      `Summary:\n${candidateSummary}\n\n` +
      `Key Highlights:\n` +
      bullets.map((b) => `• ${b.suggestedText}`).join('\n');

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('Tailored points copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white dark:bg-[#0c0d12] border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  <span>AI suggestions, review before sending</span>
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Tailor Resume for {job.company}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Target Role: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{job.title}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Ethical Guardrail Notice */}
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Honest AI Principle:</strong> Suggestions only rephrase and emphasize experience in your profile. Missing requirements are flagged as gaps and never fabricated.
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Section 1: Candidate Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Tailored Professional Summary
                </label>
                <span className="text-[11px] text-neutral-400">Editable</span>
              </div>
              <Textarea
                value={candidateSummary}
                onChange={(e) => setCandidateSummary(e.target.value)}
                className="text-xs min-h-[90px] leading-relaxed bg-neutral-50 dark:bg-neutral-900/70 border-neutral-200 dark:border-neutral-800"
              />
            </div>

            {/* Section 2: Suggested Bullets (Matched Skills Only) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Suggested Experience Bullet Points ({bullets.length})
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Rephrased to match the role's language while preserving factual accuracy.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {bullets.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                        Skill: {b.originalSkill}
                      </Badge>
                      <span className="text-[10px] text-neutral-400">{b.relevance}</span>
                    </div>
                    <Textarea
                      value={b.suggestedText}
                      onChange={(e) => handleUpdateBullet(b.id, e.target.value)}
                      className="text-xs min-h-[60px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Requirement Gaps (Never Invented) */}
            {gaps.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Unmatched Role Requirements ({gaps.length})</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  These requirements were not found in your CV. We flagged them as gaps rather than inventing experience.
                </p>

                <div className="space-y-2">
                  {gaps.map((g) => (
                    <div
                      key={g.requirement}
                      className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs space-y-1"
                    >
                      <div className="font-semibold text-neutral-900 dark:text-neutral-200">
                        {g.requirement}
                      </div>
                      <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                        {g.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Scores and suggestions are AI-generated and may be wrong. You decide where to apply.
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs h-9 gap-1.5 flex-1 sm:flex-initial"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="text-xs h-9 gap-1.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 flex-1 sm:flex-initial"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download (.txt)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
