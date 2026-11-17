import {
  AdminMetrics,
  AdminActivityItem,
  PlatformTransaction,
  AdminAuditLog,
  AdminUserProfile,
  AdminCorporateWorkspace,
  AdminRemoteJob,
} from './types';
import { getLocalWorkspace, getLocalAssessments, saveLocalAssessment, getLocalUnlocks } from '@/lib/recruiter/store';

// Storage keys
const AUDIT_LOGS_KEY = 'sync730_admin_audit_logs';
const TRANSACTIONS_KEY = 'sync730_platform_transactions';
const USERS_KEY = 'sync730_admin_users';
const ADMIN_JOBS_KEY = 'sync730_admin_remote_jobs';

// Seed Admin Users
export const SEED_ADMIN_USERS: AdminUserProfile[] = [
  {
    id: 'usr-admin-001',
    email: 'admin@sync730.com',
    full_name: 'David O. Alabi',
    role: 'PLATFORM_ADMIN',
    workspace_name: 'Sync730 Internal',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    avatar_url: '',
    phone: '+234 801 000 0001',
    is_demo: false,
  },
  {
    id: 'usr-admin-002',
    email: 'kemi.adebayo@sync730.com',
    full_name: 'Kemi Adebayo',
    role: 'PLATFORM_ADMIN',
    workspace_name: 'Sync730 Internal',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 4).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
    avatar_url: '',
    phone: '+234 802 111 2233',
    is_demo: false,
  },
  {
    id: 'usr-recruiter-001',
    email: 'elena.rostova@fintechglobal.co',
    full_name: 'Elena Rostova',
    role: 'recruiter',
    workspace_name: 'Fintech Global Ventures',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    avatar_url: '',
    phone: '+234 812 345 6789',
    is_demo: false,
  },
  {
    id: 'usr-recruiter-002',
    email: 'hiring@acmeglobal.com',
    full_name: 'Alex Morgan',
    role: 'recruiter',
    workspace_name: 'Acme Global Ventures (Demo)',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    avatar_url: '',
    phone: '+234 809 111 2233',
    is_demo: true,
  },
  {
    id: 'usr-recruiter-003',
    email: 'talent@cloudscale.africa',
    full_name: 'Tunde Bakare',
    role: 'recruiter',
    workspace_name: 'CloudScale Africa Ltd',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    avatar_url: '',
    phone: '+234 803 555 4433',
    is_demo: false,
  },
  {
    id: 'usr-recruiter-004',
    email: 'recruiting@payrail.ng',
    full_name: 'Zainab Bello',
    role: 'recruiter',
    workspace_name: 'PayRail Technologies',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 6).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 18).toISOString(),
    avatar_url: '',
    phone: '+234 807 888 9900',
    is_demo: false,
  },
  {
    id: 'usr-recruiter-005',
    email: 'hr@sterlingcap.ng',
    full_name: 'Folake Solanke',
    role: 'recruiter',
    workspace_name: 'Sterling Capital Microfinance',
    status: 'SUSPENDED',
    last_active: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
    avatar_url: '',
    phone: '+234 805 444 3322',
    is_demo: false,
  },
  {
    id: 'usr-cand-001',
    email: 'jane.doe@sync730.com',
    full_name: 'Jane Doe',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    avatar_url: '',
    phone: '+234 812 345 6789',
    is_demo: false,
  },
  {
    id: 'usr-cand-002',
    email: 'chinedu.eze@sync730.com',
    full_name: 'Chinedu Eze',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    avatar_url: '',
    phone: '+234 803 987 6543',
    is_demo: false,
  },
  {
    id: 'usr-cand-003',
    email: 'amara.okonkwo@sync730.com',
    full_name: 'Amara Okonkwo',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 8).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    avatar_url: '',
    phone: '+234 901 234 5678',
    is_demo: false,
  },
  {
    id: 'usr-cand-004',
    email: 'ibrahim.musa@gmail.com',
    full_name: 'Ibrahim Musa',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 14).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    avatar_url: '',
    phone: '+234 802 345 6789',
    is_demo: false,
  },
  {
    id: 'usr-cand-005',
    email: 'ngozi.nwosu@sync730.com',
    full_name: 'Ngozi Nwosu',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    avatar_url: '',
    phone: '+234 813 456 7890',
    is_demo: false,
  },
  {
    id: 'usr-cand-006',
    email: 'emeka.okafor@gmail.com',
    full_name: 'Emeka Okafor',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 18).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    avatar_url: '',
    phone: '+234 805 678 1234',
    is_demo: false,
  },
  {
    id: 'usr-cand-007',
    email: 'fatima.abubakar@sync730.com',
    full_name: 'Fatima Abubakar',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 22).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    avatar_url: '',
    phone: '+234 809 234 5678',
    is_demo: false,
  },
  {
    id: 'usr-cand-008',
    email: 'oluwaseun.ajayi@yahoo.com',
    full_name: 'Oluwaseun Ajayi',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    avatar_url: '',
    phone: '+234 701 234 5678',
    is_demo: false,
  },
  {
    id: 'usr-cand-009',
    email: 'temitope.adeleke@sync730.com',
    full_name: 'Temitope Adeleke',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 9).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    avatar_url: '',
    phone: '+234 816 789 0123',
    is_demo: false,
  },
  {
    id: 'usr-cand-010',
    email: 'somto.chukwu@gmail.com',
    full_name: 'Somtochukwu Eze',
    role: 'candidate',
    workspace_name: '—',
    status: 'SUSPENDED',
    last_active: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 35).toISOString(),
    avatar_url: '',
    phone: '+234 802 888 7766',
    is_demo: false,
  },
  {
    id: 'usr-cand-011',
    email: 'aisha.garba@sync730.com',
    full_name: 'Aisha Garba',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 11).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    avatar_url: '',
    phone: '+234 803 111 4455',
    is_demo: false,
  },
  {
    id: 'usr-cand-012',
    email: 'chika.anene@yahoo.com',
    full_name: 'Chika Anene',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 7).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    avatar_url: '',
    phone: '+234 814 555 6677',
    is_demo: false,
  },
  {
    id: 'usr-cand-013',
    email: 'babajide.sanwo@gmail.com',
    full_name: 'Babajide Sanwo',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 16).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    avatar_url: '',
    phone: '+234 808 999 1122',
    is_demo: false,
  },
  {
    id: 'usr-cand-014',
    email: 'blessing.ugwu@sync730.com',
    full_name: 'Blessing Ugwu',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 4).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    avatar_url: '',
    phone: '+234 812 666 7788',
    is_demo: false,
  },
  {
    id: 'usr-cand-015',
    email: 'damilola.ade@gmail.com',
    full_name: 'Damilola Ade',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    avatar_url: '',
    phone: '+234 905 123 4567',
    is_demo: false,
  },
  {
    id: 'usr-cand-016',
    email: 'yakubu.gowon@sync730.com',
    full_name: 'Yakubu Gowon',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 19).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    avatar_url: '',
    phone: '+234 807 111 2233',
    is_demo: false,
  },
  {
    id: 'usr-cand-017',
    email: 'titilayo.bamidele@gmail.com',
    full_name: 'Titilayo Bamidele',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 10).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    avatar_url: '',
    phone: '+234 809 333 4455',
    is_demo: false,
  },
  {
    id: 'usr-cand-018',
    email: 'oscar.nnamdi@sync730.com',
    full_name: 'Oscar Nnamdi',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    avatar_url: '',
    phone: '+234 811 222 3344',
    is_demo: false,
  },
  {
    id: 'usr-cand-019',
    email: 'khalid.usman@gmail.com',
    full_name: 'Khalid Usman',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 13).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    avatar_url: '',
    phone: '+234 803 777 8899',
    is_demo: false,
  },
  {
    id: 'usr-cand-020',
    email: 'funmilayo.raji@sync730.com',
    full_name: 'Funmilayo Raji',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 6).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    avatar_url: '',
    phone: '+234 815 888 9900',
    is_demo: false,
  },
  {
    id: 'usr-cand-021',
    email: 'gerald.okoli@yahoo.com',
    full_name: 'Gerald Okoli',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 21).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    avatar_url: '',
    phone: '+234 802 444 5566',
    is_demo: false,
  },
  {
    id: 'usr-cand-022',
    email: 'halima.sani@gmail.com',
    full_name: 'Halima Sani',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    avatar_url: '',
    phone: '+234 808 123 9876',
    is_demo: false,
  },
  {
    id: 'usr-demo-001',
    email: 'test-user@example.com',
    full_name: 'Test Candidate (Demo)',
    role: 'candidate',
    workspace_name: '—',
    status: 'ACTIVE',
    last_active: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    avatar_url: '',
    phone: '+234 800 000 0000',
    is_demo: true,
  },
];

