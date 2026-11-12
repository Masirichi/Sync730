// lib/candidate/profile.ts
// Candidate Profile model, strength evaluation, and CV parsing utilities.

export interface SkillProficiency {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export type SeniorityLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead/Staff';
export type WorkPreference = 'Remote' | 'Contract' | 'Full-time' | 'Part-time';

export interface CVFileInfo {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  parsedSummary?: string;
  rawText?: string;
}

export interface CandidateProfile {
  fullName: string;
  email: string;
  phone?: string;
  location: string; // e.g. "Lagos, Nigeria"
  targetRoles: string[]; // e.g. ["Senior Frontend Engineer", "Full Stack Architect"]
  skills: SkillProficiency[]; // skills with proficiency level
  yearsOfExperience: number;
  seniority: SeniorityLevel;
  workPreferences: WorkPreference[];
  minSalaryExpectation: number | null;
  salaryCurrency: 'USD' | 'NGN' | 'EUR' | 'GBP';
  verificationStatus?: 'not_started' | 'in_progress' | 'verified';
  cvFile?: CVFileInfo | null;
  bio?: string;
  lastUpdated?: string;
}

export interface ProfileStrengthCheck {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
  hint: string;
}

export interface ProfileStrengthResult {
  score: number; // 0 to 100
  isComplete: boolean;
  checks: ProfileStrengthCheck[];
  missingCount: number;
}

export const PROFILE_STORAGE_KEY = 'sync730_candidate_profile';

// Default seeded candidate profile for Nigerian / African tech talent
export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  fullName: 'Adaeze Okonkwo',
  email: 'adaeze.okonkwo@sync730.dev',
  phone: '+234 803 123 4567',
  location: 'Lagos, Nigeria',
  targetRoles: ['Senior Frontend Engineer', 'Full Stack TypeScript Architect'],
  skills: [
    { name: 'React', level: 'Expert' },
    { name: 'TypeScript', level: 'Expert' },
    { name: 'Next.js', level: 'Advanced' },
    { name: 'Tailwind CSS', level: 'Expert' },
    { name: 'Node.js', level: 'Advanced' },
    { name: 'PostgreSQL', level: 'Intermediate' },
    { name: 'GraphQL', level: 'Advanced' },
  ],
  yearsOfExperience: 6,
  seniority: 'Senior',
  workPreferences: ['Remote', 'Full-time', 'Contract'],
  minSalaryExpectation: 85000,
  salaryCurrency: 'USD',
  verificationStatus: 'verified',
  cvFile: {
    name: 'Adaeze_Okonkwo_Senior_Engineer_CV.pdf',
    size: 1450000,
    type: 'application/pdf',
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    parsedSummary: '6+ years in frontend & full-stack development with React, TypeScript, Next.js, and high-throughput web applications in Lagos, Nigeria.',
  },
  bio: 'Senior Software Engineer specializing in resilient, accessible Next.js web applications, design systems, and distributed cloud integrations.',
  lastUpdated: new Date().toISOString(),
};

/**
 * Calculates Profile Strength (0 - 100%) and returns an actionable checklist.
 */
export function calculateProfileStrength(profile?: Partial<CandidateProfile> | null): ProfileStrengthResult {
  if (!profile) {
    return {
      score: 0,
      isComplete: false,
      checks: [],
      missingCount: 6,
    };
  }

  const checks: ProfileStrengthCheck[] = [
    {
      id: 'target_roles',
      label: 'Target roles specified',
      completed: Array.isArray(profile.targetRoles) && profile.targetRoles.length > 0,
      weight: 15,
      hint: 'Add at least one role you are targeting (e.g. Senior Frontend Engineer)',
    },
    {
      id: 'skills',
      label: 'At least 3 skills with proficiency levels',
      completed: Array.isArray(profile.skills) && profile.skills.length >= 3,
      weight: 25,
      hint: 'Add your core technical skills and rate your proficiency (Beginner to Expert)',
    },
    {
      id: 'experience',
      label: 'Years of experience & Seniority level',
      completed: typeof profile.yearsOfExperience === 'number' && profile.yearsOfExperience > 0 && Boolean(profile.seniority),
      weight: 15,
      hint: 'Specify your career experience and seniority (Entry, Mid, Senior, Lead)',
    },
    {
      id: 'location',
      label: 'Location & Work preferences',
      completed: Boolean(profile.location?.trim()) && Array.isArray(profile.workPreferences) && profile.workPreferences.length > 0,
      weight: 15,
      hint: 'Provide your base location and remote/contract/full-time preferences',
    },
    {
      id: 'salary',
      label: 'Minimum salary expectation',
      completed: typeof profile.minSalaryExpectation === 'number' && profile.minSalaryExpectation > 0,
      weight: 15,
      hint: 'Set your baseline annual or monthly compensation requirement',
    },
    {
      id: 'cv_upload',
      label: 'CV / Resume uploaded (PDF/DOCX, max 5MB)',
      completed: Boolean(profile.cvFile?.name),
      weight: 15,
      hint: 'Upload your current CV to enable automatic skill extraction',
    },
  ];

  let totalScore = 0;
  let completedCount = 0;

  checks.forEach((c) => {
    if (c.completed) {
      totalScore += c.weight;
      completedCount++;
    }
  });

  const missingCount = checks.length - completedCount;
  // Consider profile complete if strength is at least 70% or all core skills/roles/experience set
  const isComplete: boolean = Boolean(totalScore >= 70 && profile.skills && profile.skills.length >= 2);

  return {
    score: Math.min(100, Math.round(totalScore)),
    isComplete,
    checks,
    missingCount,
  };
}

