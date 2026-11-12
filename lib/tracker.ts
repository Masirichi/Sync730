import { CandidateTrackerItem, RemoteJob, TrackerStatus } from './supabase/types';
import { createBrowserClient } from './supabase/client';

const LOCAL_STORAGE_KEY = 'sync730_candidate_tracker';

export const INITIAL_TRACKER_ITEMS: CandidateTrackerItem[] = [
  {
    id: 'track-001',
    candidate_id: 'local-candidate-01',
    job_id: 'remotive-2086540',
    company: 'Credit Wellness Global',
    title: 'Senior Full Stack Engineer (Next.js & Supabase)',
    location: 'Worldwide',
    salary: '$110,000 - $140,000 USD',
    status: 'SAVED',
    url: 'https://remotive.com',
    notes: 'Bookmarked from Verified Remote Feed. Need to polish Vet-Once profile before applying.',
    applied_date: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'track-002',
    candidate_id: 'local-candidate-01',
    job_id: 'remotive-2086542',
    company: 'FinSync Africa',
    title: 'Lead Product Designer (Design Systems)',
    location: 'Africa Only',
    salary: '$65,000 - $90,000 USD',
    status: 'APPLIED',
    url: 'https://remotive.com',
    notes: 'Submitted Vet-Once portfolio. Recruiter confirmation email received.',
    applied_date: new Date(Date.now() - 3600000 * 48).toISOString(),
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
    status: 'INTERVIEWING',
    url: 'https://stripe.com/jobs',
    notes: 'Technical screen passed with hiring manager. Round 2 system design on Thursday.',
    applied_date: new Date(Date.now() - 3600000 * 120).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 140).toISOString(),
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
    return JSON.parse(raw);
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

  const newItem: CandidateTrackerItem = {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    candidate_id: candidateId || 'local-candidate-01',
    job_id: job.id || job.external_id || '',
    company: job.company_name || job.company || 'Direct Employer',
    title: job.title || 'Role',
    location: job.candidate_required_location || job.location_tier || 'Remote',
    salary: job.salary || null,
    status: 'SAVED',
    url: job.apply_url || job.url || null,
    notes: `Saved from Verified Remote Feed (${job.location_tier || 'Remote'}). Source: ${job.source_name || job.source || 'Direct'}.`,
    applied_date: null,
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
    const newItem: CandidateTrackerItem = {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      candidate_id: 'local-candidate-01',
      job_id: job.id || job.external_id || '',
      company: job.company_name || job.company || 'Direct Employer',
      title: job.title || 'Role',
      location: job.candidate_required_location || job.location_tier || 'Remote',
      salary: job.salary || null,
      status: 'APPLIED',
      url: job.apply_url || job.url || null,
      notes: `Applied directly via verified link on ${new Date().toLocaleDateString()}.`,
      applied_date: new Date().toISOString(),
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
          applied_date: newStatus === 'APPLIED' && !i.applied_date ? new Date().toISOString() : i.applied_date,
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

// Add external job manually
export async function addExternalTrackerJob(
  jobData: {
    title: string;
    company: string;
    location?: string;
    salary?: string;
    url?: string;
    notes?: string;
    status: TrackerStatus;
  },
  candidateId?: string
): Promise<CandidateTrackerItem> {
  const current = getLocalTrackerItems();
  const newItem: CandidateTrackerItem = {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    candidate_id: candidateId || 'local-candidate-01',
    job_id: null,
    company: jobData.company,
    title: jobData.title,
    location: jobData.location || 'Remote',
    salary: jobData.salary || null,
    status: jobData.status,
    url: jobData.url || null,
    notes: jobData.notes || 'Manually added external application',
    applied_date: jobData.status !== 'SAVED' ? new Date().toISOString() : null,
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