// Seed Platform Transactions
export const SEED_PLATFORM_TRANSACTIONS: PlatformTransaction[] = [
  {
    id: 'tx-001',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    workspace_id: 'ws-sync730-demo',
    company_name: 'Acme Global Ventures (Demo)',
    payer_name: 'Alex Morgan',
    payer_email: 'hiring@acmeglobal.com',
    amount: 100000,
    amount_ngn: 100000,
    currency: 'NGN',
    transaction_type: 'TOKEN_PURCHASE',
    payment_reference: 'pstk_ref_9823194',
    paystack_reference: 'pstk_ref_9823194',
    status: 'PAID',
    mode: 'TEST',
    notes: 'Purchased 5 candidate unlock tokens via Paystack (Demo workspace)',
    is_demo: true,
  },
  {
    id: 'tx-002',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    workspace_id: 'ws-fintech-01',
    company_name: 'Fintech Global Ventures',
    payer_name: 'Elena Rostova',
    payer_email: 'elena.rostova@fintechglobal.co',
    amount: 200000,
    amount_ngn: 200000,
    currency: 'NGN',
    transaction_type: 'TOKEN_PURCHASE',
    payment_reference: 'pstk_ref_7741289',
    paystack_reference: 'pstk_ref_7741289',
    status: 'PAID',
    mode: 'LIVE',
    notes: 'Purchased 10 candidate unlock tokens via Paystack',
    is_demo: false,
  },
  {
    id: 'tx-003',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    workspace_id: 'ws-cloudscale-03',
    company_name: 'CloudScale Africa Ltd',
    payer_name: 'Tunde Bakare',
    payer_email: 'talent@cloudscale.africa',
    amount: 300000,
    amount_ngn: 300000,
    currency: 'NGN',
    transaction_type: 'TOKEN_PURCHASE',
    payment_reference: 'pstk_ref_6619284',
    paystack_reference: 'pstk_ref_6619284',
    status: 'PAID',
    mode: 'LIVE',
    notes: 'Purchased 15 candidate unlock tokens for Q4 engineering hiring',
    is_demo: false,
  },
  {
    id: 'tx-004',
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    payer_name: 'Jane Doe',
    payer_email: 'jane.doe@sync730.com',
    amount: 2500,
    amount_ngn: 2500,
    currency: 'NGN',
    transaction_type: 'INTERVIEW_PREP',
    tool_name: 'Interview Prep',
    payment_reference: 'pstk_prep_881920',
    paystack_reference: 'pstk_prep_881920',
    status: 'PAID',
    mode: 'LIVE',
    notes: 'Interview Prep AI video coach session tailored to Senior Frontend Lead role',
    is_demo: false,
  },
  {
    id: 'tx-005',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    payer_name: 'Chinedu Eze',
    payer_email: 'chinedu.eze@sync730.com',
    amount: 3500,
    amount_ngn: 3500,
    currency: 'NGN',
    transaction_type: 'RESUME_GENERATOR',
    tool_name: 'Résumé Generator',
    payment_reference: 'pstk_res_442109',
    paystack_reference: 'pstk_res_442109',
    status: 'PAID',
    mode: 'LIVE',
    notes: 'Executive Resume Generation for Lead Product Designer role',
    is_demo: false,
  },
  {
    id: 'tx-006',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    payer_name: 'Amara Okonkwo',
    payer_email: 'amara.okonkwo@sync730.com',
    amount: 4500,
    amount_ngn: 4500,
    currency: 'NGN',
    transaction_type: 'LINKEDIN_OPTIMIZATION',
    tool_name: 'LinkedIn Profile Optimization',
    payment_reference: 'pstk_lkn_332194',
    paystack_reference: 'pstk_lkn_332194',
    status: 'PAID',
    mode: 'LIVE',
    notes: 'Complete LinkedIn profile headline, about section, and experience optimization',
    is_demo: false,
  },
  {
    id: 'tx-007',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    workspace_id: 'ws-fintech-01',
    company_name: 'Fintech Global Ventures',
    payer_name: 'Elena Rostova',
    payer_email: 'elena.rostova@fintechglobal.co',
    amount: 50000,
    amount_ngn: 50000,
    currency: 'NGN',
    transaction_type: 'REFUND',
    payment_reference: 'pstk_ref_5521901',
    paystack_reference: 'pstk_ref_5521901',
    status: 'REFUNDED',
    mode: 'LIVE',
    notes: 'Reversal of 2 unused trial tokens requested per SLA guarantee',
    refunded_amount: 50000,
    refund_reason: 'Client requested refund on 2 trial tokens within 7-day guarantee window',
    refunded_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    is_demo: false,
  },
  {
    id: 'tx-008',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    workspace_id: 'cand-prep-001',
    company_name: 'Jane Doe (B2C Candidate)',
    payer_name: 'Jane Doe',
    payer_email: 'test@example.com',
    amount: 2500,
    amount_ngn: 2500,
    currency: 'NGN',
    transaction_type: 'MOCK_PREP_FEE',
    payment_reference: 'pstk_mock_prep_5512',
    paystack_reference: 'pstk_mock_prep_5512',
    status: 'PAID',
    mode: 'TEST',
    notes: 'Mock prep test sandbox unlock fee (Mock transaction)',
    is_demo: true,
  },
];

