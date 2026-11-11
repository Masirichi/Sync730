'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquareText, ArrowUpRight } from 'lucide-react';

const conversations = [
  { name: 'Sarah Chen', role: 'Recruiter at TechCorp', initials: 'SC', lastMessage: 'Hi Jane, I reviewed your application and...', time: '2h ago', unread: true },
  { name: 'Mike Johnson', role: 'Recruiter at DesignHub', initials: 'MJ', lastMessage: "Thanks for applying! We'd love to schedule...", time: '1d ago', unread: false },
  { name: 'Emily Davis', role: 'Recruiter at StartupXYZ', initials: 'ED', lastMessage: 'Your profile looks great. Are you open to...', time: '3d ago', unread: false },
];

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Messages
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Direct communication channels with verified hiring teams.
        </p>
      </div>

      <div className="space-y-3">
        {conversations.map((conv) => (
          <Card
            key={conv.name}
            className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
          >
            <CardContent className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold">
                    {conv.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {conv.name}
                    </h3>
                    {conv.unread && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-neutral-500">
                    {conv.role}
                  </p>
                  <p className="truncate text-xs text-neutral-600 dark:text-neutral-400 max-w-md">
                    {conv.lastMessage}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[11px] text-neutral-400 font-medium">
                  {conv.time}
                </span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 inline-flex items-center gap-0.5">
                  Open <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
