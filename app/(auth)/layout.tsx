import Link from 'next/link';
import { BrandLogo } from '@/components/site/brand-logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex xl:p-14">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-background/20" />
        <div className="absolute bottom-24 right-20 h-40 w-40 rounded-full bg-background/5" />
        <BrandLogo inverted />
        <div className="relative max-w-md"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-background/50">The work network for what comes next</p><h2 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.04em]">Where good work and good people meet.</h2><p className="mt-5 leading-7 text-background/60">A more thoughtful way to find opportunities, build teams, and make your next move.</p></div>
        <p className="relative text-sm text-background/45">© 2026 Sync730</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12"><div className="w-full max-w-sm"><div className="mb-10 lg:hidden"><BrandLogo /></div>{children}</div></div>
    </div>
  );
}
