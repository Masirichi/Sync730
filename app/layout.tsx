import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://sync730.com'),
  title: {
    default: 'Sync730: Empowering recruitment in the Age of AI',
    template: '%s | Sync730',
  },
  description:
    'Smart, AI-powered recruitment solutions for organizations: interview every applicant, review only the best.',
  icons: {
    icon: '/assets/logo/sync730_icon_black.png',
    shortcut: '/assets/logo/sync730_icon_black.png',
    apple: '/assets/logo/sync730_icon_black.png',
  },
  openGraph: {
    title: 'Sync730: Empowering recruitment in the Age of AI',
    description:
      'Smart, AI-powered recruitment solutions for organizations: interview every applicant, review only the best.',
    url: 'https://sync730.com',
    siteName: 'Sync730',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground" suppressHydrationWarning>
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