// Seed Admin Audit Logs (Pre-populated compliant audit history)
export const SEED_ADMIN_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-010',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'ROLE_VERIFIED',
    target_id: 'job-admin-lagos-003',
    notes: 'Verified role is live on PayRail Technologies official careers channel with hiring lead confirmed',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'verified role',
      target_label: 'Senior Product Designer (Design Systems)',
      target_type: 'ROLE',
      link: '/command/roles',
    },
  },
  {
    id: 'log-009',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'TOKEN_ADJUSTMENT',
    target_id: 'ws-fintech-01',
    notes: 'Allocated 5 additional vetting tokens for Q4 engineering expansion per contract addendum',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'adjusted tokens for',
      target_label: 'Fintech Global Ventures',
      target_type: 'WORKSPACE',
      link: '/command/money',
    },
  },
  {
    id: 'log-008',
    created_at: new Date(Date.now() - 3600000 * 11).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'ROLE_VERIFIED',
    target_id: 'job-admin-abuja-004',
    notes: 'Confirmed live employment posting for Abuja office expansion with Sterling Capital HR',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'verified role',
      target_label: 'Operations & Expansion Lead',
      target_type: 'ROLE',
      link: '/command/roles',
    },
  },
  {
    id: 'log-007',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'ROLE_DEMOTED',
    target_id: 'usr-recruiter-002',
    notes: 'Revoked staging recruiter privileges following internal quarterly security audit',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'updated role for',
      target_label: 'Alex Morgan',
      target_type: 'USER',
      link: '/command/users',
    },
  },
  {
    id: 'log-006',
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'VIDEO_ASSESSMENT_VERIFIED',
    target_id: 'va-cand-001',
    notes: 'Completed human review of candidate video interview. Verified STAR response structure',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'approved video for',
      target_label: 'Jane Doe',
      target_type: 'VIDEO',
      link: '/command/video-review',
    },
  },
  {
    id: 'log-005',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'ROLE_PINNED',
    target_id: 'job-admin-feat-001',
    notes: 'Pinned role to featured showcase matching verified worldwide remote criteria',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'pinned featured role',
      target_label: 'Lead Systems Architect & Tech Director',
      target_type: 'ROLE',
      link: '/command/roles',
    },
  },
  {
    id: 'log-004',
    created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'TOKEN_ADJUSTMENT',
    target_id: 'ws-cloudscale-03',
    notes: 'Applied standard enterprise token top-up upon successful Paystack corporate invoice settlement',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'adjusted tokens for',
      target_label: 'CloudScale Africa Ltd',
      target_type: 'WORKSPACE',
      link: '/command/money',
    },
  },
  {
    id: 'log-003',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'VIDEO_ASSESSMENT_VERIFIED',
    target_id: 'va-cand-002',
    notes: 'Inspected low-lighting proctoring flag and verified authentic candidate environment',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'verified video for',
      target_label: 'Chinedu Eze',
      target_type: 'VIDEO',
      link: '/command/video-review',
    },
  },
  {
    id: 'log-002',
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'ROLE_TAKEDOWN',
    target_id: 'job-remotive-991',
    notes: 'Removed expired listing after employer filled position directly on company website',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'took down role',
      target_label: 'Senior Backend Engineer',
      target_type: 'ROLE',
      link: '/command/roles',
    },
  },
  {
    id: 'log-001',
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'SYSTEM_BOOTSTRAP',
    target_id: 'system',
    notes: 'Sync730 Platform Admin Command Center initialized with RBAC controls and audit logging',
    metadata: {
      actor_name: 'David O. Alabi',
      action_verb: 'initialized system',
      target_label: 'Platform Command Center',
      target_type: 'SYSTEM',
      link: '/command/audit',
    },
  },
];

