import fs from 'fs';
import path from 'path';
import os from 'os';
import { AdminRemoteJob, AdminAuditLog } from './types';
import { SEED_ADMIN_AUDIT_LOGS } from './store';
import { validateJobPublishing } from '@/lib/jobs/validation';

const PRIMARY_JOBS_FILE = path.join(process.cwd(), '.sync730-admin-jobs.json');
const FALLBACK_JOBS_FILE = path.join(os.tmpdir(), '.sync730-admin-jobs.json');

const PRIMARY_LOGS_FILE = path.join(process.cwd(), '.sync730-audit-logs.json');
const FALLBACK_LOGS_FILE = path.join(os.tmpdir(), '.sync730-audit-logs.json');

const PRIMARY_TOMBSTONES_FILE = path.join(process.cwd(), '.sync730-tombstones.json');
const FALLBACK_TOMBSTONES_FILE = path.join(os.tmpdir(), '.sync730-tombstones.json');

// In-memory process cache to bridge serverless function instances
let memoryJobsCache: AdminRemoteJob[] | null = null;
let memoryLogsCache: AdminAuditLog[] | null = null;
let memoryDeletedIds: Set<string> | null = null;
let memoryTakenDownIds: Set<string> | null = null;

export const DEMO_COMPANY_PATTERNS = [
  'scale army',
  'bruntwork',
  'leading african digital bank',
  'pan-african logistics platform',
  'freehire',
  'credit wellness global',
  'hyperscale cloud',
  'techsphere europe',
  'finvelocity global',
  'neuralflow engineering',
  'apex digital financial',
  'skyward systems',
  'sync730 partner labs',
  'fintech velocity africa',
  'payrail technologies',
  'sterling capital partners',
  'vetted tech africa',
  'deltacloud',
  'technova africa',
  'cloudsys technologies',
];

export function isDemoCompany(companyName?: string): boolean {
  if (!companyName) return false;
  const lower = companyName.toLowerCase().trim();
  return DEMO_COMPANY_PATTERNS.some((pat) => lower.includes(pat));
}

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

interface TombstoneRegistry {
  deleted: string[];
  taken_down: string[];
}

function readTombstones(): TombstoneRegistry {
  const raw = readFileSafe(PRIMARY_TOMBSTONES_FILE, FALLBACK_TOMBSTONES_FILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
        taken_down: Array.isArray(parsed.taken_down) ? parsed.taken_down : [],
      };
    } catch {}
  }
  return { deleted: [], taken_down: [] };
}

function writeTombstones(reg: TombstoneRegistry) {
  writeFileSafe(PRIMARY_TOMBSTONES_FILE, FALLBACK_TOMBSTONES_FILE, JSON.stringify(reg, null, 2));
}

export function getDeletedJobIds(): Set<string> {
  if (memoryDeletedIds) return memoryDeletedIds;
  const reg = readTombstones();
  memoryDeletedIds = new Set(reg.deleted);
  return memoryDeletedIds;
}

export function getTakenDownJobIds(): Set<string> {
  if (memoryTakenDownIds) return memoryTakenDownIds;
  const reg = readTombstones();
  memoryTakenDownIds = new Set(reg.taken_down);
  return memoryTakenDownIds;
}

export function recordDeletedJob(id: string, external_id?: string): void {
  const reg = readTombstones();
  const set = new Set(reg.deleted);
  set.add(id);
  if (external_id) set.add(external_id);
  reg.deleted = Array.from(set);

  // If it was in taken_down, remove it
  reg.taken_down = reg.taken_down.filter((x) => x !== id && x !== external_id);

  writeTombstones(reg);
  memoryDeletedIds = new Set(reg.deleted);
  if (memoryTakenDownIds) {
    memoryTakenDownIds.delete(id);
    if (external_id) memoryTakenDownIds.delete(external_id);
  }
}

export function recordTakenDownJob(id: string, isActive: boolean, external_id?: string): void {
  const reg = readTombstones();
  const set = new Set(reg.taken_down);
  if (!isActive) {
    // Taking down (inactive)
    set.add(id);
    if (external_id) set.add(external_id);
  } else {
    // Republishing (active)
    set.delete(id);
    if (external_id) set.delete(external_id);
    // Also remove from deleted if republished
    reg.deleted = reg.deleted.filter((x) => x !== id && x !== external_id);
    if (memoryDeletedIds) {
      memoryDeletedIds.delete(id);
      if (external_id) memoryDeletedIds.delete(external_id);
    }
  }
  reg.taken_down = Array.from(set);
  writeTombstones(reg);
  memoryTakenDownIds = new Set(reg.taken_down);
}

