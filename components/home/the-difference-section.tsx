// components/home/the-difference-section.tsx
import React from 'react';

const differenceItems = [
  {
    number: '01',
    title: 'Find the right fit',
    text: 'Discover roles and people through a clearer, more considered matching experience.',
  },
  {
    number: '02',
    title: 'Move with momentum',
    text: 'Keep every application, conversation, and next step in one calm workspace.',
  },
  {
    number: '03',
    title: 'Build better teams',
    text: 'Give hiring teams the context they need to make confident decisions faster.',
  },
];

export function TheDifferenceSection() {
  return (
    <section className="border-b border-border/70 bg-background text-foreground py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Left Column: Eyebrow with black dot & Headline */}
          <div>
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
              <span>THE SYNC730 DIFFERENCE</span>
            </div>

            <h2 className="mt-6 max-w-sm text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl text-foreground">
              Less noise.
              <br />
              <span className="text-muted-foreground">More signal.</span>
            </h2>
          </div>

          {/* Right Column: Three hairline rows with numeral, title, and description (NO icons) */}
          <div className="divide-y divide-border/70 border-y border-border/70">
            {differenceItems.map((item) => (
              <div
                key={item.number}
                className="grid gap-4 py-8 sm:grid-cols-[64px_1.1fr_1.4fr] sm:items-start"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
                  {item.number}
                </span>
                <h3 className="text-xl font-medium tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
