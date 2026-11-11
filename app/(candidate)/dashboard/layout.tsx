'use client';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { candidateNavItems } from '@/lib/navigation';

const headerNavItems = candidateNavItems.map(({ label, href }) => ({ label, href }));

export default function CandidateDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={candidateNavItems} roleLabel="Candidate" homeHref="/" />
      <div className="flex flex-1 flex-col">
        <DashboardHeader navItems={headerNavItems} userName="Jane Doe" userInitials="JD" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
