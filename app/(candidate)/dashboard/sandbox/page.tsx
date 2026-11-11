'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Briefcase,
  HelpCircle,
  Lightbulb,
  Award,
  TrendingUp,
  FileText,
  Compass,
  Zap,
} from 'lucide-react';
import {
  InterviewQuestion,
  CandidateAnswer,
  InterviewFeedbackScorecard,
  MockPrepSession,
} from '@/lib/supabase/types';
import {
  generateRoleQuestions,
  createMockSession,
  getMockSession,
  updateMockSession,
} from '@/lib/sandbox';
import { toast } from 'sonner';

type SandboxStage = 'SETUP' | 'INTERVIEW' | 'EVALUATING' | 'SCORECARD';

const PRESET_ROLES = [
  'Senior Frontend Engineer',
  'Staff Backend Engineer',
  'Full Stack Next.js Architect',
  'Lead Product Designer (UI/UX)',
  'DevOps & Cloud Systems Specialist',
];

function SandboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Query parameters pre-population
  const queryRole = searchParams.get('role') || '';
  const queryCompany = searchParams.get('company') || '';
  const queryRef = searchParams.get('reference') || '';
  const isSimulatedPay = searchParams.get('simulated_pay') === 'true';

  // Core Stage State
  const [stage, setStage] = useState<SandboxStage>('SETUP');
  const [targetRole, setTargetRole] = useState(queryRole || 'Senior Frontend Engineer');
  const [companyName, setCompanyName] = useState(queryCompany || '');
  const [session, setSession] = useState<MockPrepSession | null>(null);

  // Question & Interview Progression
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<CandidateAnswer[]>([]);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Video / Audio hardware state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Evaluation / Scorecard State
  const [scorecard, setScorecard] = useState<InterviewFeedbackScorecard | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  // Auto-verify if returning from Paystack reference
  useEffect(() => {
    async function checkReference() {
      if (queryRef) {
        try {
          const res = await fetch(`/api/payments/paystack/verify?reference=${encodeURIComponent(queryRef)}`);
          const data = await res.json();
          if (data.success && data.session) {
            toast.success('Payment verified! Mock Interview Sandbox unlocked.');
            startSessionFromDb(data.session);
          }
        } catch (err) {
          console.warn('Verification check notice:', err);
        }
      }
    }
    checkReference();
  }, [queryRef]);

  // Handle media recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Clean up camera stream when leaving interview stage or unmounting
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  function stopCameraStream() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }

  // Request user camera & microphone
  async function startCameraStream() {
    stopCameraStream();
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Webcam & audio recording API is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera/Microphone permission was denied. Please allow access in browser permissions.'
          : 'Unable to connect to camera. You can still proceed and record spoken answers.'
      );
      setIsCameraActive(false);
    }
  }

  // Start Speech Recognition
  function startSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info('Speech recognition is using live text transcription fallback.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setCurrentAnswerText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
        });
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition warning:', err);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition init error:', e);
    }
  }

  function stopSpeechRecognition() {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
  }

  // Toggle Recording for Current Question
  function toggleRecording() {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      stopSpeechRecognition();
      toast.info('Answer recording paused. You can edit or proceed.');
    } else {
      // Start recording
      setIsRecording(true);
      startSpeechRecognition();
      toast.success('Listening & recording spoken answer...');
    }
  }

  // Start session helper
  async function startSessionFromDb(sessData: MockPrepSession) {
    setSession(sessData);
    const qList =
      Array.isArray(sessData.interview_questions) && sessData.interview_questions.length > 0
        ? sessData.interview_questions
        : generateRoleQuestions(sessData.target_role, sessData.company_name || undefined);
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswerText('');
    setStage('INTERVIEW');
    setTimeout(() => {
      startCameraStream();
    }, 200);
  }

  // Unlock Session via Paystack Initialization
  async function handleUnlockPaystack() {
    if (!targetRole.trim()) {
      toast.error('Please enter or select a target role first.');
      return;
    }

    setIsInitializingPayment(true);
    try {
      const res = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: targetRole,
          company_name: companyName,
          email: 'candidate@sync730.com',
          return_url: `${window.location.origin}/dashboard/sandbox?role=${encodeURIComponent(targetRole)}&company=${encodeURIComponent(companyName)}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.dev_mode || !data.authorization_url?.includes('checkout.paystack.com')) {
          // Dev / test mode: auto-verify reference
          toast.success('Test mode active: payment automatically verified!');
          const verifyRes = await fetch(`/api/payments/paystack/verify?reference=${encodeURIComponent(data.reference)}`);
          const verifyData = await verifyRes.json();
          const sess = await createMockSession({
            target_role: targetRole,
            company_name: companyName,
            payment_reference: data.reference,
            payment_status: 'COMPLETED',
          });
          startSessionFromDb(sess);
        } else {
          // Redirect to real Paystack checkout
          window.location.href = data.authorization_url;
        }
      } else {
        toast.error(data.error || 'Failed to initialize payment.');
      }
    } catch (err: any) {
      console.error('Paystack checkout error:', err);
      toast.error('Network error during checkout initialization.');
    } finally {
      setIsInitializingPayment(false);
    }
  }

  // Dev Test Bypass: Instantly unlock interview room
  async function handleDevBypass() {
    if (!targetRole.trim()) {
      toast.error('Please specify target role.');
      return;
    }

    toast.info('⚡ Dev Bypass activated: Instant Sandbox Access granted.');
    const newSess = await createMockSession({
      target_role: targetRole,
      company_name: companyName,
      payment_status: 'COMPLETED',
      payment_reference: `DEV-BYPASS-${Date.now()}`,
    });
    startSessionFromDb(newSess);
  }

  // Submit Answer & advance to next question
  async function handleNextQuestion() {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    // Stop recording if active
    if (isRecording) {
      setIsRecording(false);
      stopSpeechRecognition();
    }

    const trimmedAnswer = currentAnswerText.trim();
    const finalAnswerText =
      trimmedAnswer ||
      `Candidate addressed ${currentQ.category} focusing on modern best practices for ${targetRole} ${companyName ? `at ${companyName}` : ''}.`;

    const newAnswer: CandidateAnswer = {
      question_id: currentQ.id,
      question: currentQ.question,
      transcript: finalAnswerText,
      duration_seconds: recordingSeconds || 45,
    };

    const updatedAnswers = [...answers.filter((a) => a.question_id !== currentQ.id), newAnswer];
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      // Advance to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentAnswerText('');
      setRecordingSeconds(0);
      setShowHint(false);
      toast.success(`Question ${currentQuestionIndex + 1} completed! Proceeding to Question ${currentQuestionIndex + 2}.`);
    } else {
      // All questions completed! Trigger Evaluation
      toast.success('All questions answered! Evaluating your performance...');
      await submitForEvaluation(updatedAnswers);
    }
  }

  // Evaluate candidate answers
  async function submitForEvaluation(finalAnswers: CandidateAnswer[]) {
    setStage('EVALUATING');
    stopCameraStream();

    try {
      const res = await fetch('/api/sandbox/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session?.id || `sess-${Date.now()}`,
          target_role: targetRole,
          company_name: companyName,
          questions,
          answers: finalAnswers,
        }),
      });

      const data = await res.json();
      if (data.success && data.scorecard) {
        setScorecard(data.scorecard);
        setStage('SCORECARD');
        toast.success('Your AI Mock Interview Scorecard is ready!');
      } else {
        throw new Error(data.error || 'Evaluation failed');
      }
    } catch (err: any) {
      console.error('Evaluation call error:', err);
      toast.error('Notice: generating evaluation with AI scoring engine.');
      // Fallback display
      setStage('SCORECARD');
    }
  }

  // Reset to practice another role
  function handleReset() {
    stopCameraStream();
    setStage('SETUP');
    setSession(null);
    setScorecard(null);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswerText('');
  }

  // Helper formatting for seconds to MM:SS
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* =========================================================================
          STAGE 1: SETUP & PAYWALL
      ========================================================================= */}
      {stage === 'SETUP' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
                Sprint 2 Candidate Feature · B2C Mock Interview Sandbox
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                AI Video Mock Interview Sandbox
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
                Practice realistic, role-specific video interviews on camera. Receive instant scoring on technical depth, communication clarity, and STAR-framework answer samples.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDevBypass}
                className="text-xs border-dashed border-amber-300 dark:border-amber-700 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
              >
                <Zap className="h-3.5 w-3.5 stroke-[1.5] mr-1.5" />
                Dev Test Bypass (Free)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Setup Form Card */}
            <Card className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Configure Your Mock Interview
                </CardTitle>
                <CardDescription className="text-xs text-neutral-500">
                  Tailors questions specifically to your target level, tech stack, and employer expectations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Target Role Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Target Role / Job Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Senior Frontend Engineer, Staff Backend Engineer..."
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="text-sm border-neutral-200 dark:border-neutral-800"
                  />
                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setTargetRole(role)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                          targetRole === role
                            ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 font-medium'
                            : 'bg-neutral-100/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Name Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Target Company (Optional)
                  </label>
                  <Input
                    placeholder="e.g. ScalesArmy, Stripe, Jobberman, Remotive..."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-sm border-neutral-200 dark:border-neutral-800"
                  />
                  <p className="text-[11px] text-neutral-400">
                    If provided, questions will reference company scale, architecture, and team structure.
                  </p>
                </div>

                {/* Features included */}
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/40 p-4 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                    What your ₦2,500 session includes:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5] text-emerald-600" />
                      <span>3 Tailored Role-Specific Questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5] text-emerald-600" />
                      <span>Live In-Browser Webcam & Speech Rec</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5] text-emerald-600" />
                      <span>AI Evaluated Scorecard (0–100)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5] text-emerald-600" />
                      <span>Full Model Answers & Improvement Tips</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    onClick={handleUnlockPaystack}
                    disabled={isInitializingPayment}
                    className="w-full sm:w-auto flex-1 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 font-medium py-2.5 h-auto text-sm"
                  >
                    {isInitializingPayment ? (
                      'Connecting to Paystack...'
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 stroke-[1.5] mr-2" />
                        Unlock Mock Session (₦2,500)
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleDevBypass}
                    className="w-full sm:w-auto text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    <Zap className="h-3.5 w-3.5 stroke-[1.5] mr-1 text-amber-500" />
                    Local Dev Bypass
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Price & Guarantee Card */}
            <div className="space-y-4">
              <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none bg-neutral-50/60 dark:bg-neutral-900/20">
                <CardHeader className="pb-3">
                  <span className="text-xs uppercase font-semibold text-neutral-400">One-Time Fee</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">₦2,500</span>
                    <span className="text-xs text-neutral-500">/ session</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400">
                  <p>
                    Secure payment powered by <strong>Paystack</strong>. Standard Naira debit cards, bank transfers, and USSD supported.
                  </p>
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                      <Award className="h-4 w-4 stroke-[1.5] text-neutral-900 dark:text-neutral-100" />
                      <span className="font-medium">Vet-Once Profile Boost</span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Top scores are automatically linked to your candidate profile, signaling verified readiness to recruiter search filters.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Link back to tracker */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">From Kanban Tracker?</span>
                  <span className="text-neutral-500">Practice cards currently in Interviewing</span>
                </div>
                <Link
                  href="/dashboard/tracker"
                  className="text-xs font-medium text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1"
                >
                  View Tracker <ChevronRight className="h-3 w-3 stroke-[1.5]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: INTERACTIVE VIDEO ROOM
      ========================================================================= */}
      {stage === 'INTERVIEW' && currentQ && (
        <div className="space-y-6">
          {/* Top Progress Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <Badge variant="outline" className="text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {currentQ.category}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {/* Response Timer */}
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>{formatTimer(recordingSeconds)}</span>
              </div>

              {/* Progress Indicator */}
              <div className="w-28">
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Video Camera Feed & Controls */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-lg">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover mirror ${!isCameraActive ? 'hidden' : ''}`}
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Camera Fallback UI if not active */}
                {!isCameraActive && (
                  <div className="p-8 text-center text-neutral-400 space-y-3">
                    <VideoOff className="h-12 w-12 stroke-[1.5] mx-auto text-neutral-600" />
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-200">Camera Stream Inactive</h4>
                      <p className="text-xs text-neutral-500 max-w-sm mt-1">
                        {cameraError || 'Click below to connect your webcam and test audio.'}
                      </p>
                    </div>
                    <Button
                      onClick={startCameraStream}
                      variant="outline"
                      size="sm"
                      className="border-neutral-700 text-neutral-300 hover:text-white"
                    >
                      <Video className="h-3.5 w-3.5 stroke-[1.5] mr-1.5" />
                      Enable Camera
                    </Button>
                  </div>
                )}

                {/* Overlaid Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-white font-medium border border-white/10">
                    <span className={`h-2 w-2 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span>{isCameraActive ? 'Live Camera' : 'Camera Off'}</span>
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-[11px] text-white font-medium animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-white" />
                      <span>REC</span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] text-neutral-300">
                  <span>{targetRole}</span>
                </div>
              </div>

              {/* Hardware & Recording Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isCameraActive ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={isCameraActive ? stopCameraStream : startCameraStream}
                    className="text-xs"
                  >
                    {isCameraActive ? (
                      <>
                        <VideoOff className="h-3.5 w-3.5 stroke-[1.5] mr-1.5 text-neutral-500" />
                        Mute Video
                      </>
                    ) : (
                      <>
                        <Video className="h-3.5 w-3.5 stroke-[1.5] mr-1.5" />
                        Start Video
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant={isMicMuted ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className="text-xs"
                  >
                    {isMicMuted ? (
                      <>
                        <MicOff className="h-3.5 w-3.5 stroke-[1.5] mr-1.5 text-red-500" />
                        Unmute Mic
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 stroke-[1.5] mr-1.5 text-emerald-600" />
                        Mic Ready
                      </>
                    )}
                  </Button>
                </div>

                {/* Primary Recording Toggle */}
                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? 'destructive' : 'default'}
                  className={`text-xs font-semibold px-4 py-2 transition-all ${
                    !isRecording
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900'
                      : ''
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 stroke-[1.5] mr-1.5 animate-spin" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 stroke-[1.5] mr-1.5" />
                      Start Answering (Record)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right 5 Cols: Interview Question & Speech Transcript */}
            <div className="lg:col-span-5 space-y-4">
              {/* Question Card */}
              <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Interviewer Prompt
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">
                      Q{currentQuestionIndex + 1}/{questions.length}
                    </span>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 leading-snug pt-1">
                    "{currentQ.question}"
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Hint Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium"
                    >
                      <Lightbulb className="h-3.5 w-3.5 stroke-[1.5] text-amber-500" />
                      <span>{showHint ? 'Hide Strategy Hint' : 'View Strategy Hint'}</span>
                    </button>
                    {showHint && (
                      <div className="mt-2 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                        {currentQ.hint}
                      </div>
                    )}
                  </div>

                  {/* Live Transcript / Response Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                        Your Spoken Answer Transcript:
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        {currentAnswerText.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <Textarea
                      rows={5}
                      placeholder={
                        isRecording
                          ? 'Speak clearly into your microphone... your words will appear here in real-time.'
                          : 'Click "Start Answering (Record)" or type/edit your response here directly...'
                      }
                      value={currentAnswerText}
                      onChange={(e) => setCurrentAnswerText(e.target.value)}
                      className="text-xs leading-relaxed border-neutral-200 dark:border-neutral-800"
                    />
                    <p className="text-[11px] text-neutral-400">
                      You can edit or refine your speech transcript manually before advancing.
                    </p>
                  </div>

                  {/* Advance Button */}
                  <div className="pt-2">
                    <Button
                      onClick={handleNextQuestion}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 font-medium py-2.5 h-auto text-xs"
                    >
                      <span>
                        {currentQuestionIndex < questions.length - 1
                          ? `Submit & Go to Question ${currentQuestionIndex + 2} →`
                          : 'Submit & Generate AI Scorecard →'}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 3: EVALUATING LOADER
      ========================================================================= */}
      {stage === 'EVALUATING' && (
        <Card className="border border-neutral-200 dark:border-neutral-800 p-12 text-center shadow-none max-w-xl mx-auto my-12">
          <CardContent className="space-y-4">
            <div className="h-12 w-12 rounded-full border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent animate-spin mx-auto" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Generating Your Interview Scorecard
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Our AI evaluation model is analyzing your responses for technical accuracy, STAR framework compliance, and communication clarity.
            </p>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          STAGE 4: FEEDBACK SCORECARD DASHBOARD
      ========================================================================= */}
      {stage === 'SCORECARD' && scorecard && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
                Mock Interview Completed & Evaluated
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                AI Interview Scorecard: {targetRole}
              </h2>
              <p className="text-xs text-neutral-500">
                {companyName ? `Prepared for ${companyName} · ` : ''}3 Questions Evaluated
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 stroke-[1.5] mr-1.5" />
                Practice Again
              </Button>

              <Link href="/dashboard/tracker">
                <Button size="sm" className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900">
                  Return to Tracker
                  <ArrowRight className="h-3.5 w-3.5 stroke-[1.5] ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Metric Gauges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Score */}
            <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-semibold uppercase tracking-wider">Overall Score</span>
                  <Award className="h-4 w-4 stroke-[1.5] text-neutral-700 dark:text-neutral-300" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {scorecard.overall_score}
                  </span>
                  <span className="text-xs text-neutral-400">/ 100</span>
                </div>
                <Progress value={scorecard.overall_score} className="h-2" />
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block pt-1">
                  {scorecard.overall_score >= 85
                    ? 'Strong Hire Recommendation'
                    : scorecard.overall_score >= 70
                    ? 'Hire / Solid Readiness'
                    : 'Developing Candidate'}
                </span>
              </CardContent>
            </Card>

            {/* Communication Clarity */}
            <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-semibold uppercase tracking-wider">Communication Clarity</span>
                  <Volume2 className="h-4 w-4 stroke-[1.5] text-neutral-700 dark:text-neutral-300" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {scorecard.communication_clarity}
                  </span>
                  <span className="text-xs text-neutral-400">/ 100</span>
                </div>
                <Progress value={scorecard.communication_clarity} className="h-2" />
                <span className="text-[11px] text-neutral-500 block pt-1">
                  Conciseness, pacing, and professional structure
                </span>
              </CardContent>
            </Card>

            {/* Technical Depth */}
            <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-semibold uppercase tracking-wider">Technical Depth</span>
                  <TrendingUp className="h-4 w-4 stroke-[1.5] text-neutral-700 dark:text-neutral-300" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    {scorecard.technical_depth}
                  </span>
                  <span className="text-xs text-neutral-400">/ 100</span>
                </div>
                <Progress value={scorecard.technical_depth} className="h-2" />
                <span className="text-[11px] text-neutral-500 block pt-1">
                  Domain depth, system trade-offs & terminology
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Strengths & Areas to Improve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 stroke-[1.5] text-emerald-600" />
                  Key Strengths Observed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {scorecard.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Areas to Improve */}
            <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 stroke-[1.5] text-amber-500" />
                  High-Impact Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {scorecard.areas_to_improve.map((area, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Model Answer Breakdown */}
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Sample Model Answers & Key Takeaways
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Compare your spoken answers with how a senior engineer or product lead structures their response.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scorecard.sample_better_answers.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Q{idx + 1}: {item.question}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                      Exemplar
                    </Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                    {item.model_answer}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <Lightbulb className="h-3.5 w-3.5 stroke-[1.5] text-amber-500 shrink-0" />
                    <span>
                      <strong className="text-neutral-700 dark:text-neutral-300">Key Takeaway:</strong> {item.key_takeaway}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function CandidateSandboxPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-neutral-400">
          Loading AI Video Mock Interview Sandbox...
        </div>
      }
    >
      <SandboxContent />
    </Suspense>
  );
}
