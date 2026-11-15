// components/home/social-proof-section.tsx
'use client';

import React from 'react';
import { HOME_CONTENT } from '@/src/content/home';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  companyOrCity: string;
  quote: string;
  avatarUrl?: string;
}

export interface ApprovedPartner {
  id: string;
  name: string;
  logoUrl?: string;
  verified: boolean;
}

interface SocialProofSectionProps {
  testimonials?: Testimonial[];
  partners?: ApprovedPartner[];
}

export function SocialProofSection({
  testimonials = [],
  partners = [],
}: SocialProofSectionProps) {
  const hasRealTestimonials = testimonials && testimonials.length > 0;
  const verifiedPartners = (partners || []).filter((p) => p.verified);
  const hasPartners = verifiedPartners.length > 0;

  // RULE: Render ONLY when real testimonials exist in data. If none, render only a partner row if partners exist; otherwise omit entirely.
  // Never ship placeholder quotes.
  if (!hasRealTestimonials && !hasPartners) {
    return null;
  }

  return (
    <section
      id="social-proof"
      aria-label="Social proof"
      className="border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>{HOME_CONTENT.socialProof.label}</span>
        </div>

        <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-foreground">
          {HOME_CONTENT.socialProof.h2}
        </h2>

        {hasRealTestimonials ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="border border-border/70 bg-secondary/30 p-7 sm:p-8 rounded-xl flex flex-col justify-between"
              >
                <blockquote className="text-base leading-relaxed text-foreground italic">
                  “{t.quote}”
                </blockquote>
                <div className="mt-6 pt-4 border-t border-border/50">
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} · {t.companyOrCity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 pt-8 border-t border-border/70">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Verified Hiring Partners
            </p>
            <div className="flex flex-wrap items-center gap-8 sm:gap-12 opacity-80">
              {verifiedPartners.map((partner) => (
                <div key={partner.id} className="text-sm font-semibold tracking-tight text-foreground">
                  {partner.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
