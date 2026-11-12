// components/ui/SalaryDisplay.tsx
'use client';

import { useEffect, useState } from 'react';
import formatSalary, { DisplayCurrency, DisplayPeriod } from '@/lib/salary/formatSalary';
import type { RemoteJob, Job } from '@/lib/supabase/types';

interface SalaryDisplayProps {
  job: Partial<RemoteJob | Job> | null | undefined;
  currency?: DisplayCurrency;
  period?: DisplayPeriod;
  className?: string;
}

export default function SalaryDisplay({
  job,
  currency = 'original',
  period = 'original',
  className = '',
}: SalaryDisplayProps) {
  const [displayText, setDisplayText] = useState<string>(() => {
    // Initial quick sync fallback while async rates are calculated
    if (!job) return 'Salary not listed';
    const raw = (job as any)?.salary || (job as any)?.salary_range;
    return raw || 'Salary not listed';
  });

  useEffect(() => {
    let isCancelled = false;

    async function computeSalary() {
      try {
        const result = await formatSalary(job, { currency, period });
        if (!isCancelled) {
          setDisplayText(result);
        }
      } catch {
        if (!isCancelled) {
          const raw = (job as any)?.salary || (job as any)?.salary_range;
          setDisplayText(raw || 'Salary not listed');
        }
      }
    }

    computeSalary();

    return () => {
      isCancelled = true;
    };
  }, [job, currency, period]);

  return <span className={className || 'font-semibold text-neutral-900 dark:text-neutral-200'}>{displayText}</span>;
}
