'use client';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { candidateNavItems } from '@/lib/navigation';

const headerNavItems = candidateNavItems.map(({ label, href }) => ({ label, href }));

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a]">
      <DashboardSidebar items={candidateNavItems} roleLabel="Candidate" homeHref="/" />
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardHeader navItems={headerNavItems} userName="Jane Doe" userInitials="JD" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
