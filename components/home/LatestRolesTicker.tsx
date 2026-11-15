// components/home/LatestRolesTicker.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase/client';
import { RemoteJob } from '@/lib/supabase/types';

export interface LatestRolesTickerProps {
  initialJobs?: RemoteJob[];
}

// 12 Authentic fallback roles representing Remote, Hybrid, and Onsite opportunities
const FALLBACK_ROLES: Partial<RemoteJob>[] = [
  {
    id: 'seed-job-1',
    title: 'Senior Full-Stack Engineer',
    company: 'Mercor Partner Labs',
    salary: '$4,500/mo',
    work_mode: 'REMOTE',
    city_location: 'Remote (Worldwide)',
    location_tier: 'Worldwide',
    is_featured: true,
  },
  {
    id: 'seed-job-3',
    title: 'Product Designer',
    company: 'PayRail Technologies',
    salary: '₦750k/mo',
    work_mode: 'HYBRID',
    city_location: 'Lekki, Lagos',
    location_tier: 'Africa Only',
    is_featured: true,
  },
  {
    id: 'seed-job-4',
    title: 'Operations Lead',
    company: 'Sterling Innovation Hub',
    salary: '₦600k/mo',
    work_mode: 'ONSITE',
    city_location: 'Maitama, Abuja',
    location_tier: 'Africa Only',
    is_featured: false,
  },
  {
    id: 'seed-job-2',
    title: 'Staff Platform Architect',
    company: 'CloudScale Africa',
    salary: '$5,200/mo',
    work_mode: 'REMOTE',
    city_location: 'Remote (Global)',
    location_tier: 'Worldwide',
    is_featured: true,
  },
  {
    id: 'seed-job-5',
    title: 'Mobile Engineer (React Native)',
    company: 'Mono Financial',
    salary: '₦900k/mo',
    work_mode: 'HYBRID',
    city_location: 'Victoria Island, Lagos',
    location_tier: 'Africa Only',
    is_featured: false,
  },
  {
    id: 'seed-job-6',
    title: 'Senior Data Engineer',
    company: 'Helicarrier Labs',
    salary: '$3,800/mo',
    work_mode: 'REMOTE',
    city_location: 'Remote (Africa / Global)',
    location_tier: 'Africa Only',
    is_featured: false,
  },
  {
    id: 'seed-job-7',
    title: 'DevOps / SRE Lead',
    company: 'Interswitch Group',
    salary: '₦850k/mo',
    work_mode: 'ONSITE',
    city_location: 'Lagos, Nigeria',
    location_tier: 'Africa Only',
    is_featured: true,
  },
  {
    id: 'seed-job-8',
    title: 'Growth Product Manager',
    company: 'Bamboo Invest',
    salary: '$3,500/mo',
    work_mode: 'REMOTE',
    city_location: 'Remote (Global)',
    location_tier: 'Worldwide',
    is_featured: false,
  },
  {
    id: 'seed-job-9',
    title: 'Backend Systems Architect',
    company: 'FairMoney',
    salary: '₦1.2M/mo',
    work_mode: 'REMOTE',
    city_location: 'Lagos / Worldwide',
    location_tier: 'Worldwide',
    is_featured: true,
  },
  {
    id: 'seed-job-10',
    title: 'Frontend Engineer (Next.js)',
    company: 'Eden Life',
    salary: '₦650k/mo',
    work_mode: 'HYBRID',
    city_location: 'Yaba, Lagos',
    location_tier: 'Africa Only',
    is_featured: false,
  },
  {
    id: 'seed-job-11',
    title: 'Cybersecurity Analyst',
    company: 'FirstBank Digital',
    salary: '₦700k/mo',
    work_mode: 'ONSITE',
    city_location: 'CBD, Abuja',
    location_tier: 'Africa Only',
    is_featured: false,
  },
  {
    id: 'seed-job-12',
    title: 'AI / ML Solutions Engineer',
    company: 'AfriTech Innovations',
    salary: '$4,200/mo',
    work_mode: 'REMOTE',
    city_location: 'Remote (Worldwide)',
    location_tier: 'Worldwide',
    is_featured: true,
  },
];

// Helper to resolve clean salary display string
function getSalaryBadge(job: Partial<RemoteJob>): string {
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
  return 'Competitive';
}

// Helper to resolve clean work mode and location display string
function getLocationPill(job: Partial<RemoteJob>): { text: string; mode: 'REMOTE' | 'HYBRID' | 'ONSITE' } {
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

  // REMOTE
  if (city.toLowerCase().includes('africa') || job.location_tier === 'Africa Only') {
    return { text: 'Remote • Africa', mode: 'REMOTE' };
  }
  if (city.toLowerCase().includes('nigeria') || job.open_to_nigeria) {
    return { text: 'Remote • Nigeria', mode: 'REMOTE' };
  }
  return { text: 'Remote • Global', mode: 'REMOTE' };
}

