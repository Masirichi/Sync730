// app/demo/demo-client.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export function DemoPageClient() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    work_email: '',
    company: '',
    company_size: '11-50',
    roles_hiring_for: '',
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
      const res = await fetch('/api/demo', {
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
      trackEvent({ name: 'demo_request_submitted' });
    } catch {
      setErrors({ general: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="py-8 space-y-4 text-center">
        <div className="inline-block px-3 py-1 bg-[#edf3ec] text-[#346538] text-xs font-semibold rounded-[4px] uppercase tracking-wider">
          Request Received
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          We’ll be in touch within 24 hours.
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Our team will reach out with a tailored walk-through of the candidate evaluation portal and live scoring rubric.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div
          role="alert"
          className="p-3 text-xs font-medium text-[#9f2f2d] bg-[#fbf0ef] border border-[#f5d4d3] rounded"
        >
          {errors.general}
        </div>
      )}

      {/* Hidden honeypot field */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="demo-pg-website-hp">Website URL</label>
        <input
          id="demo-pg-website-hp"
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
          <label htmlFor="demo-pg-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Full Name <span className="text-[#9f2f2d]">*</span>
          </label>
          <input
            id="demo-pg-name"
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'demo-pg-name-err' : undefined}
            className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            placeholder="e.g. Amara Okafor"
          />
          {errors.name && (
            <p id="demo-pg-name-err" className="text-xs text-[#9f2f2d]">{errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="demo-pg-work-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Work Email <span className="text-[#9f2f2d]">*</span>
          </label>
          <input
            id="demo-pg-work-email"
            type="email"
            name="work_email"
            required
            value={formData.work_email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.work_email)}
            aria-describedby={errors.work_email ? 'demo-pg-email-err' : undefined}
            className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            placeholder="amara@company.com"
          />
          {errors.work_email && (
            <p id="demo-pg-email-err" className="text-xs text-[#9f2f2d]">{errors.work_email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="demo-pg-company" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Company Name <span className="text-[#9f2f2d]">*</span>
          </label>
          <input
            id="demo-pg-company"
            type="text"
            name="company"
            required
            value={formData.company}
            onChange={handleChange}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={errors.company ? 'demo-pg-company-err' : undefined}
            className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            placeholder="e.g. Sterling Capital"
          />
          {errors.company && (
            <p id="demo-pg-company-err" className="text-xs text-[#9f2f2d]">{errors.company}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="demo-pg-company-size" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Company Size <span className="text-[#9f2f2d]">*</span>
          </label>
          <select
            id="demo-pg-company-size"
            name="company_size"
            value={formData.company_size}
            onChange={handleChange}
            className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <option value="1-10">1 – 10 employees</option>
            <option value="11-50">11 – 50 employees</option>
            <option value="51-200">51 – 200 employees</option>
            <option value="201-1000">201 – 1,000 employees</option>
            <option value="1000+">1,000+ employees</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="demo-pg-roles" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Roles You Hire For <span className="text-[#9f2f2d]">*</span>
        </label>
        <input
          id="demo-pg-roles"
          type="text"
          name="roles_hiring_for"
          required
          value={formData.roles_hiring_for}
          onChange={handleChange}
          aria-invalid={Boolean(errors.roles_hiring_for)}
          aria-describedby={errors.roles_hiring_for ? 'demo-pg-roles-err' : undefined}
          className="w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          placeholder="e.g. Senior Backend Engineers, Product Designers"
        />
        {errors.roles_hiring_for && (
          <p id="demo-pg-roles-err" className="text-xs text-[#9f2f2d]">{errors.roles_hiring_for}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="demo-pg-message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Optional Message
        </label>
        <textarea
          id="demo-pg-message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleChange}
          className="w-full p-3 text-base sm:text-sm bg-background border border-border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground resize-none"
          placeholder="Tell us about your upcoming hiring timeline or specific interview requirements..."
        />
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
            I agree to Sync730 processing my information in accordance with the{' '}
            <Link href="/privacy" target="_blank" className="underline text-foreground hover:opacity-80">
              Privacy Policy
            </Link>{' '}
            and the Nigeria Data Protection Act 2023. <span className="text-[#9f2f2d]">*</span>
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
          {loading ? 'Submitting...' : 'Confirm Demo Request'}
        </button>
      </div>
    </form>
  );
}
