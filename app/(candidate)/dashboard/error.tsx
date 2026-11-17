'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function CandidateDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error safely
    console.error('Candidate Dashboard Error:', error);
  }, [error]);

  const handleHardRefresh = () => {
    if (typeof window !== 'undefined') {
      // Force clean reload bypassing cache
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
      <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
        Something didn't load quite right
      </h2>
      <p className="mt-1.5 max-w-md text-xs text-neutral-500 dark:text-neutral-400">
        A recent update was deployed to the platform. Reloading your session will fetch the latest version.
      </p>
      <div className="mt-5 flex items-center gap-3">
        <Button
          onClick={handleHardRefresh}
          className="gap-2 text-xs font-semibold min-h-[44px] px-5 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
        >
          <RotateCcw className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>Reload Page</span>
        </Button>
      </div>
    </div>
  );
}
