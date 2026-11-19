// app/how-we-verify/page.tsx
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Roles on Sync730 | Redirecting...',
  robots: {
    index: false,
    follow: false,
  },
};

export default function HowWeVerifyPage() {
  redirect('/find-work');
}