// Sample Nigerian Hybrid & Onsite Roles for Dev / Demo Seeding
export const SAMPLE_NIGERIA_ROLES: AdminRemoteJob[] = [
  {
    id: 'job-admin-lagos-003',
    external_id: 'ext-admin-lagos-003',
    title: 'Senior Product Designer (Design Systems)',
    company: 'PayRail Technologies',
    company_name: 'PayRail Technologies',
    career_url: 'https://careers.payrail.tech/roles/senior-product-designer',
    url: 'https://careers.payrail.tech/roles/senior-product-designer',
    apply_url: 'https://careers.payrail.tech/roles/senior-product-designer',
    location_tier: 'Africa Only',
    candidate_required_location: 'Lagos, Nigeria',
    work_mode: 'HYBRID',
    city_location: 'Lekki, Lagos, Nigeria',
    salary: '₦850k - ₦1.2m/mo',
    salary_min: 850000,
    salary_max: 1200000,
    salary_currency: 'NGN',
    salary_period: 'month',
    description: 'Lead design systems, interactive prototyping, and user journey optimization for our high-growth Nigerian payments platform. Hybrid work setup: 2 days at our Lekki Phase 1 design studio.',
    category: 'Product & Design',
    job_type: 'Full-time',
    tags: ['Figma', 'Design Systems', 'Mobile UX', 'User Research'],
    skills: ['Figma', 'Design Systems', 'Mobile UX', 'User Research'],
    source: 'company_direct',
    source_name: 'Platform Curated',
    source_type: 'ADMIN_CURATED',
    open_to_nigeria: true,
    is_active: true,
    is_featured: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-admin-abuja-004',
    external_id: 'ext-admin-abuja-004',
    title: 'Operations & Expansion Lead',
    company: 'Sterling Capital Partners',
    company_name: 'Sterling Capital Partners',
    career_url: 'https://sterlingcap.ng/careers/operations-lead',
    url: 'https://sterlingcap.ng/careers/operations-lead',
    apply_url: 'https://sterlingcap.ng/careers/operations-lead',
    location_tier: 'Africa Only',
    candidate_required_location: 'Abuja, Nigeria',
    work_mode: 'ONSITE',
    city_location: 'Maitama, Abuja, Nigeria',
    salary: '₦700k - ₦950k/mo',
    salary_min: 700000,
    salary_max: 950000,
    salary_currency: 'NGN',
    salary_period: 'month',
    description: 'Drive strategic partnerships, compliance operations, and institutional merchant expansion across Northern Nigeria from our Maitama headquarters in Abuja.',
    category: 'Operations & Finance',
    job_type: 'Full-time',
    tags: ['Operations', 'Fintech', 'Compliance', 'Vendor Management'],
    skills: ['Operations', 'Fintech', 'Compliance', 'Vendor Management'],
    source: 'company_direct',
    source_name: 'Platform Curated',
    source_type: 'ADMIN_CURATED',
    open_to_nigeria: true,
    is_active: true,
    is_featured: false,
    published_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

// Seed Admin-Curated & Remote Jobs
export const SEED_ADMIN_REMOTE_JOBS: AdminRemoteJob[] = [
  {
    id: 'job-admin-feat-001',
    external_id: 'ext-admin-feat-001',
    title: 'Lead Systems Architect & Tech Director',
    company: 'Sync730 Partner Labs',
    career_url: 'https://careers.sync730.com/roles/lead-systems-architect',
    url: 'https://careers.sync730.com/roles/lead-systems-architect',
    location_tier: 'Worldwide',
    candidate_required_location: 'Worldwide Remote',
    work_mode: 'REMOTE',
    city_location: 'Remote (Worldwide)',
    salary: '$140,000 - $180,000 / yr',
    description: 'Spearhead our next-generation distributed talent intelligence network. Direct cloud architecture across global microservices and pan-African engineering nodes.',
    category: 'Software & Engineering',
    job_type: 'Full-time',
    tags: ['Go', 'Kubernetes', 'TypeScript', 'Distributed Systems'],
    source: 'company_direct',
    source_type: 'ADMIN_CURATED',
    is_active: true,
    is_featured: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-admin-cur-002',
    external_id: 'ext-admin-cur-002',
    title: 'Senior Full Stack Product Engineer',
    company: 'Fintech Velocity Africa',
    career_url: 'https://fintechvelocity.co/careers/senior-fullstack',
    url: 'https://fintechvelocity.co/careers/senior-fullstack',
    location_tier: 'Africa Only',
    candidate_required_location: 'Nigeria / Kenya / Remote',
    work_mode: 'REMOTE',
    city_location: 'Remote (Africa)',
    salary: '₦1,800,000 - ₦2,600,000 / mo',
    description: 'Build high-throughput payment rails and core banking APIs. Partner with risk engineering to deploy resilient transaction ledger models.',
    category: 'Software & Engineering',
    job_type: 'Full-time',
    tags: ['Next.js', 'PostgreSQL', 'Node.js', 'Paystack'],
    source: 'company_direct',
    source_type: 'ADMIN_CURATED',
    is_active: true,
    is_featured: false,
    published_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  ...SAMPLE_NIGERIA_ROLES,
];

let memoryJobs = [...SEED_ADMIN_REMOTE_JOBS];
let memoryUsers = [...SEED_ADMIN_USERS];
let memoryTransactions = [...SEED_PLATFORM_TRANSACTIONS];
let memoryAuditLogs = [...SEED_ADMIN_AUDIT_LOGS];

/* ==============================================================================
 * Store Accessors (Universal Browser-Safe)
 * ============================================================================== */

export function getAdminAuditLogs(): AdminAuditLog[] {
  if (typeof window === 'undefined') return memoryAuditLogs;
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(SEED_ADMIN_AUDIT_LOGS));
      return SEED_ADMIN_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ADMIN_AUDIT_LOGS;
  }
}

export function saveAdminAuditLog(log: AdminAuditLog) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getAdminAuditLogs();
      const updated = [log, ...existing];
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_audit_logs_updated'));
    } catch (e) {
      console.warn('Failed to save audit log:', e);
    }
  }
  memoryAuditLogs.unshift(log);
}

