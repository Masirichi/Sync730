'use client';

import { useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function CommandSourcesPage() {
  useEffect(() => {
    document.title = 'Sources | Command Center';
  }, []);

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Sources
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Job crawl endpoints, ingestion schedule, and source reliability status.
        </p>
      </div>

      {/* Empty State */}
      <Card className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-12 text-center shadow-sm">
        <div className="max-w-md mx-auto space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <Globe className="h-6 w-6 stroke-[2]" />
          </div>
          <h2 className="text-base font-semibold text-white">
            Crawl sources
          </h2>
          <p className="text-sm text-neutral-400">
            Coming in a later phase. Endpoint monitoring, crawl cadence, and source verification will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}
