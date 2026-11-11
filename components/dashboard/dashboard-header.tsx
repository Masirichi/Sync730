'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, LogOut, Menu, Search, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BrandLogo } from '@/components/site/brand-logo';
import { createBrowserClient } from '@/lib/supabase/client';

interface NavItem {
  label: string;
  href: string;
}

interface DashboardHeaderProps {
  navItems: NavItem[];
  userName: string;
  userInitials: string;
}

export function DashboardHeader({ navItems, userName, userInitials }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="lg:hidden"><BrandLogo compact /></div>
          <div className="hidden sm:block">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Dashboard Overview
            </h2>
          </div>
        </div>

        {/* Right Utility Buttons & Profile Card (Inspiration Style) */}
        <div className="flex items-center gap-3">
          {/* Notification Button with Red Badge (matching inspiration's bell) */}
          <button
            type="button"
            className="relative h-9 w-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4 stroke-[1.5]" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* Settings Button (matching inspiration's gear) */}
          <button
            type="button"
            className="h-9 w-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4 stroke-[1.5]" />
          </button>

          {/* User Profile Card (matching inspiration's user card) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                    San Francisco, CA
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-neutral-200 dark:border-neutral-800">
              <DropdownMenuLabel className="font-semibold text-xs">Signed in as {userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/candidate" className="cursor-pointer">Overview</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/crawler" className="cursor-pointer">Remote Job Feed</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/tracker" className="cursor-pointer">Kanban Tracker</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4 stroke-[1.5]" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-900 text-white p-4 lg:hidden">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 font-medium"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full text-left rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-neutral-800 font-medium mt-2 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
