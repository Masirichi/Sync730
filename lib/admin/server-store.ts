import fs from 'fs';
import path from 'path';
import { AdminRemoteJob, AdminAuditLog } from './types';
import { SEED_ADMIN_REMOTE_JOBS, SEED_ADMIN_AUDIT_LOGS } from './store';

const JOBS_CACHE_FILE = path.join(process.cwd(), '.sync730-admin-jobs.json');
const LOGS_CACHE_FILE = path.join(process.cwd(), '.sync730-audit-logs.json');

export function getServerJobs(): AdminRemoteJob[] {
  try {
    if (fs.existsSync(JOBS_CACHE_FILE)) {
      const raw = fs.readFileSync(JOBS_CACHE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read server jobs cache:', e);
  }
  return [...SEED_ADMIN_REMOTE_JOBS];
}

export function saveServerJob(job: AdminRemoteJob): AdminRemoteJob {
  try {
    const existing = getServerJobs();
    const updated = [job, ...existing.filter((j) => j.id !== job.id)];
    fs.writeFileSync(JOBS_CACHE_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to write server jobs cache:', e);
  }

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
  try {
    const existing = getServerJobs();
    const target = existing.find((j) => j.id === jobId || j.external_id === jobId);
    if (target) {
      target.is_active = currentStatus !== undefined ? !currentStatus : !target.is_active;
      newStatus = target.is_active;
      fs.writeFileSync(JOBS_CACHE_FILE, JSON.stringify(existing, null, 2), 'utf8');
    } else {
      newStatus = !currentStatus;
    }
  } catch (e) {
    console.warn('Failed to toggle server job active:', e);
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
  try {
    const existing = getServerJobs();
    const target = existing.find((j) => j.id === jobId || j.external_id === jobId);
    if (target) {
      target.is_featured = currentStatus !== undefined ? !currentStatus : !target.is_featured;
      newFeatured = target.is_featured;
      fs.writeFileSync(JOBS_CACHE_FILE, JSON.stringify(existing, null, 2), 'utf8');
    } else {
      newFeatured = !currentStatus;
    }
  } catch (e) {
    console.warn('Failed to toggle server job featured:', e);
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
  try {
    if (fs.existsSync(LOGS_CACHE_FILE)) {
      const raw = fs.readFileSync(LOGS_CACHE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read audit logs cache:', e);
  }
  return [...SEED_ADMIN_AUDIT_LOGS];
}

export function saveServerAuditLog(log: AdminAuditLog) {
  try {
    const existing = getServerAuditLogs();
    const updated = [log, ...existing];
    fs.writeFileSync(LOGS_CACHE_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to write audit logs cache:', e);
  }
}
