import { createBrowserClient } from '@/lib/supabase/client';
import {
  MockPrepSession,
  InterviewQuestion,
  CandidateAnswer,
  InterviewFeedbackScorecard,
  PaymentStatus,
} from '@/lib/supabase/types';

const STORAGE_KEY = 'sync730_mock_prep_sessions';

/**
 * Generate 3 tailored role-specific questions based on target role & optional company
 */
/**
 * Extract technology and domain signals from an actual job description
 */
function extractJobDescriptionSignals(jdText: string): {
  detectedSkills: string[];
  detectedDomain: string;
  isSenior: boolean;
  keyResponsibilities: string[];
} {
  const lower = jdText.toLowerCase();

  const SKILL_KEYWORDS = [
    'React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'FastAPI', 'Django',
    'Go', 'Golang', 'Java', 'Spring Boot', 'C#', '.NET', 'Rust', 'PHP', 'Laravel',
    'Flutter', 'React Native', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
    'Terraform', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'RabbitMQ',
    'GraphQL', 'REST API', 'Tailwind', 'Figma', 'Microservices', 'CI/CD', 'Datadog'
  ];

  const detectedSkills = SKILL_KEYWORDS.filter((skill) =>
    lower.includes(skill.toLowerCase())
  );

  let detectedDomain = 'high-growth tech products';
  if (lower.includes('fintech') || lower.includes('payment') || lower.includes('banking') || lower.includes('checkout') || lower.includes('money')) {
    detectedDomain = 'fintech and real-time payment processing';
  } else if (lower.includes('health') || lower.includes('medical') || lower.includes('clinical')) {
    detectedDomain = 'digital health and HIPAA-compliant data platforms';
  } else if (lower.includes('e-commerce') || lower.includes('marketplace') || lower.includes('retail')) {
    detectedDomain = 'e-commerce marketplaces with high peak transactions';
  } else if (lower.includes('logistics') || lower.includes('supply chain') || lower.includes('fleet')) {
    detectedDomain = 'fleet logistics and distributed tracking platforms';
  } else if (lower.includes('developer') || lower.includes('infrastructure') || lower.includes('cloud')) {
    detectedDomain = 'developer tooling and cloud-native infrastructure';
  }

  const isSenior =
    lower.includes('senior') ||
    lower.includes('staff') ||
    lower.includes('lead') ||
    lower.includes('principal') ||
    lower.includes('architect') ||
    lower.includes('head of');

  const keyResponsibilities: string[] = [];
  if (lower.includes('architect') || lower.includes('design')) keyResponsibilities.push('system design and architecture');
  if (lower.includes('scale') || lower.includes('performance') || lower.includes('latency')) keyResponsibilities.push('high-concurrency scale and sub-second latency');
  if (lower.includes('mentor') || lower.includes('lead') || lower.includes('team')) keyResponsibilities.push('team mentorship and engineering standards');
  if (lower.includes('collaborat') || lower.includes('product') || lower.includes('cross-functional')) keyResponsibilities.push('cross-functional alignment with product managers and designers');

  return { detectedSkills, detectedDomain, isSenior, keyResponsibilities };
}

/**
 * Generate 5 tailored role-specific questions based on target role, optional company, and actual job description
 */
