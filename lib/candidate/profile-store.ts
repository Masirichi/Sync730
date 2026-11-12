// lib/candidate/profile-store.ts
// Server and browser store for candidate profiles, with strict apply_ready computation.
// Under no circumstances are gender, age, photographs, or marital status collected or stored.

import fs from 'fs';
import path from 'path';
import os from 'os';
import { evaluateApplyReady, ApplyReadyResult } from './apply-ready-config';

export interface WorkHistoryEntry {
  id: string;
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  summary?: string;
}

export interface SkillProficiencyItem {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface ExtendedCandidateProfile {
  id: string;
  user_id?: string;
  email_verified: boolean;
  full_name: string;
  email: string;
  country: string;
  location?: string;
  role_track: string;
  target_roles?: string[];
  skills: SkillProficiencyItem[];
  years_of_experience: number;
  experience_level: string; // 'Entry' | 'Mid' | 'Senior' | 'Lead/Staff' | 'Executive'
  work_history: WorkHistoryEntry[];
  cv_uploaded: boolean;
  cv_file_name?: string;
  cv_file_size?: number;
  cv_uploaded_at?: string;
  work_preferences: string[];
  min_salary_expectation: number | null;
  salary_currency: 'USD' | 'NGN' | 'EUR' | 'GBP';
  bio?: string;
  // Computed server-side on every save
  is_apply_ready: boolean;
  missing_items: Array<{
    id: string;
    key: string;
    label: string;
    hint: string;
    link: string;
  }>;
  apply_ready_progress_pct: number;
  last_updated: string;
}

// Baseline default candidate profile (seeded for local testing)
export const DEFAULT_EXTENDED_PROFILE: ExtendedCandidateProfile = {
  id: 'candidate-default-01',
  user_id: 'default-candidate-user',
  email_verified: true,
  full_name: 'Adaeze Okonkwo',
  email: 'adaeze.okonkwo@sync730.dev',
  country: 'Nigeria',
  location: 'Lagos, Nigeria',
  role_track: 'Software Engineering',
  target_roles: ['Senior Frontend Engineer', 'Full Stack TypeScript Architect'],
  skills: [
    { name: 'React', level: 'Expert' },
    { name: 'TypeScript', level: 'Expert' },
    { name: 'Next.js', level: 'Advanced' },
    { name: 'Tailwind CSS', level: 'Expert' },
    { name: 'Node.js', level: 'Advanced' },
  ],
  years_of_experience: 6,
  experience_level: 'Senior',
  work_history: [
    {
      id: 'work-1',
      title: 'Senior Frontend Engineer',
      company: 'PayFlex Africa',
      location: 'Lagos, Nigeria',
      start_date: '2022-03',
      current: true,
      summary: 'Led the core merchant checkout frontend, cutting load latency by 45%.',
    },
  ],
  cv_uploaded: true,
  cv_file_name: 'Adaeze_Okonkwo_Senior_Engineer_CV.pdf',
  cv_file_size: 1450000,
  cv_uploaded_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  work_preferences: ['Remote', 'Full-time'],
  min_salary_expectation: 85000,
  salary_currency: 'USD',
  bio: 'Senior Software Engineer specializing in resilient, accessible Next.js web applications.',
  is_apply_ready: true,
  missing_items: [],
  apply_ready_progress_pct: 100,
  last_updated: new Date().toISOString(),
};

const PRIMARY_PROFILES_FILE = path.join(process.cwd(), '.sync730-candidate-profiles.json');
const FALLBACK_PROFILES_FILE = path.join(os.tmpdir(), '.sync730-candidate-profiles.json');

declare global {
  // eslint-disable-next-line no-var
  var __sync730_candidate_profiles_cache__: Map<string, ExtendedCandidateProfile> | undefined;
}

function getProfilesMap(): Map<string, ExtendedCandidateProfile> {
  if (globalThis.__sync730_candidate_profiles_cache__) {
    return globalThis.__sync730_candidate_profiles_cache__;
  }

  const map = new Map<string, ExtendedCandidateProfile>();
  map.set(DEFAULT_EXTENDED_PROFILE.id, DEFAULT_EXTENDED_PROFILE);
  if (DEFAULT_EXTENDED_PROFILE.user_id) {
    map.set(DEFAULT_EXTENDED_PROFILE.user_id, DEFAULT_EXTENDED_PROFILE);
  }

  try {
    let raw: string | null = null;
    if (fs.existsSync(PRIMARY_PROFILES_FILE)) {
      raw = fs.readFileSync(PRIMARY_PROFILES_FILE, 'utf8');
    } else if (fs.existsSync(FALLBACK_PROFILES_FILE)) {
      raw = fs.readFileSync(FALLBACK_PROFILES_FILE, 'utf8');
    }

    if (raw) {
      const list: ExtendedCandidateProfile[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach(p => {
          map.set(p.id, p);
          if (p.user_id) map.set(p.user_id, p);
        });
      }
    }
  } catch {
    // Ignore read errors
  }

  globalThis.__sync730_candidate_profiles_cache__ = map;
  return map;
}

function persistProfilesMap(): void {
  const map = getProfilesMap();
  const list = Array.from(new Set(map.values()));
  const json = JSON.stringify(list, null, 2);

  try {
    fs.writeFileSync(PRIMARY_PROFILES_FILE, json, 'utf8');
  } catch {}
  try {
    fs.writeFileSync(FALLBACK_PROFILES_FILE, json, 'utf8');
  } catch {}
}

export function createEmptyCandidateProfile(userId?: string): ExtendedCandidateProfile {
  const empty: Partial<ExtendedCandidateProfile> = {
    id: `candidate-${userId || Date.now()}`,
    user_id: userId,
    full_name: '',
    email: '',
    country: '',
    role_track: '',
    skills: [],
    years_of_experience: 0,
    experience_level: '',
    work_history: [],
    cv_uploaded: false,
    email_verified: false,
    work_preferences: [],
    min_salary_expectation: null,
    salary_currency: 'USD',
  };
  const evaluation = evaluateApplyReady(empty);
  return {
    ...empty,
    is_apply_ready: false,
    missing_items: evaluation.missing_items,
    apply_ready_progress_pct: evaluation.progress_pct,
    last_updated: new Date().toISOString(),
  } as ExtendedCandidateProfile;
}

/**
 * Retrieves a candidate profile by user ID or profile ID.
 */
export function getCandidateProfileServer(userIdOrProfileId?: string): ExtendedCandidateProfile {
  const map = getProfilesMap();
  if (userIdOrProfileId && map.has(userIdOrProfileId)) {
    return map.get(userIdOrProfileId)!;
  }
  // If specific ID was requested but not found in profile store, return a fresh empty incomplete profile
  if (userIdOrProfileId) {
    return createEmptyCandidateProfile(userIdOrProfileId);
  }
  // Fall back to default seeded candidate only when no user ID was provided at all
  return DEFAULT_EXTENDED_PROFILE;
}

/**
 * Saves a candidate profile on the server, automatically computing apply_ready
 * and storing the status and missing items.
 */
export function saveCandidateProfileServer(
  profileData: Partial<ExtendedCandidateProfile>,
  userId?: string
): { profile: ExtendedCandidateProfile; apply_ready_result: ApplyReadyResult } {
  const map = getProfilesMap();
  const existing =
    userId && map.has(userId)
      ? map.get(userId)!
      : userId
      ? createEmptyCandidateProfile(userId)
      : DEFAULT_EXTENDED_PROFILE;

  // Compute apply_ready criteria on the server
  const evaluation = evaluateApplyReady({
    ...existing,
    ...profileData,
  });

  const updatedProfile: ExtendedCandidateProfile = {
    ...existing,
    ...profileData,
    id: existing.id || `candidate-${Date.now()}`,
    user_id: userId || existing.user_id,
    is_apply_ready: evaluation.is_apply_ready,
    missing_items: evaluation.missing_items,
    apply_ready_progress_pct: evaluation.progress_pct,
    last_updated: new Date().toISOString(),
  };

  map.set(updatedProfile.id, updatedProfile);
  if (updatedProfile.user_id) {
    map.set(updatedProfile.user_id, updatedProfile);
  }

  persistProfilesMap();

  return {
    profile: updatedProfile,
    apply_ready_result: evaluation,
  };
}
