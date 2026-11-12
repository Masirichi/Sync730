import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verified Remote & Tech Jobs in Nigeria & Africa | Sync730',
  description:
    'Search and apply to verified software engineering, product, and data opportunities open to Nigerian and African talent.',
  alternates: {
    canonical: 'https://sync730.com/jobs',
  },
  openGraph: {
    title: 'Verified Remote & Tech Jobs in Nigeria & Africa | Sync730',
    description:
      'Search and apply to verified software engineering, product, and data opportunities open to Nigerian and African talent.',
    url: 'https://sync730.com/jobs',
    siteName: 'Sync730',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