export function getPlatformTransactions(): PlatformTransaction[] {
  if (typeof window === 'undefined') return memoryTransactions;
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_PLATFORM_TRANSACTIONS));
      return SEED_PLATFORM_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PLATFORM_TRANSACTIONS;
  }
}

export function savePlatformTransaction(tx: PlatformTransaction) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getPlatformTransactions();
      const updated = [tx, ...existing];
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_transactions_updated'));
    } catch (e) {
      console.warn('Failed to save transaction:', e);
    }
  }
  memoryTransactions.unshift(tx);
}

export function getAdminUsers(): AdminUserProfile[] {
  if (typeof window === 'undefined') return memoryUsers;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_ADMIN_USERS));
      return SEED_ADMIN_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ADMIN_USERS;
  }
}

export function saveAdminUsers(users: AdminUserProfile[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      window.dispatchEvent(new Event('sync730_users_updated'));
    } catch (e) {
      console.warn('Failed to save users:', e);
    }
  }
  memoryUsers = users;
}

export function getAdminRemoteJobs(): AdminRemoteJob[] {
  if (typeof window === 'undefined') return memoryJobs;
  try {
    const raw = localStorage.getItem(ADMIN_JOBS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(SEED_ADMIN_REMOTE_JOBS));
      return SEED_ADMIN_REMOTE_JOBS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ADMIN_REMOTE_JOBS;
  }
}

