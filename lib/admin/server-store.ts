import fs from 'fs';
import path from 'path';
import os from 'os';
import { AdminRemoteJob, AdminAuditLog } from './types';
import { SEED_ADMIN_REMOTE_JOBS, SEED_ADMIN_AUDIT_LOGS } from './store';

const PRIMARY_JOBS_FILE = path.join(process.cwd(), '.sync730-admin-jobs.json');
const FALLBACK_JOBS_FILE = path.join(os.tmpdir(), '.sync730-admin-jobs.json');

const PRIMARY_LOGS_FILE = path.join(process.cwd(), '.sync730-audit-logs.json');
const FALLBACK_LOGS_FILE = path.join(os.tmpdir(), '.sync730-audit-logs.json');

// In-memory process cache to bridge serverless function instances
let memoryJobsCache: AdminRemoteJob[] | null = null;
let memoryLogsCache: AdminAuditLog[] | null = null;

function readFileSafe(primaryPath: string, fallbackPath: string): string | null {
  try {
    if (fs.existsSync(primaryPath)) {
      return fs.readFileSync(primaryPath, 'utf8');
    }
  } catch {
    // Fall back to temp dir
  }

  try {
    if (fs.existsSync(fallbackPath)) {
      return fs.readFileSync(fallbackPath, 'utf8');
    }
  } catch {
    // Ignore
  }

  return null;
}

function writeFileSafe(primaryPath: string, fallbackPath: string, data: string): boolean {
  let written = false;
  try {
    fs.writeFileSync(primaryPath, data, 'utf8');
    written = true;
  } catch {
    // Read-only filesystem on Vercel
  }

  try {
    fs.writeFileSync(fallbackPath, data, 'utf8');
    written = true;
  } catch {
    // Fallback error
  }

  return written;
}

export function getServerJobs(): AdminRemoteJob[] {
  const raw = readFileSafe(PRIMARY_JOBS_FILE, FALLBACK_JOBS_FILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryJobsCache = parsed;
        return parsed;
      }
    } catch {
      // Ignore parse error
    }
  }

  if (memoryJobsCache && memoryJobsCache.length > 0) {
    return memoryJobsCache;
  }

  memoryJobsCache = [...SEED_ADMIN_REMOTE_JOBS];
  return memoryJobsCache;
}

export function saveServerJob(job: AdminRemoteJob): AdminRemoteJob {
  const existing = getServerJobs();
  const updated = [job, ...existing.filter((j) => j.id !== job.id && j.external_id !== job.external_id)];
  memoryJobsCache = updated;

  writeFileSafe(PRIMARY_JOBS_FILE, FALLBACK_JOBS_FILE, JSON.stringify(updated, null, 2));

  saveServerAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_POSTED',
    target_id: job.id,
    notes: `Published verified admin role: "${job.title}" at ${job.company} (${job.location_tier})`,
  });

  return job;
}

export function toggleServerJobActive(jobId: string, currentStatus?: boolean): { is_active: boolean } {
  let newStatus = false;
  const existing = getServerJobs();
  const target = existing.find((j) => j.id === jobId || j.external_id === jobId);

  if (target) {
    target.is_active = currentStatus !== undefined ? !currentStatus : !target.is_active;
    newStatus = target.is_active;
    memoryJobsCache = existing;
    writeFileSafe(PRIMARY_JOBS_FILE, FALLBACK_JOBS_FILE, JSON.stringify(existing, null, 2));
  } else {
    newStatus = !currentStatus;
  }

  saveServerAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_STATUS_CHANGE',
    target_id: jobId,
    notes: `Changed status of job ${jobId} to ${newStatus ? 'ACTIVE (Republished)' : 'TAKEN_DOWN'}`,
  });

  return { is_active: newStatus };
}

export function toggleServerJobFeatured(jobId: string, currentStatus?: boolean): { is_featured: boolean } {
  let newFeatured = false;
  const existing = getServerJobs();
  const target = existing.find((j) => j.id === jobId || j.external_id === jobId);

  if (target) {
    target.is_featured = currentStatus !== undefined ? !currentStatus : !target.is_featured;
    newFeatured = target.is_featured;
    memoryJobsCache = existing;
    writeFileSafe(PRIMARY_JOBS_FILE, FALLBACK_JOBS_FILE, JSON.stringify(existing, null, 2));
  } else {
    newFeatured = !currentStatus;
  }

  saveServerAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_STATUS_CHANGE',
    target_id: jobId,
    notes: `Toggled featured status of job ${jobId} to ${newFeatured ? 'FEATURED (Pinned)' : 'UNFEATURED'}`,
  });

  return { is_featured: newFeatured };
}

export function getServerAuditLogs(): AdminAuditLog[] {
  if (memoryLogsCache && memoryLogsCache.length > 0) {
    return memoryLogsCache;
  }

  const raw = readFileSafe(PRIMARY_LOGS_FILE, FALLBACK_LOGS_FILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryLogsCache = parsed;
        return parsed;
      }
    } catch {
      // Ignore
    }
  }

  memoryLogsCache = [...SEED_ADMIN_AUDIT_LOGS];
  return memoryLogsCache;
}

export function saveServerAuditLog(log: AdminAuditLog) {
  const existing = getServerAuditLogs();
  const updated = [log, ...existing];
  memoryLogsCache = updated;
  writeFileSafe(PRIMARY_LOGS_FILE, FALLBACK_LOGS_FILE, JSON.stringify(updated, null, 2));
}
