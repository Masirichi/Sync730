'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/site/brand-logo';
import {
  ALLOWED_COUNTRIES,
  ALLOWED_TRACKS,
  ALLOWED_PRIORITIES,
  PriorityValue,
} from '@/lib/waitlist/constants';

interface FormState {
  full_name: string;
  email: string;
  country: string;
  track: string;
  priorities: PriorityValue[];
  consent: boolean;
  company: string; // Honeypot
}

interface FormErrors {
  full_name?: string;
  email?: string;
  consent?: string;
  priorities?: string;
  general?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fireAnalytics(eventName: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', eventName, props);
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Waitlist Analytics] ${eventName}`, props || {});
    }
  } catch {
    // Analytics failure should never break UI
  }
}

export default function WaitlistPage() {
  const [formData, setFormData] = useState<FormState>({
    full_name: '',
    email: '',
    country: '',
    track: '',
    priorities: [],
    consent: false,
    company: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [priorityLimitWarning, setPriorityLimitWarning] = useState<string | null>(null);

  // Focus management refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const consentInputRef = useRef<HTMLInputElement>(null);
  const successPanelRef = useRef<HTMLDivElement>(null);

  // Unique IDs for accessibility aria-describedby
  const nameErrorId = useId();
  const emailErrorId = useId();
  const consentErrorId = useId();
  const prioritiesErrorId = useId();
  const generalErrorId = useId();

  // Environment variables for Community Channels (Addendum)
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL;
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.CONTACT_EMAIL;

  useEffect(() => {
    fireAnalytics('waitlist_view');
    if (!contactEmail && process.env.NODE_ENV !== 'production') {
      console.warn('TODO: CONTACT_EMAIL environment variable is unset for footer contact link');
    }
  }, [contactEmail]);

  useEffect(() => {
    if (submitted && successPanelRef.current) {
      successPanelRef.current.focus();
    }
  }, [submitted]);

  // Derive initials for live preview
  const initials = React.useMemo(() => {
    const trimmed = formData.full_name.trim();
    if (!trimmed) return '—';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [formData.full_name]);

  const selectedCountryLabel = React.useMemo(() => {
    if (!formData.country) return 'Location';
    const found = ALLOWED_COUNTRIES.find(c => c.value === formData.country);
    return found ? found.label : 'Location';
  }, [formData.country]);

  const selectedTrackLabel = React.useMemo(() => {
    if (!formData.track) return 'What you do';
    const found = ALLOWED_TRACKS.find(t => t.value === formData.track);
    return found ? found.label : 'What you do';
  }, [formData.track]);

  const handlePriorityToggle = (priority: PriorityValue) => {
    setErrors(prev => ({ ...prev, priorities: undefined }));
    setPriorityLimitWarning(null);

    setFormData(prev => {
      const exists = prev.priorities.includes(priority);
      if (exists) {
        return {
          ...prev,
          priorities: prev.priorities.filter(p => p !== priority),
        };
      }
      if (prev.priorities.length >= 3) {
        setPriorityLimitWarning('You can select up to 3 priorities.');
        return prev;
      }
      return {
        ...prev,
        priorities: [...prev.priorities, priority],
      };
    });
  };

  const handleCopyInviteLink = async () => {
    try {
      const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/waitlist?ref=share`
        : 'https://sync730.com/waitlist?ref=share';

      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      // Fallback if clipboard API is denied
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const newErrors: FormErrors = {};

