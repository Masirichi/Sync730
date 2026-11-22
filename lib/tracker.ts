import { CandidateTrackerItem, RemoteJob, TrackerStatus, TrackerJobType, TrackerRatePeriod } from './supabase/types';
import { createBrowserClient } from './supabase/client';

const LOCAL_STORAGE_KEY = 'sync730_candidate_tracker';

export const INITIAL_TRACKER_ITEMS: CandidateTrackerItem[] = [
  {
    id: 'track-001',
    candidate_id: 'local-candidate-01',
    job_id: 'moniepoint-core-eng-01',
    company: 'Moniepoint',
    title: 'Senior Backend Engineer (High-Throughput Core Banking)',
    location: 'Africa Only',
    salary: '$60,000 - $100,000 USD',
    rate: '$7,000/mo',
    rate_period: 'monthly',
    job_type: 'Full-time',
    status: 'SAVED',
    url: 'https://moniepoint.com/careers',
    notes: 'Bookmarked from Verified Remote Feed. One profile, every application.',
    applied_date: null,
    interview_date: null,
    contact: 'Moniepoint Talent Team · careers@moniepoint.com',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'track-002',
    candidate_id: 'local-candidate-01',
    job_id: 'paystack-staff-frontend-02',
    company: 'Paystack',
    title: 'Staff Frontend Engineer (Payment Checkout & SDKs)',
    location: 'Worldwide',
    salary: '$95,000 - $130,000 USD',
    rate: '$10,000/mo',
    rate_period: 'monthly',
    job_type: 'Full-time',
    status: 'APPLIED',
    url: 'https://paystack.com/careers',
    notes: 'Applied on Paystack careers portal. Confirmed application recorded.',
    applied_date: new Date(Date.now() - 3600000 * 48).toISOString(),
    interview_date: null,
    contact: 'Paystack Talent Acquisitions · careers@paystack.com',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'track-003',
    candidate_id: 'local-candidate-01',
    job_id: null,
    company: 'Stripe International',
    title: 'Backend Systems Engineer',
    location: 'EMEA',
    salary: '€110,000 EUR',
    rate: '€9,200/mo',
    rate_period: 'monthly',
    job_type: 'Full-time',
    status: 'INTERVIEWING',
    url: 'https://stripe.com/jobs',
    notes: 'Technical screen passed with hiring manager. Round 2 system design scheduled.',
    applied_date: new Date(Date.now() - 3600000 * 120).toISOString(),
    interview_date: new Date(Date.now() + 3600000 * 48).toISOString(),
    contact: 'Elena Rostova (Engineering Recruiter) · elena@stripe.com',
    created_at: new Date(Date.now() - 3600000 * 140).toISOString(),
  },
  {
    id: 'track-004',
    candidate_id: 'local-candidate-01',
    job_id: null,
    company: 'Paystack',
    title: 'Senior Developer Relations Advocate',
    location: 'Lagos, Nigeria (Hybrid)',
    salary: '₦1,200,000/mo',
    rate: '₦1,200,000/mo',
    rate_period: 'monthly',
    job_type: 'Full-time',
    status: 'OFFER',
    url: 'https://paystack.com/careers',
    notes: 'Offer package received via email. Reviewing equity terms and start date.',
    applied_date: new Date(Date.now() - 3600000 * 240).toISOString(),
    interview_date: new Date(Date.now() - 3600000 * 72).toISOString(),
    contact: 'Tunde Adebayo (VP People) · tunde@paystack.com',
    created_at: new Date(Date.now() - 3600000 * 260).toISOString(),
  },
];

// Helper to get local stored tracker items
export function getLocalTrackerItems(): CandidateTrackerItem[] {
  if (typeof window === 'undefined') return INITIAL_TRACKER_ITEMS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_TRACKER_ITEMS));
      return INITIAL_TRACKER_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_TRACKER_ITEMS;
    }
    const cleaned = parsed
      .filter((item): item is CandidateTrackerItem => Boolean(item && typeof item === 'object' && item.id && !item.company?.toLowerCase().includes('credit wellness') && !item.company?.toLowerCase().includes('finsync')))
      .map((item) => ({
        ...item,
        title: item.title || 'Untitled Role',
        company: item.company || 'Company',
        status: (item.status === 'OFFERED' ? 'OFFER' : item.status) || 'SAVED',
      }));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned.length > 0 ? cleaned : INITIAL_TRACKER_ITEMS;
  } catch {
    return INITIAL_TRACKER_ITEMS;
  }
}

