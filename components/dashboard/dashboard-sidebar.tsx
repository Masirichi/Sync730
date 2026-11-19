'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type LucideIcon, LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@/lib/supabase/client';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  items: NavItem[];
  roleLabel: string;
  homeHref: string;
}

export function DashboardSidebar({ items, roleLabel, homeHref }: DashboardSidebarProps) {
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
    <aside className="hidden w-64 shrink-0 bg-[#101114] text-white rounded-[28px] border border-neutral-800/60 lg:flex lg:flex-col justify-between p-3.5 my-3 ml-3 h-[calc(100vh-24px)] max-h-[calc(100vh-24px)] sticky top-3 shadow-sm select-none overflow-y-auto">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Brand Logo Header with Sync bold white / 730 grey */}
        <div className="flex h-14 items-center px-2.5 pt-1 pb-1 shrink-0">
          <BrandLogo inverted />
        </div>

        {/* Role Label */}
        <div className="px-2.5 pt-2 pb-1.5 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            {roleLabel} Portal
          </p>
        </div>

        {/* Navigation Items (Inspiration Floating Pill Style) */}
        <nav aria-label="Desktop Sidebar Navigation" className="space-y-1 px-0.5 py-1.5 flex-1 min-h-0 overflow-y-auto">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== '/candidate' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium transition-all',
                  active
                    ? 'bg-[#222329] text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Log Out Section (Inspiration Style) */}
      <div className="p-1 pt-2 space-y-1.5 shrink-0 border-t border-neutral-800/40 mt-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 min-h-[40px] rounded-xl bg-[#18191E] hover:bg-[#202127] border border-neutral-800/80 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-all shadow-sm"
        >
          <LogOut className="h-4 w-4 shrink-0 stroke-[1.5] text-neutral-400" />
          <span>Log Out</span>
        </button>
        <Link
          href={homeHref}
          className="block text-center text-[11px] text-neutral-400 hover:text-white transition-colors py-1.5"
        >
          Back to public site
        </Link>
      </div>
    </aside>
  );
}
