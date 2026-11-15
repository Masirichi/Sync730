// app/find-work/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getFilteredPublicJobs, JobFilterParams } from '@/lib/jobs/service';
import { fetchActiveRemoteJobs } from '@/lib/crawler/jobs-fetcher';
import { JobsClientView } from '@/components/jobs/jobs-client-view';

interface FindWorkPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: FindWorkPageProps): Promise<Metadata> {
  const hasFiltersOrPagination = Boolean(
    searchParams.q ||
      (searchParams.modality && searchParams.modality !== 'all') ||
      (searchParams.department && searchParams.department !== 'all') ||
      (searchParams.location && searchParams.location !== 'all') ||
      (searchParams.seniority && searchParams.seniority !== 'all') ||
      (searchParams.job_type && searchParams.job_type !== 'all') ||
      searchParams.salary_shown === 'true' ||
      (searchParams.page && searchParams.page !== '1')
  );

  return {
    title: 'Find Tech & Remote Jobs in Nigeria, Africa & Worldwide | Sync730',
    description:
      'Discover active verified Remote, Hybrid, and Onsite roles in Lagos, Abuja, Port Harcourt, and worldwide. Clear interview expectations and verified compensation.',
    alternates: {
      canonical: 'https://sync730.com/find-work',
    },
    robots: {
      index: !hasFiltersOrPagination,
      follow: true,
    },
    openGraph: {
      title: 'Find Tech & Remote Jobs in Nigeria, Africa & Worldwide | Sync730',
      description:
        'Discover active verified Remote, Hybrid, and Onsite roles in Lagos, Abuja, Port Harcourt, and worldwide.',
      url: 'https://sync730.com/find-work',
      siteName: 'Sync730',
      type: 'website',
    },
  };
}

export default async function FindWorkPage({ searchParams }: FindWorkPageProps) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const modality =
    typeof searchParams.modality === 'string'
      ? (searchParams.modality.toLowerCase() as any)
      : undefined;
  const department =
    typeof searchParams.department === 'string'
      ? searchParams.department
      : typeof searchParams.category === 'string'
      ? searchParams.category
      : undefined;
  const category = department;
  const location =
    typeof searchParams.location === 'string' ? searchParams.location : undefined;
  const open_to =
    typeof searchParams.open_to === 'string' ? searchParams.open_to : undefined;
  const seniority =
    typeof searchParams.seniority === 'string' ? searchParams.seniority : undefined;
  const job_type =
    typeof searchParams.job_type === 'string' ? searchParams.job_type : undefined;
  const salary_shown = searchParams.salary_shown === 'true';
  const min_salary =
    typeof searchParams.min_salary === 'string' ? parseInt(searchParams.min_salary, 10) : undefined;
  const sort =
    typeof searchParams.sort === 'string' ? (searchParams.sort as any) : undefined;
  const rawPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  // Query all active jobs directly from crawler/database to ensure real-time sync
  let activeRemoteJobs: any[] = [];
  try {
    activeRemoteJobs = await fetchActiveRemoteJobs();
  } catch (err) {
    console.warn('Failed to fetch active remote jobs in find-work:', err);
  }

  const filterParams: JobFilterParams = {
    q,
    modality: modality !== 'all' ? modality : undefined,
    department: department !== 'all' ? department : undefined,
    category: category !== 'all' ? category : undefined,
    location: location !== 'all' ? location : undefined,
    open_to: open_to !== 'all' ? open_to : undefined,
    seniority: seniority !== 'all' ? seniority : undefined,
    job_type: job_type !== 'all' ? job_type : undefined,
    salary_shown: salary_shown ? true : undefined,
    min_salary: min_salary && !isNaN(min_salary) ? min_salary : undefined,
    sort,
    page,
    limit: 12,
  };

  const results = getFilteredPublicJobs(filterParams, activeRemoteJobs);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcfcf9] dark:bg-neutral-950 p-8 text-center text-xs text-neutral-500">
          Loading verified jobs...
        </div>
      }
    >
      <JobsClientView
        initialResults={results}
        filterParams={filterParams}
        basePath="/find-work"
      />
    </Suspense>
  );
}
