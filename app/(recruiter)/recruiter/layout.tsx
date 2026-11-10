'use client';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Home, Briefcase, Users, FileText, MessageSquare, BarChart3 } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/recruiter', icon: Home },
  { label: 'Jobs', href: '/recruiter/jobs', icon: Briefcase },
  { label: 'Candidates', href: '/recruiter/candidates', icon: Users },
  { label: 'Applications', href: '/recruiter/applications', icon: FileText },
  { label: 'Messages', href: '/recruiter/messages', icon: MessageSquare },
  { label: 'Analytics', href: '/recruiter/analytics', icon: BarChart3 },
];

const headerNavItems = navItems.map(({ label, href }) => ({ label, href }));

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={navItems} roleLabel="Recruiter" homeHref="/" />
      <div className="flex flex-1 flex-col">
        <DashboardHeader navItems={headerNavItems} userName="Alex Morgan" userInitials="AM" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
