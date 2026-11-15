// components/home/latest-roles-section.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { JobCard } from '@/components/jobs/job-card';
import { JobDetailDialog } from '@/components/jobs/job-detail-dialog';
import { homeCopy } from '@/content/home';
import { PublicJob } from '@/lib/jobs/service';
import {
  getLocalTrackerItems,
  saveJobToTracker,
  removeJobFromTracker,
} from '@/lib/tracker';
import { toast } from 'sonner';

interface LatestRolesSectionProps {
  jobs: PublicJob[];
  rolesLive?: number;
}

export function LatestRolesSection({ jobs = [], rolesLive }: LatestRolesSectionProps) {
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);

  // Sync saved & applied status with SyncFlow
  useEffect(() => {
    const syncStatus = () => {
      try {
        const items = getLocalTrackerItems();
        const saved = new Set<string>();
        const applied = new Set<string>();
        items.forEach((item) => {
          if (item.status === 'SAVED') saved.add(item.id);
          else if (['APPLIED', 'INTERVIEWING', 'OFFER'].includes(item.status)) applied.add(item.id);
        });
        setSavedJobIds(saved);
        setAppliedJobIds(applied);
      } catch {}
    };

    syncStatus();
    window.addEventListener('sync730_tracker_updated', syncStatus);
    return () => window.removeEventListener('sync730_tracker_updated', syncStatus);
  }, []);

  const handleBookmarkToggle = async (e: React.MouseEvent | null, job: PublicJob) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isCurrentlySaved = savedJobIds.has(job.id);
    const updated = new Set(savedJobIds);

    if (isCurrentlySaved) {
      updated.delete(job.id);
      removeJobFromTracker(job.id);
      setSavedJobIds(updated);
    } else {
      updated.add(job.id);
      await saveJobToTracker({
        id: job.id,
        title: job.title,
        company: job.company,
        candidate_required_location: job.location_rule,
        location_tier: (job as any).location_tier || job.location_rule,
        apply_url: job.apply_url || (job as any).url,
      });
      setSavedJobIds(updated);

      toast('Saved to SyncFlow', {
        duration: 4500,
        action: {
          label: 'View',
          onClick: () => {
            window.dispatchEvent(new CustomEvent('sync730_open_syncflow'));
          },
        },
      });
    }
  };

  const handleApplyClick = (e: React.MouseEvent, job: PublicJob) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
  };

  // Limit between 3 and 6 newest public jobs
  const displayJobs = jobs.slice(0, 6);
  const liveCount = rolesLive || jobs.length || 26;

  if (displayJobs.length === 0) {
    return null;
  }

  return (
    <section
      id="latest-roles"
      aria-label="Latest verified roles"
      className="border-b border-border/70 bg-background py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-border/70">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{homeCopy.latestRoles.eyebrow}</span>
            </div>

            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-foreground">
              {homeCopy.latestRoles.h2}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {homeCopy.latestRoles.body}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <Link
              href={homeCopy.latestRoles.buttonHref}
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              <span>{homeCopy.latestRoles.buttonText}</span>
              <ArrowRight className="ml-2 h-4 w-4 stroke-[1.5]" aria-hidden="true" />
            </Link>

            <p className="text-xs text-muted-foreground">
              {liveCount} {homeCopy.latestRoles.metaSuffix}
            </p>
          </div>
        </div>

        {/* 3 to 6 Jobs Grid using Phase JobCard component */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedJobIds.has(job.id)}
              isApplied={appliedJobIds.has(job.id)}
              onBookmarkToggle={handleBookmarkToggle}
              onApplyClick={handleApplyClick}
              onSelect={() => setSelectedJob(job)}
            />
          ))}
        </div>

        {/* Bottom Bar Mobile CTA */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/70 md:hidden">
          <p className="text-xs text-muted-foreground">
            {liveCount} {homeCopy.latestRoles.metaSuffix}
          </p>
          <Link
            href={homeCopy.latestRoles.buttonHref}
            className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
          >
            <span>{homeCopy.latestRoles.buttonText}</span>
            <ArrowRight className="ml-2 h-4 w-4 stroke-[1.5]" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Accessible Job Detail Dialog */}
      {selectedJob && (
        <JobDetailDialog
          job={selectedJob}
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          isSaved={savedJobIds.has(selectedJob.id)}
          isApplied={appliedJobIds.has(selectedJob.id)}
          onBookmarkToggle={(job) => handleBookmarkToggle(null, job)}
        />
      )}
    </section>
  );
}
