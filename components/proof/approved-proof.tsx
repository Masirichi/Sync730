// components/proof/approved-proof.tsx
// Optional social proof component that renders ONLY when verified, approved partner data exists
// Never renders unverified or fake testimonials.

import React from 'react';

export interface ApprovedPartner {
  id: string;
  name: string;
  logoUrl?: string;
  verified: boolean;
}

interface ApprovedProofProps {
  partners?: ApprovedPartner[];
}

export function ApprovedProof({ partners = [] }: ApprovedProofProps) {
  const verifiedPartners = partners.filter((p) => p.verified);

  if (verifiedPartners.length === 0) {
    return null; // Render nothing if no real approved data exists
  }

  return (
    <section className="border-b border-border/70 bg-background py-8">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Partnering with verified hiring teams
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-80">
          {verifiedPartners.map((partner) => (
            <div key={partner.id} className="text-sm font-semibold tracking-tight text-foreground">
              {partner.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
