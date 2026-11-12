// lib/jobs/application-store.ts
// Server store for candidate job applications, external clicks, and daily application rate limits.

import fs from 'fs';
import path from 'path';
import os from 'os';
import { getLocalPipelineCandidates, saveLocalPipelineCandidates } from '@/lib/recruiter/store';
import { PipelineCandidate } from '@/lib/recruiter/types';

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: 'applied' | 'interviewing' | 'shortlisted' | 'rejected' | 'hired';
  cover_note?: string;
  source_type: 'employer' | 'partner' | 'curated';
  created_at: string;
}

export interface ExternalApplyClick {
  id: string;
  user_id: string;
  job_id: string;
  timestamp: string;
}

interface ApplicationDataStore {
  applications: JobApplication[];
  external_clicks: ExternalApplyClick[];
}

const PRIMARY_APPLICATIONS_FILE = path.join(process.cwd(), '.sync730-job-applications.json');
const FALLBACK_APPLICATIONS_FILE = path.join(os.tmpdir(), '.sync730-job-applications.json');

declare global {
  // eslint-disable-next-line no-var
  var __sync730_applications_store__: ApplicationDataStore | undefined;
}

function getStore(): ApplicationDataStore {
  if (globalThis.__sync730_applications_store__) {
    return globalThis.__sync730_applications_store__;
  }

  const initial: ApplicationDataStore = {
    applications: [],
    external_clicks: [],
  };

  try {
    let raw: string | null = null;
    if (fs.existsSync(PRIMARY_APPLICATIONS_FILE)) {
      raw = fs.readFileSync(PRIMARY_APPLICATIONS_FILE, 'utf8');
    } else if (fs.existsSync(FALLBACK_APPLICATIONS_FILE)) {
      raw = fs.readFileSync(FALLBACK_APPLICATIONS_FILE, 'utf8');
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.applications)) {
        initial.applications = parsed.applications;
        initial.external_clicks = parsed.external_clicks || [];
      }
    }
  } catch {}

  globalThis.__sync730_applications_store__ = initial;
  return initial;
}

function persistStore(): void {
  const store = getStore();
  const json = JSON.stringify(store, null, 2);

  try {
    fs.writeFileSync(PRIMARY_APPLICATIONS_FILE, json, 'utf8');
  } catch {}
  try {
    fs.writeFileSync(FALLBACK_APPLICATIONS_FILE, json, 'utf8');
  } catch {}
}

const DAILY_LIMIT = 20;

/**
 * Counts user applications and external clicks in the last 24 hours.
 */
export function getDailyActivityCount(userId: string): number {
  const store = getStore();
  const twentyFourHoursAgo = Date.now() - 24 * 3600 * 1000;

  const appCount = store.applications.filter(
    (a) => a.user_id === userId && new Date(a.created_at).getTime() > twentyFourHoursAgo
  ).length;

  const clickCount = store.external_clicks.filter(
    (c) => c.user_id === userId && new Date(c.timestamp).getTime() > twentyFourHoursAgo
  ).length;

  return appCount + clickCount;
}

/**
 * Checks whether user has exceeded the daily limit of 20 applications/external clicks.
 */
export function checkDailyLimit(userId: string): { allowed: boolean; count: number; limit: number } {
  const count = getDailyActivityCount(userId);
  return {
    allowed: count < DAILY_LIMIT,
    count,
    limit: DAILY_LIMIT,
  };
}

/**
 * Checks if a user has already applied to a specific job.
 */
export function hasUserAppliedToJob(userId: string, jobId: string): boolean {
  const store = getStore();
  return store.applications.some((a) => a.user_id === userId && a.job_id === jobId);
}

/**
 * Creates an application record for an employer job.
 * Enforces one application per user per job and daily limit.
 */
export function submitEmployerApplication(params: {
  user_id: string;
  job_id: string;
  cover_note?: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_track?: string;
}): { success: boolean; application?: JobApplication; error?: string; status_code: number } {
  const { user_id, job_id, cover_note, candidate_name, candidate_email } = params;

  // 1. Check daily limit (20 per day)
  const limitCheck = checkDailyLimit(user_id);
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: 'You have reached your daily limit of 20 applications/links for today. Please check back tomorrow.',
      status_code: 429,
    };
  }

  // 2. Check duplicate application
  if (hasUserAppliedToJob(user_id, job_id)) {
    return {
      success: false,
      error: 'You have already applied to this role.',
      status_code: 400,
    };
  }

  // 3. Create application record
  const application: JobApplication = {
    id: `app-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    user_id,
    job_id,
    status: 'applied',
    cover_note: cover_note?.slice(0, 1000),
    source_type: 'employer',
    created_at: new Date().toISOString(),
  };

  const store = getStore();
  store.applications.push(application);
  persistStore();

  // 4. Connect to employer pipeline so the employer sees the application in their dashboard!
  try {
    const currentCandidates = getLocalPipelineCandidates();
    const newPipelineCandidate: PipelineCandidate = {
      id: `pipe-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      job_id,
      candidate_id: user_id,
      masked_id: `CAN-${user_id.slice(-4).toUpperCase()}`,
      candidate_name: candidate_name || 'Verified Candidate',
      candidate_email: candidate_email || 'candidate@sync730.dev',
      stage: 'Contacted',
      overall_match_score: 88,
      technical_depth_score: 85,
      communication_score: 90,
      skills: ['TypeScript', 'React', 'Node.js'],
      seniority: 'Senior',
      years_of_experience: 5,
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stage_history: [
        {
          from_stage: 'Applied',
          to_stage: 'Contacted',
          reason: cover_note || 'Direct application via Sync730',
          moved_by: user_id,
          moved_at: new Date().toISOString(),
        },
      ],
      scorecards: [],
      scheduled_interviews: [],
      notes: [],
    };
    saveLocalPipelineCandidates([newPipelineCandidate, ...currentCandidates]);
  } catch (err) {
    // Non-fatal if job is not an active employer workspace job
  }

  return {
    success: true,
    application,
    status_code: 200,
  };
}

/**
 * Logs an external apply link click.
 * Enforces daily limit.
 */
export function recordExternalApplyClick(
  user_id: string,
  job_id: string
): { success: boolean; error?: string; status_code: number } {
  // Check daily limit (20 per day)
  const limitCheck = checkDailyLimit(user_id);
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: 'You have reached your daily limit of 20 applications/links for today. Please check back tomorrow.',
      status_code: 429,
    };
  }

  const click: ExternalApplyClick = {
    id: `click-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    user_id,
    job_id,
    timestamp: new Date().toISOString(),
  };

  const store = getStore();
  store.external_clicks.push(click);
  persistStore();

  return {
    success: true,
    status_code: 200,
  };
}

/**
 * Returns all applications for a given user.
 */
export function getUserApplications(userId: string): JobApplication[] {
  const store = getStore();
  return store.applications.filter((a) => a.user_id === userId);
}
