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
export function generateRoleQuestions(targetRole: string, companyName?: string): InterviewQuestion[] {
  const roleLower = (targetRole || 'Software Engineer').toLowerCase();
  const companyPrefix = companyName ? `at ${companyName}` : 'in this role';

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
        category: 'Cross-functional Collaboration',
        question: `Tell me about a time you had to balance design fidelity against tight engineering deadlines ${companyPrefix}. How did you prioritize?`,
        hint: 'Use the STAR method (Situation, Task, Action, Result) focusing on design tokens, pragmatism, and user impact.',
      },
    ];
  }

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
        category: 'Incident Response & Reliability',
        question: 'Walk me through how you diagnosed and resolved the most challenging production outage or latency spike you encountered.',
        hint: 'Detail telemetry metrics, structured logging, root-cause isolation, and post-mortem prevention steps.',
      },
    ];
  }

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
        category: 'Product Strategy & Prioritization',
        question: `How do you defend high-effort UX improvements against business requests for quick feature delivery ${companyPrefix}?`,
        hint: 'Highlight conversion lift, churn reduction, customer lifetime value (LTV), and user empathy.',
      },
    ];
  }

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
        category: 'Reliability Engineering',
        question: 'How do you define Service Level Objectives (SLOs) and Error Budgets with product teams?',
        hint: 'Discuss balancing feature release velocity against system reliability and automatic freeze policies.',
      },
    ];
  }

  // Default Generalist / Engineering / Leadership
  return [
    {
      id: 1,
      category: 'Core Competency & Problem Solving',
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
      category: 'Behavioral & Leadership',
      question: 'Tell me about a high-stakes disagreement with a teammate or stakeholder. How did you handle it and what was the outcome?',
      hint: 'Use the STAR method emphasizing data-driven discussions, mutual respect, and collaborative compromise.',
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
  candidate_id?: string | null;
  payment_reference?: string;
  payment_status?: PaymentStatus;
  amount?: number;
}): Promise<MockPrepSession> {
  const questions = generateRoleQuestions(params.target_role, params.company_name);
  const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
  const reference = params.payment_reference || `SYNC730-REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newSession: MockPrepSession = {
    id: sessionId,
    candidate_id: params.candidate_id || null,
    target_role: params.target_role,
    company_name: params.company_name || null,
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
