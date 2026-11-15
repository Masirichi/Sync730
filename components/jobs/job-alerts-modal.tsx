// components/jobs/job-alerts-modal.tsx
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { fireJobAnalytics } from '@/lib/analytics/client';

interface JobAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLocations?: string[];
  initialLocation?: string;
  initialModality?: string;
}

const MODALITIES = [
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'onsite', label: 'Onsite' },
];

const COMMON_ROLES = [
  { id: 'swe', label: 'Software Engineering' },
  { id: 'design', label: 'Product & Design' },
  { id: 'data', label: 'Data & AI' },
  { id: 'devops', label: 'DevOps & Cloud' },
  { id: 'product', label: 'Product Management' },
];

export function JobAlertsModal({
  isOpen,
  onClose,
  availableLocations = ['Lagos, Nigeria', 'Abuja, Nigeria', 'Worldwide Remote'],
  initialLocation,
  initialModality = 'remote',
}: JobAlertsModalProps) {
  const [email, setEmail] = useState('');
  const [selectedModalities, setSelectedModalities] = useState<string[]>([initialModality]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    initialLocation && initialLocation !== 'all' ? [initialLocation] : []
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['swe']);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleModality = (mod: string) => {
    setSelectedModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setErrorMessage('You must agree to receive job alerts in accordance with our Privacy Policy.');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/jobs/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          modalities: selectedModalities,
          locations: selectedLocations,
          role_types: selectedRoles,
          consent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to subscribe to alerts.');
        setIsSubmitting(false);
        return;
      }

      fireJobAnalytics('alert_subscribed', { modalities_count: selectedModalities.length });
      setSubmitted(true);
    } catch {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitted(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] p-6 bg-background text-foreground border border-border rounded-2xl shadow-xl">
        {submitted ? (
          <div className="space-y-4 py-4 text-center">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Job alert confirmed
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              We’ve registered your preferences for <strong className="text-foreground">{email}</strong>. When verified roles matching your criteria are published, you’ll receive an alert. You can unsubscribe at any time.
            </p>
            <Button
              type="button"
              onClick={handleClose}
              className="mt-4 w-full h-11 text-sm font-semibold bg-foreground text-background rounded-full hover:opacity-90"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                Get job alerts
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Receive notifications when verified roles matching your target disciplines and work arrangement go live.
              </DialogDescription>
            </DialogHeader>

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="alert-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email address *
              </Label>
              <Input
                id="alert-email"
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs rounded-xl border-border bg-background text-foreground"
              />
            </div>

            {/* Modality Chips */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Work arrangement
              </Label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {MODALITIES.map((m) => {
                  const active = selectedModalities.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModality(m.id)}
                      className={`h-8 px-3.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Disciplines */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Discipline / Role track
              </Label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {COMMON_ROLES.map((r) => {
                  const active = selectedRoles.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRole(r.id)}
                      className={`h-8 px-3.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Required Consent Checkbox */}
            <div className="pt-2">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="alert-consent"
                  checked={consent}
                  onCheckedChange={(val) => setConsent(Boolean(val))}
                  className="mt-0.5 rounded border-border"
                />
                <Label htmlFor="alert-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I consent to Sync730 sending me verified job alerts and platform notifications in accordance with the{' '}
                  <Link href="/privacy" className="underline hover:text-foreground text-foreground">
                    Privacy Policy
                  </Link>
                  . I understand I can unsubscribe anytime with one click.
                </Label>
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-full border-border text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !consent}
                className="rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 px-6"
              >
                {isSubmitting ? 'Subscribing...' : 'Activate alerts'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
