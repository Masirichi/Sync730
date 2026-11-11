import { JobSource, LocationTier, RemoteJob } from '../supabase/types';

export interface CrawlerAdapter {
  id: JobSource;
  name: string;
  website: string;
  description: string;
  badgeColor: string;
  crawl: () => Promise<Omit<RemoteJob, 'id'>[]>;
}

export function resolveLocationTier(locationStr: string): LocationTier {
  const loc = (locationStr || '').toLowerCase();

  const africaKeywords = [
    'africa',
    'nigeria',
    'lagos',
    'abuja',
    'kenya',
    'nairobi',
    'south africa',
    'johannesburg',
    'cape town',
    'ghana',
    'accra',
    'egypt',
    'cairo',
    'rwanda',
    'kigali',
    'morocco',
    'casablanca',
    'senegal',
    'uganda',
  ];

  const emeaKeywords = [
    'emea',
    'europe, middle east',
    'europe',
    'uk / europe',
    'london',
    'berlin',
    'amsterdam',
    'portugal',
    'poland',
    'spain',
    'estonia',
  ];

  if (africaKeywords.some((k) => loc.includes(k))) {
    return 'Africa Only';
  }

  if (emeaKeywords.some((k) => loc.includes(k))) {
    return 'EMEA';
  }

  return 'Worldwide';
}
