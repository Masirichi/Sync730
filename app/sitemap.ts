import { MetadataRoute } from 'next';
import { getAllJobs } from '@/lib/jobs/service';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sync730.com';

  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/waitlist`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Dynamically add all live jobs to the sitemap
  try {
    const liveJobs = getAllJobs(false);
    const jobRoutes: MetadataRoute.Sitemap = liveJobs.map((j) => ({
      url: `${baseUrl}/jobs/${j.slug}`,
      lastModified: new Date(j.posted_date || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...baseRoutes, ...jobRoutes];
  } catch {
    return baseRoutes;
  }
}
