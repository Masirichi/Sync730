'use client';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Briefcase, FileText, MessageSquare, Home, Heart } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/candidate', icon: Home },
  { label: 'Browse Jobs', href: '/candidate/jobs', icon: Briefcase },
  { label: 'My Applications', href: '/candidate/applications', icon: FileText },
  { label: 'Saved Jobs', href: '/candidate/saved', icon: Heart },
  { label: 'Messages', href: '/candidate/messages', icon: MessageSquare },
];

const headerNavItems = navItems.map(({ label, href }) => ({ label, href }));

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={navItems} roleLabel="Candidate" homeHref="/" />
      <div className="flex flex-1 flex-col">
        <DashboardHeader navItems={headerNavItems} userName="Jane Doe" userInitials="JD" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
