import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Sync730 talent waitlist',
  description:
    'Join the talent waitlist for Sync730 — connecting verified African talent with exceptional companies.',
  alternates: {
    canonical: 'https://sync730.com/waitlist',
  },
  openGraph: {
    title: 'Join the Sync730 talent waitlist',
    description:
      'Connecting verified African talent with exceptional companies.',
    url: 'https://sync730.com/waitlist',
    siteName: 'Sync730',
    type: 'website',
    images: [
      {
        url: '/og-sync730.png',
        width: 1200,
        height: 630,
        alt: 'Sync730 Talent Waitlist',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join the Sync730 talent waitlist',
    description:
      'Connecting verified African talent with exceptional companies.',
    images: ['/og-sync730.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