// Helper to save local stored tracker items
export function saveLocalTrackerItems(items: CandidateTrackerItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('sync730_tracker_updated'));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Fetch tracker items (try Supabase first, fallback to localStorage)
export async function fetchCandidateTracker(candidateId?: string): Promise<CandidateTrackerItem[]> {
  try {
    const supabase = createBrowserClient();
    const { data: userAuth } = await supabase.auth.getUser();
    const activeUserId = candidateId || userAuth?.user?.id;

    if (activeUserId) {
      const { data, error } = await supabase
        .from('candidate_tracker')
        .select('*')
        .eq('candidate_id', activeUserId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as CandidateTrackerItem[];
      }
    }
  } catch (err) {
    console.warn('Supabase tracker fetch fallback:', err);
  }

  return getLocalTrackerItems();
}

function deriveRateAndPeriod(salaryStr?: string | null): { rate: string | null; rate_period: TrackerRatePeriod | null } {
  if (!salaryStr) return { rate: null, rate_period: null };
  const sLower = salaryStr.toLowerCase();
  if (sLower.includes('/ hr') || sLower.includes('/hr') || sLower.includes('per hour') || sLower.includes('/hour')) {
    return { rate: salaryStr, rate_period: 'hourly' };
  }
  if (sLower.includes('/ mo') || sLower.includes('/mo') || sLower.includes('per month') || sLower.includes('/month')) {
    return { rate: salaryStr, rate_period: 'monthly' };
  }
  return { rate: salaryStr, rate_period: 'monthly' };
}

// Save a job from crawler to tracker
export async function saveJobToTracker(
  job: Partial<RemoteJob>,
  candidateId?: string
): Promise<{ success: boolean; item: CandidateTrackerItem; isNew: boolean }> {
  const currentItems = getLocalTrackerItems();
  const existing = currentItems.find((i) => i.job_id === job.id || i.job_id === job.external_id);

  if (existing) {
    return { success: true, item: existing, isNew: false };
  }

  const { rate, rate_period } = deriveRateAndPeriod(job.salary);
  const job_type = (job.job_type || (job as any).employment_type || 'Full-time') as TrackerJobType;
  const companyName = job.company_name || job.company || 'Direct Employer';

  const newItem: CandidateTrackerItem = {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    candidate_id: candidateId || 'local-candidate-01',
    job_id: job.id || job.external_id || '',
    company: companyName,
    title: job.title || 'Role',
    location: job.candidate_required_location || job.location_tier || 'Remote',
    salary: job.salary || null,
    rate,
    rate_period,
    job_type,
    status: 'SAVED',
    url: job.apply_url || job.url || null,
    contact: `${companyName} Hiring Team`,
    notes: `Saved from Verified Remote Feed (${job.location_tier || 'Remote'}). Source: ${job.source_name || job.source || 'Direct'}.`,
    applied_date: null,
    interview_date: null,
    created_at: new Date().toISOString(),
  };

  const updated = [newItem, ...currentItems];
  saveLocalTrackerItems(updated);

  // Sync with Supabase if authenticated
  try {
    const supabase = createBrowserClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (userAuth?.user?.id) {
      newItem.candidate_id = userAuth.user.id;
      await supabase.from('candidate_tracker').upsert(newItem);
    }
  } catch (err) {
    console.warn('Supabase tracker save warning:', err);
  }

  return { success: true, item: newItem, isNew: true };
}

// Remove job by job_id or item id
export function removeJobFromTracker(jobId: string): boolean {
  const current = getLocalTrackerItems();
  const updated = current.filter((i) => i.job_id !== jobId && i.id !== jobId);
  saveLocalTrackerItems(updated);
  return true;
}

// Check if job is saved
export function isJobSavedInTracker(jobId: string): boolean {
  const current = getLocalTrackerItems();
  return current.some((i) => i.job_id === jobId || i.id === jobId);
}

// Check if job is marked as applied
export function isJobAppliedInTracker(jobId: string): boolean {
  const current = getLocalTrackerItems();
  return current.some(
    (i) =>
      (i.job_id === jobId || i.id === jobId) &&
      (i.status === 'APPLIED' || i.status === 'INTERVIEWING' || i.status === 'OFFER' || (i.status as string) === 'OFFERED')
  );
}

