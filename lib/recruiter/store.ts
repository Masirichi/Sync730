import {
  CorporateWorkspace,
  WorkspaceMember,
  EmployerJob,
  JobStatus,
  PipelineCandidate,
  PipelineStage,
  PipelineStageHistory,
  ScorecardEntry,
  ScheduledInterview,
  VideoAssessment,
  TokenUnlockRecord,
  CandidateContactLog,
  RecruiterRole,
  AuditLogEntry,
  AuditLogAction,
  ConsoleNotification,
  NotificationType,
  NotificationSettings,
} from './types';
import { createBrowserClient } from '@/lib/supabase/client';

const WORKSPACE_KEY = 'sync730_active_workspace';
const JOBS_KEY = 'sync730_employer_jobs';
const ASSESSMENTS_KEY = 'sync730_talent_assessments';
const UNLOCKS_KEY = 'sync730_token_unlocks';
const MEMBERS_KEY = 'sync730_workspace_members';
const CONTACT_LOGS_KEY = 'sync730_candidate_contact_logs';
const PIPELINE_KEY = 'sync730_pipeline_candidates';
const AUDIT_LOGS_KEY = 'sync730_recruiter_audit_logs';
const NOTIFICATIONS_KEY = 'sync730_console_notifications';
const NOTIFICATION_SETTINGS_KEY = 'sync730_notification_settings';

// Default initial corporate workspace
export const DEFAULT_WORKSPACE: CorporateWorkspace = {
  id: 'ws-sync730-demo',
  company_name: 'Acme Global Ventures',
  billing_email: 'recruiting@acmeglobal.com',
  token_balance: 2, // 2 free trial tokens
  industry: 'Fintech & Cloud Software',
  company_size: '50-200 Employees',
  created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
};

// Initial Seed Candidates with Video Assessments & Rich Vetting Metrics
export const SEED_VIDEO_ASSESSMENTS: (VideoAssessment & {
  real_name: string;
  real_email: string;
  phone: string;
  whatsapp?: string;
  cv_url?: string;
})[] = [
  {
    id: 'va-cand-001',
    candidate_id: 'cand-001-jane-doe',
    target_role: 'Senior Full Stack Engineer (Next.js & Supabase)',
    overall_match_score: 95,
    technical_depth_score: 96,
    communication_score: 92,
    ai_summary:
      'Demonstrated high-velocity engineering depth across Next.js 14 App Router, Server Actions, and distributed Supabase architectures. Articulated nuanced tradeoffs between streaming SSR and state collocation with high clarity. Verified 0 proctoring infractions.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 165, // 2:45
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    seniority: 'Senior',
    skills: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Node.js', 'Tailwind CSS', 'PostgreSQL'],
    years_of_experience: 6,
    availability: 'Available',
    expected_salary: '$95,000 - $125,000 USD',
    location: 'Lagos, Nigeria',
    timezone: 'WAT (UTC+1)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    real_name: 'Jane Doe',
    real_email: 'jane.doe@sync730.com',
    phone: '+234 812 345 6789',
    whatsapp: '+2348123456789',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/jane_doe_fullstack_lead.pdf',
    transcript: [
      {
        time: 15,
        timestamp_label: '0:15',
        text: 'In our enterprise Next.js application, we segregated dynamic client state from heavy server-side streaming chunks to eliminate hydration waterfalls.',
      },
      {
        time: 48,
        timestamp_label: '0:48',
        text: 'For Supabase, we enforced granular Row-Level Security policies tied to JWT auth claims and tuned postgres indexes for tenant isolation.',
      },
      {
        time: 95,
        timestamp_label: '1:35',
        text: 'When handling high-frequency webhooks, we buffered incoming payloads through idempotent queue workers to guarantee at-least-once processing without race conditions.',
      },
      {
        time: 140,
        timestamp_label: '2:20',
        text: 'To ensure zero regressions, we maintain 90% unit test coverage using Vitest and verify critical user flows with Playwright end-to-end.',
      },
    ],
    key_moments: [
      {
        time: 15,
        timestamp_label: '0:15',
        title: 'App Router Hydration & Streaming Optimization',
        summary: 'Deep architectural dive on eliminating client waterfalls using React Server Components.',
      },
      {
        time: 48,
        timestamp_label: '0:48',
        title: 'Multi-Tenant Supabase RLS & Index Tuning',
        summary: 'Details strict database security boundaries with zero authorization bypasses.',
      },
      {
        time: 95,
        timestamp_label: '1:35',
        title: 'Idempotent Webhook & Queue Worker Architecture',
        summary: 'Explains distributed concurrency safeguards for external payment and partner events.',
      },
    ],
  },
  {
    id: 'va-cand-002',
    candidate_id: 'cand-002-chinedu-eze',
    target_role: 'Lead Product Designer (Design Systems & Mobile UX)',
    overall_match_score: 91,
    technical_depth_score: 89,
    communication_score: 94,
    ai_summary:
      'Presents comprehensive mastery of multi-brand design token architectures, Figma variable systems, and accessible WCAG 2.1 AAA touch states. Communicates design decisions with executive polish and strong business empathy.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 210, // 3:30
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    seniority: 'Lead',
    skills: ['Figma', 'Design Systems', 'Mobile UX', 'Design Tokens', 'User Research', 'Accessibility (WCAG)'],
    years_of_experience: 8,
    availability: 'Open to offers',
    expected_salary: '$110,000 - $135,000 USD',
    location: 'Abuja, Nigeria',
    timezone: 'WAT (UTC+1)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    real_name: 'Chinedu Eze',
    real_email: 'chinedu.eze@sync730.com',
    phone: '+234 803 987 6543',
    whatsapp: '+2348039876543',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/chinedu_eze_lead_designer.pdf',
    transcript: [
      {
        time: 20,
        timestamp_label: '0:20',
        text: 'Our design system unified 4 distinct mobile and desktop brand properties into a single semantic token matrix using Figma Variables.',
      },
      {
        time: 75,
        timestamp_label: '1:15',
        text: 'We audited color contrast to ensure WCAG 2.1 AAA compliance and established 48x48 pixel touch target baselines across all mobile touchpoints.',
      },
      {
        time: 150,
        timestamp_label: '2:30',
        text: 'Collaborating directly with engineering via Storybook and token transformers, we reduced handoff drift and shipping cycle times by 40%.',
      },
    ],
    key_moments: [
      {
        time: 20,
        timestamp_label: '0:20',
        title: 'Multi-Brand Token Architecture',
        summary: 'Demonstrates unified typography, elevation, and palette primitives across cross-functional platforms.',
      },
      {
        time: 75,
        timestamp_label: '1:15',
        title: 'Accessibility & Contrast Compliance',
        summary: 'Emphasizes inclusive design guidelines for diverse global audiences.',
      },
    ],
  },
  {
    id: 'va-cand-003',
    candidate_id: 'cand-003-amara-okonkwo',
    target_role: 'Staff Site Reliability Engineer (Kubernetes & SRE)',
    overall_match_score: 93,
    technical_depth_score: 97,
    communication_score: 88,
    ai_summary:
      'Exemplary incident triage and distributed systems resilience. Detailed multi-cluster ArgoCD GitOps pipelines, Terraform IaC state locking, and automated disaster recovery scenarios across AWS and GCP with zero downtime.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 195, // 3:15
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 70).toISOString(),
    seniority: 'Staff',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'ArgoCD', 'CI/CD Pipelines', 'Prometheus', 'Grafana'],
    years_of_experience: 10,
    availability: 'Available',
    expected_salary: '$130,000 - $160,000 USD',
    location: 'Nairobi, Kenya',
    timezone: 'EAT (UTC+3)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 70).toISOString(),
    real_name: 'Amara Okonkwo',
    real_email: 'amara.okonkwo@sync730.com',
    phone: '+234 901 234 5678',
    whatsapp: '+2349012345678',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/amara_okonkwo_staff_sre.pdf',
    transcript: [
      {
        time: 18,
        timestamp_label: '0:18',
        text: 'We managed multi-region EKS clusters backed by Karpenter for dynamic node autoscaling based on custom Prometheus queue depth metrics.',
      },
      {
        time: 68,
        timestamp_label: '1:08',
        text: 'During simulated regional network partition drills, our ArgoCD GitOps sync restored 100% of cluster state within 90 seconds.',
      },
      {
        time: 130,
        timestamp_label: '2:10',
        text: 'We implemented OpenTelemetry tracing across all gRPC services, allowing us to drop mean time to detection (MTTD) from 15 minutes to under 2 minutes.',
      },
    ],
    key_moments: [
      {
        time: 18,
        timestamp_label: '0:18',
        title: 'Kubernetes Autoscaling with Karpenter',
        summary: 'Cost-optimized infrastructure scaling managing spike loads with zero latency degradation.',
      },
      {
        time: 68,
        timestamp_label: '1:08',
        title: 'GitOps Disaster Recovery Drill',
        summary: 'Proves failover resilience and automated cluster state reconciliation.',
      },
    ],
  },
  {
    id: 'va-cand-004',
    candidate_id: 'cand-004-tariq-mansoor',
    target_role: 'Senior AI / LLM Engineer (RAG & Autonomous Agents)',
    overall_match_score: 90,
    technical_depth_score: 93,
    communication_score: 88,
    ai_summary:
      'Flowmingo AI is currently transcribing and analyzing acoustic clarity, vector embeddings of reasoning depth, and anti-cheating gaze consistency.',
    secure_video_url: '',
    poster_url: '',
    duration_seconds: 0,
    proctoring_flags: [],
    status: 'PROCESSING',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    seniority: 'Senior',
    skills: ['Python', 'FastAPI', 'LangChain', 'Vector DBs', 'PyTorch', 'Next.js'],
    years_of_experience: 7,
    availability: 'Open to offers',
    expected_salary: '$115,000 - $145,000 USD',
    location: 'Cairo, Egypt',
    timezone: 'EET (UTC+2)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 2).toISOString(),
    real_name: 'Tariq Mansoor',
    real_email: 'tariq.mansoor@sync730.com',
    phone: '+234 818 765 4321',
    whatsapp: '+2348187654321',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/tariq_mansoor_ai_engineer.pdf',
  },
  {
    id: 'va-cand-005',
    candidate_id: 'cand-005-kemi-adebayo',
    target_role: 'Mid-Level Frontend Engineer (React & TypeScript)',
    overall_match_score: 87,
    technical_depth_score: 88,
    communication_score: 91,
    ai_summary:
      'Strong execution on accessible web components, React 18 concurrent rendering, and performant state normalization. Articulates component lifecycle clearly.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 180, // 3:00
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 390).toISOString(), // ~13 months ago (flags >12m advisory)
    seniority: 'Mid-Level',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'Jest', 'HTML5/CSS3'],
    years_of_experience: 4,
    availability: 'Available',
    expected_salary: '$60,000 - $80,000 USD',
    location: 'Ibadan, Nigeria',
    timezone: 'WAT (UTC+1)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 390).toISOString(),
    real_name: 'Kemi Adebayo',
    real_email: 'kemi.adebayo@sync730.com',
    phone: '+234 814 555 1234',
    whatsapp: '+2348145551234',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/kemi_adebayo_frontend.pdf',
    transcript: [
      {
        time: 12,
        timestamp_label: '0:12',
        text: 'I structured our design tokens in Tailwind and built responsive data tables handling 5,000 rows with virtual windowing.',
      },
      {
        time: 55,
        timestamp_label: '0:55',
        text: 'Using React Query for server caching eliminated redundant fetch calls and gave users instant offline feedback.',
      },
    ],
    key_moments: [
      {
        time: 12,
        timestamp_label: '0:12',
        title: 'Virtual Table Performance Tuning',
        summary: 'Discusses 60fps scrolling and memory management on low-spec mobile devices.',
      },
    ],
  },
  {
    id: 'va-cand-006',
    candidate_id: 'cand-006-emeka-offor',
    target_role: 'Staff Backend Architect (Go & Distributed Systems)',
    overall_match_score: 94,
    technical_depth_score: 98,
    communication_score: 90,
    ai_summary: 'Architected high-throughput financial transaction settlement engines.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    poster_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 150,
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    seniority: 'Staff',
    skills: ['Go', 'gRPC', 'Kafka', 'PostgreSQL', 'Distributed Systems'],
    years_of_experience: 11,
    availability: 'Not looking', // Marked 'Not looking' -> Hidden by default as required!
    expected_salary: '$140,000 - $170,000 USD',
    location: 'Enugu, Nigeria',
    timezone: 'WAT (UTC+1)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: false, // Consent false -> Hidden as required!
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    real_name: 'Emeka Offor',
    real_email: 'emeka.offor@sync730.com',
    phone: '+234 802 333 4444',
  },
];

