// lib/analytics/events.ts
// Privacy-preserving analytics tracker and funnel aggregator.
// STRICT DIRECTIVE: Under NO circumstances are personal data, candidate names,
// emails, IP addresses, or sensitive credentials transmitted or stored.

import fs from 'fs';
import path from 'path';
import os from 'os';

export type AnalyticsEventType =
  | 'jobs_list_view'
  | 'job_view'
  | 'apply_click_logged_out'
  | 'signup_started_from_job'
  | 'signup_completed'
  | 'profile_step_completed'
  | 'apply_ready_reached'
  | 'application_submitted'
  | 'external_click';

export interface AnalyticsEventRecord {
  id: string;
  type: AnalyticsEventType;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

const PRIMARY_ANALYTICS_FILE = path.join(process.cwd(), '.sync730-analytics-events.json');
const FALLBACK_ANALYTICS_FILE = path.join(os.tmpdir(), '.sync730-analytics-events.json');

declare global {
  // eslint-disable-next-line no-var
  var __sync730_analytics_events__: AnalyticsEventRecord[] | undefined;
}

function getStoredEvents(): AnalyticsEventRecord[] {
  if (globalThis.__sync730_analytics_events__) {
    return globalThis.__sync730_analytics_events__;
  }

  const events: AnalyticsEventRecord[] = [];
  try {
    let raw: string | null = null;
    if (fs.existsSync(PRIMARY_ANALYTICS_FILE)) {
      raw = fs.readFileSync(PRIMARY_ANALYTICS_FILE, 'utf8');
    } else if (fs.existsSync(FALLBACK_ANALYTICS_FILE)) {
      raw = fs.readFileSync(FALLBACK_ANALYTICS_FILE, 'utf8');
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        events.push(...parsed);
      }
    }
  } catch {}

  globalThis.__sync730_analytics_events__ = events;
  return events;
}

function persistEvents(): void {
  const events = getStoredEvents();
  const json = JSON.stringify(events, null, 2);
  try {
    fs.writeFileSync(PRIMARY_ANALYTICS_FILE, json, 'utf8');
  } catch {}
  try {
    fs.writeFileSync(FALLBACK_ANALYTICS_FILE, json, 'utf8');
  } catch {}
}

/**
 * Records an analytics event on the server.
 */
export function recordServerAnalyticsEvent(
  type: AnalyticsEventType,
  properties?: Record<string, string | number | boolean>
): void {
  // Strip any accidental personal fields
  const cleanProps: Record<string, any> = {};
  if (properties && typeof properties === 'object') {
    for (const [k, v] of Object.entries(properties)) {
      if (!k.toLowerCase().includes('email') && !k.toLowerCase().includes('name') && !k.toLowerCase().includes('ip')) {
        cleanProps[k] = v;
      }
    }
  }

  const record: AnalyticsEventRecord = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    type,
    properties: cleanProps,
    timestamp: new Date().toISOString(),
  };

  const list = getStoredEvents();
  list.push(record);
  persistEvents();
}

export interface FunnelStage {
  step: string;
  eventType: AnalyticsEventType;
  count: number;
  conversionFromFirst: number; // percentage
  conversionFromPrevious: number; // percentage
}

/**
 * Computes the recruitment apply funnel metrics for the admin console.
 */
export function getFunnelMetrics(): {
  stages: FunnelStage[];
  totalEvents: number;
  byType: Record<string, number>;
} {
  const events = getStoredEvents();
  const byType: Record<string, number> = {};

  events.forEach((e) => {
    byType[e.type] = (byType[e.type] || 0) + 1;
  });

  // Funnel order
  const stageDefs: { step: string; eventType: AnalyticsEventType }[] = [
    { step: '1. Browse Jobs List', eventType: 'jobs_list_view' },
    { step: '2. View Job Details', eventType: 'job_view' },
    { step: '3. Intent to Apply (Logged Out)', eventType: 'apply_click_logged_out' },
    { step: '4. Start Signup from Job', eventType: 'signup_started_from_job' },
    { step: '5. Complete Signup', eventType: 'signup_completed' },
    { step: '6. Profile Step Completed', eventType: 'profile_step_completed' },
    { step: '7. Reached Apply-Ready', eventType: 'apply_ready_reached' },
    { step: '8. Applications & Clicks', eventType: 'application_submitted' },
  ];

  const firstCount = Math.max(1, byType['jobs_list_view'] || 0);
  let prevCount = firstCount;

  const stages: FunnelStage[] = stageDefs.map((def) => {
    const count = byType[def.eventType] || 0;
    const conversionFromFirst = Math.round((count / firstCount) * 100);
    const conversionFromPrevious = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    prevCount = Math.max(1, count);

    return {
      step: def.step,
      eventType: def.eventType,
      count,
      conversionFromFirst,
      conversionFromPrevious,
    };
  });

  return {
    stages,
    totalEvents: events.length,
    byType,
  };
}

export { fireJobAnalytics } from './client';
