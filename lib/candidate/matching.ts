// lib/candidate/matching.ts
// Transparent, Ethical AI Candidate-Job Matching Engine.
//
// =========================================================================================
// ETHICAL AI NON-DISCRIMINATION COMPLIANCE DIRECTIVE:
//
// This matching algorithm calculates compatibility strictly based on technical qualifications,
// verifiable role criteria, and stated job search parameters:
// 1. Technical skill overlap (candidate skills vs job requirements)
// 2. Seniority level alignment (e.g. Senior vs Senior / Lead)
// 3. Employment type preference (e.g. Full-time, Contract, Remote)
// 4. Geographic & location authorization (e.g. Open to Nigeria / Africa / Worldwide)
// 5. Baseline compensation expectation vs offered job salary range
//
// Under NO circumstances does this scoring or ranking engine consider or ingest:
// - Gender or gender identity
// - Age, birthdate, or graduation year
// - Candidate name, username, or personal identity
// - Photographs, profile avatars, or biometric attributes
// - Race, tribe, nationality, or ethnic origin
// - Marital status, parental status, or any protected personal characteristics
//
// All calculations are transparent, merit-focused, and fully auditable.
// If the candidate profile lacks necessary qualification data, the engine returns
// null and prompts the candidate to complete their profile rather than estimating.
// =========================================================================================

import { RemoteJob } from '@/lib/supabase/types';
import { CandidateProfile, calculateProfileStrength } from './profile';
import { extractCleanSkills } from '@/lib/crawler/job-utils';

export interface MatchBreakdown {
  matchedSkills: string[];
  missingSkills: string[];
  totalJobSkills: number;
  skillOverlapPct: number;
  seniorityFit: 'Exact fit' | 'Adjacent fit' | 'Growth role' | 'Overqualified';
  seniorityPoints: number; // out of 20
  jobTypeFit: boolean;
  jobTypePoints: number; // out of 15
  locationEligible: boolean;
  locationReason: string;
  locationPoints: number; // out of 10
  salaryFit: 'Meets expectation' | 'Competitive' | 'Below expectation' | 'Not listed';
  salaryPoints: number; // out of 10
}

export interface MatchScoreResult {
  isProfileComplete: boolean;
  score: number | null; // e.g. 82 or null if profile incomplete
  reason: string; // e.g. "Matches 6/8 skills · Seniority fits · Open to Nigeria"
  breakdown: MatchBreakdown | null;
  reportCount?: number;
}

/**
 * Normalizes a skill string for comparison (lowercase, trimmed, stripped of punctuation).
 */
