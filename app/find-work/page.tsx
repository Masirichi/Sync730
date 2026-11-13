import { Metadata } from 'next';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { FindWorkClient } from './find-work-client';
import { fetchActiveRemoteJobs } from '@/lib/crawler/jobs-fetcher';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Find Tech & Professional Jobs in Nigeria, Africa & Remote | Sync730',
  description:
    'Discover verified Remote, Hybrid, and Onsite roles in Lagos, Abuja, Port Harcourt, and global remote teams. Synced live with verified employers and competitive compensation.',
  alternates: {
    canonical: 'https://sync730.com/find-work',
  },
  openGraph: {
    title: 'Find Tech & Professional Jobs in Nigeria, Africa & Remote | Sync730',
    description:
      'Discover verified Remote, Hybrid, and Onsite roles in Lagos, Abuja, Port Harcourt, and global remote teams.',
    url: 'https://sync730.com/find-work',
    siteName: 'Sync730',
    type: 'website',
  },
};

export default async function FindWorkPage() {
  const jobs = await fetchActiveRemoteJobs();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="flex-1">
        <FindWorkClient initialJobs={jobs} />
      </div>
      <SiteFooter />
    </div>
  );
}
