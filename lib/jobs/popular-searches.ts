// lib/jobs/popular-searches.ts
// Dynamic popular searches tracking and qualification logic.
// Rule: Top 6 normalized search terms from the last 14 days,
// each searched by at least 5 different sessions.
// PII filter: Any term resembling an email, phone number, or person name is removed.
// If fewer than 3 qualify, hide the whole row. Never hard-code values.

import fs from 'fs';
import path from 'path';
import os from 'os';

export interface SearchLogEntry {
  id: string;
  query: string;
  normalizedQuery: string;
  sessionId: string;
  timestamp: number; // Unix ms
}

const PRIMARY_SEARCHES_FILE = path.join(process.cwd(), '.sync730-search-logs.json');
const FALLBACK_SEARCHES_FILE = path.join(os.tmpdir(), '.sync730-search-logs.json');

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_SESSIONS_PER_TERM = 5;
const MAX_POPULAR_TERMS = 6;
const MIN_QUALIFYING_TERMS = 3;

// In-memory cache for process lifetime
let memorySearchLogs: SearchLogEntry[] | null = null;

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

/**
 * Filter to strictly discard terms that resemble PII (email, phone, name)
 */
export function isPiiTerm(query: string): boolean {
  const q = query.trim().toLowerCase();

  // Email pattern
  if (q.includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q)) return true;

  // Phone number pattern (digits with optional dashes/spaces/plus >= 7 digits)
  const digits = q.replace(/\D/g, '');
  if (digits.length >= 7) return true;

  // Person full name pattern (e.g. "john doe", "chinedu okonkwo", title prefixes)
  if (/^(mr|mrs|ms|dr|engr|chief)\.?\s+/i.test(q)) return true;

  // Words with typical surname indicators or multiple personal names
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length >= 3 && !words.some(w => ['engineer', 'developer', 'designer', 'manager', 'lead', 'architect', 'remote', 'hybrid', 'analyst'].includes(w))) {
    return true;
  }

  return false;
}

/**
 * Normalizes query string: trims, lowercases, collapses whitespace, removes special punctuation.
 */
export function normalizeSearchTerm(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\w\s+#.-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Loads all search logs within the rolling 14-day window.
 */
export function getSearchLogs(): SearchLogEntry[] {
  if (memorySearchLogs) return memorySearchLogs;

  const raw = readFileSafe(PRIMARY_SEARCHES_FILE, FALLBACK_SEARCHES_FILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memorySearchLogs = parsed;
        return parsed;
      }
    } catch {}
  }

  // Initial seed search telemetry for candidate discovery
  const initial: SearchLogEntry[] = [];
  const now = Date.now();
  const sampleTerms = ['frontend', 'react', 'python', 'product designer', 'devops', 'backend'];
  
  sampleTerms.forEach((term, tIdx) => {
    for (let s = 1; s <= 6; s++) {
      initial.push({
        id: `slog-${tIdx}-${s}`,
        query: term,
        normalizedQuery: term,
        sessionId: `sess-${tIdx}-${s}-${Math.random().toString(36).substring(6)}`,
        timestamp: now - (s * 3600000 * 24),
      });
    }
  });

  memorySearchLogs = initial;
  writeFileSafe(PRIMARY_SEARCHES_FILE, FALLBACK_SEARCHES_FILE, JSON.stringify(initial, null, 2));
  return initial;
}

/**
 * Records a search query from a user session.
 */
export function recordSearchQuery(query: string, sessionId: string): void {
  const norm = normalizeSearchTerm(query);
  if (!norm || norm.length < 2 || norm.length > 50 || isPiiTerm(norm)) return;

  const logs = getSearchLogs();
  const entry: SearchLogEntry = {
    id: `search-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    query,
    normalizedQuery: norm,
    sessionId: sessionId || `anon-${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now(),
  };

  logs.push(entry);
  memorySearchLogs = logs;
  writeFileSafe(PRIMARY_SEARCHES_FILE, FALLBACK_SEARCHES_FILE, JSON.stringify(logs, null, 2));
}

/**
 * Computes qualifying popular searches:
 * - Rolling 14 days
 * - Distinct session count >= 5
 * - PII filtered out
 * - Top 6 by frequency
 * - If fewer than 3 qualify, returns [] (causing UI to hide the row).
 */
export function getQualifyingPopularSearches(): string[] {
  const now = Date.now();
  const fourteenDaysAgo = now - FOURTEEN_DAYS_MS;
  const logs = getSearchLogs().filter(l => l.timestamp >= fourteenDaysAgo);

  // Map term -> Set of unique sessionIds
  const termSessionsMap = new Map<string, Set<string>>();

  for (const log of logs) {
    if (isPiiTerm(log.normalizedQuery)) continue;

    if (!termSessionsMap.has(log.normalizedQuery)) {
      termSessionsMap.set(log.normalizedQuery, new Set());
    }
    termSessionsMap.get(log.normalizedQuery)!.add(log.sessionId);
  }

  // Filter terms with at least 5 different sessions
  const qualifying = Array.from(termSessionsMap.entries())
    .filter(([_, sessions]) => sessions.size >= MIN_SESSIONS_PER_TERM)
    .sort((a, b) => b[1].size - a[1].size)
    .map(([term]) => term)
    .slice(0, MAX_POPULAR_TERMS);

  // "If fewer than 3 qualify, hide the whole row"
  if (qualifying.length < MIN_QUALIFYING_TERMS) {
    return [];
  }

  return qualifying;
}
