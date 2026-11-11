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
    <aside className="hidden w-64 shrink-0 bg-[#101114] text-white rounded-[28px] border border-neutral-800/60 lg:flex lg:flex-col justify-between p-4 my-3 ml-3 h-[calc(100vh-24px)] sticky top-3 shadow-sm select-none">
      <div>
        {/* Brand Logo Header with Sync bold white / 730 grey */}
        <div className="flex h-16 items-center px-3 pt-2 pb-1">
          <BrandLogo inverted />
        </div>

        {/* Role Label */}
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
            {roleLabel} Portal
          </p>
        </div>

        {/* Navigation Items (Inspiration Floating Pill Style) */}
        <nav className="space-y-1 px-1 py-2">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== '/candidate' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-[#222329] text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Log Out Section (Inspiration Style) */}
      <div className="p-2 space-y-2">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl bg-[#18191E] hover:bg-[#202127] border border-neutral-800/80 text-sm font-medium text-neutral-300 hover:text-white transition-all shadow-sm"
        >
          <LogOut className="h-4 w-4 shrink-0 stroke-[1.5] text-neutral-400" />
          <span>Log Out</span>
        </button>
        <Link
          href={homeHref}
          className="block text-center text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-1"
        >
          Back to public site
        </Link>
      </div>
    </aside>
  );
}
