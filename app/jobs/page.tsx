import { Metadata } from 'next';
import { Suspense } from 'react';
import { getFilteredPublicJobs, JobFilterParams } from '@/lib/jobs/service';
import { JobsClientView } from '@/components/jobs/jobs-client-view';

interface JobsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ searchParams }: JobsPageProps): Promise<Metadata> {
  const hasFiltersOrPagination = Boolean(
    searchParams.q ||
      (searchParams.department && searchParams.department !== 'all') ||
      (searchParams.location && searchParams.location !== 'all') ||
      (searchParams.seniority && searchParams.seniority !== 'all') ||
      (searchParams.job_type && searchParams.job_type !== 'all') ||
      searchParams.salary_shown === 'true' ||
      (searchParams.page && searchParams.page !== '1')
  );

  return {
    title: 'Verified Tech Jobs in Nigeria, Africa & Remote | Sync730',
    description:
      'Browse vetted tech jobs open to candidates in Nigeria, Africa, and global remote teams. Software engineering, design, and data.',
    alternates: {
      canonical: 'https://sync730.com/jobs',
    },
    robots: {
      index: !hasFiltersOrPagination,
      follow: true,
    },
    openGraph: {
      title: 'Verified Tech Jobs in Nigeria, Africa & Remote | Sync730',
      description:
        'Browse vetted tech jobs open to candidates in Nigeria, Africa, and global remote teams. Software engineering, design, and data.',
      url: 'https://sync730.com/jobs',
      siteName: 'Sync730',
      type: 'website',
    },
  };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const department = typeof searchParams.department === 'string' ? searchParams.department : undefined;
  const location = typeof searchParams.location === 'string' ? searchParams.location : undefined;
  const seniority = typeof searchParams.seniority === 'string' ? searchParams.seniority : undefined;
  const job_type = typeof searchParams.job_type === 'string' ? searchParams.job_type : undefined;
  const salary_shown = searchParams.salary_shown === 'true';
  const rawPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const filterParams: JobFilterParams = {
    q,
    department: department !== 'all' ? department : undefined,
    location: location !== 'all' ? location : undefined,
    seniority: seniority !== 'all' ? seniority : undefined,
    job_type: job_type !== 'all' ? job_type : undefined,
    salary_shown: salary_shown ? true : undefined,
    page,
    limit: 12,
  };

  const results = getFilteredPublicJobs(filterParams);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfcf9] p-8 text-center text-xs text-neutral-500">Loading jobs...</div>}>
      <JobsClientView initialResults={results} filterParams={filterParams} />
    </Suspense>
  );
}