// Mark job as applied (or add to tracker as APPLIED)
export function markJobAsApplied(job: Partial<RemoteJob>): CandidateTrackerItem {
  const current = getLocalTrackerItems();
  const existingIndex = current.findIndex((i) => i.job_id === job.id || i.job_id === job.external_id);

  if (existingIndex >= 0) {
    current[existingIndex].status = 'APPLIED';
    current[existingIndex].applied_date = current[existingIndex].applied_date || new Date().toISOString();
    saveLocalTrackerItems(current);
    return current[existingIndex];
  } else {
    const { rate, rate_period } = deriveRateAndPeriod(job.salary);
    const companyName = job.company_name || job.company || 'Direct Employer';
    const job_type = (job.job_type || (job as any).employment_type || 'Full-time') as TrackerJobType;

    const newItem: CandidateTrackerItem = {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      candidate_id: 'local-candidate-01',
      job_id: job.id || job.external_id || '',
      company: companyName,
      title: job.title || 'Role',
      location: job.candidate_required_location || job.location_tier || 'Remote',
      salary: job.salary || null,
      rate,
      rate_period,
      job_type,
      status: 'APPLIED',
      url: job.apply_url || job.url || null,
      contact: `${companyName} Hiring Team`,
      notes: `Applied directly via verified link on ${new Date().toLocaleDateString()}.`,
      applied_date: new Date().toISOString(),
      interview_date: null,
      created_at: new Date().toISOString(),
    };
    saveLocalTrackerItems([newItem, ...current]);
    return newItem;
  }
}

// Update card status / column
export async function updateTrackerStatus(
  itemId: string,
  newStatus: TrackerStatus
): Promise<CandidateTrackerItem[]> {
  const current = getLocalTrackerItems();
  const updated = current.map((i) =>
    i.id === itemId
      ? {
          ...i,
          status: newStatus,
          applied_date:
            (newStatus === 'APPLIED' || newStatus === 'INTERVIEWING' || newStatus === 'OFFER') && !i.applied_date
              ? new Date().toISOString()
              : i.applied_date,
          updated_at: new Date().toISOString(),
        }
      : i
  );

  saveLocalTrackerItems(updated);

  // Sync with Supabase
  try {
    const supabase = createBrowserClient();
    await supabase.from('candidate_tracker').update({ status: newStatus }).eq('id', itemId);
  } catch (err) {
    console.warn('Supabase tracker update warning:', err);
  }

  return updated;
}

// Update any field of a tracker item (e.g. title, company, status, job_type, applied_date, interview_date, rate, contact, notes)
export async function updateTrackerItem(
  itemId: string,
  updates: Partial<CandidateTrackerItem>
): Promise<CandidateTrackerItem[]> {
  const current = getLocalTrackerItems();
  const updated = current.map((i) =>
    i.id === itemId
      ? {
          ...i,
          ...updates,
          updated_at: new Date().toISOString(),
        }
      : i
  );

  saveLocalTrackerItems(updated);

  try {
    const supabase = createBrowserClient();
    await supabase.from('candidate_tracker').update(updates).eq('id', itemId);
  } catch (err) {
    console.warn('Supabase tracker item update warning:', err);
  }

  return updated;
}

export interface ExternalTrackerJobInput {
  title: string;
  company: string;
  status: TrackerStatus;
  job_type?: TrackerJobType | string | null;
  applied_date?: string | null;
  interview_date?: string | null;
  rate?: string | null;
  rate_period?: TrackerRatePeriod | null;
  contact?: string | null;
  location?: string | null;
  salary?: string | null;
  url?: string | null;
  notes?: string | null;
}

// Add external job manually with all core tracker features
export async function addExternalTrackerJob(
  jobData: ExternalTrackerJobInput,
  candidateId?: string
): Promise<CandidateTrackerItem> {
  const current = getLocalTrackerItems();

  const isAppliedStatus = jobData.status === 'APPLIED' || jobData.status === 'INTERVIEWING' || jobData.status === 'OFFER' || (jobData.status as string) === 'OFFERED';
  const applied_date = jobData.applied_date || (isAppliedStatus ? new Date().toISOString() : null);

  const newItem: CandidateTrackerItem = {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    candidate_id: candidateId || 'local-candidate-01',
    job_id: null,
    company: jobData.company,
    title: jobData.title,
    location: jobData.location || 'Remote',
    salary: jobData.salary || jobData.rate || null,
    rate: jobData.rate || jobData.salary || null,
    rate_period: jobData.rate_period || 'monthly',
    job_type: jobData.job_type || 'Full-time',
    status: jobData.status,
    url: jobData.url || null,
    contact: jobData.contact || null,
    notes: jobData.notes || 'Manually added external application',
    applied_date,
    interview_date: jobData.interview_date || null,
    created_at: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  saveLocalTrackerItems(updated);

  try {
    const supabase = createBrowserClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (userAuth?.user?.id) {
      newItem.candidate_id = userAuth.user.id;
      await supabase.from('candidate_tracker').insert(newItem);
    }
  } catch (err) {
    console.warn('Supabase external tracker save warning:', err);
  }

  return newItem;
}
