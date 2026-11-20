import { Suspense } from 'react';
import { RecruiterMessagesView } from '@/components/recruiter/recruiter-messages-view';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Talent Messages & Chat | Recruiter Console | Sync730',
  description: 'Communicate directly with verified talents, arrange technical evaluations, and manage hiring dialogues.',
};

export default function ConsoleMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      }
    >
      <RecruiterMessagesView />
    </Suspense>
  );
}
