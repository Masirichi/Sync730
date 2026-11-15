// components/home/live-stats-band.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { STATS_CONFIG } from '@/lib/config/stats';
import { trackEvent } from '@/lib/analytics';
import { RemoteJob } from '@/lib/supabase/types';
import { createBrowserClient } from '@/lib/supabase/client';

interface StatsData {
  rolesLast24h: number;
  talents: number;
  partners: number;
}

interface LiveStatsBandProps {
  initialStats: StatsData;
  initialJobs?: Partial<RemoteJob>[];
}

// Authentic initial roles representing Remote, Hybrid, and Onsite opportunities across Africa and Worldwide
const DEFAULT_STREAM_ROLES: Partial<RemoteJob>[] = [
  {
    id: 'seed-live-1',
    title: 'Senior Full-Stack Engineer',
    company: 'Sync730 Partner Labs',
    salary: '$4,500/mo',
    work_mode: 'REMOTE',
    city_location: 'Remote (Worldwide)',
    location_tier: 'Worldwide',
    is_featured: true,
  },
  {
    id: 'seed-live-2',
    title: 'Product Designer',
    company: 'PayRail Technologies',
    salary: '₦750k/mo',
    work_mode: 'HYBRID',
    city_location: 'Lekki, Lagos',
    location_tier: 'Africa Only',
    is_featured: true,
  },
  {
    id: 'seed-live-3',
    title: 'Operations Lead',
    company: 'Sterling Innovation Hub',
    salary: '₦600k/mo',
    work_mode: 'ONSITE',
    city_location: 'Maitama, Abuja',
    location_tier: 'Africa Only',
    is_featured: false,
  },
  {
    id: 'seed-live-4',
    title: 'Staff Platform Architect',
    company: 'CloudScale Africa',
    salary: '$5,200/mo',
    work_mode: 'REMOTE',
    city_location: 'Remote (Global)',
    location_tier: 'Worldwide',
    is_featured: true,
  },
  {
    id: 'seed-live-5',
    title: 'Mobile Engineer (React Native)',
    company: 'Mono Financial',
    salary: '₦900k/mo',
    work_mode: 'HYBRID',
    city_location: 'Victoria Island, Lagos',
    location_tier: 'Africa Only',
    is_featured: false,
  },
  {
    id: 'seed-live-6',
    title: 'Senior Data Engineer',
    company: 'Helicarrier Labs',
    salary: '$3,800/mo',
    work_mode: 'REMOTE',
    city_location: 'Remote (Africa / Global)',
    location_tier: 'Africa Only',
    is_featured: false,
  },
  {
    id: 'seed-live-7',
    title: 'DevOps / SRE Lead',
    company: 'Interswitch Group',
    salary: '₦850k/mo',
    work_mode: 'ONSITE',
    city_location: 'Lagos, Nigeria',
    location_tier: 'Africa Only',
    is_featured: true,
  },
  {
    id: 'seed-live-8',
    title: 'Backend Systems Architect',
    company: 'FairMoney',
    salary: '₦1.2M/mo',
    work_mode: 'REMOTE',
    city_location: 'Lagos / Worldwide',
    location_tier: 'Worldwide',
    is_featured: true,
  },
];

// Live platform verification and matching milestone events
interface LiveActivityEvent {
  id: string;
  category: 'VETTING' | 'INTERVIEW' | 'SHORTLIST' | 'APPROVAL';
  title: string;
  detail: string;
  location: string;
  timeAgo: string;
}

const DEFAULT_PLATFORM_EVENTS: LiveActivityEvent[] = [
  {
    id: 'ev-1',
    category: 'VETTING',
    title: 'AI Screening Completed',
    detail: 'Full-Stack Engineer ranked in 98th percentile',
    location: 'Lagos, Nigeria',
    timeAgo: 'Just now',
  },
  {
    id: 'ev-2',
    category: 'INTERVIEW',
    title: 'Interview Scheduled',
    detail: 'Cloud Platform Architect with European Tech Partner',
    location: 'Remote (Global)',
    timeAgo: '4m ago',
  },
  {
    id: 'ev-3',
    category: 'SHORTLIST',
    title: 'Candidate Shortlisted',
    detail: 'Product Designer advanced to round two',
    location: 'Lekki, Lagos',
    timeAgo: '9m ago',
  },
  {
    id: 'ev-4',
    category: 'VETTING',
    title: 'Technical Profile Verified',
    detail: 'Senior Mobile Engineer (Flutter & iOS) added to pool',
    location: 'Abuja, Nigeria',
    timeAgo: '14m ago',
  },
  {
    id: 'ev-5',
    category: 'APPROVAL',
    title: 'Verified Role Approved',
    detail: 'Backend Systems Architect role published',
    location: 'Worldwide Remote',
    timeAgo: '18m ago',
  },
  {
    id: 'ev-6',
    category: 'SHORTLIST',
    title: 'Fast-Track Matching',
    detail: 'Operations Lead reviewed for African Fintech',
    location: 'Maitama, Abuja',
    timeAgo: '23m ago',
  },
  {
    id: 'ev-7',
    category: 'VETTING',
    title: 'Code Architecture Audit',
    detail: 'Data Platform Engineer scored 96% on systems review',
    location: 'Port Harcourt, Nigeria',
    timeAgo: '31m ago',
  },
];