export function LatestRolesTicker({ initialJobs = [] }: LatestRolesTickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [jobs, setJobs] = useState<Partial<RemoteJob>[]>(() => {
    if (initialJobs && initialJobs.length > 0) {
      return initialJobs;
    }
    return FALLBACK_ROLES;
  });

  // Client-side fetcher to sync latest jobs
  const fetchLatestJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        if (data?.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
      }
    } catch {
      // Retain existing
    }
  };

  // 1. Subscribe to Supabase Realtime & browser events
  useEffect(() => {
    let supabase: any;
    try {
      supabase = createBrowserClient();
    } catch {
      supabase = null;
    }

    let channel: any = null;
    if (supabase) {
      try {
        channel = supabase
          .channel('public:remote_jobs_ticker')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'remote_jobs' },
            (payload: any) => {
              if (payload.new && payload.new.is_active !== false) {
                const newJob = payload.new;
                setJobs((prev) => {
                  const exists = prev.findIndex((j) => j.id === newJob.id);
                  if (exists >= 0) {
                    const updated = [...prev];
                    updated[exists] = { ...updated[exists], ...newJob };
                    return updated;
                  }
                  return [newJob, ...prev].slice(0, 18);
                });
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription fallback:', e);
      }
    }

    const handleLocalSync = () => {
      fetchLatestJobs();
    };

    window.addEventListener('sync730_remote_jobs_updated', handleLocalSync);
    window.addEventListener('sync730_admin_jobs_updated', handleLocalSync);

    return () => {
      if (supabase && channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
      window.removeEventListener('sync730_remote_jobs_updated', handleLocalSync);
      window.removeEventListener('sync730_admin_jobs_updated', handleLocalSync);
    };
  }, []);

  // Split jobs into two rows for the dual-row infinite marquee
  const { row1, row2 } = useMemo(() => {
    const list = jobs.length >= 6 ? jobs : FALLBACK_ROLES;
    const half = Math.ceil(list.length / 2);
    const firstHalf = list.slice(0, half);
    const secondHalf = list.slice(half);

    // Duplicate arrays to achieve seamless infinite looping
    return {
      row1: [...firstHalf, ...firstHalf, ...firstHalf],
      row2: [...secondHalf, ...secondHalf, ...secondHalf],
    };
  }, [jobs]);

  const activeCount = Math.max(jobs.length, 25);

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-[#fcfcf9] dark:bg-neutral-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* 2. Mercor-Style Header & Social Proof Counters */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-border/40">
          <div className="max-w-2xl space-y-4">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Hiring Now • Live Feed</span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 dark:text-white">
              Latest roles
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore curated remote global roles alongside top-tier hybrid and onsite opportunities in Lagos, Abuja, and across Africa. Synced live with verified employers.
            </p>
          </div>

          {/* Primary "Find Work →" CTA & Social Proof Metrics */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-5">
            <Link
              href="/find-work"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs sm:text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs group"
            >
              <span>Find Work</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>

            {/* 3 Compact Social Proof Metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100">
                <span className="font-bold text-neutral-950 dark:text-white">{activeCount}+</span>
                <span className="text-muted-foreground">Active Roles</span>
              </div>
              <span className="text-border">·</span>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                <span className="text-muted-foreground">Remote, Hybrid & Onsite</span>
              </div>
              <span className="text-border">·</span>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                <span className="text-muted-foreground">Vet-Once Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Smooth GPU-Accelerated Live Animation & Interactive Cards */}
      <div className="relative mt-10 w-full overflow-hidden group">
        {/* Left & Right Edge Fades for Seamless Infinite Loop */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#fcfcf9] dark:from-neutral-950 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#fcfcf9] dark:from-neutral-950 to-transparent z-10" />

        {/* Ticker Row 1: Scrolling Left */}
        <div
          className={`flex gap-4 py-2 w-max ${
            shouldReduceMotion
              ? 'overflow-x-auto no-scrollbar'
              : 'animate-marquee-left group-hover:[animation-play-state:paused]'
          }`}
          style={{ willChange: 'transform' }}
        >
          {row1.map((job, idx) => (
            <TickerJobCard key={`r1-${job.id || idx}-${idx}`} job={job} />
          ))}
        </div>

        {/* Ticker Row 2: Scrolling Right */}
        <div
          className={`flex gap-4 py-2 w-max ${
            shouldReduceMotion
              ? 'overflow-x-auto no-scrollbar'
              : 'animate-marquee-right group-hover:[animation-play-state:paused]'
          }`}
          style={{ willChange: 'transform' }}
        >
          {row2.map((job, idx) => (
            <TickerJobCard key={`r2-${job.id || idx}-${idx}`} job={job} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Subcomponent: Individual Job Card in the Ticker
function TickerJobCard({ job }: { job: Partial<RemoteJob> }) {
  const salaryBadge = getSalaryBadge(job);
  const { text: locText, mode } = getLocationPill(job);
  const company = job.company_name || job.company || 'Partner Employer';
  const jobId = job.id || job.external_id || 'seed-job-1';

  // Badge styling matching the 3 work modes
  const modeBadgeClass =
    mode === 'ONSITE'
      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40'
      : mode === 'HYBRID'
      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/40'
      : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/40';

  return (
    <Link
      href={`/find-work?jobId=${encodeURIComponent(jobId)}`}
      className="w-[280px] sm:w-[320px] shrink-0 rounded-2xl border border-border/70 bg-white dark:bg-neutral-900 p-4 sm:p-5 transition-all duration-200 hover:border-neutral-950 dark:hover:border-white hover:shadow-md cursor-pointer flex flex-col justify-between group/card"
    >
      <div className="space-y-2.5">
        {/* Top Badges Row: Mode & Location + Verified Pulse */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${modeBadgeClass}`}
          >
            {locText}
          </span>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Live</span>
          </div>
        </div>

        {/* Job Title & Company */}
        <div>
          <h3 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white group-hover/card:underline line-clamp-1">
            {job.title}
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-1">
            {company}
          </p>
        </div>
      </div>

      {/* Bottom Row: Compensation Badge & Arrow */}
      <div className="pt-3 mt-2 border-t border-border/40 flex items-center justify-between text-xs">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800/70 px-2.5 py-1 rounded-md text-[11px]">
          {salaryBadge}
        </span>
        <span className="text-xs font-semibold text-neutral-500 group-hover/card:text-neutral-950 dark:group-hover/card:text-white transition-colors">
          View role →
        </span>
      </div>
    </Link>
  );
}
