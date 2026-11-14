// components/home/live-stats-band.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { STATS_CONFIG } from '@/lib/config/stats';
import { trackEvent } from '@/lib/analytics';

interface StatsData {
  rolesLast24h: number;
  talents: number;
  partners: number;
}

interface LiveStatsBandProps {
  initialStats: StatsData;
}

export function LiveStatsBand({ initialStats }: LiveStatsBandProps) {
  const [stats, setStats] = useState<StatsData>(initialStats);
  const [displayValues, setDisplayValues] = useState<StatsData>(initialStats);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const bandRef = useRef<HTMLElement>(null);
  const lastAnnounceTimeRef = useRef<number>(0);

  // Check if counters qualify based on minimums
  const meetsMinRoles = stats.rolesLast24h >= STATS_CONFIG.minimums.rolesLast24h;
  const meetsMinTalents = stats.talents >= STATS_CONFIG.minimums.talents;
  const meetsMinPartners = stats.partners >= STATS_CONFIG.minimums.partners;

  const qualifyingCount =
    (meetsMinRoles ? 1 : 0) + (meetsMinTalents ? 1 : 0) + (meetsMinPartners ? 1 : 0);

  // Rule: If fewer than two cells qualify, hide the whole band
  const shouldRenderBand = qualifyingCount >= 2;

  // Animation helper for count-up
  const animateValue = (
    start: number,
    end: number,
    durationMs: number,
    onProgress: (current: number) => void
  ) => {
    // Check prefers-reduced-motion
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
      // Ease out cubic
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

          // Animate initial count up from 0 to real value over 1.5s
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

  // Refresh interval every 60s
  useEffect(() => {
    if (!shouldRenderBand) return;

    const refreshStats = async () => {
      // Pause refreshing if tab is hidden
      if (document.hidden) return;

      try {
        const res = await fetch('/api/public/stats');
        if (!res.ok) return;

        const data = await res.json();
        const newRoles = data.rolesLast24h ?? stats.rolesLast24h;
        const newTalents = data.talents ?? stats.talents;
        const newPartners = data.partners ?? stats.partners;

        // Animate up if increased (<800ms); update immediately if decreased
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

        // Announce politely at most once every 60s
        const now = Date.now();
        if (now - lastAnnounceTimeRef.current >= 60000) {
          lastAnnounceTimeRef.current = now;
          setAnnouncement('Live platform activity updated');
        }
      } catch {
        // Keep last value if request fails
      }
    };

    const interval = setInterval(refreshStats, STATS_CONFIG.refreshIntervalMs);
    return () => clearInterval(interval);
  }, [shouldRenderBand, stats]);

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

  return (
    <section
      ref={bandRef}
      aria-label="Live platform activity"
      className="border-b border-border/70 bg-foreground text-background"
    >
      <div className="mx-auto max-w-7xl px-5 pt-8 pb-3 sm:px-8 lg:px-10">
        {/* Pulsing indicator & label above cells */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-background/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Live platform activity</span>
        </div>
      </div>

      {/* Grid of counter cells */}
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

      {/* Polite live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </section>
  );
}
