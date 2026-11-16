// lib/admin/audit.ts
// Single source of truth for platform administrative audit logging.
// Enforces append-only semantics, structured actor metadata, and before/after state diffs.

import { createServerClient } from '@/lib/supabase/server';
import { saveServerAuditLog } from './server-store';
import { saveAdminAuditLog } from './store';

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  target_label: string;
  reason: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  created_at: string;
  ip?: string | null;
}

export interface DangerousActionAuditParams {
  actor_id: string;
  actor_name?: string;
  action: string;
  target_type: string;
  target_id: string;
  target_label: string;
  reason: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ip?: string | null;
}

/**
 * Validates that a reason is present and satisfies the minimum character length (default: 10).
 * Throws an error or returns the sanitized reason.
 */
export function requireReason(reason: unknown, minLength = 10): string {
  if (typeof reason !== 'string' || reason.trim().length < minLength) {
    throw new Error(
      `A mandatory reason of at least ${minLength} characters is required for this dangerous action.`
    );
  }
  return reason.trim();
}

/**
 * Append-only write operation for platform audit events.
 * Writes to Supabase `audit_log` table and mirrors to server store.
 * Strictly immutable: no code path exists for UPDATE or DELETE.
 */
export async function recordDangerousAuditLog(
  params: DangerousActionAuditParams
): Promise<AuditLogEntry> {
  // Validate reason is compliant before recording
  const validatedReason = requireReason(params.reason, 10);

  const entry: AuditLogEntry = {
    id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
    actor_id: params.actor_id || 'usr-platform-admin',
    actor_name: params.actor_name || 'Platform Administrator',
    action: params.action,
    target_type: params.target_type,
    target_id: params.target_id,
    target_label: params.target_label || params.target_id,
    reason: validatedReason,
    before: params.before || {},
    after: params.after || {},
    created_at: new Date().toISOString(),
    ip: params.ip || null,
  };

  // 1. Supabase persistence
  try {
    const supabase = await createServerClient();
    await supabase.from('audit_log').insert({
      id: entry.id,
      actor_id: entry.actor_id,
      actor_name: entry.actor_name,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      target_label: entry.target_label,
      reason: entry.reason,
      before: entry.before,
      after: entry.after,
      created_at: entry.created_at,
      ip: entry.ip,
    });
  } catch (err) {
    console.warn('Notice: Primary database audit_log write fallback:', err);
  }

  // 2. Fallback & local server store write
  try {
    saveServerAuditLog({
      id: entry.id,
      created_at: entry.created_at,
      admin_id: entry.actor_id,
      action_type: entry.action,
      target_id: entry.target_id,
      notes: `[${entry.target_label}] ${entry.reason}`,
      metadata: {
        actor_name: entry.actor_name,
        target_type: entry.target_type,
        before: entry.before,
        after: entry.after,
        ip: entry.ip,
      },
    });
  } catch {}

  // 3. Admin memory store write for immediate reactivity
  try {
    saveAdminAuditLog({
      id: entry.id,
      created_at: entry.created_at,
      admin_id: entry.actor_id,
      action_type: entry.action,
      target_id: entry.target_id,
      notes: `[${entry.target_label}] ${entry.reason}`,
      metadata: {
        actor_name: entry.actor_name,
        target_type: entry.target_type,
        before: entry.before,
        after: entry.after,
      },
    });
  } catch {}

  return entry;
}
