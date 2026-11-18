import type { Metadata } from 'next';
import { CommandClientLayout } from '@/components/admin/command-client-layout';

export const metadata: Metadata = {
  title: {
    template: '%s | Command Center',
    default: 'Overview | Command Center',
  },
  description: 'Sync730 Platform Command Center & Operational Telemetry',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  // Pinned account block renders <span>Sign out</span> via CommandClientLayout
  return <CommandClientLayout>{children}</CommandClientLayout>;
}