// Initial Seed Jobs with Counts and Multi-Currency Compensation
export const INITIAL_EMPLOYER_JOBS: EmployerJob[] = [
  {
    id: 'job-emp-001',
    workspace_id: 'ws-sync730-demo',
    job_title: 'Senior Full Stack Engineer (Next.js & Supabase)',
    flowmingo_project_id: 'mock_flowmingo_proj_8921',
    status: 'active',
    department: 'Engineering',
    seniority: 'Senior',
    job_type: 'Full-time',
    employment_type: 'Full-time',
    work_arrangement: 'Remote',
    location: '100% Remote (Global Overlap)',
    eligible_regions: ['Nigeria', 'Africa', 'Worldwide'],
    salary_min: 95000,
    salary_max: 130000,
    salary_currency: 'USD',
    salary_period: 'year',
    salary_range: '$95,000 - $130,000 USD',
    skills: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    description: 'We are seeking an autonomous Senior Full Stack Engineer to lead web architecture, Core Web Vitals optimization, and real-time backend integrations.',
    requirements: 'Minimum 5 years building scalable web architectures. Deep experience with Next.js App Router, SSR streaming, and PostgreSQL/Supabase.',
    application_deadline: '2026-12-31',
    assessment_template: 'Engineering',
    invited_count: 18,
    assessed_count: 12,
    shortlisted_count: 4,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'job-emp-002',
    workspace_id: 'ws-sync730-demo',
    job_title: 'Staff Cloud Infrastructure & SRE',
    flowmingo_project_id: 'mock_flowmingo_proj_3104',
    status: 'active',
    department: 'DevOps & Infrastructure',
    seniority: 'Staff',
    job_type: 'Full-time',
    employment_type: 'Full-time',
    work_arrangement: 'Remote',
    location: 'Remote (US / EMEA Hours)',
    eligible_regions: ['Nigeria', 'Africa', 'EMEA'],
    salary_min: 110000,
    salary_max: 150000,
    salary_currency: 'USD',
    salary_period: 'year',
    salary_range: '$110,000 - $150,000 USD',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD Pipelines'],
    description: 'Scale multi-tenant Kubernetes clusters, manage automated CI/CD deployment gates, and ensure 99.99% uptime across production services.',
    requirements: 'Demonstrated experience managing multi-region Kubernetes clusters with ArgoCD, Terraform, and automated disaster recovery.',
    application_deadline: '2026-12-15',
    assessment_template: 'Engineering',
    invited_count: 10,
    assessed_count: 7,
    shortlisted_count: 2,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'job-emp-003',
    workspace_id: 'ws-sync730-demo',
    job_title: 'Senior Product Designer (Design Systems)',
    flowmingo_project_id: 'mock_flowmingo_proj_5521',
    status: 'draft',
    department: 'Product & Design',
    seniority: 'Senior',
    job_type: 'Full-time',
    employment_type: 'Full-time',
    work_arrangement: 'Hybrid',
    location: 'Lagos, Nigeria (Hybrid)',
    location_country: 'Nigeria',
    location_state: 'Lagos',
    location_city: 'Victoria Island',
    eligible_regions: ['Nigeria'],
    salary_min: 15000000,
    salary_max: 22000000,
    salary_currency: 'NGN',
    salary_period: 'year',
    salary_range: '₦15,000,000 - ₦22,000,000 NGN',
    skills: ['Figma', 'Design Systems', 'Mobile UX', 'Design Tokens'],
    description: 'Define and maintain multi-platform UI components, micro-interactions, and design tokens for cross-functional engineering teams.',
    requirements: 'Strong portfolio demonstrating multi-tenant design tokens, accessibility auditing, and fluid responsive design.',
    application_deadline: '2027-01-31',
    assessment_template: 'Product/Design',
    invited_count: 0,
    assessed_count: 0,
    shortlisted_count: 0,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'job-emp-004',
    workspace_id: 'ws-sync730-demo',
    job_title: 'Staff Platform Engineer (Kubernetes & Go)',
    flowmingo_project_id: 'mock_flowmingo_proj_5522',
    status: 'closed',
    department: 'Engineering',
    seniority: 'Lead',
    job_type: 'Full-time',
    employment_type: 'Full-time',
    work_arrangement: 'Remote',
    location: 'Remote',
    location_country: 'Worldwide',
    eligible_regions: ['Worldwide'],
    salary_min: 140000,
    salary_max: 180000,
    salary_currency: 'USD',
    salary_period: 'year',
    salary_range: '$140,000 - $180,000 USD',
    skills: ['Kubernetes', 'Go', 'Terraform', 'AWS'],
    description: 'Lead cloud infrastructure, multi-cluster Kubernetes deployments, and developer platform tooling.',
    requirements: 'Extensive production experience scaling high-throughput distributed systems in Go and Kubernetes.',
    application_deadline: '2026-10-31',
    assessment_template: 'Engineering',
    invited_count: 14,
    assessed_count: 11,
    shortlisted_count: 3,
    created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
];

// Seed Pipeline Candidates for Job Stages
export const INITIAL_PIPELINE_CANDIDATES: PipelineCandidate[] = [
  {
    id: 'pipe-001',
    job_id: 'job-emp-001',
    candidate_id: 'cand-001-jane-doe',
    masked_id: 'CAND-001',
    candidate_name: 'Sync730 Verified Candidate #001',
    stage: 'Shortlisted',
    overall_match_score: 95,
    technical_depth_score: 96,
    communication_score: 92,
    skills: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    seniority: 'Senior',
    years_of_experience: 6,
    location: 'Lagos, Nigeria (Remote)',
    expected_salary: '$100,000 - $125,000 USD / year',
    applied_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    stage_history: [
      {
        from_stage: 'Applied',
        to_stage: 'Shortlisted',
        moved_by: 'Alex Morgan (Owner)',
        moved_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ],
    scorecards: [
      {
        id: 'sc-001',
        interviewer_id: 'mem-001',
        interviewer_name: 'Alex Morgan',
        interviewer_role: 'OWNER',
        technical_depth: 5,
        problem_solving: 5,
        culture_values: 4,
        communication: 5,
        overall_rating: 5,
        notes: 'Outstanding technical articulation on SSR streaming and state collocation.',
        submitted_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
    ],
    scheduled_interviews: [],
    notes: [
      {
        id: 'note-001',
        author_name: 'Alex Morgan',
        author_role: 'OWNER',
        text: 'Top recommendation from Flowmingo video screening. Ready for hiring manager deep dive.',
        created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
      },
    ],
  },
  {
    id: 'pipe-002',
    job_id: 'job-emp-001',
    candidate_id: 'cand-004-tunde-balogun',
    masked_id: 'CAND-004',
    candidate_name: 'Sync730 Verified Candidate #004',
    stage: 'Contacted',
    overall_match_score: 91,
    technical_depth_score: 94,
    communication_score: 88,
    skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
    seniority: 'Senior',
    years_of_experience: 7,
    location: 'Ibadan, Nigeria (Remote)',
    expected_salary: '$90,000 - $115,000 USD / year',
    applied_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    stage_history: [
      {
        from_stage: 'Applied',
        to_stage: 'Shortlisted',
        moved_by: 'Sarah Chen (Tech Lead)',
        moved_at: new Date(Date.now() - 3600000 * 50).toISOString(),
      },
      {
        from_stage: 'Shortlisted',
        to_stage: 'Contacted',
        moved_by: 'Alex Morgan (Owner)',
        moved_at: new Date(Date.now() - 3600000 * 36).toISOString(),
      },
    ],
    scorecards: [
      {
        id: 'sc-002',
        interviewer_id: 'mem-002',
        interviewer_name: 'Sarah Chen (Tech Lead)',
        interviewer_role: 'INTERVIEWER',
        technical_depth: 4,
        problem_solving: 4,
        culture_values: 5,
        communication: 4,
        overall_rating: 4,
        notes: 'Strong frontend architectural fundamentals, solid answers on DOM virtual table optimizations.',
        submitted_at: new Date(Date.now() - 3600000 * 30).toISOString(),
      },
    ],
    scheduled_interviews: [],
    notes: [],
  },
  {
    id: 'pipe-003',
    job_id: 'job-emp-001',
    candidate_id: 'cand-002-chidi-okafor',
    masked_id: 'CAND-002',
    candidate_name: 'Sync730 Verified Candidate #002',
    stage: 'Interviewing',
    overall_match_score: 93,
    technical_depth_score: 95,
    communication_score: 90,
    skills: ['Next.js', 'PostgreSQL', 'Kubernetes', 'Docker'],
    seniority: 'Staff',
    years_of_experience: 8,
    location: 'Abuja, Nigeria (Remote)',
    expected_salary: '$110,000 - $135,000 USD / year',
    applied_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    stage_history: [
      {
        from_stage: 'Applied',
        to_stage: 'Shortlisted',
        moved_by: 'Alex Morgan (Owner)',
        moved_at: new Date(Date.now() - 3600000 * 70).toISOString(),
      },
      {
        from_stage: 'Shortlisted',
        to_stage: 'Contacted',
        moved_by: 'Alex Morgan (Owner)',
        moved_at: new Date(Date.now() - 3600000 * 40).toISOString(),
      },
      {
        from_stage: 'Contacted',
        to_stage: 'Interviewing',
        moved_by: 'Sarah Chen (Tech Lead)',
        moved_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
    scorecards: [
      {
        id: 'sc-003',
        interviewer_id: 'mem-001',
        interviewer_name: 'Alex Morgan',
        interviewer_role: 'OWNER',
        technical_depth: 5,
        problem_solving: 5,
        culture_values: 5,
        communication: 4,
        overall_rating: 5,
        notes: 'Impressive systems background; handled multi-tenant architecture questions with high confidence.',
        submitted_at: new Date(Date.now() - 3600000 * 14).toISOString(),
      },
      {
        id: 'sc-004',
        interviewer_id: 'mem-002',
        interviewer_name: 'Sarah Chen (Tech Lead)',
        interviewer_role: 'INTERVIEWER',
        technical_depth: 4,
        problem_solving: 5,
        culture_values: 4,
        communication: 4,
        overall_rating: 4,
        notes: 'Clear problem-solving framework. Would be an asset for database optimization.',
        submitted_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ],
    scheduled_interviews: [
      {
        id: 'int-001',
        scheduled_at: new Date(Date.now() + 3600000 * 24).toISOString(),
        duration_minutes: 45,
        interviewer_emails: ['alex.morgan@acmeglobal.com', 'sarah.tech@acmeglobal.com'],
        candidate_email: 'chidi.okafor@sync730.com',
        meeting_link: 'https://meet.google.com/sync-730-int',
        notes: 'Technical systems deep-dive & architecture review',
        created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
        created_by: 'sarah.tech@acmeglobal.com',
      },
    ],
    notes: [
      {
        id: 'note-002',
        author_name: 'Sarah Chen',
        author_role: 'INTERVIEWER',
        text: 'Scheduled architecture review interview for tomorrow. Calendar invite sent to candidate.',
        created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
    ],
  },
  {
    id: 'pipe-004',
    job_id: 'job-emp-001',
    candidate_id: 'cand-005-kemi-adebayo',
    masked_id: 'CAND-005',
    candidate_name: 'Sync730 Verified Candidate #005',
    stage: 'Offer',
    overall_match_score: 88,
    technical_depth_score: 87,
    communication_score: 91,
    skills: ['TypeScript', 'React', 'Tailwind CSS'],
    seniority: 'Senior',
    years_of_experience: 5,
    location: 'Lagos, Nigeria (Remote)',
    expected_salary: '$85,000 - $110,000 USD / year',
    applied_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    stage_history: [
      {
        from_stage: 'Applied',
        to_stage: 'Shortlisted',
        moved_by: 'Alex Morgan',
        moved_at: new Date(Date.now() - 3600000 * 90).toISOString(),
      },
      {
        from_stage: 'Shortlisted',
        to_stage: 'Interviewing',
        moved_by: 'Alex Morgan',
        moved_at: new Date(Date.now() - 3600000 * 50).toISOString(),
      },
      {
        from_stage: 'Interviewing',
        to_stage: 'Offer',
        moved_by: 'Alex Morgan',
        moved_at: new Date(Date.now() - 3600000 * 16).toISOString(),
      },
    ],
    scorecards: [
      {
        id: 'sc-005',
        interviewer_id: 'mem-001',
        interviewer_name: 'Alex Morgan',
        interviewer_role: 'OWNER',
        technical_depth: 4,
        problem_solving: 4,
        culture_values: 5,
        communication: 5,
        overall_rating: 5,
        notes: 'Passed all rounds. Formal offer extended.',
        submitted_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ],
    scheduled_interviews: [],
    notes: [],
  },
  {
    id: 'pipe-005',
    job_id: 'job-emp-001',
    candidate_id: 'cand-007-sample',
    masked_id: 'CAND-007',
    candidate_name: 'Sync730 Verified Candidate #007',
    stage: 'Rejected',
    rejection_reason: 'Skill mismatch: Candidate lacked deep experience in PostgreSQL row level security and realtime subscriptions.',
    overall_match_score: 74,
    technical_depth_score: 70,
    communication_score: 76,
    skills: ['HTML', 'CSS', 'JavaScript'],
    seniority: 'Mid-Level',
    years_of_experience: 3,
    location: 'Remote',
    expected_salary: '$60,000 USD / year',
    applied_at: new Date(Date.now() - 3600000 * 140).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    stage_history: [
      {
        from_stage: 'Applied',
        to_stage: 'Shortlisted',
        moved_by: 'Sarah Chen',
        moved_at: new Date(Date.now() - 3600000 * 100).toISOString(),
      },
      {
        from_stage: 'Shortlisted',
        to_stage: 'Rejected',
        moved_by: 'Sarah Chen',
        moved_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        reason: 'Skill mismatch: Candidate lacked deep experience in PostgreSQL row level security and realtime subscriptions.',
      },
    ],
    scorecards: [
      {
        id: 'sc-006',
        interviewer_id: 'mem-002',
        interviewer_name: 'Sarah Chen (Tech Lead)',
        interviewer_role: 'INTERVIEWER',
        technical_depth: 2,
        problem_solving: 3,
        culture_values: 4,
        communication: 3,
        overall_rating: 2,
        notes: 'Needs more hands-on production experience with distributed database transactions.',
        submitted_at: new Date(Date.now() - 3600000 * 50).toISOString(),
      },
    ],
    scheduled_interviews: [],
    notes: [],
  },
];

// Initial Workspace Members
export const INITIAL_MEMBERS: WorkspaceMember[] = [
  {
    id: 'mem-001',
    workspace_id: 'ws-sync730-demo',
    user_id: 'recruiter-admin-user',
    role: 'OWNER',
    email: 'alex.morgan@acmeglobal.com',
    full_name: 'Alex Morgan',
    status: 'Active',
    last_active: 'Just now',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: 'mem-002',
    workspace_id: 'ws-sync730-demo',
    user_id: 'admin-user-02',
    role: 'ADMIN',
    email: 'david.okonkwo@acmeglobal.com',
    full_name: 'David Okonkwo',
    status: 'Active',
    last_active: '2 hours ago',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'mem-003',
    workspace_id: 'ws-sync730-demo',
    user_id: 'interviewer-user-01',
    role: 'INTERVIEWER',
    email: 'sarah.tech@acmeglobal.com',
    full_name: 'Sarah Chen (Tech Lead)',
    status: 'Active',
    last_active: 'Yesterday',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'inv-001',
    workspace_id: 'ws-sync730-demo',
    user_id: 'pending-inv-001',
    role: 'INTERVIEWER',
    email: 'amara.nwosu@acmeglobal.com',
    full_name: 'Amara Nwosu',
    status: 'Invited',
    invited_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    expires_at: new Date(Date.now() + 3600000 * 24 * 5).toISOString(), // 5 days remaining of 7
    invited_by: 'Alex Morgan',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
];

// Initial Immutable Audit Logs
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    workspace_id: 'ws-sync730-demo',
    actor_id: 'recruiter-admin-user',
    actor_name: 'Alex Morgan',
    actor_email: 'alex.morgan@acmeglobal.com',
    actor_role: 'OWNER',
    action: 'TOKEN_PURCHASE',
    target_resource: 'ord_growth_pack_01',
    details: 'Purchased Growth Pack (15 Tokens) for ₦270,000 via Paystack verified card transaction.',
    metadata: { pack_id: 'growth', tokens: 15, amount: 270000, reference: 'pay_ref_growth_98421' },
    ip_address: '102.89.43.12 (Lagos, NG)',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'aud-002',
    workspace_id: 'ws-sync730-demo',
    actor_id: 'admin-user-02',
    actor_name: 'David Okonkwo',
    actor_email: 'david.okonkwo@acmeglobal.com',
    actor_role: 'ADMIN',
    action: 'TOKEN_UNLOCK',
    target_resource: 'cand-001-jane-doe',
    details: 'Unlocked candidate Jane Doe (Senior Full Stack Engineer) contact dossier for 1 token. Handled under NDPA 2023 compliance.',
    metadata: { candidate_id: 'cand-001-jane-doe', tokens_spent: 1, balance_after: 2 },
    ip_address: '105.112.98.54 (Abuja, NG)',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'aud-003',
    workspace_id: 'ws-sync730-demo',
    actor_id: 'recruiter-admin-user',
    actor_name: 'Alex Morgan',
    actor_email: 'alex.morgan@acmeglobal.com',
    actor_role: 'OWNER',
    action: 'MEMBER_INVITE',
    target_resource: 'inv-001',
    details: 'Invited Amara Nwosu (amara.nwosu@acmeglobal.com) as INTERVIEWER with 7-day expiration window.',
    metadata: { invitee_email: 'amara.nwosu@acmeglobal.com', role: 'INTERVIEWER', expires_in_days: 7 },
    ip_address: '102.89.43.12 (Lagos, NG)',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'aud-004',
    workspace_id: 'ws-sync730-demo',
    actor_id: 'recruiter-admin-user',
    actor_name: 'Alex Morgan',
    actor_email: 'alex.morgan@acmeglobal.com',
    actor_role: 'OWNER',
    action: 'ROLE_CHANGE',
    target_resource: 'mem-002',
    details: 'Updated David Okonkwo role from INTERVIEWER to ADMIN.',
    metadata: { member_id: 'mem-002', old_role: 'INTERVIEWER', new_role: 'ADMIN' },
    ip_address: '102.89.43.12 (Lagos, NG)',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    id: 'aud-005',
    workspace_id: 'ws-sync730-demo',
    actor_id: 'admin-user-02',
    actor_name: 'David Okonkwo',
    actor_email: 'david.okonkwo@acmeglobal.com',
    actor_role: 'ADMIN',
    action: 'JOB_UPDATED',
    target_resource: 'job-001',
    details: 'Updated job "Senior Backend Engineer (Go & Distributed Systems)" status to Active.',
    metadata: { job_id: 'job-001', status: 'active' },
    ip_address: '105.112.98.54 (Abuja, NG)',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'aud-006',
    workspace_id: 'ws-sync730-demo',
    actor_id: 'recruiter-admin-user',
    actor_name: 'Alex Morgan',
    actor_email: 'alex.morgan@acmeglobal.com',
    actor_role: 'OWNER',
    action: 'DATA_EXPORT',
    target_resource: 'pipeline-export-job-001',
    details: 'Exported pipeline candidate dataset for "Senior Backend Engineer" (14 candidates) as CSV.',
    metadata: { job_id: 'job-001', record_count: 14, format: 'CSV' },
    ip_address: '102.89.43.12 (Lagos, NG)',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
  },
  {
    id: 'aud-007',
    workspace_id: 'ws-sync730-demo',
    actor_id: 'recruiter-admin-user',
    actor_name: 'Alex Morgan',
    actor_email: 'alex.morgan@acmeglobal.com',
    actor_role: 'OWNER',
    action: 'LOGIN_NEW_DEVICE',
    target_resource: 'session_auth_01',
    details: 'Authenticated from new desktop environment: Chrome 130 on Windows 11 (IP: 102.89.43.12). 2FA verified.',
    metadata: { ip: '102.89.43.12', os: 'Windows 11', browser: 'Chrome 130' },
    ip_address: '102.89.43.12 (Lagos, NG)',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
];

// Initial Console Notifications
export const INITIAL_NOTIFICATIONS: ConsoleNotification[] = [
  {
    id: 'notif-001',
    workspace_id: 'ws-sync730-demo',
    type: 'NEW_VETTED_CANDIDATE',
    title: '3 New Vetted Candidates Available',
    description: 'Fresh AI-vetted candidates matched your open role: Senior Backend Engineer.',
    link: '/console/talent?job=job-001',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'notif-002',
    workspace_id: 'ws-sync730-demo',
    type: 'VIDEO_AWAITING_REVIEW',
    title: 'Candidate Video Awaiting Review',
    description: 'Jane Doe submitted their technical screening response for Lead Product Designer.',
    link: '/console/jobs/job-001/pipeline',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'notif-003',
    workspace_id: 'ws-sync730-demo',
    type: 'PAYMENT_CONFIRMED',
    title: 'Payment Confirmed · Tokens Added',
    description: 'Starter Pack (5 tokens) payment was verified. Balance is now 2 tokens.',
    link: '/console/billing',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'notif-004',
    workspace_id: 'ws-sync730-demo',
    type: 'LOW_TOKENS',
    title: 'Low Token Balance Warning',
    description: 'Your workspace has 2 candidate unlock tokens remaining. Top up to keep unlocking dossiers.',
    link: '/console/billing',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'notif-005',
    workspace_id: 'ws-sync730-demo',
    type: 'TEAMMATE_COMMENT',
    title: 'New Scorecard from Sarah Chen',
    description: 'Sarah Chen rated candidate Tunde Bakare with 4.8/5 on Architecture & Concurrency.',
    link: '/console/jobs/job-001/pipeline',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  in_app: {
    NEW_VETTED_CANDIDATE: true,
    VIDEO_AWAITING_REVIEW: true,
    PAYMENT_CONFIRMED: true,
    LOW_TOKENS: true,
    TEAMMATE_COMMENT: true,
  },
  email: {
    NEW_VETTED_CANDIDATE: true,
    VIDEO_AWAITING_REVIEW: true,
    PAYMENT_CONFIRMED: true,
    LOW_TOKENS: true,
    TEAMMATE_COMMENT: false,
  },
  whatsapp: {
    NEW_VETTED_CANDIDATE: false,
    VIDEO_AWAITING_REVIEW: false,
    PAYMENT_CONFIRMED: true,
    LOW_TOKENS: true,
    TEAMMATE_COMMENT: false,
  },
};

// In-Memory store for Server-side fallback (persisted across Next.js route chunks on globalThis)
interface GlobalServerStoreType {
  workspace: CorporateWorkspace;
  jobs: EmployerJob[];
  pipelineCandidates: PipelineCandidate[];
  assessments: any[];
  unlocks: TokenUnlockRecord[];
  members: WorkspaceMember[];
  contactLogs: CandidateContactLog[];
  auditLogs: AuditLogEntry[];
  notifications: ConsoleNotification[];
  notificationSettings: NotificationSettings;
}

const g = globalThis as unknown as { __sync730_server_store__?: GlobalServerStoreType };
if (!g.__sync730_server_store__) {
  g.__sync730_server_store__ = {
    workspace: DEFAULT_WORKSPACE,
    jobs: [...INITIAL_EMPLOYER_JOBS],
    pipelineCandidates: [...INITIAL_PIPELINE_CANDIDATES],
    assessments: [...SEED_VIDEO_ASSESSMENTS],
    unlocks: [] as TokenUnlockRecord[],
    members: [...INITIAL_MEMBERS],
    contactLogs: [] as CandidateContactLog[],
    auditLogs: [...INITIAL_AUDIT_LOGS],
    notifications: [...INITIAL_NOTIFICATIONS],
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
  };
}
const globalServerStore: GlobalServerStoreType = g.__sync730_server_store__;

/* ==============================================================================
 * B2B Store Client Functions
 * ============================================================================== */

export function getLocalWorkspace(): CorporateWorkspace {
  if (typeof window === 'undefined') return globalServerStore.workspace;
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(DEFAULT_WORKSPACE));
      return DEFAULT_WORKSPACE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

export function saveLocalWorkspace(ws: CorporateWorkspace) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(ws));
      window.dispatchEvent(new Event('sync730_workspace_updated'));
    } catch (e) {
      console.warn('Failed to save workspace to localStorage:', e);
    }
  }
  globalServerStore.workspace = ws;
}

export function getLocalJobs(): EmployerJob[] {
  if (typeof window === 'undefined') return globalServerStore.jobs;
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) {
      localStorage.setItem(JOBS_KEY, JSON.stringify(INITIAL_EMPLOYER_JOBS));
      return INITIAL_EMPLOYER_JOBS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EMPLOYER_JOBS;
  }
}

export function saveLocalJobs(jobs: EmployerJob[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
      window.dispatchEvent(new Event('sync730_jobs_updated'));
    } catch (e) {
      console.warn('Failed to save jobs to localStorage:', e);
    }
  }
  globalServerStore.jobs = jobs;
}

export function updateJobStatus(jobId: string, status: JobStatus): EmployerJob | null {
  const jobs = getLocalJobs();
  const index = jobs.findIndex((j) => j.id === jobId);
  if (index === -1) return null;
  const updatedJob = { ...jobs[index], status, updated_at: new Date().toISOString() };
  jobs[index] = updatedJob;
  saveLocalJobs(jobs);
  return updatedJob;
}

export function duplicateJob(jobId: string): EmployerJob | null {
  const jobs = getLocalJobs();
  const source = jobs.find((j) => j.id === jobId);
  if (!source) return null;
  const duplicated: EmployerJob = {
    ...source,
    id: `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    job_title: `${source.job_title} (Copy)`,
    flowmingo_project_id: `mock_flowmingo_proj_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    status: 'draft',
    invited_count: 0,
    assessed_count: 0,
    shortlisted_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveLocalJobs([duplicated, ...jobs]);
  return duplicated;
}

export function updateJob(jobId: string, updates: Partial<EmployerJob>): EmployerJob | null {
  const jobs = getLocalJobs();
  const index = jobs.findIndex((j) => j.id === jobId);
  if (index === -1) return null;
  const updatedJob = { ...jobs[index], ...updates, updated_at: new Date().toISOString() };
  jobs[index] = updatedJob;
  saveLocalJobs(jobs);
  return updatedJob;
}

export function getLocalPipelineCandidates(jobId?: string): PipelineCandidate[] {
  if (typeof window === 'undefined') {
    return jobId
      ? globalServerStore.pipelineCandidates.filter((c) => c.job_id === jobId)
      : globalServerStore.pipelineCandidates;
  }
  try {
    const raw = localStorage.getItem(PIPELINE_KEY);
    if (!raw) {
      localStorage.setItem(PIPELINE_KEY, JSON.stringify(INITIAL_PIPELINE_CANDIDATES));
      return jobId
        ? INITIAL_PIPELINE_CANDIDATES.filter((c) => c.job_id === jobId)
        : INITIAL_PIPELINE_CANDIDATES;
    }
    const candidates: PipelineCandidate[] = JSON.parse(raw);
    return jobId ? candidates.filter((c) => c.job_id === jobId) : candidates;
  } catch {
    return INITIAL_PIPELINE_CANDIDATES;
  }
}

export function saveLocalPipelineCandidates(candidates: PipelineCandidate[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PIPELINE_KEY, JSON.stringify(candidates));
      window.dispatchEvent(new Event('sync730_pipeline_updated'));
    } catch (e) {
      console.warn('Failed to save pipeline candidates to localStorage:', e);
    }
  }
  globalServerStore.pipelineCandidates = candidates;
}

export function updateLocalPipelineCandidateStage(
  id: string,
  stage: PipelineStage,
  reason?: string,
  movedBy?: string
): PipelineCandidate | null {
  const all = getLocalPipelineCandidates();
  const index = all.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = all[index];
  const historyEntry: PipelineStageHistory = {
    from_stage: current.stage,
    to_stage: stage,
    moved_by: movedBy || 'Hiring Team',
    moved_at: new Date().toISOString(),
    reason: stage === 'Rejected' ? reason : undefined,
  };

  const updated: PipelineCandidate = {
    ...current,
    stage,
    rejection_reason: stage === 'Rejected' ? reason : current.rejection_reason,
    updated_at: new Date().toISOString(),
    stage_history: [historyEntry, ...(current.stage_history || [])],
  };

  all[index] = updated;
  saveLocalPipelineCandidates(all);
  return updated;
}

export function addScorecardToPipelineCandidate(
  candidateId: string,
  scorecard: ScorecardEntry
): PipelineCandidate | null {
  const all = getLocalPipelineCandidates();
  const index = all.findIndex((c) => c.id === candidateId);
  if (index === -1) return null;

  const current = all[index];
  const updated: PipelineCandidate = {
    ...current,
    scorecards: [scorecard, ...(current.scorecards || [])],
    updated_at: new Date().toISOString(),
  };

  all[index] = updated;
  saveLocalPipelineCandidates(all);
  return updated;
}

export function addNoteToPipelineCandidate(
  candidateId: string,
  note: { author_name: string; author_role: RecruiterRole; text: string }
): PipelineCandidate | null {
  const all = getLocalPipelineCandidates();
  const index = all.findIndex((c) => c.id === candidateId);
  if (index === -1) return null;

  const current = all[index];
  const noteEntry = {
    id: `note-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    ...note,
    created_at: new Date().toISOString(),
  };

  const updated: PipelineCandidate = {
    ...current,
    notes: [noteEntry, ...(current.notes || [])],
    updated_at: new Date().toISOString(),
  };

  all[index] = updated;
  saveLocalPipelineCandidates(all);
  return updated;
}

export function scheduleInterviewForPipelineCandidate(
  candidateId: string,
  interview: ScheduledInterview
): PipelineCandidate | null {
  const all = getLocalPipelineCandidates();
  const index = all.findIndex((c) => c.id === candidateId);
  if (index === -1) return null;

  const current = all[index];
  const updated: PipelineCandidate = {
    ...current,
    stage: current.stage === 'Shortlisted' || current.stage === 'Contacted' ? 'Interviewing' : current.stage,
    scheduled_interviews: [interview, ...(current.scheduled_interviews || [])],
    updated_at: new Date().toISOString(),
  };

  all[index] = updated;
  saveLocalPipelineCandidates(all);
  return updated;
}

export function getLocalUnlocks(workspaceId?: string): TokenUnlockRecord[] {
  if (typeof window === 'undefined') {
    return workspaceId
      ? globalServerStore.unlocks.filter((u) => u.workspace_id === workspaceId)
      : globalServerStore.unlocks;
  }
  try {
    const raw = localStorage.getItem(UNLOCKS_KEY);
    const unlocks: TokenUnlockRecord[] = raw ? JSON.parse(raw) : [];
    return workspaceId ? unlocks.filter((u) => u.workspace_id === workspaceId) : unlocks;
  } catch {
    return [];
  }
}

export function saveLocalUnlock(unlock: TokenUnlockRecord) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalUnlocks();
      const updated = [...existing.filter((u) => !(u.workspace_id === unlock.workspace_id && u.candidate_id === unlock.candidate_id)), unlock];
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_unlocks_updated'));
    } catch (e) {
      console.warn('Failed to save unlock to localStorage:', e);
    }
  }
  globalServerStore.unlocks.push(unlock);
}

export function getLocalAssessments(): (VideoAssessment & { real_name?: string; real_email?: string; phone?: string; whatsapp?: string; cv_url?: string })[] {
  if (typeof window === 'undefined') return globalServerStore.assessments;
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    if (!raw) {
      localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(SEED_VIDEO_ASSESSMENTS));
      return SEED_VIDEO_ASSESSMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_VIDEO_ASSESSMENTS;
  }
}

export function saveLocalAssessment(assessment: VideoAssessment & { real_name?: string; real_email?: string }) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalAssessments();
      const idx = existing.findIndex((a) => a.id === assessment.id || a.candidate_id === assessment.candidate_id);
      let updated;
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = { ...existing[idx], ...assessment };
      } else {
        updated = [assessment, ...existing];
      }
      localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_assessments_updated'));
    } catch (e) {
      console.warn('Failed to save assessment to localStorage:', e);
    }
  }
  globalServerStore.assessments.push(assessment as any);
}

export function getLocalMembers(workspaceId?: string): WorkspaceMember[] {
  if (typeof window === 'undefined') return globalServerStore.members;
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (!raw) {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    const members: WorkspaceMember[] = JSON.parse(raw);
    return workspaceId ? members.filter((m) => m.workspace_id === workspaceId) : members;
  } catch {
    return INITIAL_MEMBERS;
  }
}

export function saveLocalMember(member: WorkspaceMember) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalMembers();
      const updated = [...existing, member];
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_members_updated'));
    } catch (e) {
      console.warn('Failed to save member to localStorage:', e);
    }
  }
  globalServerStore.members.push(member);
}

/**
 * Update member role with Last-Owner protection and privilege hierarchy enforcement.
 */
export function updateWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: RecruiterRole,
  actor: { id: string; name: string; email: string; role: RecruiterRole }
): { success: boolean; member?: WorkspaceMember; error?: string } {
  const members = getLocalMembers(workspaceId);
  const targetMember = members.find((m) => m.id === memberId);
  if (!targetMember) {
    return { success: false, error: 'Member not found.' };
  }

  // RULE 1: Cannot demote the last OWNER
  if (targetMember.role === 'OWNER' && newRole !== 'OWNER') {
    const activeOwners = members.filter((m) => m.role === 'OWNER' && m.status === 'Active');
    if (activeOwners.length <= 1) {
      return {
        success: false,
        error: 'Cannot remove or demote the last workspace Owner. Assign another Owner first.',
      };
    }
  }

  // RULE 2: Only OWNER can promote/demote other ADMINs and OWNERs
  if (actor.role !== 'OWNER') {
    if (newRole === 'OWNER' || newRole === 'ADMIN' || targetMember.role === 'OWNER' || targetMember.role === 'ADMIN') {
      return {
        success: false,
        error: 'Permission denied: Only workspace Owners can assign, modify, or demote Admin and Owner roles.',
      };
    }
  }

  const oldRole = targetMember.role;
  const updatedMember: WorkspaceMember = {
    ...targetMember,
    role: newRole,
  };

  const updatedList = members.map((m) => (m.id === memberId ? updatedMember : m));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('sync730_members_updated'));
    } catch (e) {
      console.warn('Failed to persist updated member:', e);
    }
  }
  globalServerStore.members = updatedList;

  // Record in immutable audit log
  addAuditLogEntry({
    workspace_id: workspaceId,
    actor_id: actor.id,
    actor_name: actor.name,
    actor_email: actor.email,
    actor_role: actor.role,
    action: 'ROLE_CHANGE',
    target_resource: memberId,
    details: `Changed role of ${targetMember.full_name || targetMember.email} from ${oldRole} to ${newRole}.`,
    metadata: { member_id: memberId, old_role: oldRole, new_role: newRole },
  });

  return { success: true, member: updatedMember };
}

/**
 * Remove a member from the workspace with Last-Owner protection and privilege hierarchy enforcement.
 */
export function removeWorkspaceMember(
  workspaceId: string,
  memberId: string,
  actor: { id: string; name: string; email: string; role: RecruiterRole }
): { success: boolean; error?: string } {
  const members = getLocalMembers(workspaceId);
  const targetMember = members.find((m) => m.id === memberId);
  if (!targetMember) {
    return { success: false, error: 'Member not found.' };
  }

  // RULE 1: Cannot remove the last OWNER
  if (targetMember.role === 'OWNER') {
    const activeOwners = members.filter((m) => m.role === 'OWNER' && m.status === 'Active');
    if (activeOwners.length <= 1) {
      return {
        success: false,
        error: 'Cannot remove or demote the last workspace Owner. Your organization must retain at least one Owner.',
      };
    }
  }

  // RULE 2: Only OWNER can remove other ADMINs and OWNERs
  if (actor.role !== 'OWNER') {
    if (targetMember.role === 'OWNER' || targetMember.role === 'ADMIN') {
      return {
        success: false,
        error: 'Permission denied: Only workspace Owners can remove Admins or Owners from the organization.',
      };
    }
  }

  const updatedList = members.filter((m) => m.id !== memberId);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('sync730_members_updated'));
    } catch (e) {
      console.warn('Failed to persist removed member:', e);
    }
  }
  globalServerStore.members = updatedList;

  // Record in immutable audit log
  addAuditLogEntry({
    workspace_id: workspaceId,
    actor_id: actor.id,
    actor_name: actor.name,
    actor_email: actor.email,
    actor_role: actor.role,
    action: 'MEMBER_REMOVE',
    target_resource: memberId,
    details: `Removed team member ${targetMember.full_name || targetMember.email} (${targetMember.role}) from the workspace.`,
    metadata: { member_id: memberId, member_role: targetMember.role },
  });

  return { success: true };
}

/**
 * Revoke a pending workspace invitation
 */
export function revokeWorkspaceInvite(
  workspaceId: string,
  inviteId: string,
  actor: { id: string; name: string; email: string; role: RecruiterRole }
): { success: boolean; error?: string } {
  const members = getLocalMembers(workspaceId);
  const targetInvite = members.find((m) => m.id === inviteId && m.status === 'Invited');
  if (!targetInvite) {
    return { success: false, error: 'Pending invitation not found.' };
  }

  if (actor.role !== 'OWNER' && targetInvite.role === 'ADMIN') {
    return {
      success: false,
      error: 'Permission denied: Only workspace Owners can revoke Admin invitations.',
    };
  }

  const updatedList = members.filter((m) => m.id !== inviteId);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('sync730_members_updated'));
    } catch (e) {
      console.warn('Failed to persist revoked invite:', e);
    }
  }
  globalServerStore.members = updatedList;

  // Record in immutable audit log
  addAuditLogEntry({
    workspace_id: workspaceId,
    actor_id: actor.id,
    actor_name: actor.name,
    actor_email: actor.email,
    actor_role: actor.role,
    action: 'INVITE_REVOKED',
    target_resource: inviteId,
    details: `Revoked pending invitation for ${targetInvite.full_name || targetInvite.email} (${targetInvite.role}).`,
    metadata: { invite_id: inviteId, invitee_email: targetInvite.email, role: targetInvite.role },
  });

  return { success: true };
}

/**
 * Resend a pending workspace invitation (resets 7-day expiration)
 */
export function resendWorkspaceInvite(
  workspaceId: string,
  inviteId: string,
  actor: { id: string; name: string; email: string; role: RecruiterRole }
): { success: boolean; error?: string; expires_at?: string } {
  const members = getLocalMembers(workspaceId);
  const targetInvite = members.find((m) => m.id === inviteId && m.status === 'Invited');
  if (!targetInvite) {
    return { success: false, error: 'Pending invitation not found.' };
  }

  // Reset 7-day expiry window
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const updatedInvite: WorkspaceMember = {
    ...targetInvite,
    expires_at: newExpiresAt,
  };

  const updatedList = members.map((m) => (m.id === inviteId ? updatedInvite : m));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('sync730_members_updated'));
    } catch (e) {
      console.warn('Failed to persist resent invite:', e);
    }
  }
  globalServerStore.members = updatedList;

  // Record in immutable audit log
  addAuditLogEntry({
    workspace_id: workspaceId,
    actor_id: actor.id,
    actor_name: actor.name,
    actor_email: actor.email,
    actor_role: actor.role,
    action: 'INVITE_RESENT',
    target_resource: inviteId,
    details: `Resent workspace invitation to ${targetInvite.email} with renewed 7-day expiration.`,
    metadata: { invite_id: inviteId, invitee_email: targetInvite.email, expires_at: newExpiresAt },
  });

  return { success: true, expires_at: newExpiresAt };
}

/**
 * Immutable Audit Log Store
 */
export function getLocalAuditLogs(workspaceId?: string): AuditLogEntry[] {
  if (typeof window === 'undefined') {
    return workspaceId
      ? globalServerStore.auditLogs.filter((l) => l.workspace_id === workspaceId)
      : globalServerStore.auditLogs;
  }
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    const logs: AuditLogEntry[] = JSON.parse(raw);
    return workspaceId ? logs.filter((l) => l.workspace_id === workspaceId) : logs;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function addAuditLogEntry(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalAuditLogs();
      const updated = [newEntry, ...existing];
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_audit_logs_updated'));
    } catch (e) {
      console.warn('Failed to append audit log to localStorage:', e);
    }
  }
  globalServerStore.auditLogs.unshift(newEntry);
  return newEntry;
}

/**
 * Console Notifications Store
 */
export function getLocalNotifications(workspaceId?: string): ConsoleNotification[] {
  if (typeof window === 'undefined') {
    return workspaceId
      ? globalServerStore.notifications.filter((n) => n.workspace_id === workspaceId)
      : globalServerStore.notifications;
  }
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    const notifs: ConsoleNotification[] = JSON.parse(raw);
    return workspaceId ? notifs.filter((n) => n.workspace_id === workspaceId) : notifs;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function markNotificationRead(notificationId: string): void {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalNotifications();
      const updated = existing.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_notifications_updated'));
    } catch (e) {
      console.warn('Failed to mark notification read:', e);
    }
  }
  globalServerStore.notifications = globalServerStore.notifications.map((n) =>
    n.id === notificationId ? { ...n, is_read: true } : n
  );
}

export function markAllNotificationsRead(workspaceId?: string): void {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalNotifications();
      const updated = existing.map((n) =>
        !workspaceId || n.workspace_id === workspaceId ? { ...n, is_read: true } : n
      );
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_notifications_updated'));
    } catch (e) {
      console.warn('Failed to mark all notifications read:', e);
    }
  }
  globalServerStore.notifications = globalServerStore.notifications.map((n) =>
    !workspaceId || n.workspace_id === workspaceId ? { ...n, is_read: true } : n
  );
}

export function clearAllNotifications(workspaceId?: string): void {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalNotifications();
      const updated = workspaceId ? existing.filter((n) => n.workspace_id !== workspaceId) : [];
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_notifications_updated'));
    } catch (e) {
      console.warn('Failed to clear notifications:', e);
    }
  }
  globalServerStore.notifications = workspaceId
    ? globalServerStore.notifications.filter((n) => n.workspace_id !== workspaceId)
    : [];
}

/**
 * Notification Settings Store
 */
export function getLocalNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return globalServerStore.notificationSettings;
  try {
    const raw = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS));
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveLocalNotificationSettings(settings: NotificationSettings): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event('sync730_notification_settings_updated'));
    } catch (e) {
      console.warn('Failed to save notification settings:', e);
    }
  }
  globalServerStore.notificationSettings = { ...settings };
}

export function getLocalCandidateContactLogs(workspaceId?: string): CandidateContactLog[] {
  if (typeof window === 'undefined') {
    return workspaceId
      ? globalServerStore.contactLogs.filter((l) => l.workspace_id === workspaceId)
      : globalServerStore.contactLogs;
  }
  try {
    const raw = localStorage.getItem(CONTACT_LOGS_KEY);
    const logs: CandidateContactLog[] = raw ? JSON.parse(raw) : [];
    return workspaceId ? logs.filter((l) => l.workspace_id === workspaceId) : logs;
  } catch {
    return [];
  }
}

export function saveLocalCandidateContactLog(log: CandidateContactLog) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalCandidateContactLogs();
      const updated = [log, ...existing];
      localStorage.setItem(CONTACT_LOGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_contact_logs_updated'));
    } catch (e) {
      console.warn('Failed to save contact log to localStorage:', e);
    }
  }
  globalServerStore.contactLogs.unshift(log);
}

/**
 * Mask a candidate assessment according to strict B2B privacy rules
 */
export function formatMaskedCandidate(
  cand: VideoAssessment & {
    real_name?: string;
    real_email?: string;
    phone?: string;
    whatsapp?: string;
    cv_url?: string;
  },
  isUnlocked: boolean
): VideoAssessment {
  if (isUnlocked) {
    return {
      ...cand,
      candidate_name: cand.real_name || cand.candidate_name || 'Verified Professional',
      candidate_email: cand.real_email || cand.candidate_email || 'candidate@sync730.com',
      phone: cand.phone || '+234 812 000 0000',
      whatsapp: cand.whatsapp || cand.phone || '+2348120000000',
      cv_url: cand.cv_url || 'https://sync730.blob.core.windows.net/resumes/verified_cv.pdf',
      is_unlocked: true,
    };
  }

  // Generate deterministic masked ID
  const shortId = (cand.candidate_id || cand.id || 'CAND').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return {
    ...cand,
    candidate_name: `Sync730 Verified Candidate #${shortId}`,
    candidate_email: 'masked@sync730.com',
    phone: undefined,
    whatsapp: undefined,
    cv_url: undefined,
    is_unlocked: false,
  };
}
