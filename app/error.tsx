'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  const handleHardRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex max-w-md w-full flex-col items-center justify-center text-center p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl">
        <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Something went wrong
        </h2>
        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          The app encountered an unexpected error or an outdated cached bundle. Please reload the page to load the newest build.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={handleHardRefresh}
            className="gap-2 text-xs font-semibold min-h-[44px] px-6 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
          >
            <RotateCcw className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Reload Page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
