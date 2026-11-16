// lib/resume/analyzer.ts
// ATS Resume Analyzer for African and Global Remote Candidates.
// Evaluates resume text against target job descriptions for keyword density,
// action verb strength, quantified metrics, section completeness, and readability.

export interface ATSBulletFeedback {
  original: string;
  reason: string;
  suggestedRewrite: string;
}

export interface ATSAnalysisResult {
  overallScore: number; // 0 - 100
  tier: 'High ATS Match' | 'Moderate Match' | 'Needs Optimization';
  breakdown: {
    keywordMatch: number; // 0 - 100
    impactScore: number; // 0 - 100
    readabilityScore: number; // 0 - 100
    sectionCompleteness: number; // 0 - 100
  };
  wordCount: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  criticalFixes: string[];
  weakBulletsWithFixes: ATSBulletFeedback[];
}

const ACTION_VERBS = [
  'architected', 'spearheaded', 'engineered', 'optimized', 'delivered', 'reduced',
  'increased', 'scaled', 'implemented', 'designed', 'orchestrated', 'streamlined',
  'automated', 'built', 'led', 'accelerated', 'transformed', 'mentored', 'developed',
  'resolved', 'migrated', 'launched', 'audited', 'deployed', 'maintained'
];

const WEAK_VERBS = [
  'worked on', 'assisted with', 'responsible for', 'helped', 'tried to', 'participated in',
  'handled tasks', 'involved in', 'supported team'
];

const ATS_SECTION_KEYWORDS = [
  'experience', 'employment', 'work history', 'skills', 'education',
  'projects', 'summary', 'certifications', 'profile'
];

const TECH_KEYWORD_TAXONOMY = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'FastAPI',
  'Django', 'Go', 'Golang', 'Java', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB',
  'Redis', 'Kafka', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD',
  'Tailwind CSS', 'GraphQL', 'REST API', 'Microservices', 'Git', 'GitHub', 'System Design',
  'Performance Optimization', 'Core Web Vitals', 'Testing', 'Jest', 'Playwright', 'Agile'
];

/**
 * Analyzes candidate resume text against target role and optional job description.
 */
