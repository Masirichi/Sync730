import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicJobBySlugOrId } from '@/lib/jobs/service';
import { JobDetailClient } from './job-detail-client';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { job, isClosed } = getPublicJobBySlugOrId(params.slug);

  if (!job) {
    return {
      title: 'Job Not Found | Sync730',
      robots: { index: false, follow: false },
    };
  }

  const title = `${job.title} at ${job.company} | Sync730`;
  const description = `${job.title} at ${job.company}. Location: ${job.location_rule}. ${
    job.salary ? `Compensation: ${job.salary}.` : ''
  } Verified tech opportunity on Sync730.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://sync730.com/jobs/${job.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://sync730.com/jobs/${job.slug}`,
      siteName: 'Sync730',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: !isClosed,
      follow: true,
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { job, isClosed, similarJobs } = getPublicJobBySlugOrId(params.slug);

  if (!job) {
    notFound();
  }

  // Generate JobPosting JSON-LD for search engine rich results
  // STRICT REQUIREMENT: Closed or expired jobs stay reachable with a banner, and their JSON-LD is REMOVED!
  let jsonLd: Record<string, any> | null = null;

  if (!isClosed) {
    let employmentType = 'FULL_TIME';
    const lowerType = job.employment_type.toLowerCase();
    if (lowerType.includes('contract')) employmentType = 'CONTRACTOR';
    else if (lowerType.includes('part')) employmentType = 'PART_TIME';
    else if (lowerType.includes('intern')) employmentType = 'INTERN';

    jsonLd = {
      '@context': 'https://schema.org/',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description || job.summary,
      datePosted: job.posted_date,
      validThrough: job.valid_through,
      employmentType,
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company,
      },
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: job.location_rule,
      },
    };

    if (job.salary_min && job.salary_max) {
      jsonLd.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: job.salary_currency || 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salary_min,
          maxValue: job.salary_max,
          unitText: job.salary_period ? job.salary_period.toUpperCase() : 'YEAR',
        },
      };
    }

    // directApply is true ONLY for employer-posted jobs
    if (job.source_type === 'employer') {
      jsonLd.directApply = true;
    }
  }

  return (
    <>
      {/* Schema.org JobPosting Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <JobDetailClient
        job={job}
        isClosed={isClosed}
        similarJobs={similarJobs}
      />
    </>
  );
}
