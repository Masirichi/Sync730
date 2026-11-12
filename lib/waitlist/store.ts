import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface WaitlistEntry {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  country: string | null;
  track: string | null;
  priorities: string[];
  consent: boolean;
  consent_at: string;
  consent_text_version: string;
  source: string | null;
}

const PRIMARY_FILE = path.join(process.cwd(), '.sync730-waitlist.json');
const FALLBACK_FILE = path.join(os.tmpdir(), '.sync730-waitlist.json');

declare global {
  // eslint-disable-next-line no-var
  var __sync730_waitlist_store__: WaitlistEntry[] | undefined;
}

function loadLocalEntries(): WaitlistEntry[] {
  if (globalThis.__sync730_waitlist_store__) {
    return globalThis.__sync730_waitlist_store__;
  }

  try {
    if (fs.existsSync(PRIMARY_FILE)) {
      const data = fs.readFileSync(PRIMARY_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        globalThis.__sync730_waitlist_store__ = parsed;
        return parsed;
      }
    }
  } catch {
    // Continue to fallback
  }

  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        globalThis.__sync730_waitlist_store__ = parsed;
        return parsed;
      }
    }
  } catch {
    // Continue to default
  }

  globalThis.__sync730_waitlist_store__ = [];
  return globalThis.__sync730_waitlist_store__;
}

function persistLocalEntries(entries: WaitlistEntry[]): void {
  globalThis.__sync730_waitlist_store__ = entries;
  const json = JSON.stringify(entries, null, 2);

  try {
    fs.writeFileSync(PRIMARY_FILE, json, 'utf8');
  } catch {
    // Read-only filesystem
  }

  try {
    fs.writeFileSync(FALLBACK_FILE, json, 'utf8');
  } catch {
    // Ignore fallback write error
  }
}

export interface SaveWaitlistResult {
  success: boolean;
  duplicate?: boolean;
  entry?: WaitlistEntry;
  error?: string;
}

/**
 * Saves a waitlist entry using Supabase service-role client if configured,
 * or the persistent local store as resilient dev/offline fallback.
 */
export async function saveWaitlistEntry(params: {
  full_name: string;
  email: string;
  country?: string | null;
  track?: string | null;
  priorities?: string[] | null;
  consent: boolean;
  source?: string | null;
}): Promise<SaveWaitlistResult> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const consentAt = new Date().toISOString();
  const consentTextVersion = 'v1';
  const cleanPriorities = Array.isArray(params.priorities) ? params.priorities : [];

  const supabase = getServiceRoleClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .insert({
          full_name: params.full_name.trim(),
          email: normalizedEmail,
          country: params.country || null,
          track: params.track || null,
          priorities: cleanPriorities,
          consent: params.consent,
          consent_at: consentAt,
          consent_text_version: consentTextVersion,
          source: params.source || null,
        })
        .select()
        .single();

      if (error) {
        // Code 23505 is PostgreSQL unique constraint violation
        if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate') || error.message?.toLowerCase().includes('unique')) {
          return { success: true, duplicate: true };
        }
        console.error('[Waitlist Store] Supabase insert error:', error.message);
        // Fall back to local store if Supabase encounters table/permission errors in dev
      } else if (data) {
        // Also reflect in local store for dev consistency and verification scripts
        const entries = loadLocalEntries();
        if (!entries.some(e => e.email.toLowerCase() === normalizedEmail)) {
          entries.push(data as WaitlistEntry);
          persistLocalEntries(entries);
        }
        return { success: true, duplicate: false, entry: data as WaitlistEntry };
      }
    } catch (err: unknown) {
      console.warn('[Waitlist Store] Supabase unreachable, using local store fallback:', err);
    }
  }

  // Local fallback store
  const entries = loadLocalEntries();
  const existing = entries.find(e => e.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return { success: true, duplicate: true, entry: existing };
  }

  const newEntry: WaitlistEntry = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    full_name: params.full_name.trim(),
    email: normalizedEmail,
    country: params.country || null,
    track: params.track || null,
    priorities: cleanPriorities,
    consent: params.consent,
    consent_at: consentAt,
    consent_text_version: consentTextVersion,
    source: params.source || null,
  };

  entries.push(newEntry);
  persistLocalEntries(entries);

  return { success: true, duplicate: false, entry: newEntry };
}

/**
 * Returns all saved waitlist entries (useful for test assertions and server diagnostics)
 */
export function getWaitlistEntries(): WaitlistEntry[] {
  return [...loadLocalEntries()];
}

/**
 * Clears the local waitlist entries (used by automated tests)
 */
export function clearWaitlistStore(): void {
  globalThis.__sync730_waitlist_store__ = [];
  try {
    if (fs.existsSync(PRIMARY_FILE)) fs.unlinkSync(PRIMARY_FILE);
  } catch {}
  try {
    if (fs.existsSync(FALLBACK_FILE)) fs.unlinkSync(FALLBACK_FILE);
  } catch {}
}
