import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Sync730 — The work network for what comes next',
  description:
    'A more thoughtful way to find opportunities, build teams, and make your next move.',
  openGraph: {
    title: 'Sync730 — The work network for what comes next',
    description:
      'A more thoughtful way to find opportunities, build teams, and make your next move.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <nav aria-label="Skip links">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-neutral-900 focus:text-white focus:rounded-lg focus:shadow-xl focus:ring-2 focus:ring-white text-sm font-semibold transition-transform"
          >
            Skip to main content
          </a>
        </nav>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