export function generateRoleQuestions(
  targetRole: string,
  companyName?: string,
  jobDescription?: string
): InterviewQuestion[] {
  const roleLower = (targetRole || 'Software Engineer').toLowerCase();
  const companyPrefix = companyName ? `at ${companyName}` : 'in this role';

  // 1. IF AN ACTUAL JOB DESCRIPTION IS SUPPLIED: Tailor all 5 questions directly to it!
  if (jobDescription && jobDescription.trim().length > 30) {
    const { detectedSkills, detectedDomain, isSenior, keyResponsibilities } =
      extractJobDescriptionSignals(jobDescription);

    const primaryStackStr =
      detectedSkills.length > 0
        ? detectedSkills.slice(0, 3).join(', ')
        : 'the core languages and frameworks required in this role';

    const secondaryStackStr =
      detectedSkills.length > 3
        ? detectedSkills.slice(3, 5).join(' and ')
        : 'state management, caching, and data persistence layers';

    return [
      {
        id: 1,
        category: 'Core Technical Competency & Implementation',
        question: `Based on the job requirements for this position ${companyPrefix}, how would you leverage ${primaryStackStr} to build a reliable, maintainable solution that fulfills the primary deliverables?`,
        hint: `Anchor your response specifically in ${primaryStackStr}. Discuss code structure, typing discipline, testing coverage, and production design patterns relevant to ${detectedDomain}.`,
      },
      {
        id: 2,
        category: 'System Architecture & Domain Engineering',
        question: `Reviewing the responsibilities in the job description, walk me through how you would architect a scalable system ${companyPrefix} dealing with ${detectedDomain}, integrating ${secondaryStackStr}.`,
        hint: 'Outline the data flow, API contracts, boundary isolation between modules, and how you prevent single points of failure under peak load.',
      },
      {
        id: 3,
        category: 'Performance, Edge Cases & Incident Triage',
        question: `In a production environment matching this role's description, describe how you would diagnose and resolve a severe latency spike or data synchronization discrepancy affecting users.`,
        hint: 'Highlight observability (metrics, logs, traces), automated health checks, rate limiting, and rollback or mitigation strategies.',
      },
      {
        id: 4,
        category: 'Behavioral & High-Stakes Situational Experience (STAR)',
        question: `Tell me about a high-stakes scenario where you had to negotiate engineering trade-offs against aggressive product launch deadlines. How did you decide what to ship and what to defer?`,
        hint: 'Use the STAR format (Situation, Task, Action, Result). Quantify the outcome, user impact, and how you communicated trade-offs to business stakeholders.',
      },
      {
        id: 5,
        category: 'Cross-Functional Collaboration & Delivery',
        question: `How do you foster alignment when collaborating closely with Product Managers, Designers, and other engineering disciplines ${companyPrefix} to turn ambiguous feature requests into crisp technical specs?`,
        hint: 'Discuss RFC/design documents, user empathy, breaking down complex epics into iterative deliverables, and handling conflicting feedback constructive.',
      },
    ];
  }

  // 2. ARCHETYPE: FRONTEND / UI / REACT (5 Questions)
  if (roleLower.includes('frontend') || roleLower.includes('react') || roleLower.includes('ui')) {
    return [
      {
        id: 1,
        category: 'Architecture & State Management',
        question: `How would you architect a complex Next.js application ${companyPrefix} to maintain sub-second Largest Contentful Paint (LCP) while handling real-time data feeds?`,
        hint: 'Discuss Server Components, streaming SSR, edge caching, and bundle splitting techniques.',
      },
      {
        id: 2,
        category: 'Performance & Component Design',
        question: 'Describe how you troubleshoot and resolve unwanted re-renders and memory leaks in deeply nested React component trees.',
        hint: 'Mention React DevTools profiler, memoization (useMemo/useCallback), state collocation, and DOM cleanup in useEffect.',
      },
      {
        id: 3,
        category: 'Data Fetching & Resilient Offline State',
        question: `How do you handle optimistic UI updates and network disconnection states ${companyPrefix} to deliver a seamless user experience across varied mobile connections in Africa?`,
        hint: 'Cover optimistic mutations, retry backoff strategies, local storage fallbacks, and user feedback toast patterns.',
      },
      {
        id: 4,
        category: 'Cross-functional Collaboration & Design Fidelity',
        question: `Tell me about a time you had to balance pixel-perfect design fidelity against tight engineering deadlines ${companyPrefix}. How did you prioritize?`,
        hint: 'Use the STAR method (Situation, Task, Action, Result) focusing on design tokens, accessibility (WCAG AA), and user impact.',
      },
      {
        id: 5,
        category: 'Testing Strategy & Quality Assurance',
        question: 'What is your end-to-end testing philosophy for mission-critical client workflows? What tools and layers do you use to prevent regressions?',
        hint: 'Discuss unit testing (Vitest/Jest), component testing (Testing Library), and integration tests (Playwright) focusing on user journey coverage.',
      },
    ];
  }

  // 3. ARCHETYPE: BACKEND / SYSTEMS / APIS (5 Questions)
  if (roleLower.includes('backend') || roleLower.includes('systems') || roleLower.includes('api')) {
    return [
      {
        id: 1,
        category: 'Distributed Systems & Scalability',
        question: `How would you design an idempotent webhook ingestion pipeline ${companyPrefix} that can safely process 10,000 events/second without dropping requests?`,
        hint: 'Cover message queues (Kafka/RabbitMQ/SQS), deduplication keys, dead-letter queues, and database write batching.',
      },
      {
        id: 2,
        category: 'Data Modeling & Concurrency',
        question: 'How do you handle race conditions in database transactions during high-concurrency balance or token deductions?',
        hint: 'Explain pessimistic locking (SELECT FOR UPDATE) vs optimistic locking (version columns) and ACID guarantees.',
      },
      {
        id: 3,
        category: 'API Design & Versioning',
        question: `How do you approach designing backwards-compatible public REST/GraphQL APIs ${companyPrefix} that thousands of external clients depend on?`,
        hint: 'Discuss additive schema migrations, deprecation headers, semantic versioning, and client SDK generation.',
      },
      {
        id: 4,
        category: 'Incident Response & Reliability',
        question: 'Walk me through how you diagnosed and resolved the most challenging production outage or latency spike you encountered.',
        hint: 'Detail telemetry metrics, structured logging, root-cause isolation, and post-mortem prevention steps.',
      },
      {
        id: 5,
        category: 'Security & Auth Infrastructure',
        question: 'How do you structure authentication, authorization (RBAC), and rate-limiting to protect sensitive user endpoints from credential stuffing and abuse?',
        hint: 'Discuss JWT vs session tokens, token rotation, Redis token-bucket rate limiting, and input sanitization.',
      },
    ];
  }

  // 4. ARCHETYPE: DESIGN / PRODUCT / UX (5 Questions)
  if (roleLower.includes('design') || roleLower.includes('product') || roleLower.includes('ux')) {
    return [
      {
        id: 1,
        category: 'Design Systems & Scalability',
        question: `How do you approach creating a component design system ${companyPrefix} that scales across multi-platform web and mobile clients?`,
        hint: 'Focus on design tokens, accessible color contrast ratios, atomic structure, and engineering handoff.',
      },
      {
        id: 2,
        category: 'User Research & Prototyping',
        question: 'When quantitative usage data contradicts feedback gathered from user interviews, how do you resolve the discrepancy?',
        hint: 'Explain funnel analytics vs qualitative friction mapping, hypothesis validation, and rapid A/B testing.',
      },
      {
        id: 3,
        category: 'Accessibility & Inclusivity (WCAG)',
        question: `How do you integrate accessibility standards (WCAG AA, screen readers, keyboard navigation) into your daily design process ${companyPrefix}?`,
        hint: 'Discuss semantic layouts, touch target minimums (44px), focus states, and testing with assistive tech.',
      },
      {
        id: 4,
        category: 'Product Strategy & Prioritization',
        question: `How do you defend high-effort UX improvements against business requests for quick feature delivery ${companyPrefix}?`,
        hint: 'Highlight conversion lift, churn reduction, customer lifetime value (LTV), and user empathy.',
      },
      {
        id: 5,
        category: 'Cross-functional Collaboration with Engineers',
        question: 'Describe how you collaborate with frontend engineers when technical feasibility or performance constraints require adjusting an approved design.',
        hint: 'Emphasize pragmatism, design token alignment, pairing in code or inspect tools, and iterative delivery.',
      },
    ];
  }

  // 5. ARCHETYPE: DEVOPS / CLOUD / INFRASTRUCTURE (5 Questions)
  if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('infrastructure')) {
    return [
      {
        id: 1,
        category: 'Infrastructure as Code & CI/CD',
        question: `How would you design a zero-downtime blue/green deployment strategy ${companyPrefix} using Terraform and Kubernetes?`,
        hint: 'Discuss health probes, ingress traffic weighting, database schema migration backward compatibility, and instant rollbacks.',
      },
      {
        id: 2,
        category: 'Observability & Security',
        question: 'Explain your strategy for securing secrets and auditing privilege escalations across cloud environments.',
        hint: 'Cover short-lived OIDC tokens, KMS envelope encryption, Least Privilege RBAC, and SIEM alerting.',
      },
      {
        id: 3,
        category: 'Disaster Recovery & High Availability',
        question: `How would you design multi-region failover and data replication ${companyPrefix} to guarantee an RTO under 5 minutes and RPO under 30 seconds?`,
        hint: 'Discuss active-passive vs active-active database replication, DNS failover, snapshot backups, and automated drill simulations.',
      },
      {
        id: 4,
        category: 'Cost Optimization & FinOps',
        question: 'Tell me about an initiative where you analyzed cloud infrastructure spending and significantly reduced monthly cloud expenditure without degrading SLOs.',
        hint: 'Discuss spot/preemptible instances, auto-scaling thresholds, storage tier lifecycle policies, and right-sizing workloads.',
      },
      {
        id: 5,
        category: 'Reliability Engineering & Error Budgets',
        question: 'How do you define Service Level Objectives (SLOs) and Error Budgets with product teams, and how do you enforce them when incidents occur?',
        hint: 'Discuss balancing feature release velocity against system reliability and automatic deployment freeze triggers.',
      },
    ];
  }

  // 6. DEFAULT GENERALIST / ENGINEERING / LEADERSHIP (5 Questions)
  return [
    {
      id: 1,
      category: 'Core Competency & Technical Philosophy',
      question: `What is your technical philosophy when tasked with building a mission-critical feature ${companyPrefix} from scratch under ambiguous requirements?`,
      hint: 'Discuss scoping, RFCs/technical specs, stakeholder alignment, incremental delivery, and test coverage.',
    },
    {
      id: 2,
      category: 'System Architecture & Quality',
      question: 'How do you ensure maintainability, performance, and security across a growing engineering codebase?',
      hint: 'Mention automated CI static analysis, code review standards, observability, and modular boundaries.',
    },
    {
      id: 3,
      category: 'Scale & High-Traffic Reliability',
      question: `Describe how you would design a system ${companyPrefix} to handle an unexpected 10x surge in concurrent traffic without crashing or degrading user experience.`,
      hint: 'Cover edge caching, asynchronous queuing, database connection pooling, circuit breakers, and graceful degradation.',
    },
    {
      id: 4,
      category: 'Behavioral & High-Stakes Situational (STAR)',
      question: 'Tell me about a high-stakes disagreement with a teammate or stakeholder. How did you handle it and what was the outcome?',
      hint: 'Use the STAR method emphasizing data-driven discussions, mutual respect, and collaborative compromise.',
    },
    {
      id: 5,
      category: 'Cross-functional Collaboration & Mentorship',
      question: `How do you balance shipping customer-facing features against paying down technical debt and mentoring more junior team members ${companyPrefix}?`,
      hint: 'Discuss 20% engineering allocation, sprint debt budgets, pairing, async documentation, and fostering an inclusive engineering culture.',
    },
  ];
}

