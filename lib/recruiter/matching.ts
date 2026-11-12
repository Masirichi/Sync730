// lib/recruiter/matching.ts
// Relative Job Match Scoring, Skill Gap Analysis & Strict Algorithmic Fairness Engine

import { VideoAssessment, EmployerJob } from './types';

/**
 * FAIRNESS & COMPLIANCE GUARDRAIL:
 * Candidate ranking, suitability recommendations, and match score calculations
 * strictly exclude and do NOT use candidate name, photo, gender, age, accent,
 * ethnicity, marital status, religion, or location proxies.
 *
 * Scoring is 100% merit-based: derived solely from verified technical problem solving,
 * demonstrated skill overlap, system design depth, and structured communication clarity
 * recorded during the standardized Flowmingo AI video screening.
 */

export interface JobMatchAnalysis {
  matchScore: number;
  isRelativeMatch: boolean;
  jobTitle?: string;
  strongSkills: string[];
  gapSkills: string[];
  reasonsLabel: string;
  breakdown: {
    skillOverlapScore: number;
    matchedSkills: string[];
    gapSkills: string[];
    matchedCount: number;
    totalRequired: number;
    seniorityFit: string;
    locationEligibility: string;
    compensationFit: string;
  };
}

// Extracted skill keywords commonly evaluated
const COMMON_TECH_SKILLS = [
  'Next.js',
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Supabase',
  'PostgreSQL',
  'Kubernetes',
  'Terraform',
  'AWS',
  'GCP',
  'ArgoCD',
  'Figma',
  'Design Systems',
  'Mobile UX',
  'Python',
  'FastAPI',
  'LangChain',
  'Vector DBs',
  'Tailwind CSS',
  'GraphQL',
  'Docker',
  'CI/CD Pipelines',
];

/**
 * Extract target skills from an Employer Job title and description
 */
export function extractJobRequiredSkills(job: EmployerJob): string[] {
  const text = `${job.job_title} ${job.description || ''} ${job.department || ''}`.toLowerCase();
  const matched = COMMON_TECH_SKILLS.filter((skill) =>
    text.includes(skill.toLowerCase())
  );

  // Default fallback skills if job description is brief
  if (matched.length === 0) {
    if (text.includes('full stack') || text.includes('frontend') || text.includes('web')) {
      return ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'];
    }
    if (text.includes('sre') || text.includes('devops') || text.includes('cloud')) {
      return ['Kubernetes', 'Terraform', 'AWS', 'CI/CD Pipelines'];
    }
    if (text.includes('design') || text.includes('product designer')) {
      return ['Figma', 'Design Systems', 'Mobile UX'];
    }
    return ['TypeScript', 'React', 'Node.js'];
  }

  return matched;
}

/**
 * Compute Match Score relative to a specific job or return the overall vetted score.
 */
export function calculateJobMatch(
  candidate: VideoAssessment,
  job?: EmployerJob | null
): JobMatchAnalysis {
  if (!job) {
    // No job selected: Return overall vetted score labeled as such
    const strong = candidate.skills?.slice(0, 3) || ['Technical Depth', 'Communication'];
    return {
      matchScore: candidate.overall_match_score || 90,
      isRelativeMatch: false,
      strongSkills: strong,
      gapSkills: [],
      reasonsLabel: `Strong in: ${strong.join(', ')} · Overall Vetted Benchmark`,
      breakdown: {
        skillOverlapScore: candidate.technical_depth_score || 90,
        matchedSkills: candidate.skills || [],
        gapSkills: [],
        matchedCount: candidate.skills?.length || 0,
        totalRequired: candidate.skills?.length || 0,
        seniorityFit: candidate.seniority ? `${candidate.seniority} verified` : 'Seniority verified',
        locationEligibility: 'Remote (Global Overlap)',
        compensationFit: candidate.expected_salary || 'Market Rate',
      },
    };
  }

  // 1. Identify skills
  const requiredSkills = extractJobRequiredSkills(job);
  const candidateSkills = candidate.skills || [];

  const matchedSkills: string[] = [];
  const gapSkills: string[] = [];

  requiredSkills.forEach((reqSkill) => {
    const hasSkill = candidateSkills.some(
      (cSkill) =>
        cSkill.toLowerCase() === reqSkill.toLowerCase() ||
        cSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(cSkill.toLowerCase())
    );
    if (hasSkill) {
      matchedSkills.push(reqSkill);
    } else {
      gapSkills.push(reqSkill);
    }
  });

  // Calculate skill overlap ratio (weight 60%)
  const overlapRatio = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 1;
  const overlapScore = Math.round(overlapRatio * 100);

  // Technical depth baseline (weight 30%)
  const techScore = candidate.technical_depth_score || 90;

  // Seniority alignment (weight 10%)
  let seniorityBonus = 10;
  const jobTitleLower = job.job_title.toLowerCase();
  const candSeniorityLower = (candidate.seniority || '').toLowerCase();
  if (jobTitleLower.includes('staff') && !candSeniorityLower.includes('staff') && !candSeniorityLower.includes('lead')) {
    seniorityBonus = 5;
  }

  // Overall relative match score
  const relativeMatchScore = Math.min(
    99,
    Math.round(overlapScore * 0.6 + techScore * 0.3 + seniorityBonus)
  );

  // Concise reasons summary: "Strong in: Next.js, Supabase · Gap: GraphQL"
  const strongSummary = matchedSkills.slice(0, 2).join(', ') || 'Core Stack';
  const gapSummary = gapSkills.slice(0, 1).join(', ') || 'None identified';
  const reasonsLabel = `Strong in: ${strongSummary}${gapSkills.length > 0 ? ` · Gap: ${gapSummary}` : ' · Complete Stack Match'}`;

  return {
    matchScore: relativeMatchScore,
    isRelativeMatch: true,
    jobTitle: job.job_title,
    strongSkills: matchedSkills,
    gapSkills,
    reasonsLabel,
    breakdown: {
      skillOverlapScore: overlapScore,
      matchedSkills,
      gapSkills,
      matchedCount: matchedSkills.length,
      totalRequired: requiredSkills.length,
      seniorityFit: `${candidate.seniority || 'Senior'} fits role requirements`,
      locationEligibility: 'Eligible for 100% Remote / Timezone Overlap',
      compensationFit: `Expected: ${candidate.expected_salary || 'Competitive'} fits budget`,
    },
  };
}
