'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Check,
  Globe,
  MapPin,
} from 'lucide-react';
import type { PublicJob } from '@/lib/jobs/service';
import { formatSalary, formatEligibility } from '@/lib/jobs/helpers';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ShareJobButton } from './share-job-button';

export interface JobCardProps {
  job: PublicJob | any;
  isSaved?: boolean;
  isApplied?: boolean;
  onBookmarkToggle?: (e: React.MouseEvent, job: any) => void;
  onApplyClick?: (e: React.MouseEvent, job: any) => void;
  onSelect?: (job: any) => void;
  variant?: 'standard' | 'featured';
  className?: string;
  isTarget?: boolean;
  extraFooter?: React.ReactNode;
}

function getInitials(name: string): string {
  if (!name) return 'CO';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatPostedAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `Posted ${diffMins}m ago`;
    }
    if (diffHours < 24) return `Posted ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Posted yesterday';
    if (diffDays < 30) return `Posted ${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `Posted ${diffMonths}mo ago`;
  } catch {
    return 'Posted recently';
  }
}

/**
 * Normalizes modality and clean location to prevent redundant repeats (e.g. "Remote" + "Worldwide Remote").
 */
export function getCleanFacts(job: any) {
  const rawMode = job.modality || job.work_mode || 'Remote';
  let mode = 'Remote';
  if (String(rawMode).toLowerCase().includes('hybrid')) mode = 'Hybrid';
  else if (String(rawMode).toLowerCase().includes('onsite')) mode = 'Onsite';

  let location = job.city_location || job.location_rule || job.candidate_required_location || job.location || 'Worldwide';
  // Strip redundant "Remote" from location if already displayed in mode
  if (mode.toLowerCase() === 'remote') {
    location = location.replace(/remote\s*\(\s*worldwide\s*\)/gi, 'Worldwide');
    location = location.replace(/\b(remote|worldwide remote|remote global)\b/gi, 'Worldwide').trim();
    if (location.toLowerCase() === 'worldwide worldwide' || location.toLowerCase() === 'worldwide (worldwide)') {
      location = 'Worldwide';
    }
  }
  if (location.toLowerCase() === 'africa only' || location.toLowerCase() === 'africa_only') {
    location = 'Africa-wide';
  }
  if (!location) {
    location = mode === 'Remote' ? 'Worldwide' : 'Africa-wide';
  }

  const jobType = job.employment_type || job.job_type || 'Full-time';

  return { mode, location, jobType };
}

