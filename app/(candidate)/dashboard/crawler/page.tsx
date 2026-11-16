'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CrawlerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/find-work');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-neutral-500">
      Redirecting to Browse Jobs (/find-work)...
    </div>
  );
}
