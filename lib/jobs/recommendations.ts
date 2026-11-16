// lib/jobs/recommendations.ts
// Multi-factor recommendation algorithm for matching verified public jobs
// with candidate profile competencies, seniority, work preferences, and registered job interests.

import type { PublicJob } from '@/lib/jobs/service';
import type { CandidateProfile } from '@/lib/candidate/profile';
import { getCandidateProfile } from '@/lib/candidate/profile';

export interface JobRecommendationResult {
  job: PublicJob;
  matchScore: number; // 0 to 100
  matchReasons: string[];
  matchedSkills: string[];
  isRecommended: boolean;
  tier: 'Strong Match' | 'Good Match' | 'Potential Match';
}

/**
 * Calculates a multi-factor recommendation score (0-100) between a job listing and a candidate's profile.
 */
export function calculateJobRecommendation(
  job: PublicJob,
  profile: CandidateProfile
): JobRecommendationResult {
  let score = 0;
  const matchReasons: string[] = [];
  const matchedSkills: string[] = [];

  const rawJob = job as any;
  const jobTitleLower = (job.title || '').toLowerCase();
  const jobDescLower = (job.description || '').toLowerCase();
  const jobTags: string[] = [
    ...(Array.isArray(job.skills) ? job.skills : []),
    ...(Array.isArray(rawJob.tags) ? rawJob.tags : []),
  ].map((t: string) => String(t).toLowerCase());

  // -------------------------------------------------------------
  // 1. Role Title & Target Track Alignment (Max 35 points)
  // -------------------------------------------------------------
  const targetRoles = profile.targetRoles || ['Software Engineer'];
  let roleTitleMatched = false;

  for (const target of targetRoles) {
    const targetLower = target.toLowerCase();
    // Direct exact or substring match
    if (jobTitleLower.includes(targetLower) || targetLower.includes(jobTitleLower)) {
      score += 35;
      roleTitleMatched = true;
      matchReasons.push(`Matches your target role: "${target}"`);
      break;
    }

    // Tokenized word-level match (e.g. "Frontend" + "Engineer")
    const targetTokens = targetLower.split(/\s+/).filter((w) => w.length > 2);
    const matchingTokens = targetTokens.filter((token) => jobTitleLower.includes(token));
    if (matchingTokens.length >= 2) {
      score += 28;
      roleTitleMatched = true;
      matchReasons.push(`Matches your specialization in ${matchingTokens.join(' ')}`);
      break;
    }
  }

  if (!roleTitleMatched) {
    // Check if category or department matches candidate domain
    const candidateSkillsString = profile.skills.map((s) => s.name.toLowerCase()).join(' ');
    if (jobTitleLower.includes('frontend') && candidateSkillsString.includes('react')) {
      score += 20;
      matchReasons.push('Aligns with your Frontend Development competencies');
    } else if (jobTitleLower.includes('backend') && (candidateSkillsString.includes('node') || candidateSkillsString.includes('python') || candidateSkillsString.includes('go'))) {
      score += 20;
      matchReasons.push('Aligns with your Backend Systems competencies');
    } else if (jobTitleLower.includes('full stack') || jobTitleLower.includes('fullstack')) {
      score += 18;
      matchReasons.push('Relevant to your Full Stack background');
    } else {
      score += 10; // Baseline generalist engineering credit
    }
  }

  // -------------------------------------------------------------
  // 2. Skills Overlap & Proficiency Weighting (Max 30 points)
  // -------------------------------------------------------------
  const candidateSkills = profile.skills || [];
  let skillsScore = 0;

  for (const skill of candidateSkills) {
    const sLower = skill.name.toLowerCase();
    const isPresentInJob =
      jobTitleLower.includes(sLower) ||
      jobTags.some((t: string) => t.includes(sLower)) ||
      jobDescLower.includes(sLower);

    if (isPresentInJob) {
      matchedSkills.push(skill.name);
      // Proficiency multiplier
      let multiplier = 1.0;
      if (skill.level === 'Expert') multiplier = 1.25;
      else if (skill.level === 'Advanced') multiplier = 1.0;
      else if (skill.level === 'Intermediate') multiplier = 0.8;
      else multiplier = 0.6;

      skillsScore += 7 * multiplier;
    }
  }

  const cappedSkillsScore = Math.min(30, Math.round(skillsScore));
  score += cappedSkillsScore;

  if (matchedSkills.length > 0) {
    matchReasons.push(`Requires ${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? ` +${matchedSkills.length - 3} more skills` : ''}`);
  }

  // -------------------------------------------------------------
  // 3. Country & Africa Eligibility Match (Max 20 points)
  // -------------------------------------------------------------
  const candidateCountry = profile.location?.split(',').pop()?.trim() || 'Nigeria';
  const isWorldwide =
    rawJob.location_type === 'worldwide' ||
    (job.location || '').toLowerCase().includes('worldwide') ||
    (job.location_rule || '').toLowerCase().includes('worldwide');
  const isAfricaWide =
    rawJob.location_type === 'africa_wide' ||
    job.eligibility?.scope === 'africa_wide' ||
    (job.location || '').toLowerCase().includes('africa');
  const eligibleCountries = job.eligible_countries || job.eligibility?.countries || [];
  const isCountrySpecific = eligibleCountries.some((c: string) =>
    c.toLowerCase().includes(candidateCountry.toLowerCase())
  );

  if (isWorldwide || isAfricaWide || isCountrySpecific) {
    score += 20;
    matchReasons.push(`Confirmed open to ${candidateCountry} (${isWorldwide ? 'Worldwide Remote' : 'Africa-wide'})`);
  } else {
    score += 8; // Partial remote fallback
  }

  // -------------------------------------------------------------
  // 4. Work Preferences & Modality (Max 10 points)
  // -------------------------------------------------------------
  const prefs = (profile.workPreferences || ['Remote']).map((p) => p.toLowerCase());
  const jobMode = (rawJob.work_mode || job.modality || 'Remote').toLowerCase();

  if (prefs.some((p) => jobMode.includes(p) || p.includes(jobMode))) {
    score += 10;
    matchReasons.push(`Matches your ${job.modality || 'Remote'} work preference`);
  } else if (jobMode.includes('remote')) {
    score += 8;
  } else {
    score += 4;
  }

  // -------------------------------------------------------------
  // 5. Seniority & Salary Alignment (Max 5 points)
  // -------------------------------------------------------------
  const candidateSeniority = (profile.seniority || 'Senior').toLowerCase();
  if (jobTitleLower.includes(candidateSeniority) || (job.seniority || '').toLowerCase().includes(candidateSeniority)) {
    score += 5;
  } else {
    score += 3;
  }

  const finalScore = Math.min(100, Math.max(30, Math.round(score)));

  let tier: JobRecommendationResult['tier'] = 'Potential Match';
  if (finalScore >= 85) tier = 'Strong Match';
  else if (finalScore >= 70) tier = 'Good Match';

  return {
    job,
    matchScore: finalScore,
    matchReasons,
    matchedSkills,
    isRecommended: finalScore >= 75,
    tier,
  };
}

/**
 * Filter, score, and rank a list of public jobs for a candidate.
 */
export function getTopRecommendedJobs(
  jobs: PublicJob[],
  profile?: CandidateProfile,
  limit = 6
): JobRecommendationResult[] {
  const activeProfile = profile || getCandidateProfile();
  if (!activeProfile || !jobs || jobs.length === 0) return [];

  const scored = jobs.map((job) => calculateJobRecommendation(job, activeProfile));

  // Sort descending by match score
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return scored.slice(0, limit);
}
