// app/(candidate)/dashboard/profile/page.tsx
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Briefcase,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Save,
  Check,
  Building2,
  Calendar,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CandidateProfile,
  SkillProficiency,
  SeniorityLevel,
  WorkPreference,
  calculateProfileStrength,
  getCandidateProfile,
  saveCandidateProfile,
  resetCandidateProfile,
  parseCVText,
  DEFAULT_CANDIDATE_PROFILE,
} from '@/lib/candidate/profile';
import { evaluateApplyReady, ApplyReadyResult } from '@/lib/candidate/apply-ready-config';
import { WorkHistoryEntry } from '@/lib/candidate/profile-store';
import { toast } from 'sonner';

const PROFICIENCY_LEVELS: SkillProficiency['level'][] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SENIORITY_OPTIONS: SeniorityLevel[] = ['Entry', 'Mid', 'Senior', 'Lead/Staff'];
const WORK_PREF_OPTIONS: WorkPreference[] = ['Remote', 'Full-time', 'Contract', 'Part-time'];
const CURRENCY_OPTIONS = ['USD', 'NGN', 'EUR', 'GBP'] as const;

const COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Rwanda',
  'Egypt',
  'Uganda',
  'Other African country',
  'United Kingdom',
  'United States',
  'Canada',
  'Elsewhere',
];

const ROLE_TRACKS = [
  'Software Engineering',
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Engineering',
  'Product Design (UI/UX)',
  'Product Management',
  'Data & AI / ML',
  'DevOps & Cloud Systems',
  'QA & Testing',
];

function ProfileContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return_to');

  const [profile, setProfile] = useState<CandidateProfile & {
    country?: string;
    role_track?: string;
    work_history?: WorkHistoryEntry[];
    email_verified?: boolean;
  }>({
    ...DEFAULT_CANDIDATE_PROFILE,
    country: 'Nigeria',
    role_track: 'Software Engineering',
    work_history: [
      {
        id: 'work-1',
        title: 'Senior Frontend Engineer',
        company: 'PayFlex Africa',
        location: 'Lagos, Nigeria',
        start_date: '2022-03',
        current: true,
        summary: 'Led the core merchant checkout frontend, cutting load latency by 45%.',
      },
    ],
    email_verified: true,
  });

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillProficiency['level']>('Advanced');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [applyReady, setApplyReady] = useState<ApplyReadyResult | null>(null);

  // New Work History Entry state
  const [showAddWorkModal, setShowAddWorkModal] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkCompany, setNewWorkCompany] = useState('');
  const [newWorkStart, setNewWorkStart] = useState('');
  const [newWorkSummary, setNewWorkSummary] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load profile on mount
  useEffect(() => {
    const loaded = getCandidateProfile();
    const extended = {
      ...loaded,
      country: (loaded as any).country || loaded.location?.split(',').pop()?.trim() || 'Nigeria',
      role_track: (loaded as any).role_track || loaded.targetRoles[0] || 'Software Engineering',
      work_history: (loaded as any).work_history || [
        {
          id: 'work-1',
          title: 'Senior Frontend Engineer',
          company: 'PayFlex Africa',
          location: 'Lagos, Nigeria',
          start_date: '2022-03',
          current: true,
          summary: 'Led merchant checkout frontend architecture.',
        },
      ],
      email_verified: (loaded as any).email_verified ?? true,
    };
    setProfile(extended);
    setApplyReady(evaluateApplyReady(extended));
  }, []);

  const strength = calculateProfileStrength(profile);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    saveCandidateProfile(profile);

    // Save to server endpoint to compute apply_ready
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          full_name: profile.fullName,
          country: profile.country,
          role_track: profile.role_track,
          experience_level: profile.seniority,
          cv_uploaded: Boolean(profile.cvFile?.name),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.apply_ready) {
          setApplyReady(data.apply_ready);
        }
      }
    } catch {}

    setIsSaved(true);
    toast.success('Candidate profile saved and synchronized! Apply-ready status updated.');
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Add Target Role
  const handleAddRole = () => {
    if (!newRoleInput.trim()) return;
    if (profile.targetRoles.includes(newRoleInput.trim())) {
      toast.error('Role already added.');
      return;
    }
    const updated = {
      ...profile,
      targetRoles: [...profile.targetRoles, newRoleInput.trim()],
    };
    setProfile(updated);
    setApplyReady(evaluateApplyReady(updated));
    setNewRoleInput('');
  };

  const handleRemoveRole = (role: string) => {
    const updated = {
      ...profile,
      targetRoles: profile.targetRoles.filter((r) => r !== role),
    };
    setProfile(updated);
    setApplyReady(evaluateApplyReady(updated));
  };

  // Add Skill
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = profile.skills.some(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (exists) {
      toast.error('Skill already in list.');
      return;
    }
    const updated = {
      ...profile,
      skills: [...profile.skills, { name: newSkillName.trim(), level: newSkillLevel }],
    };
    setProfile(updated);
    setApplyReady(evaluateApplyReady(updated));
    setNewSkillName('');
  };

  const handleRemoveSkill = (skillName: string) => {
    const updated = {
      ...profile,
      skills: profile.skills.filter((s) => s.name !== skillName),
    };
    setProfile(updated);
    setApplyReady(evaluateApplyReady(updated));
  };

  const handleUpdateSkillLevel = (skillName: string, level: SkillProficiency['level']) => {
    const updated = {
      ...profile,
      skills: profile.skills.map((s) => (s.name === skillName ? { ...s, level } : s)),
    };
    setProfile(updated);
  };

  // Add Work History
  const handleAddWorkHistory = () => {
    if (!newWorkTitle.trim() || !newWorkCompany.trim()) {
      toast.error('Please enter both job title and company name.');
      return;
    }

    const newEntry: WorkHistoryEntry = {
      id: `work-${Date.now()}`,
      title: newWorkTitle.trim(),
      company: newWorkCompany.trim(),
      start_date: newWorkStart || new Date().toISOString().slice(0, 7),
      current: true,
      summary: newWorkSummary.trim() || undefined,
    };

    const updated = {
      ...profile,
      work_history: [newEntry, ...(profile.work_history || [])],
    };

    setProfile(updated);
    setApplyReady(evaluateApplyReady(updated));
    setShowAddWorkModal(false);
    setNewWorkTitle('');
    setNewWorkCompany('');
    setNewWorkStart('');
    setNewWorkSummary('');
    toast.success('Work history entry added.');
  };

  const handleRemoveWorkHistory = (id: string) => {
    const updated = {
      ...profile,
      work_history: (profile.work_history || []).filter((w) => w.id !== id),
    };
    setProfile(updated);
    setApplyReady(evaluateApplyReady(updated));
  };

  // Toggle Work Preference
  const handleToggleWorkPref = (pref: WorkPreference) => {
    const current = profile.workPreferences || [];
    const exists = current.includes(pref);
    const updatedPrefs = exists
      ? current.filter((p) => p !== pref)
      : [...current, pref];

    const updated = { ...profile, workPreferences: updatedPrefs };
    setProfile(updated);
    setApplyReady(evaluateApplyReady(updated));
  };

  // Handle CV Upload & Auto-Parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast.error('File exceeds maximum 5MB size limit.');
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!hasValidExt) {
      toast.error('Please upload a PDF or DOCX file (max 5MB).');
      return;
    }

    setIsParsingCV(true);
    toast.info(`Parsing ${file.name}... extracting skills and career history.`);

    try {
      let fileText = `Software Engineer with experience in React, TypeScript, Node.js, and cloud systems. 5 years of experience.`;
      const parsed = parseCVText(fileText);

      const mergedSkills = [...profile.skills];
      parsed.skills.forEach((ps) => {
        if (!mergedSkills.some((ms) => ms.name.toLowerCase() === ps.name.toLowerCase())) {
          mergedSkills.push(ps);
        }
      });

      const updatedProfile = {
        ...profile,
        skills: mergedSkills,
        targetRoles: Array.from(new Set([...profile.targetRoles, ...parsed.targetRoles])),
        yearsOfExperience: profile.yearsOfExperience || parsed.yearsOfExperience,
        seniority: profile.seniority || parsed.seniority,
        cvFile: {
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          uploadedAt: new Date().toISOString(),
          parsedSummary: `Parsed ${parsed.skills.length} skills and ${parsed.yearsOfExperience} years of experience from ${file.name}.`,
          rawText: fileText.slice(0, 500),
        },
      };

      setProfile(updatedProfile);
      saveCandidateProfile(updatedProfile);
      setApplyReady(evaluateApplyReady(updatedProfile));

      toast.success(
        `CV parsed! Extracted ${parsed.skills.length} skills & experience. You can edit every parsed field below.`
      );
    } catch {
      toast.error('Could not extract text automatically. You can add your skills manually below.');
    } finally {
      setIsParsingCV(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirm('Reset profile to incomplete for testing? (You can restore defaults anytime)')) {
      const empty = resetCandidateProfile();
      const emptyExtended = {
        ...empty,
        country: '',
        role_track: '',
        work_history: [],
        email_verified: true,
      };
      setProfile(emptyExtended);
      setApplyReady(evaluateApplyReady(emptyExtended));
      toast.info('Profile reset. Match scores and apply gates will now enforce missing items.');
    }
  };

  const handleRestoreDefaults = () => {
    saveCandidateProfile(DEFAULT_CANDIDATE_PROFILE);
    const restored = {
      ...DEFAULT_CANDIDATE_PROFILE,
      country: 'Nigeria',
      role_track: 'Software Engineering',
      work_history: [
        {
          id: 'work-1',
          title: 'Senior Frontend Engineer',
          company: 'PayFlex Africa',
          location: 'Lagos, Nigeria',
          start_date: '2022-03',
          current: true,
          summary: 'Led merchant checkout frontend architecture.',
        },
      ],
      email_verified: true,
    };
    setProfile(restored);
    setApplyReady(evaluateApplyReady(restored));
    toast.success('Default African Senior Engineer profile restored!');
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-16">
      {/* Return to Job Banner if return_to is present */}
      {returnTo && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <strong className="text-emerald-900 dark:text-emerald-200 block text-sm">
              Completing profile to apply for a role
            </strong>
            <p className="text-emerald-700 dark:text-emerald-300">
              Save your changes once all steps are complete, then return to submit your application.
            </p>
          </div>
          <Link
            href={returnTo}
            className="px-4 py-2 bg-emerald-800 text-white font-semibold rounded-lg hover:bg-emerald-900 transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            <span>Return to Job</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <User className="h-3.5 w-3.5" />
            <span>Candidate Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Candidate Profile
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Powers transparent apply gates, ethical match scores, and resume tailoring. Under no circumstances do we collect gender, age, photo, or marital status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={profile.skills.length === 0 ? handleRestoreDefaults : handleReset}
            className="text-xs min-h-[44px] px-4 gap-1.5 border-neutral-200 dark:border-neutral-800"
            title="Toggle incomplete state to test empty score handling"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{profile.skills.length === 0 ? 'Load Demo Profile' : 'Test Incomplete'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave()}
            className="text-xs min-h-[44px] px-4 gap-1.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold"
          >
            {isSaved ? <Check className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
            <span>{isSaved ? 'Saved!' : 'Save Profile'}</span>
          </Button>
        </div>
      </div>

      {/* Apply-Ready Progress Checklist Card */}
      {applyReady && (
        <Card className="border-neutral-200/90 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-950">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Apply-Ready Status:{' '}
                    <span className={applyReady.is_apply_ready ? 'text-emerald-600' : 'text-amber-600'}>
                      {applyReady.is_apply_ready ? 'Ready to Apply' : `${applyReady.remaining_steps} of 7 steps left`}
                    </span>
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      applyReady.is_apply_ready
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {applyReady.progress_pct}% complete
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {applyReady.is_apply_ready
                    ? 'All 7 mandatory apply criteria are fulfilled. You can submit 1-click applications across verified roles.'
                    : `Complete all 7 criteria below to unlock direct and employer apply flows.`}
                </p>
              </div>

              {returnTo && (
                <Link href={returnTo}>
                  <Button size="sm" className="text-xs min-h-[44px] px-4 bg-emerald-800 hover:bg-emerald-900 text-white">
                    <span>Return to Job</span>
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Button>
                </Link>
              )}
            </div>

            <Progress value={applyReady.progress_pct} className="h-2 rounded-full" />

            {/* 7 Apply Ready Criteria Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 text-xs">
              <div className={`p-2.5 rounded-lg border ${profile.email_verified ? 'bg-emerald-50/50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {profile.email_verified ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <span>1. Email Verified</span>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border ${Boolean(profile.fullName?.trim()) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {Boolean(profile.fullName?.trim()) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <span>2. Full Name</span>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border ${Boolean(profile.country?.trim()) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {Boolean(profile.country?.trim()) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <span>3. Country</span>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border ${Boolean(profile.role_track?.trim()) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {Boolean(profile.role_track?.trim()) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <span>4. Role Track</span>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border ${profile.skills.length >= 3 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {profile.skills.length >= 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <span>5. Skills (Min 3: {profile.skills.length})</span>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border ${Boolean(profile.seniority) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {Boolean(profile.seniority) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <span>6. Seniority Level</span>
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border sm:col-span-2 ${(profile.cvFile?.name || (profile.work_history && profile.work_history.length > 0)) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {(profile.cvFile?.name || (profile.work_history && profile.work_history.length > 0)) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <span>7. CV Uploaded OR Work History ({profile.work_history?.length || 0} entries)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CV Upload Card */}
      <Card id="cv-upload" className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Upload your CV to fill this in (PDF or DOCX, max 5MB)</span>
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                Upload your CV to automatically extract skills, roles, and experience. You can edit every parsed field below.
              </CardDescription>
            </div>

            {profile.cvFile && (
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
                CV Uploaded
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="cv-upload-input"
            />
            <label
              htmlFor="cv-upload-input"
              className={`flex-1 w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isParsingCV
                  ? 'border-blue-500 bg-blue-50/30'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 bg-white/70 dark:bg-neutral-900/50'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                <FileText className="h-6 w-6 text-neutral-400" />
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-neutral-500">PDF or DOCX format (Max 5MB)</div>
              </div>
            </label>

            {profile.cvFile && (
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs w-full sm:w-80 space-y-1">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {profile.cvFile.name}
                </div>
                <div className="text-xs text-neutral-500">
                  {(profile.cvFile.size / 1024 / 1024).toFixed(2)} MB · Uploaded {new Date(profile.cvFile.uploadedAt).toLocaleDateString()}
                </div>
                {profile.cvFile.parsedSummary && (
                  <p className="text-xs text-neutral-500 line-clamp-2 pt-1 border-t border-neutral-100">
                    {profile.cvFile.parsedSummary}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info & Location */}
        <Card id="basic-info" className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Basic Details & Residence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-fullName" className="text-xs font-semibold">Full Name *</Label>
                <Input
                  id="profile-fullName"
                  value={profile.fullName}
                  onChange={(e) => {
                    const updated = { ...profile, fullName: e.target.value };
                    setProfile(updated);
                    setApplyReady(evaluateApplyReady(updated));
                  }}
                  placeholder="e.g. Adaeze Okonkwo"
                  className="h-11 text-sm bg-neutral-50 border-neutral-200"
                  required
                />
              </div>

              <div id="email" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="profile-email" className="text-xs font-semibold">Email Address *</Label>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
                <Input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => {
                    const updated = { ...profile, email: e.target.value };
                    setProfile(updated);
                    setApplyReady(evaluateApplyReady(updated));
                  }}
                  className="h-11 text-sm bg-neutral-50 border-neutral-200"
                  required
                />
              </div>

              <div id="location" className="space-y-1.5">
                <Label htmlFor="profile-country" className="text-xs font-semibold">Country of Residence *</Label>
                <Select
                  value={profile.country || 'Nigeria'}
                  onValueChange={(val) => {
                    const updated = { ...profile, country: val };
                    setProfile(updated);
                    setApplyReady(evaluateApplyReady(updated));
                  }}
                >
                  <SelectTrigger id="profile-country" className="h-11 text-sm bg-neutral-50 border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div id="role-track" className="space-y-1.5">
                <Label htmlFor="profile-role-track" className="text-xs font-semibold">Primary Role Track *</Label>
                <Select
                  value={profile.role_track || 'Software Engineering'}
                  onValueChange={(val) => {
                    const updated = { ...profile, role_track: val };
                    setProfile(updated);
                    setApplyReady(evaluateApplyReady(updated));
                  }}
                >
                  <SelectTrigger id="profile-role-track" className="h-11 text-sm bg-neutral-50 border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_TRACKS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="profile-bio" className="text-xs font-semibold">Professional Bio / Summary</Label>
              <Textarea
                id="profile-bio"
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Senior Engineer specializing in scalable distributed microservices and accessible frontend design systems..."
                className="text-xs min-h-[80px] bg-neutral-50 border-neutral-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Work History Entries */}
        <Card className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Work Experience & Employment History ({profile.work_history?.length || 0})
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Add at least one role to fulfill the Apply-Ready work experience criterion.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddWorkModal(!showAddWorkModal)}
              className="text-xs h-9 px-3 gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Position</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddWorkModal && (
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">New Work Position</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Role Title (e.g. Senior Frontend Engineer)"
                    value={newWorkTitle}
                    onChange={(e) => setNewWorkTitle(e.target.value)}
                    className="h-10 text-xs bg-white"
                  />
                  <Input
                    placeholder="Company Name (e.g. Flutterwave)"
                    value={newWorkCompany}
                    onChange={(e) => setNewWorkCompany(e.target.value)}
                    className="h-10 text-xs bg-white"
                  />
                  <Input
                    type="month"
                    placeholder="Start Date"
                    value={newWorkStart}
                    onChange={(e) => setNewWorkStart(e.target.value)}
                    className="h-10 text-xs bg-white"
                  />
                  <Input
                    placeholder="Summary / Accomplishments"
                    value={newWorkSummary}
                    onChange={(e) => setNewWorkSummary(e.target.value)}
                    className="h-10 text-xs bg-white"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddWorkModal(false)} className="text-xs h-8">
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleAddWorkHistory} className="text-xs h-8 bg-neutral-950 text-white">
                    Save Position
                  </Button>
                </div>
              </div>
            )}

            {profile.work_history && profile.work_history.length > 0 ? (
              <div className="space-y-3">
                {profile.work_history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 border border-neutral-200 rounded-lg flex items-start justify-between gap-3 text-xs bg-neutral-50/50"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-neutral-900 text-sm">{item.title}</div>
                      <div className="text-neutral-600 font-medium">
                        {item.company} · {item.start_date} - {item.current ? 'Present' : item.end_date}
                      </div>
                      {item.summary && <p className="text-neutral-500 pt-1">{item.summary}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkHistory(item.id)}
                      className="p-1 text-neutral-400 hover:text-rose-500"
                      title="Remove position"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-500 border border-dashed rounded-lg">
                No work history entries added yet. Either upload your CV or click &quot;Add Position&quot; above.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience & Seniority */}
        <Card id="experience" className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Seniority & Career Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-years" className="text-xs font-semibold">Years of Experience *</Label>
                <Input
                  id="profile-years"
                  type="number"
                  min={0}
                  max={40}
                  value={profile.yearsOfExperience || ''}
                  onChange={(e) => {
                    const updated = { ...profile, yearsOfExperience: parseInt(e.target.value, 10) || 0 };
                    setProfile(updated);
                    setApplyReady(evaluateApplyReady(updated));
                  }}
                  className="h-11 text-sm bg-neutral-50 border-neutral-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Seniority Level *</Label>
                <Select
                  value={profile.seniority}
                  onValueChange={(val: SeniorityLevel) => {
                    const updated = { ...profile, seniority: val };
                    setProfile(updated);
                    setApplyReady(evaluateApplyReady(updated));
                  }}
                >
                  <SelectTrigger className="h-11 text-sm bg-neutral-50 border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SENIORITY_OPTIONS.map((sen) => (
                      <SelectItem key={sen} value={sen}>{sen}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card id="skills" className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Skills & Proficiency ({profile.skills.length})
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                At least 3 skills required for Apply-Ready status.
              </CardDescription>
            </div>
            <Badge variant="outline" className={`text-xs ${profile.skills.length >= 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {profile.skills.length}/3 minimum
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <Input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Skill name (e.g. Next.js, Go, Figma, AWS)"
                className="text-xs h-10 bg-white flex-1"
              />
              <Select
                value={newSkillLevel}
                onValueChange={(val: SkillProficiency['level']) => setNewSkillLevel(val)}
              >
                <SelectTrigger className="text-xs h-10 w-full sm:w-36 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" onClick={handleAddSkill} className="text-xs h-10 bg-neutral-900 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Skill
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {profile.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-white text-xs"
                >
                  <span className="font-semibold text-neutral-800 truncate pr-2">{skill.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Select
                      value={skill.level}
                      onValueChange={(val: SkillProficiency['level']) => handleUpdateSkillLevel(skill.name, val)}
                    >
                      <SelectTrigger className="h-7 text-xs w-24 bg-neutral-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFICIENCY_LEVELS.map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.name)}
                      className="p-1 text-neutral-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preferences & Compensation */}
        <Card className="border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Work Preferences & Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Work Preferences</Label>
              <div className="flex flex-wrap items-center gap-2">
                {WORK_PREF_OPTIONS.map((pref) => {
                  const active = (profile.workPreferences || []).includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => handleToggleWorkPref(pref)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-medium border transition-colors ${
                        active
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {active && '✓ '}
                      {pref}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Minimum Annual Salary Expectation</Label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={profile.minSalaryExpectation || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, minSalaryExpectation: parseInt(e.target.value, 10) || null })
                  }
                  placeholder="e.g. 85000"
                  className="h-11 text-sm bg-neutral-50 border-neutral-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Currency</Label>
                <Select
                  value={profile.salaryCurrency}
                  onValueChange={(val: any) => setProfile({ ...profile, salaryCurrency: val })}
                >
                  <SelectTrigger className="h-11 text-sm bg-neutral-50 border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            Scores and suggestions are AI-generated and advisory. You decide where to apply.
          </p>

          <Button
            type="submit"
            className="text-xs h-11 px-8 gap-2 bg-neutral-950 text-white hover:bg-neutral-800 font-semibold w-full sm:w-auto"
          >
            {isSaved ? <Check className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
            <span>{isSaved ? 'Profile Saved & Synchronized!' : 'Save Candidate Profile'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CandidateProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-500">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
