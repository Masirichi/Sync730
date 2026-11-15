// app/ai-transparency/page.tsx
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'AI Transparency & Algorithmic Fairness Guarantee | Sync730',
  description:
    'Our commitment to algorithmic fairness, objective technical vetting, advisory AI scores, and candidate review procedures under NDPA 2023.',
};

export default function AiTransparencyPage() {
  redirect('/scoring-methodology');
}