export function saveAdminRemoteJob(job: AdminRemoteJob): AdminRemoteJob {
  if (typeof window !== 'undefined') {
    try {
      const existing = getAdminRemoteJobs();
      const updated = [job, ...existing.filter((j) => j.id !== job.id)];
      localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_admin_jobs_updated'));
      window.dispatchEvent(new Event('sync730_remote_jobs_updated'));
    } catch (e) {
      console.warn('Failed to save admin job:', e);
    }
  }
  
  const idx = memoryJobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    memoryJobs[idx] = job;
  } else {
    memoryJobs.unshift(job);
  }

  saveAdminAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_POSTED',
    target_id: job.id,
    notes: `Published verified admin role: "${job.title}" at ${job.company} (${job.location_tier})`,
  });

  return job;
}

export function toggleAdminJobActive(jobId: string, currentStatus?: boolean): { is_active: boolean } {
  let newStatus = false;
  if (typeof window !== 'undefined') {
    try {
      const existing = getAdminRemoteJobs();
      const target = existing.find((j) => j.id === jobId || j.external_id === jobId);
      if (target) {
        target.is_active = currentStatus !== undefined ? !currentStatus : !target.is_active;
        newStatus = target.is_active;
      } else {
        newStatus = !currentStatus;
      }
      localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(existing));
      window.dispatchEvent(new Event('sync730_admin_jobs_updated'));
      window.dispatchEvent(new Event('sync730_remote_jobs_updated'));
    } catch (e) {
      console.warn('Failed to toggle active status:', e);
    }
  }

  const sTarget = memoryJobs.find((j) => j.id === jobId || j.external_id === jobId);
  if (sTarget) {
    sTarget.is_active = currentStatus !== undefined ? !currentStatus : !sTarget.is_active;
    newStatus = sTarget.is_active;
  }

  saveAdminAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_STATUS_CHANGE',
    target_id: jobId,
    notes: `Changed status of job ${jobId} to ${newStatus ? 'ACTIVE (Republished)' : 'TAKEN_DOWN'}`,
  });

  return { is_active: newStatus };
}

