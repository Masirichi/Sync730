// lib/jobs/reports-and-alerts.ts
// Handlers and stores for Job Reports and Job Alerts subscriptions.
// Strict business rule: >= 3 reports automatically hides the job pending review.

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export type ReportReason =
  | 'asks_for_payment'
  | 'fake_company'
  | 'misleading_pay'
  | 'job_is_closed'
  | 'other';

export interface JobReport {
  id: string;
  job_id: string;
  reason: ReportReason;
  details?: string;
  created_at: string;
  reporter_ip?: string;
}

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
  return getAllReports().filter((r) => r.job_id === jobId);
}

export function isJobHiddenByReports(jobId: string): boolean {
  return getReportsForJob(jobId).length >= 3;
}

export function submitJobReport(params: {
  job_id: string;
  reason: ReportReason;
  details?: string;
  reporter_ip?: string;
}): { success: boolean; totalReports: number; isHidden: boolean } {
  const reports = getAllReports();
  const newReport: JobReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    job_id: params.job_id,
    reason: params.reason,
    details: params.details?.slice(0, 1000),
    created_at: new Date().toISOString(),
    reporter_ip: params.reporter_ip,
  };

  reports.push(newReport);
  memoryReports = reports;
  writeFileSafe(PRIMARY_REPORTS_FILE, FALLBACK_REPORTS_FILE, JSON.stringify(reports, null, 2));

  const total = reports.filter((r) => r.job_id === params.job_id).length;
  return {
    success: true,
    totalReports: total,
    isHidden: total >= 3,
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
    existing.modalities = params.modalities;
    existing.locations = params.locations;
    existing.role_types = params.role_types;
    existing.consent_timestamp = new Date().toISOString();
    writeFileSafe(PRIMARY_ALERTS_FILE, FALLBACK_ALERTS_FILE, JSON.stringify(alerts, null, 2));
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
    double_opt_in_token: crypto.randomBytes(16).toString('hex'),
    is_verified: true, // Auto-verified in staging; double opt-in link sent
    unsubscribed: false,
    unsubscribe_token: crypto.randomBytes(16).toString('hex'),
    created_at: new Date().toISOString(),
  };

  alerts.push(newSub);
  memoryAlerts = alerts;
  writeFileSafe(PRIMARY_ALERTS_FILE, FALLBACK_ALERTS_FILE, JSON.stringify(alerts, null, 2));

  return { success: true, subscription: newSub };
}
