'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Lock,
  Unlock,
  Zap,
  Play,
  Pause,
  Video,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  FileText,
  Sparkles,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VideoAssessment, CorporateWorkspace } from '@/lib/recruiter/types';
import { getLocalWorkspace, saveLocalWorkspace } from '@/lib/recruiter/store';
import { toast } from 'sonner';

export default function ConsoleTalentPage() {
  const [candidates, setCandidates] = useState<VideoAssessment[]>([]);
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(getLocalWorkspace());
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchTalent = async () => {
    setIsLoading(true);
    const ws = getLocalWorkspace();
    setWorkspace(ws);
    try {
      const res = await fetch(`/api/talent/list?workspace_id=${ws.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.warn('Notice: Failed to fetch talent pool:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTalent();

    const handleUpdate = () => {
      setWorkspace(getLocalWorkspace());
    };
    window.addEventListener('sync730_workspace_updated', handleUpdate);
    window.addEventListener('sync730_unlocks_updated', handleUpdate);
    window.addEventListener('sync730_assessments_updated', fetchTalent);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleUpdate);
      window.removeEventListener('sync730_unlocks_updated', handleUpdate);
      window.removeEventListener('sync730_assessments_updated', fetchTalent);
    };
  }, []);

  // Unlock Candidate Profile Action (1 Token)
  const handleUnlock = async (candidateId: string) => {
    const ws = getLocalWorkspace();
    if (ws.token_balance < 1) {
      toast.error('Insufficient tokens! Please top up your token balance on the Billing page.', {
        action: {
          label: 'Top Up Tokens',
          onClick: () => window.location.assign('/console/team'),
        },
      });
      return;
    }

    setUnlockingId(candidateId);
    try {
      const res = await fetch('/api/talent/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          workspace_id: ws.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.candidate) {
        // Update local candidate list with revealed info
        setCandidates((prev) =>
          prev.map((c) =>
            c.candidate_id === candidateId || c.id === candidateId
              ? { ...c, ...data.candidate, is_unlocked: true }
              : c
          )
        );

        // Update token balance
        if (typeof data.token_balance === 'number') {
          const updatedWs = { ...ws, token_balance: data.token_balance };
          setWorkspace(updatedWs);
          saveLocalWorkspace(updatedWs);
        }

        toast.success(`Candidate profile unlocked! 1 token spent. Contact info revealed.`);
      } else {
        throw new Error(data.error || 'Failed to unlock profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error unlocking candidate.');
    } finally {
      setUnlockingId(null);
    }
  };

  // Seed 3 Mock Candidates Helper
  const handleSeedMock = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/talent/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Seeded 3 realistic candidate video assessments!');
        await fetchTalent();
      }
    } catch {
      toast.error('Failed to seed candidates.');
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.target_role.toLowerCase().includes(search.toLowerCase()) ||
      c.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.ai_summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Vetted Talent Pool
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Browse verified technical assessments. Names and direct contact info remain strictly anonymized until unlocked with a token.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Seed Button for Verification */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedMock}
            disabled={isSeeding}
            className="text-xs h-9 px-3 rounded-xl border-neutral-200 dark:border-neutral-800 font-medium gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>Dev: Seed 3 Candidates</span>
          </Button>

          <Link href="/console/team">
            <Button
              size="sm"
              className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-3.5 rounded-xl shadow-xs gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
              <span>{workspace.token_balance} Tokens Available</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Privacy Notice Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, framework, or technical keywords..."
            className="pl-9 h-9 text-xs border-0 bg-neutral-50 dark:bg-neutral-800/60 focus-visible:ring-0 shadow-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
          <span>Strict Anonymization Active · Unlocks cost 1 token</span>
        </div>
      </div>

      {/* Talent Cards Grid */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <div className="h-8 w-8 border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="text-xs text-neutral-500">Loading vetted talent assessments...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <Users className="h-8 w-8 text-neutral-400 mx-auto stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            No candidate assessments found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Click &quot;Dev: Seed 3 Candidates&quot; above to instantly populate realistic vetted candidate assessments.
          </p>
          <Button
            size="sm"
            onClick={handleSeedMock}
            className="text-xs h-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
          >
            Seed 3 Mock Candidates
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((cand) => {
            const isUnlocked = Boolean(cand.is_unlocked);

            return (
              <div
                key={cand.id || cand.candidate_id}
                data-candidate-card={cand.candidate_id}
                className="flex flex-col justify-between rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-2xs"
              >
                {/* Video Player Preview Header */}
                <div className="relative aspect-video bg-neutral-950 overflow-hidden group">
                  <video
                    src={cand.secure_video_url}
                    controls
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900/80 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                      <Video className="h-3 w-3 stroke-[1.5] text-emerald-400" />
                      <span>Flowmingo AI Verified Video</span>
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold shadow-xs">
                      {cand.overall_match_score}% Match
                    </span>
                  </div>
                </div>

                {/* Candidate Content Body */}
                <div className="p-5 flex-1 space-y-4">
                  {/* Name and Masking State */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3
                        data-candidate-name
                        className="text-sm font-bold text-neutral-900 dark:text-white truncate"
                      >
                        {cand.candidate_name}
                      </h3>

                      {isUnlocked ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shrink-0 gap-1"
                        >
                          <Unlock className="h-2.5 w-2.5 stroke-[1.5]" />
                          <span>Unlocked</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 shrink-0 gap-1"
                        >
                          <Lock className="h-2.5 w-2.5 stroke-[1.5]" />
                          <span>Masked</span>
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {cand.target_role}
                    </div>

                    {/* Email / Contact info */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      <Mail className="h-3.5 w-3.5 text-neutral-400 stroke-[1.5] shrink-0" />
                      <span
                        data-candidate-email
                        className={`truncate ${
                          isUnlocked
                            ? 'text-neutral-900 dark:text-white font-medium'
                            : 'text-neutral-400 italic'
                        }`}
                      >
                        {cand.candidate_email}
                      </span>
                    </div>
                  </div>

                  {/* AI Evaluation Scores Matrix */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs">
                    <div>
                      <div className="text-[10px] text-neutral-400">Technical Depth</div>
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {cand.technical_depth_score} / 100
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Communication</div>
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {cand.communication_score} / 100
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 stroke-[1.5]" />
                      <span>Flowmingo AI Assessment Summary</span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                      {cand.ai_summary}
                    </p>
                  </div>

                  {/* Proctoring Status */}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>Identity Verified · 0 Proctoring Flags</span>
                  </div>
                </div>

                {/* Footer Action Card */}
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                  {isUnlocked ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${cand.candidate_email}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 font-semibold rounded-lg gap-1.5"
                        >
                          <Mail className="h-3.5 w-3.5 stroke-[1.5]" />
                          <span>Contact Directly</span>
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleUnlock(cand.candidate_id)}
                      disabled={unlockingId === cand.candidate_id}
                      size="sm"
                      className="w-full h-9 text-xs bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold rounded-xl shadow-xs gap-1.5"
                    >
                      {unlockingId === cand.candidate_id ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                          <span>Unlocking Candidate...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
                          <span>Unlock Candidate Profile (1 Token)</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
