'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { candidateNavItems } from '@/lib/navigation';
import { BrandLogo } from '@/components/site/brand-logo';
import { createBrowserClient } from '@/lib/supabase/client';

export default function CandidateDashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      if (typeof document !== 'undefined') {
        document.cookie = 'sync730-demo-role=; path=/; max-age=0';
      }
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F0F2F5] dark:bg-[#0a0a0c]">
      {/* Floating Dark Pill Sidebar (Desktop) */}
      <DashboardSidebar items={candidateNavItems} roleLabel="Candidate" homeHref="/" />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Top Header (Small screens only) */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 m-3 mb-0 rounded-2xl">
          <BrandLogo compact />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mx-3 mt-2 bg-[#101114] text-white rounded-2xl p-4 space-y-2 border border-neutral-800">
            {candidateNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-[#222329] text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-300 hover:text-white mt-2"
            >
              <LogOut className="h-4 w-4 text-neutral-400" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Floating White Main Surface Island */}
        <main className="flex-1 m-3 lg:ml-0 bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200/70 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 sm:p-8 lg:p-9 min-h-[calc(100vh-24px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