/**
 * Loads candidate profile from localStorage or falls back to default.
 */
export function getCandidateProfile(): CandidateProfile {
  if (typeof window === 'undefined') return DEFAULT_CANDIDATE_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_CANDIDATE_PROFILE));
      return DEFAULT_CANDIDATE_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CANDIDATE_PROFILE;
  }
}

/**
 * Saves candidate profile to localStorage and dispatches a broadcast event.
 */
export function saveCandidateProfile(profile: CandidateProfile): CandidateProfile {
  const updated = {
    ...profile,
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_profile_updated'));
    } catch (e) {
      console.warn('Failed to save candidate profile:', e);
    }
  }

  return updated;
}

/**
 * Resets candidate profile to a blank/minimal profile for testing incomplete states.
 */
export function resetCandidateProfile(): CandidateProfile {
  const emptyProfile: CandidateProfile = {
    fullName: '',
    email: '',
    location: '',
    targetRoles: [],
    skills: [],
    yearsOfExperience: 0,
    seniority: 'Mid',
    workPreferences: ['Remote'],
    minSalaryExpectation: null,
    salaryCurrency: 'USD',
    cvFile: null,
    bio: '',
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(emptyProfile));
      window.dispatchEvent(new Event('sync730_profile_updated'));
    } catch (e) {
      console.warn('Failed to reset candidate profile:', e);
    }
  }

  return emptyProfile;
}

/**
 * Extracts technical skills, roles, and experience from raw CV text.
 */
export function parseCVText(text: string): {
  skills: SkillProficiency[];
  yearsOfExperience: number;
  seniority: SeniorityLevel;
  targetRoles: string[];
} {
  const lower = text.toLowerCase();

  // Known tech skills to scan
  const KNOWN_SKILLS = [
    'React', 'TypeScript', 'JavaScript', 'Next.js', 'Node.js', 'Python', 'Go', 'Golang',
    'Kubernetes', 'Docker', 'AWS', 'GCP', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'GraphQL', 'Tailwind CSS', 'Kafka', 'Terraform', 'CI/CD', 'Git', 'Java', 'Flutter',
    'Dart', 'Figma', 'UI/UX', 'FastAPI', 'Django', 'Rust', 'Linux', 'Microservices'
  ];

  const foundSkills: SkillProficiency[] = [];
  const seenSkills = new Set<string>();

  for (const skill of KNOWN_SKILLS) {
    const sLower = skill.toLowerCase();
    if (lower.includes(sLower) && !seenSkills.has(sLower)) {
      seenSkills.add(sLower);
      // Determine proficiency heuristic
      let level: SkillProficiency['level'] = 'Advanced';
      if (lower.includes(`expert in ${sLower}`) || lower.includes(`lead ${sLower}`) || lower.includes(`principal ${sLower}`)) {
        level = 'Expert';
      } else if (lower.includes(`familiar with ${sLower}`) || lower.includes(`basic ${sLower}`)) {
        level = 'Intermediate';
      }
      foundSkills.push({ name: skill, level });
    }
  }

  // Detect years of experience from patterns like "6+ years", "5 years of experience"
  let years = 4;
  const yrMatch = text.match(/(\d+)\+?\s*years(?:\s+of)?\s+experience/i) || text.match(/experience\s*:\s*(\d+)\+?\s*years/i);
  if (yrMatch && yrMatch[1]) {
    const parsed = parseInt(yrMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 35) {
      years = parsed;
    }
  }

  // Detect seniority
  let seniority: SeniorityLevel = 'Mid';
  if (lower.includes('staff') || lower.includes('principal') || lower.includes('lead architect') || lower.includes('director')) {
    seniority = 'Lead/Staff';
  } else if (lower.includes('senior') || years >= 5) {
    seniority = 'Senior';
  } else if (lower.includes('junior') || lower.includes('entry level') || years <= 2) {
    seniority = 'Entry';
  }

  // Detect target roles
  const targetRoles: string[] = [];
  if (lower.includes('frontend') || lower.includes('react')) targetRoles.push('Senior Frontend Engineer');
  if (lower.includes('full stack') || lower.includes('fullstack')) targetRoles.push('Full Stack TypeScript Architect');
  if (lower.includes('backend') || lower.includes('distributed')) targetRoles.push('Senior Backend & Distributed Systems Engineer');
  if (lower.includes('devops') || lower.includes('cloud') || lower.includes('sre')) targetRoles.push('DevOps & Cloud Systems Specialist');
  if (lower.includes('data') || lower.includes('machine learning') || lower.includes('ai')) targetRoles.push('Data & AI Engineer');
  if (targetRoles.length === 0) targetRoles.push('Software Engineer');

  return {
    skills: foundSkills.length > 0 ? foundSkills : [
      { name: 'TypeScript', level: 'Advanced' },
      { name: 'React', level: 'Advanced' },
      { name: 'Node.js', level: 'Intermediate' },
    ],
    yearsOfExperience: years,
    seniority,
    targetRoles: targetRoles.slice(0, 3),
  };
}