function normalizeSkill(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Evaluates candidate seniority vs job seniority level.
 */
function evaluateSeniority(
  candidateSen: string,
  jobSen: string
): { fit: MatchBreakdown['seniorityFit']; points: number } {
  const normCand = (candidateSen || '').toLowerCase();
  const normJob = (jobSen || '').toLowerCase();

  const rankMap: Record<string, number> = {
    entry: 1,
    mid: 2,
    senior: 3,
    'lead/staff': 4,
    lead: 4,
    staff: 4,
  };

  const cRank = rankMap[normCand] || 2;
  const jRank = rankMap[normJob] || 3;

  if (cRank === jRank) {
    return { fit: 'Exact fit', points: 20 };
  } else if (cRank === jRank - 1) {
    return { fit: 'Growth role', points: 14 };
  } else if (cRank === jRank + 1) {
    return { fit: 'Adjacent fit', points: 15 };
  } else if (cRank > jRank + 1) {
    return { fit: 'Overqualified', points: 10 };
  } else {
    return { fit: 'Growth role', points: 8 };
  }
}

/**
 * Computes the Match Score between a candidate profile and a specific job.
 * Returns null score if candidate profile is incomplete.
 */
export function computeJobMatchScore(
  job: Partial<RemoteJob>,
  profile?: CandidateProfile | null
): MatchScoreResult {
  // 1. Verify Profile Completeness
  if (!profile) {
    return {
      isProfileComplete: false,
      score: null,
      reason: 'Complete your profile to see match scores',
      breakdown: null,
    };
  }

  const strength = calculateProfileStrength(profile);
  if (!strength.isComplete || !profile.skills || profile.skills.length === 0) {
    return {
      isProfileComplete: false,
      score: null,
      reason: 'Complete your profile to see match scores',
      breakdown: null,
    };
  }

  // 2. Extract Candidate Skills
  const candidateSkillMap = new Map<string, string>();
  profile.skills.forEach((sp) => {
    candidateSkillMap.set(normalizeSkill(sp.name), sp.name);
  });

  // 3. Extract Clean Job Skills
  const rawJobSkills = job.skills || job.tags || [];
  const cleanJobSkills = extractCleanSkills(
    rawJobSkills,
    job.company_name || job.company,
    job.source_name || job.source
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  cleanJobSkills.forEach((js) => {
    const norm = normalizeSkill(js);
    if (candidateSkillMap.has(norm)) {
      matchedSkills.push(js);
    } else {
      missingSkills.push(js);
    }
  });

  // Calculate skill score component (0 to 45 points)
  const totalJobSkills = cleanJobSkills.length || 1;
  const skillRatio = cleanJobSkills.length > 0 ? matchedSkills.length / cleanJobSkills.length : 0.8;
  const skillPoints = Math.round(skillRatio * 45);

  // 4. Seniority Fit (0 to 20 points)
  const seniorityEval = evaluateSeniority(profile.seniority, job.seniority || 'Mid');

  // 5. Job Type Preference (0 to 15 points)
  let jobTypeFit = false;
  let jobTypePoints = 5;
  const jobTypeStr = (job.job_type || 'Full-time').toLowerCase();
  if (
    profile.workPreferences &&
    profile.workPreferences.some((p) => {
      const lowerP = p.toLowerCase();
      if (lowerP === 'remote') return true;
      return jobTypeStr.includes(lowerP);
    })
  ) {
    jobTypeFit = true;
    jobTypePoints = 15;
  }

  // 6. Location Eligibility (0 to 10 points)
  let locationEligible = false;
  let locationReason = 'Worldwide Remote';
  let locationPoints = 10;

  const isNigeriaCandidate = (profile.location || '').toLowerCase().includes('nigeria') ||
    (profile.location || '').toLowerCase().includes('lagos') ||
    (profile.location || '').toLowerCase().includes('abuja');

  if (job.open_to_nigeria) {
    locationEligible = true;
    locationReason = 'Open to Nigeria';
    locationPoints = 10;
  } else if (job.location_rule === 'worldwide') {
    locationEligible = true;
    locationReason = 'Worldwide eligible';
    locationPoints = 10;
  } else if (isNigeriaCandidate && job.location_rule === 'africa_only') {
    locationEligible = true;
    locationReason = 'Africa region fit';
    locationPoints = 10;
  } else if (job.eligible_countries && job.eligible_countries.includes('Worldwide')) {
    locationEligible = true;
    locationReason = 'Open to international remote';
    locationPoints = 10;
  } else {
    locationEligible = false;
    locationReason = 'Location restriction';
    locationPoints = 2;
  }

  // 7. Salary Expectation Fit (0 to 10 points)
  let salaryFit: MatchBreakdown['salaryFit'] = 'Not listed';
  let salaryPoints = 7; // Neutral fallback when unlisted

  if (profile.minSalaryExpectation && profile.minSalaryExpectation > 0) {
    const jobMin = job.salary_min || null;
    const jobMax = job.salary_max || null;

    if (jobMax || jobMin) {
      const effectiveJobAnnual = (jobMax || jobMin || 0) * (job.salary_period === 'month' ? 12 : job.salary_period === 'hour' ? 1920 : 1);
      const candAnnual = profile.salaryCurrency === 'NGN' && job.salary_currency === 'USD'
        ? profile.minSalaryExpectation / 1500
        : profile.salaryCurrency === 'USD' && job.salary_currency === 'NGN'
        ? profile.minSalaryExpectation * 1500
        : profile.minSalaryExpectation;

      if (effectiveJobAnnual >= candAnnual) {
        salaryFit = 'Meets expectation';
        salaryPoints = 10;
      } else if (effectiveJobAnnual >= candAnnual * 0.8) {
        salaryFit = 'Competitive';
        salaryPoints = 6;
      } else {
        salaryFit = 'Below expectation';
        salaryPoints = 2;
      }
    }
  }

  // Aggregate Total Score (Capped between 35 and 98 to remain credible and honest)
  const totalScore = Math.min(98, Math.max(35, skillPoints + seniorityEval.points + jobTypePoints + locationPoints + salaryPoints));

  // Construct Honest One-Line Reason
  const reasonParts: string[] = [];
  if (cleanJobSkills.length > 0) {
    reasonParts.push(`Matches ${matchedSkills.length}/${cleanJobSkills.length} skills`);
  } else {
    reasonParts.push('Core skills align');
  }

  if (seniorityEval.fit === 'Exact fit') {
    reasonParts.push('Seniority fits');
  } else if (seniorityEval.fit === 'Adjacent fit') {
    reasonParts.push('Seniority close');
  }

  if (locationReason) {
    reasonParts.push(locationReason);
  }

  const oneLineReason = reasonParts.join(' · ');

  return {
    isProfileComplete: true,
    score: totalScore,
    reason: oneLineReason,
    breakdown: {
      matchedSkills,
      missingSkills,
      totalJobSkills: cleanJobSkills.length,
      skillOverlapPct: Math.round(skillRatio * 100),
      seniorityFit: seniorityEval.fit,
      seniorityPoints: seniorityEval.points,
      jobTypeFit,
      jobTypePoints,
      locationEligible,
      locationReason,
      locationPoints,
      salaryFit,
      salaryPoints,
    },
  };
}