export function getServerJobs(): AdminRemoteJob[] {
  let jobs: AdminRemoteJob[] = [];
  const raw = readFileSafe(PRIMARY_JOBS_FILE, FALLBACK_JOBS_FILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        jobs = parsed;
      }
    } catch {
      // Ignore parse error
    }
  }

  if (jobs.length === 0 && memoryJobsCache && memoryJobsCache.length > 0) {
    jobs = memoryJobsCache;
  }

  const deletedIds = getDeletedJobIds();
  const takenDownIds = getTakenDownJobIds();

  // Exclude demo roles, permanently deleted roles, and update taken down flag
  const map = new Map<string, AdminRemoteJob>();
  jobs.forEach((j) => {
    const company = j.company || j.company_name;
    if (isDemoCompany(company)) return;
    if (j.is_demo === true) return;
    if (deletedIds.has(j.id) || (j.external_id && deletedIds.has(j.external_id))) return;

    // Synchronize active status with taken down registry
    const isTakenDown = takenDownIds.has(j.id) || (j.external_id && takenDownIds.has(j.external_id));
    const effectiveIsActive = isTakenDown ? false : j.is_active !== false;

    map.set(j.id, {
      ...j,
      is_active: effectiveIsActive,
      status: effectiveIsActive ? (j.status || 'live') : 'taken_down',
    });
  });

  const combined = Array.from(map.values());
  memoryJobsCache = combined;
  return combined;
}

export function saveServerJob(job: AdminRemoteJob): AdminRemoteJob {
  // Validate job before saving/publishing
  const validation = validateJobPublishing({
    company: job.company || job.company_name,
    title: job.title,
    description: job.description,
    salary: job.salary,
    salary_min: (job as any).salary_min,
    salary_max: (job as any).salary_max,
    salary_currency: (job as any).salary_currency,
  });

  if (!validation.valid) {
    throw new Error(`Cannot publish job: ${validation.errors.join(' ')}`);
  }

  // Ensure job is not in deleted or taken down tombstones
  recordTakenDownJob(job.id, true, job.external_id);

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
    target.status = newStatus ? 'live' : 'taken_down';
    recordTakenDownJob(target.id, newStatus, target.external_id);
    memoryJobsCache = existing;
    writeFileSafe(PRIMARY_JOBS_FILE, FALLBACK_JOBS_FILE, JSON.stringify(existing, null, 2));
  } else {
    newStatus = !currentStatus;
    recordTakenDownJob(jobId, newStatus);
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

export function deleteServerJob(jobId: string): boolean {
  const existing = getServerJobs();
  const target = existing.find((j) => j.id === jobId || j.external_id === jobId);
  const externalId = target?.external_id;

  recordDeletedJob(jobId, externalId);

  const updated = existing.filter((j) => j.id !== jobId && j.external_id !== jobId);
  memoryJobsCache = updated;

  writeFileSafe(PRIMARY_JOBS_FILE, FALLBACK_JOBS_FILE, JSON.stringify(updated, null, 2));

  saveServerAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_DELETED',
    target_id: jobId,
    notes: `Permanently deleted role ${jobId}`,
  });

  return true;
}

export function toggleServerJobFeatured(jobId: string, currentStatus?: boolean): { is_featured: boolean } {
  let newFeatured = false;
  const existing = getServerJobs();
  const target = existing.find((j) => j.id === jobId || j.external_id === jobId);

  const willBeFeatured = currentStatus !== undefined ? !currentStatus : target ? !target.is_featured : true;

  // Phase 9 Compliance: Featured roles capped strictly at maximum of 3
  if (willBeFeatured) {
    const activeFeaturedCount = existing.filter(
      (j) => j.is_featured && j.id !== jobId && j.external_id !== jobId
    ).length;
    if (activeFeaturedCount >= 3) {
      throw new Error('Featured roles are capped at a maximum of 3. Please unfeature an existing role before pinning another.');
    }
  }

  if (target) {
    target.is_featured = willBeFeatured;
    newFeatured = target.is_featured;
    memoryJobsCache = existing;
    writeFileSafe(PRIMARY_JOBS_FILE, FALLBACK_JOBS_FILE, JSON.stringify(existing, null, 2));
  } else {
    newFeatured = willBeFeatured;
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
