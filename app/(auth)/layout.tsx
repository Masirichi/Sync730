import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_30%_20%,rgba(255,255,255,0.12),transparent)]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">TalentHub</span>
        </Link>
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight">
            Where talent meets opportunity
          </h2>
          <p className="mt-3 max-w-md text-primary-foreground/80">
            Join thousands of candidates and companies building their teams on TalentHub.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">© 2026 TalentHub</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">TalentHub</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
