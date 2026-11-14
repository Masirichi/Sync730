// components/modals/enterprise-modal.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { trackEvent } from '@/lib/analytics';

interface EnterpriseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnterpriseModal({ open, onOpenChange }: EnterpriseModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    work_email: '',
    company: '',
    company_size: '51-200',
    use_cases: '',
    message: '',
    consent: false,
    website_hp: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/enterprise-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          setErrors(data.fields);
        } else {
          setErrors({ general: data.error || 'Submission failed. Please try again.' });
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      trackEvent({ name: 'enterprise_interest_submitted' });
    } catch {
      setErrors({ general: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSuccess(false);
      setErrors({});
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-6 sm:p-8 bg-background border-border text-foreground">
        <DialogHeader className="text-left space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Enterprise Solutions
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Enterprise Early Access
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Custom team workflows, ATS integrations, enterprise SLA, and a dedicated recruitment success manager.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 space-y-4 text-center">
            <div className="inline-block px-3 py-1 bg-[#edf3ec] text-[#346538] text-xs font-semibold rounded-[4px] uppercase tracking-wider">
              Request Logged
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Thank you for your interest.
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Our enterprise team will reach out directly to review your organization’s hiring volume and custom workflow requirements.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errors.general && (
              <div
                role="alert"
                className="p-3 text-xs font-medium text-[#9f2f2d] bg-[#fbf0ef] border border-[#f5d4d3] rounded"
              >
                {errors.general}
              </div>
            )}

            <div className="hidden" aria-hidden="true">
              <label htmlFor="ent-website-hp">Website URL</label>
              <input
                id="ent-website-hp"
                type="text"
                name="website_hp"
                value={formData.website_hp}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="ent-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Full Name <span className="text-[#9f2f2d]">*</span>
                </label>
                <input
                  id="ent-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'ent-name-err' : undefined}
                  className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  placeholder="e.g. Tunde Adeyemi"
                />
                {errors.name && (
                  <p id="ent-name-err" className="text-xs text-[#9f2f2d]">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ent-work-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Corporate Email <span className="text-[#9f2f2d]">*</span>
                </label>
                <input
                  id="ent-work-email"
                  type="email"
                  name="work_email"
                  required
                  value={formData.work_email}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.work_email)}
                  aria-describedby={errors.work_email ? 'ent-email-err' : undefined}
                  className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  placeholder="tunde@enterprise.com"
                />
                {errors.work_email && (
                  <p id="ent-email-err" className="text-xs text-[#9f2f2d]">{errors.work_email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="ent-company" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Organization Name <span className="text-[#9f2f2d]">*</span>
                </label>
                <input
                  id="ent-company"
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.company)}
                  aria-describedby={errors.company ? 'ent-company-err' : undefined}
                  className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  placeholder="e.g. Zenith Global Group"
                />
                {errors.company && (
                  <p id="ent-company-err" className="text-xs text-[#9f2f2d]">{errors.company}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ent-company-size" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Organization Size <span className="text-[#9f2f2d]">*</span>
                </label>
                <select
                  id="ent-company-size"
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  <option value="51-200">51 – 200 employees</option>
                  <option value="201-1000">201 – 1,000 employees</option>
                  <option value="1000-5000">1,000 – 5,000 employees</option>
                  <option value="5000+">5,000+ employees</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ent-use-cases" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hiring Goals & ATS Workflows <span className="text-[#9f2f2d]">*</span>
              </label>
              <textarea
                id="ent-use-cases"
                name="use_cases"
                required
                rows={2}
                value={formData.use_cases}
                onChange={handleChange}
                aria-invalid={Boolean(errors.use_cases)}
                aria-describedby={errors.use_cases ? 'ent-use-cases-err' : undefined}
                className="w-full p-3 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground resize-none"
                placeholder="e.g. High-volume graduate engineer intake, multi-department custom scoring rubrics..."
              />
              {errors.use_cases && (
                <p id="ent-use-cases-err" className="text-xs text-[#9f2f2d]">{errors.use_cases}</p>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  checked={formData.consent}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-border text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
                />
                <span>
                  I agree to Sync730 processing this corporate inquiry under the{' '}
                  <Link href="/privacy" target="_blank" className="underline text-foreground hover:opacity-80">
                    Privacy Policy
                  </Link>. <span className="text-[#9f2f2d]">*</span>
                </span>
              </label>
              {errors.consent && (
                <p className="mt-1 text-xs text-[#9f2f2d]">{errors.consent}</p>
              )}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 inline-flex items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                {loading ? 'Submitting...' : 'Submit Enterprise Request'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
