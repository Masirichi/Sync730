'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CurrencyChoice, PeriodChoice } from '@/lib/jobs/format-salary';
import { JOB_CATEGORIES } from '@/lib/jobs/types';

export interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  // Current active values
  activeCategory: string;
  activeOpenTo: string;
  activeSeniority: string;
  activeJobType: string;
  activeMinSalary?: number;
  currency: CurrencyChoice;
  period: PeriodChoice;
  onCurrencyChange: (c: CurrencyChoice) => void;
  onPeriodChange: (p: PeriodChoice) => void;
  // Apply & Clear
  onApplyFilters: (filters: {
    category: string;
    open_to: string;
    seniority: string;
    job_type: string;
    min_salary?: number;
  }) => void;
  onClearAll: () => void;
  // Dynamic count of roles
  matchingCount: number;
}

const OPEN_TO_OPTIONS = [
  { value: 'all', label: 'Any eligibility' },
  { value: 'africa-wide', label: 'Africa-wide (All Africa)' },
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'ghana', label: 'Ghana' },
  { value: 'kenya', label: 'Kenya' },
  { value: 'south africa', label: 'South Africa' },
  { value: 'rwanda', label: 'Rwanda' },
  { value: 'egypt', label: 'Egypt' },
  { value: 'worldwide', label: 'Worldwide' },
];

const SENIORITY_OPTIONS = [
  { value: 'all', label: 'All Seniority' },
  { value: 'junior', label: 'Junior / Entry' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Staff' },
];

const JOB_TYPE_OPTIONS = [
  { value: 'all', label: 'All Job Types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'part-time', label: 'Part-time' },
];

const MIN_SALARY_OPTIONS = [
  { value: 0, label: 'Any salary' },
  { value: 30000, label: '$30,000+ / yr' },
  { value: 50000, label: '$50,000+ / yr' },
  { value: 75000, label: '$75,000+ / yr' },
  { value: 100000, label: '$100,000+ / yr' },
  { value: 150000, label: '$150,000+ / yr' },
];

export function FiltersDrawer({
  isOpen,
  onClose,
  triggerRef,
  activeCategory,
  activeOpenTo,
  activeSeniority,
  activeJobType,
  activeMinSalary = 0,
  currency,
  period,
  onCurrencyChange,
  onPeriodChange,
  onApplyFilters,
  onClearAll,
  matchingCount,
}: FiltersDrawerProps) {
  // Local state for draft selections while drawer is open
  const [draftCategory, setDraftCategory] = useState(activeCategory);
  const [draftOpenTo, setDraftOpenTo] = useState(activeOpenTo);
  const [draftSeniority, setDraftSeniority] = useState(activeSeniority);
  const [draftJobType, setDraftJobType] = useState(activeJobType);
  const [draftMinSalary, setDraftMinSalary] = useState(activeMinSalary);

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync draft state whenever drawer opens with current active values
  useEffect(() => {
    if (isOpen) {
      setDraftCategory(activeCategory);
      setDraftOpenTo(activeOpenTo);
      setDraftSeniority(activeSeniority);
      setDraftJobType(activeJobType);
      setDraftMinSalary(activeMinSalary);
    }
  }, [isOpen, activeCategory, activeOpenTo, activeSeniority, activeJobType, activeMinSalary]);

  // Focus trap and Esc key listener
  useEffect(() => {
    if (!isOpen) return;

    // Trap focus inside drawer
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when drawer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Return focus to trigger button
      if (triggerRef?.current) {
        triggerRef.current.focus();
      } else if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters({
      category: draftCategory,
      open_to: draftOpenTo,
      seniority: draftSeniority,
      job_type: draftJobType,
      min_salary: draftMinSalary > 0 ? draftMinSalary : undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setDraftCategory('all');
    setDraftOpenTo('all');
    setDraftSeniority('all');
    setDraftJobType('all');
    setDraftMinSalary(0);
    onClearAll();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="filters-drawer-heading">
      {/* Scrim / Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Desktop: Right slide-over; Mobile: Bottom sheet) */}
      <div
        ref={drawerRef}
        className="fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl md:rounded-none md:inset-y-0 md:left-auto md:right-0 md:max-h-full md:w-full md:max-w-md bg-white dark:bg-neutral-900 border-t md:border-t-0 md:border-l border-border shadow-2xl flex flex-col z-50 outline-none animate-in fade-in slide-in-from-bottom md:slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 id="filters-drawer-heading" className="text-base font-bold text-neutral-950 dark:text-white">
              Filter roles
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Narrow down opportunities open to you
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters drawer"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Category */}
          <div>
            <label htmlFor="filter-category" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block mb-2">
              Category
            </label>
            <select
              id="filter-category"
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-white dark:bg-neutral-800 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Open to / Eligibility */}
          <div>
            <label htmlFor="filter-open-to" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block mb-2">
              Open to (Eligibility)
            </label>
            <select
              id="filter-open-to"
              value={draftOpenTo}
              onChange={(e) => setDraftOpenTo(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-white dark:bg-neutral-800 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-white cursor-pointer"
            >
              {OPEN_TO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Seniority */}
          <div>
            <label htmlFor="filter-seniority" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block mb-2">
              Seniority
            </label>
            <select
              id="filter-seniority"
              value={draftSeniority}
              onChange={(e) => setDraftSeniority(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-white dark:bg-neutral-800 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-white cursor-pointer"
            >
              {SENIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type */}
          <div>
            <label htmlFor="filter-job-type" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block mb-2">
              Job Type
            </label>
            <select
              id="filter-job-type"
              value={draftJobType}
              onChange={(e) => setDraftJobType(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-white dark:bg-neutral-800 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-white cursor-pointer"
            >
              {JOB_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Salary */}
          <div>
            <label htmlFor="filter-min-salary" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block mb-2">
              Minimum Salary
            </label>
            <select
              id="filter-min-salary"
              value={draftMinSalary}
              onChange={(e) => setDraftMinSalary(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-white dark:bg-neutral-800 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-white cursor-pointer"
            >
              {MIN_SALARY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Display Currency & Period */}
          <div className="pt-4 border-t border-border space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Display Currency
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['ORIGINAL', 'NGN', 'USD'] as CurrencyChoice[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onCurrencyChange(c)}
                    className={`h-9 rounded-xl text-xs font-medium border transition-colors ${
                      currency === c
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white font-bold'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-muted-foreground border-border hover:border-neutral-950'
                    }`}
                  >
                    {c === 'ORIGINAL' ? 'Original' : c === 'NGN' ? '₦ NGN' : '$ USD'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Display Period
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['MONTHLY', 'YEARLY'] as PeriodChoice[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPeriodChange(p)}
                    className={`h-9 rounded-xl text-xs font-medium border transition-colors ${
                      period === p
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white font-bold'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-muted-foreground border-border hover:border-neutral-950'
                    }`}
                  >
                    {p === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-neutral-50 dark:bg-neutral-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="h-11 px-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm"
          >
            Show {matchingCount} {matchingCount === 1 ? 'role' : 'roles'}
          </button>
        </div>
      </div>
    </div>
  );
}
