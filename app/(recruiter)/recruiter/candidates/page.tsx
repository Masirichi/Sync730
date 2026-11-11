'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Unlock, Lock, Mail, Phone, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CandidateProfile {
  id: string;
  maskedId: string;
  realName: string;
  role: string;
  skills: string[];
  match: number;
  initials: string;
  realEmail: string;
  realPhone: string;
  is_masked: boolean;
  experience: string;
  location: string;
}

const initialCandidates: CandidateProfile[] = [
  {
    id: 'cand-001',
    maskedId: 'Candidate #4A91E0',
    realName: 'Jane Doe',
    role: 'Senior Frontend Engineer',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    match: 95,
    initials: 'JD',
    realEmail: 'jane.doe@example.com',
    realPhone: '+1 (555) 234-5678',
    is_masked: true,
    experience: '6 years experience',
    location: 'Remote / Lagos',
  },
  {
    id: 'cand-002',
    maskedId: 'Candidate #7F3B12',
    realName: 'John Smith',
    role: 'Full Stack Developer',
    skills: ['Node.js', 'React', 'PostgreSQL', 'Supabase'],
    match: 88,
    initials: 'JS',
    realEmail: 'john.smith@example.com',
    realPhone: '+1 (555) 876-5432',
    is_masked: true,
    experience: '4 years experience',
    location: 'Remote / London',
  },
  {
    id: 'cand-003',
    maskedId: 'Candidate #C82D99',
    realName: 'Alice Brown',
    role: 'Product Designer',
    skills: ['Figma', 'UX Research', 'Design Systems'],
    match: 82,
    initials: 'AB',
    realEmail: 'alice.brown@example.com',
    realPhone: '+1 (555) 345-6789',
    is_masked: true,
    experience: '5 years experience',
    location: 'Remote / Berlin',
  },
  {
    id: 'cand-004',
    maskedId: 'Candidate #E11C45',
    realName: 'Bob Wilson',
    role: 'DevOps & Cloud Engineer',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    match: 78,
    initials: 'BW',
    realEmail: 'bob.wilson@example.com',
    realPhone: '+1 (555) 901-2345',
    is_masked: true,
    experience: '7 years experience',
    location: 'Remote / San Francisco',
  },
];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>(initialCandidates);
  const [tokenBalance, setTokenBalance] = useState(15);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const handleUnlockCandidate = (candidateId: string) => {
    if (tokenBalance < 1) {
      toast.error('Insufficient tokens. Please purchase more recruiter tokens to unlock candidate profiles.');
      return;
    }

    setUnlockingId(candidateId);

    // Simulate token unlock transaction
    setTimeout(() => {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, is_masked: false } : c))
      );
      setTokenBalance((prev) => prev - 1);
      setUnlockingId(null);
      toast.success('Candidate unlocked successfully! Direct contact info is now visible.');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header with Token Wallet & Privacy Indicator */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Candidates Pool</h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-xs">
              <Shield className="h-3 w-3 text-primary" /> Privacy Protected
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Candidate names and contact information remain masked until unlocked with tokens.
          </p>
        </div>

        {/* Token Balance Pill */}
        <div className="flex items-center gap-2 self-start rounded-full border bg-card px-4 py-1.5 shadow-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-medium text-muted-foreground">Available Tokens:</span>
          <span className="text-sm font-bold text-foreground">{tokenBalance}</span>
        </div>
      </div>

      {/* Candidate Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {candidates.map((c) => {
          const isMasked = c.is_masked;

          return (
            <Card
              key={c.id}
              className={`transition-all duration-200 ${
                isMasked ? 'border-border/70 hover:border-primary/40' : 'border-primary/40 bg-card/60 shadow-sm'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12 border">
                    <AvatarFallback
                      className={`font-semibold ${
                        isMasked
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {isMasked ? <Lock className="h-5 w-5 text-muted-foreground" /> : c.initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Body */}
                  <div className="flex-1 space-y-2.5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base leading-tight">
                            {isMasked ? c.maskedId : c.realName}
                          </h3>
                          {isMasked ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase tracking-wider gap-1 text-amber-600 bg-amber-500/10 border-amber-500/20"
                            >
                              <Lock className="h-2.5 w-2.5" /> Masked
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase tracking-wider gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5" /> Unlocked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{c.role}</p>
                      </div>

                      <Badge
                        variant="secondary"
                        className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 whitespace-nowrap"
                      >
                        {c.match}% match
                      </Badge>
                    </div>

                    {/* Metadata & Location */}
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span>{c.experience}</span>
                      <span>•</span>
                      <span>{c.location}</span>
                    </div>

                    {/* Contact Details (Masked vs Unlocked) */}
                    {isMasked ? (
                      <div className="rounded-md border border-dashed border-border/80 bg-muted/40 p-2.5 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span className="font-mono text-[11px] text-muted-foreground/70">
                            ••••••••••••••@•••••••.com
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span className="font-mono text-[11px] text-muted-foreground/70">
                            +• (•••) •••-••••
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-emerald-600" />
                          <a
                            href={`mailto:${c.realEmail}`}
                            className="text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {c.realEmail}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{c.realPhone}</span>
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs py-0 px-2 font-normal">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      {isMasked ? (
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs h-8"
                          onClick={() => handleUnlockCandidate(c.id)}
                          disabled={unlockingId === c.id}
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          {unlockingId === c.id ? 'Unlocking...' : 'Unlock Profile (1 Token)'}
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" className="gap-1.5 text-xs h-8">
                            View Full Profile
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                            <Mail className="h-3.5 w-3.5" /> Message
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
