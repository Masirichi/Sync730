'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RecruiterApplication {
  id: string;
  maskedId: string;
  realName: string;
  role: string;
  date: string;
  status: 'new' | 'reviewing' | 'interview' | 'offer' | 'rejected';
  initials: string;
  is_masked: boolean;
}

const initialApplications: RecruiterApplication[] = [
  { id: 'app-1', maskedId: 'Candidate #4A91E0', realName: 'Jane Doe', role: 'Senior Frontend Engineer', date: 'Nov 8, 2026', status: 'new', initials: 'JD', is_masked: true },
  { id: 'app-2', maskedId: 'Candidate #7F3B12', realName: 'John Smith', role: 'Full Stack Developer', date: 'Nov 7, 2026', status: 'reviewing', initials: 'JS', is_masked: true },
  { id: 'app-3', maskedId: 'Candidate #C82D99', realName: 'Alice Brown', role: 'Product Designer', date: 'Nov 6, 2026', status: 'interview', initials: 'AB', is_masked: false },
  { id: 'app-4', maskedId: 'Candidate #E11C45', realName: 'Bob Wilson', role: 'DevOps Engineer', date: 'Nov 4, 2026', status: 'offer', initials: 'BW', is_masked: true },
  { id: 'app-5', maskedId: 'Candidate #99A1C2', realName: 'Carol Lee', role: 'Full Stack Developer', date: 'Nov 2, 2026', status: 'rejected', initials: 'CL', is_masked: true },
];

const statusStyles: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  reviewing: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  interview: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  offer: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function RecruiterApplicationsPage() {
  const [apps, setApps] = useState<RecruiterApplication[]>(initialApplications);

  const toggleUnlock = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id === appId) {
          const next = !a.is_masked;
          toast.success(next ? 'Candidate masked' : 'Candidate unlocked with 1 token');
          return { ...a, is_masked: next };
        }
        return a;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-xs">
              <Shield className="h-3 w-3 text-primary" /> Masking Enforced
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Review incoming applications. Contact details are masked according to candidate privacy rules.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {apps.map((app) => {
          const isMasked = app.is_masked;

          return (
            <Card key={app.id} className="transition-all duration-200 hover:shadow-sm">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback
                      className={`text-sm font-semibold ${
                        isMasked
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {isMasked ? <Lock className="h-4 w-4" /> : app.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {isMasked ? app.maskedId : app.realName}
                      </h3>
                      {isMasked ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 gap-0.5 text-amber-600 bg-amber-500/10 border-amber-500/20"
                        >
                          <Lock className="h-2 w-2" /> Masked
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 gap-0.5 text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                        >
                          <CheckCircle2 className="h-2 w-2" /> Unlocked
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.role} · Applied {app.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge variant="outline" className={statusStyles[app.status]}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </Badge>

                  {isMasked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-8"
                      onClick={() => toggleUnlock(app.id)}
                    >
                      <Unlock className="h-3 w-3" /> Unlock (1 Token)
                    </Button>
                  ) : (
                    <Button size="sm" className="text-xs h-8">
                      Review Dossier
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
