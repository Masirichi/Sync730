// lib/candidate/apply-ready-config.ts
// Centralized configuration for Apply-Ready candidate profile requirements.
// You can adjust, add, or reorder criteria here without modifying the core apply flows.

export interface ApplyReadyCriterion {
  id: string;
  key: string;
  label: string;
  hint: string;
  link: string; // Anchor link to profile section
  check: (profile: any) => boolean;
}

export const APPLY_READY_CRITERIA: ApplyReadyCriterion[] = [
  {
    id: 'email_verified',
    key: 'email_verified',
    label: 'Email address verified',
    hint: 'Confirm your email address to receive employer updates and interview invitations',
    link: '/dashboard/profile#email',
    check: (profile) => Boolean(profile?.email_verified === true || profile?.emailVerified === true),
  },
  {
    id: 'full_name',
    key: 'full_name',
    label: 'Full name',
    hint: 'Provide your first and last name as you want employers to see it',
    link: '/dashboard/profile#basic-info',
    check: (profile) => {
      const name = profile?.full_name || profile?.fullName;
      return typeof name === 'string' && name.trim().length >= 2;
    },
  },
  {
    id: 'country',
    key: 'country',
    label: 'Country of residence',
    hint: 'Select your current country for location eligibility and timezone matching',
    link: '/dashboard/profile#location',
    check: (profile) => {
      const country = profile?.country || (profile?.location && profile.location.split(',').pop()?.trim());
      return typeof country === 'string' && country.trim().length >= 2;
    },
  },
  {
    id: 'role_track',
    key: 'role_track',
    label: 'Primary role track',
    hint: 'Choose your main professional discipline (e.g., Software Engineering, Product Design)',
    link: '/dashboard/profile#role-track',
    check: (profile) => {
      const track = profile?.role_track || profile?.roleTrack || (Array.isArray(profile?.targetRoles) && profile.targetRoles.length > 0);
      return Boolean(track);
    },
  },
  {
    id: 'skills',
    key: 'skills',
    label: 'At least 3 verified skills',
    hint: 'Add a minimum of 3 core technical or functional skills with proficiency levels',
    link: '/dashboard/profile#skills',
    check: (profile) => {
      const skills = profile?.skills;
      if (!Array.isArray(skills)) return false;
      return skills.length >= 3;
    },
  },
  {
    id: 'experience_level',
    key: 'experience_level',
    label: 'Experience & seniority level',
    hint: 'Select your career level (Entry, Mid, Senior, Lead/Staff, or Executive)',
    link: '/dashboard/profile#experience',
    check: (profile) => {
      const level = profile?.experience_level || profile?.experienceLevel || profile?.seniority;
      return typeof level === 'string' && level.trim().length > 0;
    },
  },
  {
    id: 'cv_or_work_history',
    key: 'cv_or_work_history',
    label: 'CV uploaded OR at least 1 work history entry',
    hint: 'Upload your CV (PDF/DOCX max 5MB) or enter at least one past or current role',
    link: '/dashboard/profile#cv-upload',
    check: (profile) => {
      const hasCV = Boolean(
        profile?.cv_uploaded === true ||
        profile?.cvFile?.name ||
        profile?.cv_file_name
      );
      const hasWorkHistory = Array.isArray(profile?.work_history || profile?.workHistory) &&
        (profile?.work_history?.length > 0 || profile?.workHistory?.length > 0);
      return hasCV || hasWorkHistory;
    },
  },
];

export interface MissingItem {
  id: string;
  key: string;
  label: string;
  hint: string;
  link: string;
}

export interface ApplyReadyResult {
  is_apply_ready: boolean;
  total_steps: number;
  completed_steps: number;
  remaining_steps: number;
  missing_items: MissingItem[];
  progress_pct: number;
}

/**
 * Computes whether a candidate profile is apply_ready based on the criteria list.
 * This runs on both server (for authorization) and client (for UI feedback).
 */
export function evaluateApplyReady(profile: any): ApplyReadyResult {
  if (!profile) {
    return {
      is_apply_ready: false,
      total_steps: APPLY_READY_CRITERIA.length,
      completed_steps: 0,
      remaining_steps: APPLY_READY_CRITERIA.length,
      missing_items: APPLY_READY_CRITERIA.map(c => ({
        id: c.id,
        key: c.key,
        label: c.label,
        hint: c.hint,
        link: c.link,
      })),
      progress_pct: 0,
    };
  }

  const missing_items: MissingItem[] = [];
  let completed_steps = 0;

  for (const criterion of APPLY_READY_CRITERIA) {
    if (criterion.check(profile)) {
      completed_steps++;
    } else {
      missing_items.push({
        id: criterion.id,
        key: criterion.key,
        label: criterion.label,
        hint: criterion.hint,
        link: criterion.link,
      });
    }
  }

  const is_apply_ready = missing_items.length === 0;
  const total_steps = APPLY_READY_CRITERIA.length;
  const remaining_steps = missing_items.length;
  const progress_pct = Math.round((completed_steps / total_steps) * 100);

  return {
    is_apply_ready,
    total_steps,
    completed_steps,
    remaining_steps,
    missing_items,
    progress_pct,
  };
}