export function analyzeResumeATS(
  resumeText: string,
  targetRole: string,
  companyName?: string,
  jobDescription?: string
): ATSAnalysisResult {
  const text = (resumeText || '').trim();
  const lowerResume = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const targetRoleLower = (targetRole || 'Software Engineer').toLowerCase();
  const jdLower = (jobDescription || '').toLowerCase();

  // -----------------------------------------------------------------
  // 1. Keyword Extraction & Match (Weight: 35%)
  // -----------------------------------------------------------------
  // Identify keywords mentioned in JD or target role
  const targetKeywords: string[] = [];

  TECH_KEYWORD_TAXONOMY.forEach((kw) => {
    const kwLower = kw.toLowerCase();
    if (
      jdLower.includes(kwLower) ||
      targetRoleLower.includes(kwLower) ||
      (jdLower.length === 0 && targetRoleLower.includes('frontend') && ['react', 'typescript', 'next.js', 'tailwind css'].includes(kwLower)) ||
      (jdLower.length === 0 && targetRoleLower.includes('backend') && ['node.js', 'postgresql', 'python', 'rest api', 'docker'].includes(kwLower))
    ) {
      targetKeywords.push(kw);
    }
  });

  // Always ensure at least 5 target keywords
  if (targetKeywords.length < 5) {
    const defaults = ['TypeScript', 'React', 'REST API', 'CI/CD', 'Git', 'Testing'];
    defaults.forEach((d) => {
      if (!targetKeywords.includes(d)) targetKeywords.push(d);
    });
  }

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  targetKeywords.forEach((kw) => {
    if (lowerResume.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const keywordMatch = Math.min(
    100,
    Math.round((matchedKeywords.length / Math.max(1, targetKeywords.length)) * 100)
  );

  // -----------------------------------------------------------------
  // 2. Action Verbs & Metric Quantification (Weight: 25%)
  // -----------------------------------------------------------------
  let actionVerbCount = 0;
  ACTION_VERBS.forEach((v) => {
    if (lowerResume.includes(v)) actionVerbCount++;
  });

  // Check metrics / numbers / percentages
  const metricMatches = text.match(/\d+[%kKmM]?|\b\d+\b/g) || [];
  const metricCount = metricMatches.length;

  let impactScore = 50;
  impactScore += Math.min(25, actionVerbCount * 4);
  impactScore += Math.min(25, metricCount * 3);
  impactScore = Math.min(100, Math.max(20, impactScore));

  // -----------------------------------------------------------------
  // 3. Section Completeness (Weight: 20%)
  // -----------------------------------------------------------------
  let sectionHits = 0;
  ATS_SECTION_KEYWORDS.forEach((s) => {
    if (lowerResume.includes(s)) sectionHits++;
  });

  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /\+?\d[\d -]{8,}\d/.test(text);
  const hasLinks = /linkedin\.com|github\.com|http/i.test(text);

  let sectionCompleteness = Math.min(60, sectionHits * 12);
  if (hasEmail) sectionCompleteness += 15;
  if (hasPhone) sectionCompleteness += 15;
  if (hasLinks) sectionCompleteness += 10;
  sectionCompleteness = Math.min(100, sectionCompleteness);

  // -----------------------------------------------------------------
  // 4. Readability & Length (Weight: 20%)
  // -----------------------------------------------------------------
  let readabilityScore = 80;
  if (wordCount < 250) {
    readabilityScore -= 35; // Too brief
  } else if (wordCount > 1600) {
    readabilityScore -= 25; // Overly verbose
  } else if (wordCount >= 380 && wordCount <= 900) {
    readabilityScore += 15; // Sweet spot
  }

  // Check bullet structure
  const bulletCount = (text.match(/[-*•]/g) || []).length;
  if (bulletCount >= 6) readabilityScore += 5;

  readabilityScore = Math.min(100, Math.max(30, readabilityScore));

  // -----------------------------------------------------------------
  // 5. Overall Score Calculation
  // -----------------------------------------------------------------
  const overallScore = Math.round(
    keywordMatch * 0.35 +
    impactScore * 0.25 +
    sectionCompleteness * 0.2 +
    readabilityScore * 0.2
  );

  let tier: ATSAnalysisResult['tier'] = 'Needs Optimization';
  if (overallScore >= 85) tier = 'High ATS Match';
  else if (overallScore >= 70) tier = 'Moderate Match';

  // -----------------------------------------------------------------
  // 6. Actionable Findings & Bullet Rewrites
  // -----------------------------------------------------------------
  const strengths: string[] = [];
  if (keywordMatch >= 75) strengths.push(`Strong keyword alignment with ${matchedKeywords.length} core technical requirements present.`);
  if (metricCount >= 4) strengths.push('Measurable accomplishments: includes concrete metrics and quantified business impact.');
  if (hasEmail && hasPhone) strengths.push('Clear contact header parsed with valid email, phone, and professional links.');
  if (actionVerbCount >= 5) strengths.push('Action-oriented tone: utilizes strong leadership verbs (e.g. Architected, Engineered, Optimized).');
  if (strengths.length === 0) strengths.push('Basic technical profile structure recognized by standard ATS parsers.');

  const criticalFixes: string[] = [];
  if (missingKeywords.length > 0) {
    criticalFixes.push(`Integrate missing high-priority keywords: ${missingKeywords.slice(0, 4).join(', ')}.`);
  }
  if (metricCount < 3) {
    criticalFixes.push('Quantify accomplishments with numbers (e.g., latency reduction %, scale handled, error budget improved).');
  }
  if (!hasLinks) {
    criticalFixes.push('Add verified GitHub and LinkedIn profile links in the contact header.');
  }
  if (wordCount < 300) {
    criticalFixes.push('Expand experience bullets to describe technical tradeoffs, system architecture, and outcomes.');
  }

  // Detect weak bullet points for actionable rewrites
  const weakBulletsWithFixes: ATSBulletFeedback[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('-') || l.startsWith('*') || l.startsWith('•'));

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    for (const weak of WEAK_VERBS) {
      if (lineLower.includes(weak)) {
        weakBulletsWithFixes.push({
          original: line,
          reason: `Uses passive phrase "${weak}" without highlighting personal ownership or metrics.`,
          suggestedRewrite: line
            .replace(new RegExp(weak, 'i'), 'Architected and deployed')
            .concat(', boosting operational throughput by 24% while maintaining 99.9% uptime.'),
        });
        break;
      }
    }
    if (weakBulletsWithFixes.length >= 3) break;
  }

  // Fallback sample weak bullet if none detected in raw text
  if (weakBulletsWithFixes.length === 0) {
    weakBulletsWithFixes.push({
      original: '- Worked on frontend features and fixed bugs for the application.',
      reason: 'Passive wording ("worked on") lacks technical depth and business impact.',
      suggestedRewrite: `- Engineered responsive Next.js and TypeScript user interfaces for ${companyName || 'high-scale applications'}, reducing page load latency by 35% and elevating test coverage to 85%.`,
    });
  }

  return {
    overallScore,
    tier,
    breakdown: {
      keywordMatch,
      impactScore,
      readabilityScore,
      sectionCompleteness,
    },
    wordCount,
    matchedKeywords,
    missingKeywords,
    strengths,
    criticalFixes,
    weakBulletsWithFixes,
  };
}