    const cleanName = formData.full_name.trim();
    if (!cleanName) {
      newErrors.full_name = 'Please enter your full name.';
    } else if (cleanName.length > 100) {
      newErrors.full_name = 'Full name must be 100 characters or fewer.';
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) {
      newErrors.email = 'Please enter your email address.';
    } else if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.consent) {
      newErrors.consent = 'You must agree to the privacy policy to join.';
    }

    if (formData.priorities.length > 3) {
      newErrors.priorities = 'You can select up to 3 priorities.';
    }

    setErrors(newErrors);

    // Focus first invalid field
    if (newErrors.full_name) {
      nameInputRef.current?.focus();
      return;
    }
    if (newErrors.email) {
      emailInputRef.current?.focus();
      return;
    }
    if (newErrors.consent) {
      consentInputRef.current?.focus();
      return;
    }
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanName,
          email: cleanEmail,
          country: formData.country || null,
          track: formData.track || null,
          priorities: formData.priorities,
          consent: formData.consent,
          company: formData.company, // Honeypot
          source: 'waitlist_page',
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errorMsg =
          data?.error ||
          'We couldn’t save your details. Check your connection and try again.';
        setErrors({ general: errorMsg });
        fireAnalytics('waitlist_submit_error', { status: response.status });
        return;
      }

      // Success
      setSubmittedName(cleanName);
      setSubmittedEmail(cleanEmail);
      setSubmitted(true);
      fireAnalytics('waitlist_submit_success');
    } catch {
      setErrors({
        general:
          'We couldn’t save your details. Check your connection and try again.',
      });
      fireAnalytics('waitlist_submit_error', { network: true });
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = submittedName.split(/\s+/)[0] || 'there';

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#111] flex flex-col font-sans selection:bg-[#edf3ec] selection:text-[#346538]">
      {/* Head typography and SEO styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Geist:wght@400;500;600;700&display=swap');
        
        .font-heading {
          font-family: 'Bricolage Grotesque', system-ui, -apple-system, sans-serif;
        }
        .font-body {
          font-family: 'Geist', system-ui, -apple-system, sans-serif;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-[#e6e6e1] bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/waitlist" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#346538] bg-[#edf3ec] px-2.5 py-1 rounded-[4px]">
              Pre-launch
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Two-Column Hero (Single column under 860px) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-16">
          {/* Left Column: Headline, Lede, What we're building */}
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-[#edf3ec] text-[#346538] text-xs font-semibold rounded-[4px] uppercase tracking-wider">
              Talent Community
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111] leading-[1.12]">
              Join the Sync730 talent waitlist
            </h1>

            <p className="font-body text-base sm:text-lg text-[#6a6a64] leading-relaxed">
              A fairer, signal-driven recruitment platform connecting verified African talent with top companies locally and globally.
            </p>

            {/* What we're building */}
            <div className="pt-4 border-t border-[#e6e6e1] space-y-4">
              <h2 className="font-heading text-lg font-bold text-[#111]">
                What we’re building
              </h2>
              <ul className="space-y-3 font-body text-sm sm:text-base text-[#111]">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111] mt-2 flex-shrink-0" aria-hidden="true" />
                  <span>Roles matched to your real craft, verified skills, and career priorities</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111] mt-2 flex-shrink-0" aria-hidden="true" />
                  <span>Direct access to vetted companies hiring across Nigeria, Africa, and remotely</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111] mt-2 flex-shrink-0" aria-hidden="true" />
                  <span>Transparent compensation expectations with zero hidden filters</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111] mt-2 flex-shrink-0" aria-hidden="true" />
                  <span>A talent-first community designed to respect your time and data</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live Profile Preview + Signup Form / Success State */}
          <div className="w-full space-y-4">
            {/* Live Profile Preview (Decorative, aria-hidden) */}
            <div
              aria-hidden="true"
              className="bg-[#f6f6f3] border border-[#e6e6e1] rounded-[6px] p-4 select-none transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#111] text-white flex items-center justify-center font-bold text-sm tracking-wider">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-sm text-[#111] truncate">
                    {formData.full_name.trim() || 'Your Name'}
                  </p>
                  <p className="text-xs text-[#6a6a64] truncate">
                    {selectedTrackLabel} · {selectedCountryLabel}
                  </p>
                </div>
              </div>

              {/* Selected Priority Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                {formData.priorities.length > 0 ? (
                  formData.priorities.map(p => (
                    <span
                      key={p}
                      className="inline-flex items-center text-[11px] font-medium bg-white border border-[#e6e6e1] text-[#111] px-2 py-0.5 rounded-[4px]"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#6a6a64] italic">
                    Your selected priorities will appear here
                  </span>
                )}
              </div>
            </div>

            {/* Form Card or Success Panel */}
            <div className="bg-white border border-[#e6e6e1] rounded-[6px] p-6 sm:p-8">
              {submitted ? (
                /* Success State */
                <div
                  ref={successPanelRef}
                  tabIndex={-1}
                  className="space-y-6 focus:outline-none"
                  aria-live="polite"
                >
                  <div className="space-y-2">
                    <span className="inline-block px-2.5 py-1 bg-[#edf3ec] text-[#346538] text-xs font-semibold rounded-[4px] uppercase tracking-wider">
                      You’re on the list
                    </span>
                    <h2 className="font-heading text-2xl font-extrabold text-[#111]">
                      You’re on the list, {firstName}.
                    </h2>
                    <p className="font-body text-sm text-[#6a6a64] leading-relaxed">
                      We’ll send launch updates and early invitations to{' '}
                      <strong className="text-[#111] font-semibold">{submittedEmail}</strong>.
                    </p>
                  </div>

                  {/* Copy Invite Link */}
                  <div className="pt-4 border-t border-[#e6e6e1] space-y-2">
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="w-full h-11 px-4 bg-[#111] text-white text-sm font-semibold rounded-[6px] hover:bg-neutral-800 active:bg-black focus-visible:outline-2 focus-visible:outline-[#111] focus-visible:outline-offset-2 transition-colors flex items-center justify-center gap-2"
                    >
                      {copySuccess ? 'Invite link copied' : 'Copy invite link'}
                    </button>
                    <p className="text-xs text-[#6a6a64] text-center">
                      Share with colleagues or teammates interested in what we’re building.
                    </p>
                  </div>

                  {/* Addendum: Community Channel Links */}
                  {(whatsappUrl || telegramUrl) && (
                    <div className="pt-6 border-t border-[#e6e6e1] space-y-3">
                      <h3 className="font-heading text-base font-bold text-[#111]">
                        Get updates while you wait
                      </h3>
                      <p className="font-body text-xs text-[#6a6a64] leading-relaxed">
                        Join our channel for launch news and job-search tips. It is one-way, so you will not get messages from other members.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => fireAnalytics('waitlist_channel_click', { channel: 'whatsapp' })}
                            className="flex-1 h-10 px-4 bg-white border border-[#e6e6e1] text-[#111] text-xs font-semibold rounded-[6px] hover:bg-[#f6f6f3] focus-visible:outline-2 focus-visible:outline-[#111] focus-visible:outline-offset-2 transition-colors inline-flex items-center justify-center text-center"
                          >
                            Join on WhatsApp
                          </a>
                        )}
                        {telegramUrl && (
                          <a
                            href={telegramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => fireAnalytics('waitlist_channel_click', { channel: 'telegram' })}
                            className="flex-1 h-10 px-4 bg-white border border-[#e6e6e1] text-[#111] text-xs font-semibold rounded-[6px] hover:bg-[#f6f6f3] focus-visible:outline-2 focus-visible:outline-[#111] focus-visible:outline-offset-2 transition-colors inline-flex items-center justify-center text-center"
                          >
                            Join on Telegram
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Waitlist Form */
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* General Error Banner */}
                  {errors.general && (
                    <div
                      id={generalErrorId}
                      role="alert"
                      className="p-3 bg-red-50 border border-[#9f2f2d]/30 text-[#9f2f2d] text-sm rounded-[6px]"
                    >
                      {errors.general}
                    </div>
                  )}

                  {/* Honeypot Field (Visually hidden) */}
                  <div style={{ display: 'none' }} aria-hidden="true">
                    <label htmlFor="company-honeypot">Company</label>
                    <input
                      id="company-honeypot"
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="waitlist-full-name"
                      className="block text-sm font-semibold text-[#111]"
                    >
                      Full name <span className="text-[#9f2f2d]">*</span>
                    </label>
                    <input
                      id="waitlist-full-name"
                      ref={nameInputRef}
                      type="text"
                      name="full_name"
                      maxLength={100}
                      value={formData.full_name}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, full_name: e.target.value }));
                        if (errors.full_name) {
                          setErrors(prev => ({ ...prev, full_name: undefined }));
                        }
                      }}
                      aria-invalid={!!errors.full_name}
                      aria-describedby={errors.full_name ? nameErrorId : undefined}
                      className={`w-full h-11 px-3 text-[16px] text-[#111] bg-white border rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111] focus-visible:outline-offset-2 transition-colors ${
                        errors.full_name ? 'border-[#9f2f2d]' : 'border-[#e6e6e1]'
                      }`}
                      placeholder="e.g. Amara Okafor"
                    />
                    {errors.full_name && (
                      <p id={nameErrorId} className="text-xs text-[#9f2f2d] font-medium pt-0.5">
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="waitlist-email"
                      className="block text-sm font-semibold text-[#111]"
                    >
                      Email address <span className="text-[#9f2f2d]">*</span>
                    </label>
                    <input
                      id="waitlist-email"
                      ref={emailInputRef}
                      type="email"
                      name="email"
                      maxLength={254}
                      value={formData.email}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, email: e.target.value }));
                        if (errors.email) {
                          setErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? emailErrorId : undefined}
                      className={`w-full h-11 px-3 text-[16px] text-[#111] bg-white border rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111] focus-visible:outline-offset-2 transition-colors ${
                        errors.email ? 'border-[#9f2f2d]' : 'border-[#e6e6e1]'
                      }`}
                      placeholder="amara@example.com"
                    />
                    {errors.email && (
                      <p id={emailErrorId} className="text-xs text-[#9f2f2d] font-medium pt-0.5">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="waitlist-country"
                      className="block text-sm font-semibold text-[#111]"
                    >
                      Country
                    </label>
                    <select
                      id="waitlist-country"
                      name="country"
                      value={formData.country}
                      onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full h-11 px-3 text-[16px] text-[#111] bg-white border border-[#e6e6e1] rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111] focus-visible:outline-offset-2 transition-colors"
                    >
                      <option value="">Select your country</option>
                      {ALLOWED_COUNTRIES.map(c => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Track (What you do) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="waitlist-track"
                      className="block text-sm font-semibold text-[#111]"
                    >
                      What you do
                    </label>
                    <select
                      id="waitlist-track"
                      name="track"
                      value={formData.track}
                      onChange={e => setFormData(prev => ({ ...prev, track: e.target.value }))}
                      className="w-full h-11 px-3 text-[16px] text-[#111] bg-white border border-[#e6e6e1] rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111] focus-visible:outline-offset-2 transition-colors"
                    >
                      <option value="">Select your primary craft</option>
                      {ALLOWED_TRACKS.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priorities ("What matters most") */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="block text-sm font-semibold text-[#111]">
                        What matters most to you in your next role?
                      </span>
                      <span className="text-xs text-[#6a6a64]">
                        {formData.priorities.length}/3 selected
                      </span>
                    </div>

                    <p className="text-xs text-[#6a6a64]">
                      Select up to 3 priorities to help us curate relevant opportunities.
                    </p>

                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1"
                      role="group"
                      aria-label="Career priorities (select up to 3)"
                    >
                      {ALLOWED_PRIORITIES.map(priority => {
                        const isChecked = formData.priorities.includes(priority);
                        const isAtLimit = formData.priorities.length >= 3 && !isChecked;

                        return (
                          <label
                            key={priority}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-[6px] text-xs font-medium cursor-pointer transition-colors select-none ${
                              isChecked
                                ? 'bg-[#edf3ec] border-[#346538] text-[#346538]'
                                : isAtLimit
                                ? 'bg-neutral-50 border-[#e6e6e1] text-[#6a6a64] opacity-75'
                                : 'bg-white border-[#e6e6e1] text-[#111] hover:bg-[#f6f6f3]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="priorities"
                              value={priority}
                              checked={isChecked}
                              onChange={() => handlePriorityToggle(priority)}
                              className="w-4 h-4 rounded text-[#111] border-[#e6e6e1] focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-1"
                            />
                            <span>{priority}</span>
                          </label>
                        );
                      })}
                    </div>

                    {priorityLimitWarning && (
                      <p className="text-xs text-[#9f2f2d] font-medium pt-1">
                        {priorityLimitWarning}
                      </p>
                    )}
                    {errors.priorities && (
                      <p id={prioritiesErrorId} className="text-xs text-[#9f2f2d] font-medium pt-1">
                        {errors.priorities}
                      </p>
                    )}
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        ref={consentInputRef}
                        type="checkbox"
                        name="consent"
                        checked={formData.consent}
                        onChange={e => {
                          setFormData(prev => ({ ...prev, consent: e.target.checked }));
                          if (errors.consent) {
                            setErrors(prev => ({ ...prev, consent: undefined }));
                          }
                        }}
                        aria-invalid={!!errors.consent}
                        aria-describedby={errors.consent ? consentErrorId : undefined}
                        className="w-4 h-4 mt-0.5 rounded text-[#111] border-[#e6e6e1] focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-1 flex-shrink-0"
                      />
                      <span className="text-xs text-[#6a6a64] leading-relaxed">
                        I agree to the processing of my information in accordance with the{' '}
                        <Link
                          href="/privacy"
                          target="_blank"
                          className="text-[#111] underline hover:text-black font-medium"
                        >
                          Privacy Policy
                        </Link>
                        . <span className="text-[#9f2f2d]">*</span>
                      </span>
                    </label>
                    {errors.consent && (
                      <p id={consentErrorId} className="text-xs text-[#9f2f2d] font-medium pt-1 pl-7">
                        {errors.consent}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-[#111] text-white text-base font-semibold rounded-[6px] hover:bg-neutral-800 active:bg-black disabled:bg-neutral-400 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#111] focus-visible:outline-offset-2 transition-colors flex items-center justify-center"
                  >
                    {submitting ? 'Joining...' : 'Join the Waitlist'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <section className="pt-12 border-t border-[#e6e6e1] max-w-3xl mx-auto space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="font-heading text-2xl font-extrabold text-[#111]">
              Frequently asked questions
            </h2>
            <p className="font-body text-sm text-[#6a6a64]">
              Everything you need to know about the waitlist and our platform.
            </p>
          </div>

          <div className="space-y-3">
            {/* FAQ 1 */}
            <details className="group border border-[#e6e6e1] rounded-[6px] bg-white transition-all">
              <summary className="p-4 sm:p-5 font-heading text-base font-bold text-[#111] cursor-pointer list-none flex items-center justify-between gap-4 focus-visible:outline-2 focus-visible:outline-[#111]">
                <span>When will Sync730 launch?</span>
                <span className="text-xl text-[#6a6a64] group-open:rotate-45 transition-transform select-none" aria-hidden="true">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 font-body text-sm text-[#6a6a64] leading-relaxed border-t border-[#e6e6e1] pt-3">
                We’re rolling out invitations in batches starting soon. Joining the waitlist reserves your place in line.
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="group border border-[#e6e6e1] rounded-[6px] bg-white transition-all">
              <summary className="p-4 sm:p-5 font-heading text-base font-bold text-[#111] cursor-pointer list-none flex items-center justify-between gap-4 focus-visible:outline-2 focus-visible:outline-[#111]">
                <span>How does the talent community work?</span>
                <span className="text-xl text-[#6a6a64] group-open:rotate-45 transition-transform select-none" aria-hidden="true">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 font-body text-sm text-[#6a6a64] leading-relaxed border-t border-[#e6e6e1] pt-3">
                Sync730 matches your skills, seniority, and work preferences directly with verified employers across Nigeria and international teams hiring in Africa.
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group border border-[#e6e6e1] rounded-[6px] bg-white transition-all">
              <summary className="p-4 sm:p-5 font-heading text-base font-bold text-[#111] cursor-pointer list-none flex items-center justify-between gap-4 focus-visible:outline-2 focus-visible:outline-[#111]">
                <span>Is joining the waitlist free?</span>
                <span className="text-xl text-[#6a6a64] group-open:rotate-45 transition-transform select-none" aria-hidden="true">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 font-body text-sm text-[#6a6a64] leading-relaxed border-t border-[#e6e6e1] pt-3">
                Yes, joining the talent waitlist and community is completely free for candidates.
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group border border-[#e6e6e1] rounded-[6px] bg-white transition-all">
              <summary className="p-4 sm:p-5 font-heading text-base font-bold text-[#111] cursor-pointer list-none flex items-center justify-between gap-4 focus-visible:outline-2 focus-visible:outline-[#111]">
                <span>What happens to my data?</span>
                <span className="text-xl text-[#6a6a64] group-open:rotate-45 transition-transform select-none" aria-hidden="true">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 font-body text-sm text-[#6a6a64] leading-relaxed border-t border-[#e6e6e1] pt-3">
                Your information is stored securely and never shared with employers without your explicit permission. You can request its removal at any time.
              </div>
            </details>

            {/* FAQ 5 (Addendum requirement) */}
            <details className="group border border-[#e6e6e1] rounded-[6px] bg-white transition-all">
              <summary className="p-4 sm:p-5 font-heading text-base font-bold text-[#111] cursor-pointer list-none flex items-center justify-between gap-4 focus-visible:outline-2 focus-visible:outline-[#111]">
                <span>Where can I get updates?</span>
                <span className="text-xl text-[#6a6a64] group-open:rotate-45 transition-transform select-none" aria-hidden="true">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 font-body text-sm text-[#6a6a64] leading-relaxed border-t border-[#e6e6e1] pt-3">
                Join our WhatsApp or Telegram channel after you sign up. We post launch news and job-search tips there.
              </div>
            </details>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e6e6e1] bg-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6a6a64]">
          <p>© 2026 Sync730. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#111] underline transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#111] underline transition-colors">
              Terms
            </Link>
            <a
              href={contactEmail ? `mailto:${contactEmail}` : '#'}
              className="hover:text-[#111] underline transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
