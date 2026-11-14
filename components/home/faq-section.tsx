// components/home/faq-section.tsx
'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const faqs = [
  {
    id: 'free_for_candidates',
    question: 'Is it free for candidates?',
    answer:
      'Yes. Sync730 is completely free for candidates. Talents can create a profile, take mock and real video interviews, access the application tracker, and receive curated role matches without any application or subscription fees.',
  },
  {
    id: 'ai_interviewing_work',
    question: 'How does AI interviewing work?',
    answer:
      'When you apply for a role through Sync730, you receive a link to take an AI-moderated video interview within 48 hours on any computer or mobile device. You answer structured questions tailored to the position. Our AI evaluates technical depth, practical problem solving, and communication clarity against a recruiter-approved rubric, generating an evidence-backed scorecard with timestamped citations.',
  },
  {
    id: 'does_ai_decide',
    question: 'Does AI decide who gets hired?',
    answer:
      'Never. Sync730 operates under a strict "AI scores, humans decide" governance policy. AI evaluation scores are purely advisory tools designed to help recruiters navigate high application volumes efficiently. Hiring teams review candidate responses directly, conduct final interviews, and make all selection and offer decisions.',
  },
  {
    id: 'data_handled',
    question: 'How is candidate data handled?',
    answer:
      'Candidate recordings, résumés, and personal data are encrypted in transit and at rest in full compliance with the Nigeria Data Protection Act 2023 (NDPA). Information is only shared with verified employers for the specific roles a candidate applies to. Candidates maintain complete visibility over their profile and can request data deletion at any time.',
  },
  {
    id: 'countries_covered',
    question: 'Which countries do you cover?',
    answer:
      'Sync730 is built for Nigeria and the wider African continent. We connect African talent with local organizations as well as global remote teams hiring across Africa and EMEA time zones.',
  },
  {
    id: 'how_to_start',
    question: 'How do I get started?',
    answer:
      'Organizations can book a demo to post open positions and configure custom interview rubrics. Candidates can browse live openings under Find Work or create a free profile to receive curated job matches.',
  },
];

export function FaqSection() {
  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>, faqId: string) => {
    if (e.currentTarget.open) {
      trackEvent({ name: 'faq_open', which: faqId });
    }
  };

  return (
    <section className="border-b border-border/70 bg-background text-foreground py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
        {/* Eyebrow with leading black dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>FAQ</span>
        </div>

        {/* H2 */}
        <h2 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl text-foreground">
          Questions
        </h2>

        {/* Native details/summary Accordion */}
        <div className="mt-14 divide-y divide-border/70 border-y border-border/70">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group py-6 [&_summary::-webkit-details-marker]:hidden"
              onToggle={(e) => handleToggle(e, faq.id)}
            >
              <summary className="flex cursor-pointer items-center justify-between text-left text-lg font-medium tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded px-1">
                <span>{faq.question}</span>
                <span className="ml-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                  <ChevronDown className="h-5 w-5 stroke-[1.5]" />
                </span>
              </summary>
              <div className="mt-4 text-sm leading-7 text-muted-foreground pr-8">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
