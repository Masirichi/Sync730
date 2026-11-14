// app/page.tsx
import { Metadata } from 'next';
import { HomeView } from '@/components/home/home-view';
import { getLivePublicStats } from '@/lib/stats/service';
import { fetchActiveRemoteJobs } from '@/lib/crawler/jobs-fetcher';
import { LatestJobItem } from '@/components/home/for-candidates-section';

export const revalidate = 60; // ISR cache revalidation at edge

export const metadata: Metadata = {
  title: 'Sync730: Empowering recruitment in the Age of AI',
  description:
    'Smart, AI-powered recruitment solutions for organizations in Africa and worldwide. Interview every applicant, review only the best.',
  alternates: {
    canonical: 'https://sync730.com/',
  },
  openGraph: {
    title: 'Sync730: Empowering recruitment in the Age of AI',
    description:
      'Smart, AI-powered recruitment solutions for organizations: interview every applicant, review only the best.',
    url: 'https://sync730.com',
    siteName: 'Sync730',
    type: 'website',
    images: [
      {
        url: '/og-sync730.png',
        width: 1200,
        height: 630,
        alt: 'Sync730 - Empowering recruitment in the Age of AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sync730: Empowering recruitment in the Age of AI',
    description:
      'Smart, AI-powered recruitment solutions for organizations: interview every applicant, review only the best.',
    images: ['/og-sync730.png'],
  },
};

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Posted recently';
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Posted recently';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Posted just now';
  if (diffHours < 24) return `Posted ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Posted yesterday';
  return `Posted ${diffDays}d ago`;
}

export default async function HomePage() {
  // 1. Fetch live platform stats for server-side initial render
  const initialStats = await getLivePublicStats();

  // 2. Fetch active jobs to compute the 3 newest roles (No pay information)
  let latestRoles: LatestJobItem[] = [];
  try {
    const allJobs = await fetchActiveRemoteJobs();
    const sorted = allJobs
      .filter((j) => j.is_active !== false)
      .sort((a, b) => {
        const timeA = new Date(a.published_at || a.created_at || 0).getTime();
        const timeB = new Date(b.published_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });

    latestRoles = sorted.slice(0, 3).map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company_name || job.company,
      location_rule:
        job.city_location ||
        (job.open_to_nigeria
          ? 'Nigeria / Africa'
          : job.location_tier === 'Worldwide'
          ? 'Worldwide'
          : 'Africa Only'),
      posted_relative: formatRelativeTime(job.published_at || job.created_at),
    }));
  } catch (error) {
    console.error('Error fetching latest roles for homepage:', error);
  }

  // 3. Organization & WebSite JSON-LD Schemas
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://sync730.com/#organization',
        name: 'Sync730',
        url: 'https://sync730.com',
        logo: 'https://sync730.com/assets/logo/sync730_icon_black.png',
        description:
          'Smart, AI-powered recruitment solutions empowering organizations to interview every applicant and review only the best.',
        sameAs: [
          'https://x.com/sync730',
          'https://linkedin.com/company/sync730',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://sync730.com/#website',
        url: 'https://sync730.com',
        name: 'Sync730',
        description: 'Empowering recruitment in the Age of AI.',
        publisher: {
          '@id': 'https://sync730.com/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://sync730.com/jobs?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Server-Rendered Homepage View */}
      <HomeView initialStats={initialStats} latestRoles={latestRoles} />
    </>
  );
}
