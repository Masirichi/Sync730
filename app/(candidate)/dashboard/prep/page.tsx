// app/(candidate)/dashboard/prep/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Send,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Lightbulb,
  FileCheck2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateRoleQuestions } from '@/lib/sandbox';
import { InterviewQuestion } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface SavedPrepSession {
  id: string;
  role: string;
  skill?: string;
  question: string;
  answer: string;
  structureScore: number;
  clarityScore: number;
  overallScore: number;
  feedback: {
    structure: string;
    clarity: string;
    strengths: string[];
    improvements: string[];
  };
  createdAt: string;
}

const PRESET_ROLES = [
  'Senior Frontend Engineer',
  'Staff Backend Engineer',
  'Full Stack Next.js Architect',
  'DevOps & Cloud Systems Specialist',
  'Lead Product Designer (UI/UX)',
  'Data & AI Platform Engineer',
  'Mobile Engineer (Flutter/React Native)',
];

function InterviewPrepContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams?.get('role') || PRESET_ROLES[0];
  const initialSkill = searchParams?.get('skill') || '';

  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [focusSkill, setFocusSkill] = useState<string>(initialSkill);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentFeedback, setCurrentFeedback] = useState<SavedPrepSession['feedback'] | null>(null);
  const [feedbackScores, setFeedbackScores] = useState<{ structure: number; clarity: number; overall: number } | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedPrepSession[]>([]);

  // Load saved sessions on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('sync730_interview_prep_sessions');
        if (raw) {
          setSavedSessions(JSON.parse(raw));
        }
      } catch {}
    }
  }, []);

  // Update questions whenever role or focus skill changes
  useEffect(() => {
    let base = generateRoleQuestions(selectedRole);
    if (focusSkill) {
      const skillQ: InterviewQuestion = {
        id: 99,
        category: `Specialized Skill: ${focusSkill}`,
        question: `How have you designed, implemented, or optimized production systems using ${focusSkill}? Walk me through a challenging problem you solved.`,
        hint: `Detail your hands-on depth with ${focusSkill}, architectural decisions, performance tradeoffs, and quantifiable results.`,
      };
      base = [skillQ, ...base];
    }
    setQuestions(base);
    setCurrentQuestionIndex(0);
    setCandidateAnswer('');
    setCurrentFeedback(null);
    setFeedbackScores(null);
  }, [selectedRole, focusSkill]);

  const activeQuestion = questions[currentQuestionIndex] || questions[0];

  // Evaluate candidate answer for Structure & Clarity
  const handleEvaluate = async () => {
    if (!candidateAnswer.trim() || candidateAnswer.trim().length < 40) {
      toast.error('Please write a more detailed response (at least 2-3 sentences) to receive structural feedback.');
      return;
    }

    setIsEvaluating(true);

    // Heuristic AI evaluator analyzing STAR structure, technical terminology, and conciseness
    setTimeout(() => {
      const answer = candidateAnswer.toLowerCase();
      const length = candidateAnswer.trim().split(/\s+/).length;

      // Check STAR components
      const hasSituation = answer.includes('when') || answer.includes('at') || answer.includes('project') || answer.includes('company') || answer.includes('built');
      const hasTask = answer.includes('needed') || answer.includes('goal') || answer.includes('responsible') || answer.includes('requirement');
      const hasAction = answer.includes('designed') || answer.includes('implemented') || answer.includes('used') || answer.includes('refactored') || answer.includes('architected');
      const hasResult = answer.includes('result') || answer.includes('reduced') || answer.includes('increased') || answer.includes('percent') || answer.includes('%') || answer.includes('improved') || answer.includes('latency');

      let structureScore = 70;
      if (hasSituation) structureScore += 8;
      if (hasTask) structureScore += 7;
      if (hasAction) structureScore += 10;
      if (hasResult) structureScore += 10;
      structureScore = Math.min(96, Math.max(50, structureScore));

      let clarityScore = 75;
      if (length >= 50 && length <= 250) clarityScore += 15; // sweet spot length
      else if (length > 250) clarityScore -= 5; // too verbose
      if (answer.includes('specifically') || answer.includes('for example') || answer.includes('in production')) clarityScore += 8;
      clarityScore = Math.min(95, Math.max(55, clarityScore));

      const overall = Math.round((structureScore + clarityScore) / 2);

      const strengths: string[] = [];
      const improvements: string[] = [];

      if (hasAction) strengths.push('Clear articulation of your direct engineering actions and architectural choices.');
      if (hasResult) strengths.push('Effectively highlighted the impact and business/performance outcome.');
      if (length >= 60) strengths.push('Strong level of technical specificity without unnecessary jargon.');

      if (!hasResult) improvements.push('Add a measurable result or metric (e.g., "reduced latency by 35%" or "scaled to 50k users").');
      if (!hasSituation) improvements.push('Frame the initial context briefly using the STAR method (Situation, Task, Action, Result).');
      if (length < 60) improvements.push('Expand on the technical implementation details and tradeoffs considered.');

      const feedbackData: SavedPrepSession['feedback'] = {
        structure: hasSituation && hasAction && hasResult
          ? 'Excellent STAR format. Your narrative flows logically from business context to technical resolution.'
          : 'Good foundation. Solidify the STAR sequence by clearly stating the initial problem, your specific action, and the concrete outcome.',
        clarity: clarityScore >= 80
          ? 'High clarity. Concise, professional, and directly answers the interviewer\'s question without rambling.'
          : 'Moderate clarity. Consider breaking lengthy sentences into active bullet points for crisper communication.',
        strengths: strengths.length > 0 ? strengths : ['Good baseline technical vocabulary.'],
        improvements: improvements.length > 0 ? improvements : ['Maintain this level of conciseness in live interviews.'],
      };

      setFeedbackScores({ structure: structureScore, clarity: clarityScore, overall });
      setCurrentFeedback(feedbackData);

      // Save to Session History
      const newSession: SavedPrepSession = {
        id: `prep-${Date.now()}`,
        role: selectedRole,
        skill: focusSkill || undefined,
        question: activeQuestion?.question || '',
        answer: candidateAnswer,
        structureScore,
        clarityScore,
        overallScore: overall,
        feedback: feedbackData,
        createdAt: new Date().toISOString(),
      };

      const updated = [newSession, ...savedSessions];
      setSavedSessions(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sync730_interview_prep_sessions', JSON.stringify(updated));
      }

      setIsEvaluating(false);
      toast.success('Interview feedback generated! Session saved to your history.');
    }, 800);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCandidateAnswer('');
      setCurrentFeedback(null);
      setFeedbackScores(null);
    }
  };

  const handleSelectSavedSession = (s: SavedPrepSession) => {
    setSelectedRole(s.role);
    setCandidateAnswer(s.answer);
    setCurrentFeedback(s.feedback);
    setFeedbackScores({
      structure: s.structureScore,
      clarity: s.clarityScore,
      overall: s.overallScore,
    });
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Technical Interview Prep</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Role & Skill Interview Practice
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Practice role-specific interview questions, structure answers with STAR, and receive immediate AI feedback on clarity, technical depth, and presentation.
          </p>
        </div>

        <Link href="/dashboard/sandbox">
          <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5">
            <span>Try Full Video Sandbox</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Role & Skill Selection Card */}
      <Card className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Target Interview Role
              </Label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val)}>
                <SelectTrigger className="text-xs h-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Focus Technical Skill (Optional)
              </Label>
              <Input
                value={focusSkill}
                onChange={(e) => setFocusSkill(e.target.value)}
                placeholder="e.g. Kubernetes, React, Kafka, System Design"
                className="text-xs h-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Question & Practice Arena */}
      {activeQuestion && (
        <Card className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <span className="text-xs text-neutral-500 font-medium">
                  {activeQuestion.category}
                </span>
              </div>

              {questions.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setCandidateAnswer('');
                        setCurrentFeedback(null);
                        setFeedbackScores(null);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentQuestionIndex
                          ? 'w-6 bg-neutral-900 dark:bg-white'
                          : 'w-2 bg-neutral-200 dark:bg-neutral-800'
                      }`}
                      aria-label={`Jump to question ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <CardTitle className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 pt-2 leading-snug">
              {activeQuestion.question}
            </CardTitle>

            {activeQuestion.hint && (
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2 mt-2">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip for this question:</strong> {activeQuestion.hint}
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Your Answer (Aim for STAR structure: Situation, Task, Action, Result)
                </Label>
                <span>{candidateAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>

              <Textarea
                value={candidateAnswer}
                onChange={(e) => setCandidateAnswer(e.target.value)}
                placeholder="In my previous role at... we noticed that... To solve this, I designed... resulting in a 40% reduction in latency and zero downtime..."
                className="text-xs sm:text-sm min-h-[140px] leading-relaxed bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex >= questions.length - 1}
                className="text-xs h-9 gap-1"
              >
                <span>Next Question</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="text-xs h-9 gap-1.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isEvaluating ? 'Evaluating Structure...' : 'Analyze Answer'}</span>
              </Button>
            </div>

            {/* Instant AI Feedback Scorecard */}
            {currentFeedback && feedbackScores && (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-500" />
                      <span>Answer Assessment</span>
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Objective evaluation on delivery, structural clarity, and engineering impact.
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-neutral-900 dark:text-white">
                      {feedbackScores.overall}/100
                    </div>
                    <div className="text-xs uppercase font-bold text-neutral-400">
                      Overall Score
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Structure Box */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Structure & STAR Sequence</span>
                      <span className="text-blue-600 dark:text-blue-400">{feedbackScores.structure}/100</span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {currentFeedback.structure}
                    </p>
                  </div>

                  {/* Clarity Box */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Clarity & Conciseness</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{feedbackScores.clarity}/100</span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {currentFeedback.clarity}
                    </p>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Key Strengths</span>
                    </div>
                    <ul className="space-y-1 text-neutral-600 dark:text-neutral-400 list-disc list-inside">
                      {currentFeedback.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                    <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>Actionable Improvements</span>
                    </div>
                    <ul className="space-y-1 text-neutral-600 dark:text-neutral-400 list-disc list-inside">
                      {currentFeedback.improvements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Practice Sessions History */}
      {savedSessions.length > 0 && (
        <Card className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-blue-600" />
              <span>Saved Practice Sessions ({savedSessions.length})</span>
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Review past interview practice questions, your answers, and historical structural scores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {savedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSavedSession(session)}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-900/30 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {session.role}
                    </Badge>
                    {session.skill && (
                      <Badge variant="secondary" className="text-xs">
                        {session.skill}
                      </Badge>
                    )}
                    <span className="text-xs text-neutral-400">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    Score: {session.overallScore}/100
                  </span>
                </div>

                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                  {session.question}
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  Answer: "{session.answer}"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer Ethical AI Disclosure */}
      <div className="text-xs text-neutral-400 dark:text-neutral-500 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-center">
        Scores and suggestions are AI-generated and may be wrong. You decide where to apply.
      </div>
    </div>
  );
}

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-neutral-500">Loading interview practice arena...</div>}>
      <InterviewPrepContent />
    </Suspense>
  );
}
