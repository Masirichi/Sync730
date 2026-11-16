'use client';

import { useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function CommandEmployersPage() {
  useEffect(() => {
    document.title = 'Employers | Command Center';
  }, []);

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Employers
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Corporate workspaces, talent search seats, and active employer accounts.
        </p>
      </div>

      {/* Empty State */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-12 text-center shadow-sm">
        <div className="max-w-md mx-auto space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <Building2 className="h-6 w-6 stroke-[2]" />
          </div>
          <h2 className="text-base font-semibold text-white">
            Employer accounts
          </h2>
          <p className="text-sm text-neutral-400">
            Coming in a later phase. Detailed employer onboarding, team seats, and verification records will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}
