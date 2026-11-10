'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';
import { BrandLogo } from '@/components/site/brand-logo';
import { cn } from '@/lib/utils';

interface NavItem { label: string; href: string; icon: LucideIcon; }
interface DashboardSidebarProps { items: NavItem[]; roleLabel: string; homeHref: string; }

export function DashboardSidebar({ items, roleLabel, homeHref }: DashboardSidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-background lg:flex lg:flex-col">
      <div className="flex h-[76px] items-center border-b border-border/70 px-6"><BrandLogo /></div>
      <div className="px-5 py-6"><p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{roleLabel}</p></div>
      <nav className="flex-1 space-y-1 px-4 pb-4">{items.map((item) => { const active = pathname === item.href || pathname.startsWith(item.href + '/'); return <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors', active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}><item.icon className="h-4 w-4 shrink-0" />{item.label}</Link>; })}</nav>
      <div className="border-t border-border/70 p-4"><Link href={homeHref} className="flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Back to home</Link></div>
    </aside>
  );
}