/**
 * Local storage helpers
 */
function getLocalSessions(): MockPrepSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSession(session: MockPrepSession) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalSessions();
    const filtered = existing.filter((s) => s.id !== session.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([session, ...filtered]));
  } catch (err) {
    console.warn('Failed to save session to localStorage:', err);
  }
}

/**
 * Create or initialize a new mock interview session
 */
export async function createMockSession(params: {
  target_role: string;
  company_name?: string;
  job_description?: string;
  candidate_id?: string | null;
  payment_reference?: string;
  payment_status?: PaymentStatus;
  amount?: number;
}): Promise<MockPrepSession> {
  const questions = generateRoleQuestions(params.target_role, params.company_name, params.job_description);
  const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
  const reference = params.payment_reference || `SYNC730-REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newSession: MockPrepSession = {
    id: sessionId,
    candidate_id: params.candidate_id || null,
    target_role: params.target_role,
    company_name: params.company_name || null,
    job_description: params.job_description || null,
    amount: params.amount || 250000, // ₦2,500
    currency: 'NGN',
    payment_reference: reference,
    payment_status: params.payment_status || 'PENDING',
    interview_questions: questions,
    candidate_answers: [],
    feedback_payload: null,
    created_at: new Date().toISOString(),
  };

  // 1. Instant local persistence
  saveLocalSession(newSession);

  // 2. Non-blocking asynchronous sync with Supabase
  try {
    const supabase = createBrowserClient();
    Promise.race([
      supabase.from('mock_prep_sessions').insert({
        id: newSession.id,
        candidate_id: newSession.candidate_id,
        target_role: newSession.target_role,
        company_name: newSession.company_name,
        job_description: newSession.job_description,
        amount: newSession.amount,
        currency: newSession.currency,
        payment_reference: newSession.payment_reference,
        payment_status: newSession.payment_status,
        interview_questions: newSession.interview_questions,
        candidate_answers: newSession.candidate_answers,
        feedback_payload: newSession.feedback_payload,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ]).catch((err) => console.warn('Supabase mock_prep_sessions sync notice:', err));
  } catch (err) {
    console.warn('Supabase browser client init notice:', err);
  }

  return newSession;
}

/**
 * Fetch a mock session by ID or payment reference
 */
export async function getMockSession(sessionIdOrRef: string): Promise<MockPrepSession | null> {
  const localItems = getLocalSessions();
  const cached = localItems.find((s) => s.id === sessionIdOrRef || s.payment_reference === sessionIdOrRef);

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('mock_prep_sessions')
      .select('*')
      .or(`id.eq.${sessionIdOrRef},payment_reference.eq.${sessionIdOrRef}`)
      .maybeSingle();

    if (!error && data) {
      saveLocalSession(data as MockPrepSession);
      return data as MockPrepSession;
    }
  } catch (err) {
    console.warn('Supabase fetch notice for mock session:', err);
  }

  return cached || null;
}

/**
 * Update session state (e.g. payment completed, answers submitted, feedback generated)
 */
export async function updateMockSession(
  sessionId: string,
  updates: Partial<MockPrepSession>
): Promise<MockPrepSession | null> {
  const current = await getMockSession(sessionId);
  if (!current) return null;

  const merged: MockPrepSession = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Instant local save
  saveLocalSession(merged);

  // Non-blocking Supabase sync
  try {
    const supabase = createBrowserClient();
    Promise.race([
      supabase.from('mock_prep_sessions').update(updates).eq('id', sessionId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ]).catch((err) => console.warn('Supabase update notice:', err));
  } catch (err) {
    console.warn('Notice: updating mock session in local state cache:', err);
  }

  return merged;
}