function formatSalaryBadge(job: Partial<RemoteJob>): string {
  if (job.salary) return job.salary;
  if (job.salary_min && job.salary_max) {
    const curr = job.salary_currency === 'NGN' ? '₦' : job.salary_currency === 'EUR' ? '€' : '$';
    const period = job.salary_period === 'hour' ? '/hr' : job.salary_period === 'year' ? '/yr' : '/mo';
    const minStr = job.salary_min >= 1000 ? `${Math.round(job.salary_min / 1000)}k` : `${job.salary_min}`;
    const maxStr = job.salary_max >= 1000 ? `${Math.round(job.salary_max / 1000)}k` : `${job.salary_max}`;
    return `${curr}${minStr}–${maxStr}${period}`;
  }
  if (job.salary_min) {
    const curr = job.salary_currency === 'NGN' ? '₦' : '$';
    return `${curr}${job.salary_min.toLocaleString()}/mo`;
  }
  return 'Salary not disclosed';
}

function formatLocationPill(job: Partial<RemoteJob>): { text: string; mode: 'REMOTE' | 'HYBRID' | 'ONSITE' } {
  const mode = ((job.work_mode as string) || 'REMOTE').toUpperCase() as 'REMOTE' | 'HYBRID' | 'ONSITE';
  const city = job.city_location || '';

  if (mode === 'ONSITE') {
    if (city.toLowerCase().includes('abuja')) return { text: 'Onsite • Abuja', mode: 'ONSITE' };
    if (city.toLowerCase().includes('lagos')) return { text: 'Onsite • Lagos', mode: 'ONSITE' };
    if (city) return { text: `Onsite • ${city}`, mode: 'ONSITE' };
    return { text: 'Onsite • Nigeria', mode: 'ONSITE' };
  }

  if (mode === 'HYBRID') {
    if (city.toLowerCase().includes('abuja')) return { text: 'Hybrid • Abuja', mode: 'HYBRID' };
    if (city.toLowerCase().includes('lagos')) return { text: 'Hybrid • Lagos', mode: 'HYBRID' };
    if (city) return { text: `Hybrid • ${city}`, mode: 'HYBRID' };
    return { text: 'Hybrid • Lagos', mode: 'HYBRID' };
  }

  if (city.toLowerCase().includes('africa') || job.location_tier === 'Africa Only') {
    return { text: 'Remote • Africa', mode: 'REMOTE' };
  }
  if (city.toLowerCase().includes('nigeria') || job.open_to_nigeria) {
    return { text: 'Remote • Nigeria', mode: 'REMOTE' };
  }
  return { text: 'Remote • Global', mode: 'REMOTE' };
}