export function toggleAdminJobFeatured(jobId: string, currentStatus?: boolean): { is_featured: boolean } {
  let newFeatured = false;
  if (typeof window !== 'undefined') {
    try {
      const existing = getAdminRemoteJobs();
      const target = existing.find((j) => j.id === jobId || j.external_id === jobId);
      if (target) {
        target.is_featured = currentStatus !== undefined ? !currentStatus : !target.is_featured;
        newFeatured = target.is_featured;
      } else {
        newFeatured = !currentStatus;
      }
      localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(existing));
      window.dispatchEvent(new Event('sync730_admin_jobs_updated'));
      window.dispatchEvent(new Event('sync730_remote_jobs_updated'));
    } catch (e) {
      console.warn('Failed to toggle featured status:', e);
    }
  }

  const sTarget = memoryJobs.find((j) => j.id === jobId || j.external_id === jobId);
  if (sTarget) {
    sTarget.is_featured = currentStatus !== undefined ? !currentStatus : !sTarget.is_featured;
    newFeatured = sTarget.is_featured;
  }

  saveAdminAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_STATUS_CHANGE',
    target_id: jobId,
    notes: `Toggled featured status of job ${jobId} to ${newFeatured ? 'FEATURED (Pinned)' : 'UNFEATURED'}`,
  });

  return { is_featured: newFeatured };
}