export function JobCard({
  job,
  isSaved = false,
  isApplied = false,
  onBookmarkToggle,
  onApplyClick,
  onSelect,
  variant,
  className,
  isTarget = false,
  extraFooter,
}: JobCardProps) {
  const isFeatured = variant === 'featured' || Boolean(job.is_featured);
  const companyName = job.company || job.company_name || 'Employer';
  const postedDate = job.posted_date || job.posted_at || job.published_at || job.created_at || new Date().toISOString();
  const summaryText = job.summary || (job.description ? job.description.slice(0, 200).replace(/<[^>]*>?/gm, '').trim() + '...' : '');
  const jobSlug = job.slug || job.id;

  // Pure helpers from Prompt 3 data task
  const salaryResult = formatSalary(job);
  const eligibilityResult = formatEligibility(job, 3);
  const facts = getCleanFacts(job);

  // Modality dot color
  const modalityDotColor =
    facts.mode.toLowerCase() === 'remote'
      ? 'bg-emerald-500'
      : facts.mode.toLowerCase() === 'hybrid'
      ? 'bg-sky-500'
      : 'bg-amber-500';

  // Filter skills tags to exclude noise (never location or modality in skills)
  const skillsList = (job.skills || [])
    .filter((s: string) => {
      const lower = String(s).toLowerCase();
      return (
        !['remote', 'hybrid', 'onsite', 'full-time', 'part-time', 'contract', 'worldwide', 'nigeria', 'kenya', 'ghana', 'africa'].includes(lower)
      );
    })
    .slice(0, 4);

  const totalSkills = (job.skills || []).length;
  const hiddenSkillsCount = Math.max(0, totalSkills - skillsList.length);

  const handleTitleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      // If parent handles detail dialog selection, prevent full-page navigation
      e.preventDefault();
      onSelect(job);
    }
  };

  return (
    <article
        id={`job-card-${job.id}`}
        className={cn(
          'relative group p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between h-full',
          isFeatured
            ? 'border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-neutral-900 dark:to-neutral-900 shadow-sm hover:border-amber-400 dark:hover:border-amber-600'
            : 'border-border/80 bg-white dark:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white',
          isTarget && 'ring-2 ring-emerald-500 border-emerald-500 shadow-md',
          className
        )}
      >
        <div className="space-y-3.5">
          {/* Header Row: Company Logo, Company Name, Role Verified Badge, and Featured Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-border/70 flex items-center justify-center font-bold text-xs text-neutral-800 dark:text-neutral-200 flex-shrink-0 overflow-hidden">
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={`${companyName} logo`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  getInitials(companyName)
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {companyName}
                </p>

                {(isFeatured || Boolean(job.is_startup || (Array.isArray(job.tags) && job.tags.some((t: string) => t.toLowerCase() === 'startup'))) || (typeof job.matchScore === 'number' && job.matchScore > 0)) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {/* Text-only Featured Badge on Featured Cards (High Contrast >= 4.5:1) */}
                    {isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-950 dark:text-amber-100 bg-amber-200/80 dark:bg-amber-900/80 border border-amber-300 dark:border-amber-700">
                        Featured
                      </span>
                    )}

                    {/* Startup Vacancy Badge (Clean, No Emoji) */}
                    {Boolean(job.is_startup || (Array.isArray(job.tags) && job.tags.some((t: string) => t.toLowerCase() === 'startup'))) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                        <span>Startup</span>
                      </span>
                    )}

                    {/* Recommendation Match Badge */}
                    {typeof job.matchScore === 'number' && job.matchScore > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
                        <span>{job.matchScore}% match</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title Row: Stretched Link across the entire card */}
          <div>
            <h3 className="text-lg font-bold text-neutral-950 dark:text-white leading-snug">
              <Link
                href={`/jobs/${jobSlug}`}
                onClick={handleTitleClick}
                className="after:absolute after:inset-0 hover:underline hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors focus:outline-none"
              >
                {job.title}
              </Link>
            </h3>
          </div>

          {/* Facts Row: One line, dot-separated (bold salary · mode with dot · location · job type) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            {/* Bold Salary or Muted "Salary not disclosed" */}
            <span
              className={
                salaryResult.isDisclosed
                  ? 'font-bold text-neutral-950 dark:text-white'
                  : 'font-normal text-neutral-500 dark:text-neutral-400'
              }
            >
              {salaryResult.formatted}
            </span>
            <span className="text-neutral-400" aria-hidden="true">·</span>

            {/* Work Mode with Coloured Dot + Text */}
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', modalityDotColor)} aria-hidden="true" />
              <span>{facts.mode}</span>
            </span>
            <span className="text-neutral-400" aria-hidden="true">·</span>

            {/* Clean Location without Redundancy */}
            <span>{facts.location}</span>
            <span className="text-neutral-400" aria-hidden="true">·</span>

            {/* Job Type */}
            <span>{facts.jobType}</span>
          </div>

          {/* Eligibility Line with Globe Icon */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
            <Globe className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
            <span>{eligibilityResult.label}</span>

            {/* Accessible +N Countries Popover */}
            {eligibilityResult.hiddenCount > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="relative z-10 px-1.5 py-0.2 rounded font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors underline focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    aria-label={`View all ${eligibilityResult.fullList.length} eligible countries`}
                  >
                    +{eligibilityResult.hiddenCount}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 p-3.5 text-xs bg-white dark:bg-neutral-900 border border-border shadow-xl rounded-2xl z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Eligible Countries ({eligibilityResult.fullList.length})
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
                    {eligibilityResult.fullList.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Summary: 2 lines, truncated at word boundary */}
          <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
            {summaryText}
          </p>

          {/* Tags Row: Skills only, max 4 plus +N */}
          {skillsList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {skillsList.map((skill: string) => (
                <span
                  key={skill}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-border/60"
                >
                  {skill}
                </span>
              ))}
              {hiddenSkillsCount > 0 && (
                <span className="text-[11px] font-medium text-neutral-500 px-1">
                  +{hiddenSkillsCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Posted date · Bookmark button · Primary Apply button */}
        <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-medium">
            {formatPostedAgo(postedDate)}
          </span>

          <div className="flex items-center gap-2">
            {/* Share Job Listing Button */}
            <ShareJobButton job={job} />

            {/* Icon-Only Bookmark Button above stretched link */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onBookmarkToggle) onBookmarkToggle(e, job);
              }}
              aria-label={`Save to SyncFlow: ${job.title}`}
              aria-pressed={isSaved}
              className="relative z-10 min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <Bookmark
                className={cn(
                  'w-4 h-4',
                  isSaved
                    ? 'fill-neutral-950 dark:fill-white text-neutral-950 dark:text-white'
                    : ''
                )}
              />
            </button>

            {/* Primary Apply Button / Disabled Applied State above stretched link */}
            {isApplied ? (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="relative z-10 min-h-[44px] px-4 py-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-semibold cursor-not-allowed flex items-center gap-1.5 shadow-none select-none"
              >
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" aria-hidden="true" />
                <span>Applied</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onApplyClick) onApplyClick(e, job);
                }}
                className="relative z-10 min-h-[44px] px-4 py-2.5 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                Apply
              </button>
            )}
          </div>
        </div>

        {extraFooter && (
          <div
            className="mt-3 pt-3 border-t border-border/40 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {extraFooter}
          </div>
        )}
      </article>
  );
}