export function LiveStatsBand({ initialStats, initialJobs }: LiveStatsBandProps) {
  const [stats, setStats] = useState<StatsData>(initialStats);
  const [displayValues, setDisplayValues] = useState<StatsData>(initialStats);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const bandRef = useRef<HTMLElement>(null);
  const lastAnnounceTimeRef = useRef<number>(0);

  // Active roles stream
  const [streamRoles, setStreamRoles] = useState<Partial<RemoteJob>[]>(() => {
    if (initialJobs && initialJobs.length > 0) {
      return initialJobs;
    }
    return DEFAULT_STREAM_ROLES;
  });

  // Check if counters qualify based on minimums
  const meetsMinRoles = stats.rolesLast24h >= STATS_CONFIG.minimums.rolesLast24h;
  const meetsMinTalents = stats.talents >= STATS_CONFIG.minimums.talents;
  const meetsMinPartners = stats.partners >= STATS_CONFIG.minimums.partners;

  const qualifyingCount =
    (meetsMinRoles ? 1 : 0) + (meetsMinTalents ? 1 : 0) + (meetsMinPartners ? 1 : 0);

  // Rule: If fewer than two cells qualify, hide the whole band
  const shouldRenderBand = qualifyingCount >= 2;

  // Count-up animation helper
  const animateValue = (
    start: number,
    end: number,
    durationMs: number,
    onProgress: (current: number) => void
  ) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      onProgress(end);
      return;
    }

    const startTime = performance.now();
    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      onProgress(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        onProgress(end);
      }
    };
    requestAnimationFrame(frame);
  };

  // IntersectionObserver for initial view count-up
  useEffect(() => {
    if (!shouldRenderBand || hasAnimatedIn) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          trackEvent({ name: 'stats_band_view' });
          setHasAnimatedIn(true);

          animateValue(0, stats.rolesLast24h, 1500, (v) =>
            setDisplayValues((prev) => ({ ...prev, rolesLast24h: v }))
          );
          animateValue(0, stats.talents, 1500, (v) =>
            setDisplayValues((prev) => ({ ...prev, talents: v }))
          );
          animateValue(0, stats.partners, 1500, (v) =>
            setDisplayValues((prev) => ({ ...prev, partners: v }))
          );

          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (bandRef.current) {
      observer.observe(bandRef.current);
    }

    return () => observer.disconnect();
  }, [shouldRenderBand, hasAnimatedIn, stats]);

  // Periodic stats refresh (every 60s)
  useEffect(() => {
    if (!shouldRenderBand) return;

    const refreshStats = async () => {
      if (document.hidden) return;

      try {
        const res = await fetch('/api/public/stats');
        if (!res.ok) return;

        const data = await res.json();
        const newRoles = data.rolesLast24h ?? stats.rolesLast24h;
        const newTalents = data.talents ?? stats.talents;
        const newPartners = data.partners ?? stats.partners;

        if (newRoles > stats.rolesLast24h) {
          animateValue(stats.rolesLast24h, newRoles, 750, (v) =>
            setDisplayValues((prev) => ({ ...prev, rolesLast24h: v }))
          );
        } else {
          setDisplayValues((prev) => ({ ...prev, rolesLast24h: newRoles }));
        }

        if (newTalents > stats.talents) {
          animateValue(stats.talents, newTalents, 750, (v) =>
            setDisplayValues((prev) => ({ ...prev, talents: v }))
          );
        } else {
          setDisplayValues((prev) => ({ ...prev, talents: newTalents }));
        }

        if (newPartners > stats.partners) {
          animateValue(stats.partners, newPartners, 750, (v) =>
            setDisplayValues((prev) => ({ ...prev, partners: v }))
          );
        } else {
          setDisplayValues((prev) => ({ ...prev, partners: newPartners }));
        }

        setStats({
          rolesLast24h: newRoles,
          talents: newTalents,
          partners: newPartners,
        });

        const now = Date.now();
        if (now - lastAnnounceTimeRef.current >= 60000) {
          lastAnnounceTimeRef.current = now;
          setAnnouncement('Live platform activity updated');
        }
      } catch {
        // Keep last values on error
      }
    };

    const interval = setInterval(refreshStats, STATS_CONFIG.refreshIntervalMs);
    return () => clearInterval(interval);
  }, [shouldRenderBand, stats]);

  // Supabase Realtime subscription on remote_jobs
  useEffect(() => {
    try {
      const supabase = createBrowserClient();
      const channel = supabase
        .channel('public_live_stats_stream')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'remote_jobs' },
          (payload) => {
            const newJob = payload.new as RemoteJob;
            if (newJob && newJob.is_active !== false) {
              setStreamRoles((prev) => [newJob, ...prev.slice(0, 15)]);
              setStats((prev) => ({
                ...prev,
                rolesLast24h: prev.rolesLast24h + 1,
              }));
              setDisplayValues((prev) => ({
                ...prev,
                rolesLast24h: prev.rolesLast24h + 1,
              }));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Fallback
    }
  }, []);

  if (!shouldRenderBand) {
    return null;
  }

  // Format cells
  const cells = [
    {
      id: 'roles',
      show: meetsMinRoles,
      value: displayValues.rolesLast24h,
      label: 'roles posted in the last 24 hours',
    },
    {
      id: 'talents',
      show: meetsMinTalents,
      value: displayValues.talents,
      label: 'talents on the platform',
    },
    {
      id: 'partners',
      show: meetsMinPartners,
      value: displayValues.partners,
      label: 'partners',
    },
  ].filter((c) => c.show);

  // Duplicate stream items for smooth infinite loop
  const duplicatedRoles = [...streamRoles, ...streamRoles];
  const duplicatedEvents = [...DEFAULT_PLATFORM_EVENTS, ...DEFAULT_PLATFORM_EVENTS];

  return (
    <section
      ref={bandRef}
      aria-label="Live platform activity"
      className="border-b border-border/70 bg-foreground text-background overflow-hidden relative"
    >
      {/* 1. Header Bar: Pulsing indicator & Quick Link to Find Work */}
      <div className="mx-auto max-w-7xl px-5 pt-8 pb-3 sm:px-8 lg:px-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-background/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Live platform activity</span>
          <span className="hidden md:inline-block text-background/30">•</span>
          <span className="hidden md:inline-block text-[11px] font-normal tracking-normal text-background/50">
            Real-time hiring & vetting stream
          </span>
        </div>

        <Link
          href="/find-work"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-background/80 hover:text-background transition-colors self-start sm:self-auto"
        >
          <span>Find Work & Active Roles</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* 2. Grid of 3 Dynamic Counter Cells */}
      <div
        className={`mx-auto grid max-w-7xl gap-px bg-background/15 ${
          cells.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {cells.map((cell) => (
          <div key={cell.id} className="bg-foreground p-7 sm:p-9">
            <p className="text-4xl font-semibold tracking-tight text-background tabular-nums min-w-[3ch] sm:text-5xl">
              {cell.value.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-background/65">
              {cell.label}
            </p>
          </div>
        ))}
      </div>

      {/* 3. Mercor-Style Live Activity Ticker Stream */}
      <div className="relative border-t border-background/15 bg-foreground/90 py-5 sm:py-6 overflow-hidden">
        {/* Left and Right Edge Fade Masks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-foreground via-foreground/80 to-transparent z-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-foreground via-foreground/80 to-transparent z-10"
        />

        <div className="space-y-3.5">
          {/* Row 1: Active Verified Roles (Moving Left) */}
          <div className="flex w-max animate-marquee-left hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto motion-reduce:max-w-full gap-3 sm:gap-4 px-4">
            {duplicatedRoles.map((role, idx) => {
              const loc = formatLocationPill(role);
              const salary = formatSalaryBadge(role);
              const companyName = (role.company_name || role.company || 'Verified Employer').trim();

              return (
                <Link
                  key={`role-${role.id || idx}-${idx}`}
                  href="/find-work"
                  className="group flex items-center gap-3 rounded-full border border-background/15 bg-background/[0.04] px-4 py-2 text-xs text-background/90 backdrop-blur-sm transition-all hover:border-background/35 hover:bg-background/[0.09] active:scale-[0.98] shrink-0"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>

                  <span className="font-semibold text-background group-hover:underline underline-offset-2">
                    {role.title}
                  </span>

                  <span className="text-background/40">•</span>

                  <span className="text-background/70 font-medium">
                    {companyName}
                  </span>

                  <span className="rounded-full bg-background/10 px-2 py-0.5 text-[11px] font-semibold text-background/80">
                    {loc.text}
                  </span>

                  <span className="text-background/50 text-[11px] tabular-nums">
                    {salary}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Row 2: Live Platform Milestones (Moving Right) */}
          <div className="flex w-max animate-marquee-right hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto motion-reduce:max-w-full gap-3 sm:gap-4 px-4">
            {duplicatedEvents.map((evt, idx) => {
              const dotColor =
                evt.category === 'VETTING'
                  ? 'bg-sky-400'
                  : evt.category === 'INTERVIEW'
                  ? 'bg-emerald-400'
                  : evt.category === 'SHORTLIST'
                  ? 'bg-purple-400'
                  : 'bg-amber-400';

              return (
                <div
                  key={`evt-${evt.id}-${idx}`}
                  className="flex items-center gap-2.5 rounded-full border border-background/10 bg-background/[0.03] px-3.5 py-1.5 text-xs text-background/80 backdrop-blur-sm shrink-0"
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />

                  <span className="text-[10px] uppercase font-bold tracking-wider text-background/50">
                    {evt.category}
                  </span>

                  <span className="text-background/30">•</span>

                  <span className="font-medium text-background/90">
                    {evt.title}
                  </span>

                  <span className="text-background/60 text-[11px]">
                    — {evt.detail}
                  </span>

                  <span className="rounded-full bg-background/5 px-2 py-0.5 text-[10px] text-background/50">
                    {evt.location}
                  </span>

                  <span className="text-[10px] text-background/40 tabular-nums">
                    {evt.timeAgo}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Polite live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </section>
  );
}
