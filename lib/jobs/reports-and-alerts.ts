// lib/jobs/reports-and-alerts.ts
// Handlers and stores for Job Reports and Job Alerts subscriptions.
// Strict business rules:
// - Reasons: "Role is closed", "Not open to Africa as stated", "Looks like a scam", "Other"
// - Rate limiting: max 1 report per IP/user per job per 24 hours.
// - >= 3 reports automatically hides the role pending review.

import fs from 'fs';
import path from 'path';
import os from 'os';
import { CanonicalReportReason, JobReport } from './types';
import { MAX_REPORTS_BEFORE_HIDE } from './config';

export type { CanonicalReportReason };
export type ReportReason = CanonicalReportReason;

export interface JobAlertSubscription {
  id: string;
  email: string;
  modalities: string[]; // ['remote', 'hybrid', 'onsite']
  locations: string[];
  role_types: string[];
  consent: boolean;
  consent_timestamp: string;
  double_opt_in_token: string;
  is_verified: boolean;
  unsubscribed: boolean;
  unsubscribe_token: string;
  created_at: string;
}

const PRIMARY_REPORTS_FILE = path.join(process.cwd(), '.sync730-job-reports.json');
const FALLBACK_REPORTS_FILE = path.join(os.tmpdir(), '.sync730-job-reports.json');

const PRIMARY_ALERTS_FILE = path.join(process.cwd(), '.sync730-job-alerts.json');
const FALLBACK_ALERTS_FILE = path.join(os.tmpdir(), '.sync730-job-alerts.json');

let memoryReports: JobReport[] | null = null;
let memoryAlerts: JobAlertSubscription[] | null = null;

// In-memory rate limiting map: `${reporterId}:::${jobId}` -> lastReportedTimestamp
const reportRateLimitMap = new Map<string, number>();

function readFileSafe(primary: string, fallback: string): string | null {
  try {
    if (fs.existsSync(primary)) return fs.readFileSync(primary, 'utf8');
  } catch {}
  try {
    if (fs.existsSync(fallback)) return fs.readFileSync(fallback, 'utf8');
  } catch {}
  return null;
}

function writeFileSafe(primary: string, fallback: string, data: string): void {
  try {
    fs.writeFileSync(primary, data, 'utf8');
  } catch {}
  try {
    fs.writeFileSync(fallback, data, 'utf8');
  } catch {}
}

export function getAllReports(): JobReport[] {
  if (memoryReports) return memoryReports;
  const raw = readFileSafe(PRIMARY_REPORTS_FILE, FALLBACK_REPORTS_FILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryReports = parsed;
        return parsed;
      }
    } catch {}
  }
  memoryReports = [];
  return [];
}

export function getReportsForJob(jobId: string): JobReport[] {
  return getAllReports().filter((r) => r.jobId === jobId || (r as any).job_id === jobId);
}

export function isJobHiddenByReports(jobId: string): boolean {
  return getReportsForJob(jobId).length >= MAX_REPORTS_BEFORE_HIDE;
}

/**
 * Checks if a specific reporter (IP or user ID) has already reported this job within the rolling 24h window.
 */
export function hasUserReportedJobToday(reporterKey: string, jobId: string): boolean {
  const key = `${reporterKey}:::${jobId}`;
  const lastTime = reportRateLimitMap.get(key);
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (lastTime && Date.now() - lastTime < oneDayMs) {
    return true;
  }

  // Also check existing persisted reports
  const allReports = getAllReports();
  const existing = allReports.find(
    (r) =>
      (r.jobId === jobId || (r as any).job_id === jobId) &&
      r.reporter_ip === reporterKey &&
      Date.now() - new Date(r.createdAt || (r as any).created_at).getTime() < oneDayMs
  );

  return Boolean(existing);
}

export function normalizeReportReason(rawReason: string): CanonicalReportReason {
  const lower = (rawReason || '').trim().toLowerCase();
  if (lower.includes('closed') || lower === 'job_is_closed') return 'Role is closed';
  if (lower.includes('not open') || lower.includes('ineligible') || lower.includes('africa')) {
    return 'Not open to Africa as stated';
  }
  if (lower.includes('scam') || lower.includes('payment') || lower.includes('fake')) {
    return 'Looks like a scam';
  }
  return 'Other';
}

/**
 * Submits a community job report with daily per-reporter rate limiting.
 */
export function submitJobReport(params: {
  jobId: string;
  reason: string;
  note?: string;
  reporterIp?: string;
}): { success: boolean; error?: string; totalReports: number; isHidden: boolean; reportId?: string; report?: JobReport } {
  const reporterKey = params.reporterIp || '127.0.0.1';

  // 1. Rate limiting check
  if (hasUserReportedJobToday(reporterKey, params.jobId)) {
    const existingReports = getReportsForJob(params.jobId);
    return {
      success: false,
      error: 'You have already reported this role today. Our verification team is reviewing it.',
      totalReports: existingReports.length,
      isHidden: existingReports.length >= MAX_REPORTS_BEFORE_HIDE,
    };
  }

  const reports = getAllReports();
  const canonicalReason = normalizeReportReason(params.reason);

  const newReport: JobReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    jobId: params.jobId,
    reason: canonicalReason,
    note: params.note?.slice(0, 1000),
    reporter_ip: reporterKey,
    createdAt: new Date().toISOString(),
  };

  reports.push(newReport);
  memoryReports = reports;
  writeFileSafe(PRIMARY_REPORTS_FILE, FALLBACK_REPORTS_FILE, JSON.stringify(reports, null, 2));

  // Update in-memory rate limiter
  reportRateLimitMap.set(`${reporterKey}:::${params.jobId}`, Date.now());

  const total = reports.filter((r) => r.jobId === params.jobId || (r as any).job_id === params.jobId).length;
  return {
    success: true,
    reportId: newReport.id,
    report: newReport,
    totalReports: total,
    isHidden: total >= MAX_REPORTS_BEFORE_HIDE,
  };
}

// ----------------- JOB ALERTS -----------------

export function getAllAlertSubscriptions(): JobAlertSubscription[] {
  if (memoryAlerts) return memoryAlerts;
  const raw = readFileSafe(PRIMARY_ALERTS_FILE, FALLBACK_ALERTS_FILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryAlerts = parsed;
        return parsed;
      }
    } catch {}
  }
  memoryAlerts = [];
  return [];
}

export function createAlertSubscription(params: {
  email: string;
  modalities: string[];
  locations: string[];
  role_types: string[];
  consent: boolean;
}): { success: boolean; subscription: JobAlertSubscription } {
  const alerts = getAllAlertSubscriptions();
  const normalizedEmail = params.email.trim().toLowerCase();

  const existing = alerts.find((a) => a.email === normalizedEmail && !a.unsubscribed);
  if (existing) {
    return { success: true, subscription: existing };
  }

  const newSub: JobAlertSubscription = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    email: normalizedEmail,
    modalities: params.modalities,
    locations: params.locations,
    role_types: params.role_types,
    consent: params.consent,
    consent_timestamp: new Date().toISOString(),
    double_opt_in_token: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    is_verified: false,
    unsubscribed: false,
    unsubscribe_token: `unsub_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    created_at: new Date().toISOString(),
  };

  alerts.push(newSub);
  memoryAlerts = alerts;
  writeFileSafe(PRIMARY_ALERTS_FILE, FALLBACK_ALERTS_FILE, JSON.stringify(alerts, null, 2));

  return { success: true, subscription: newSub };
}
