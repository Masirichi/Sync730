'use client';

import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Home, Users, Briefcase, Building2, BarChart3, ShieldCheck } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { label: 'Companies', href: '/admin/companies', icon: Building2 },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Security', href: '/admin/security', icon: ShieldCheck },
];

const headerNavItems = navItems.map(({ label, href }) => ({ label, href }));

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={navItems} roleLabel="Admin" homeHref="/" />
      <div className="flex flex-1 flex-col">
        <DashboardHeader navItems={headerNavItems} userName="Admin User" userInitials="AD" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
