const fs = require('fs');
const path = require('path');

console.log('Applying targeted axe fixes across the codebase...');

// =============================================================
// 1. app/(candidate)/dashboard/profile/page.tsx
// =============================================================
const profilePath = path.resolve('app/(candidate)/dashboard/profile/page.tsx');
let profileContent = fs.readFileSync(profilePath, 'utf8');

// Full name
profileContent = profileContent.replace(
  `<Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Full Name *</Label>
                <Input
                  value={profile.fullName}`,
  `<Label htmlFor="profile-fullName" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Full Name *</Label>
                <Input
                  id="profile-fullName"
                  value={profile.fullName}`
);

// Email
profileContent = profileContent.replace(
  `<Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Email Address *</Label>
                <Input
                  type="email"
                  value={profile.email}`,
  `<Label htmlFor="profile-email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Email Address *</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={profile.email}`
);

// Location
profileContent = profileContent.replace(
  `<Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Location (City, Country) *</Label>
                <Input
                  value={profile.location}`,
  `<Label htmlFor="profile-location" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Location (City, Country) *</Label>
                <Input
                  id="profile-location"
                  value={profile.location}`
);

// Phone
profileContent = profileContent.replace(
  `<Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Phone Number (Optional)</Label>
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={profile.phone || ''}`,
  `<Label htmlFor="profile-phone" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Phone Number (Optional)</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  value={profile.phone || ''}`
);

// Bio
profileContent = profileContent.replace(
  `<Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Professional Bio / Summary</Label>
              <Textarea
                value={profile.bio || ''}`,
  `<Label htmlFor="profile-bio" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Professional Bio / Summary</Label>
              <Textarea
                id="profile-bio"
                value={profile.bio || ''}`
);

// Target Role Input
profileContent = profileContent.replace(
  `<Input
                  placeholder="Add target role (e.g. Senior Backend Engineer)..."
                  value={newRoleInput}`,
  `<Input
                  id="profile-newRoleInput"
                  aria-label="Add target role"
                  placeholder="Add target role (e.g. Senior Backend Engineer)..."
                  value={newRoleInput}`
);

// Years of Experience
profileContent = profileContent.replace(
  `<Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Years of Experience *
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={40}
                  value={profile.yearsOfExperience || ''}`,
  `<Label htmlFor="profile-yearsOfExperience" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Years of Experience *
                </Label>
                <Input
                  id="profile-yearsOfExperience"
                  aria-label="Years of Experience"
                  type="number"
                  min={0}
                  max={40}
                  value={profile.yearsOfExperience || ''}`
);

// Add custom skill input
profileContent = profileContent.replace(
  `<Input
                placeholder="Add custom skill (e.g. Kafka, Next.js, Kubernetes)..."
                value={newSkillInput}`,
  `<Input
                id="profile-newSkillInput"
                aria-label="Add custom skill"
                placeholder="Add custom skill (e.g. Kafka, Next.js, Kubernetes)..."
                value={newSkillInput}`
);

// Minimum salary input
profileContent = profileContent.replace(
  `<Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Minimum Annual Expectation (Gross)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={profile.minimumSalary || ''}`,
  `<Label htmlFor="profile-minimumSalary" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Minimum Annual Expectation (Gross)
                  </Label>
                  <Input
                    id="profile-minimumSalary"
                    aria-label="Minimum Annual Expectation"
                    type="number"
                    min="0"
                    step="1000"
                    value={profile.minimumSalary || ''}`
);

// Profile strength progress bar
profileContent = profileContent.replace(
  `<Progress value={strength.score} className="h-2 rounded-full" />`,
  `<Progress value={strength.score} aria-label="Profile completion strength" className="h-2 rounded-full" />`
);

// Contrast on profile strength pill
profileContent = profileContent.replace(
  `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`,
  `bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30`
);

// Contrast on profile file size / uploaded date
profileContent = profileContent.replace(
  `<div className="text-xs text-neutral-400">`,
  `<div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">`
);

// Contrast on AI disclosure footer
profileContent = profileContent.replace(
  `<div className="pt-6 pb-2 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500">`,
  `<div className="pt-6 pb-2 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-700 dark:text-neutral-300 font-medium">`
);

fs.writeFileSync(profilePath, profileContent, 'utf8');
console.log('SUCCESS: Profile page fixes applied');

// =============================================================
// 2. app/(candidate)/dashboard/jobs/[id]/page.tsx
// =============================================================
const jobDetailPath = path.resolve('app/(candidate)/dashboard/jobs/[id]/page.tsx');
let jobDetailContent = fs.readFileSync(jobDetailPath, 'utf8');

// Fix label-content-name-mismatch on Back to jobs link
jobDetailContent = jobDetailContent.replace(
  `aria-label="Back to verified jobs list"`,
  `aria-label="Back to jobs"`
);

// Fix contrast on learning resource
jobDetailContent = jobDetailContent.replace(
  /className="text-xs text-neutral-400">Learning resource &amp; practice<\/span>/g,
  'className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Learning resource &amp; practice</span>'
);

// Fix contrast on footer
jobDetailContent = jobDetailContent.replace(
  `<div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500">`,
  `<div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-700 dark:text-neutral-300 font-medium">`
);

fs.writeFileSync(jobDetailPath, jobDetailContent, 'utf8');
console.log('SUCCESS: Job detail page fixes applied');

// =============================================================
// 3. app/(candidate)/dashboard/tracker/page.tsx
// =============================================================
const trackerPath = path.resolve('app/(candidate)/dashboard/tracker/page.tsx');
let trackerContent = fs.readFileSync(trackerPath, 'utf8');

// Fix scrollable-region-focusable
trackerContent = trackerContent.replace(
  `<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">`,
  `<div tabIndex={0} role="region" aria-label="Application tracker columns" className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4 focus:outline-none focus:ring-2 focus:ring-neutral-400 rounded-xl">`
);

// Fix contrast on empty state
trackerContent = trackerContent.replace(
  `className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center text-xs text-neutral-400"`,
  `className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center text-xs text-neutral-700 dark:text-neutral-300 font-medium"`
);

// Fix contrast on added date
trackerContent = trackerContent.replace(
  `className="flex items-center gap-1 text-xs text-neutral-400"`,
  `className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 font-medium"`
);

fs.writeFileSync(trackerPath, trackerContent, 'utf8');
console.log('SUCCESS: Tracker page fixes applied');

// =============================================================
// 4. app/(candidate)/dashboard/crawler/page.tsx
// =============================================================
const crawlerPath = path.resolve('app/(candidate)/dashboard/crawler/page.tsx');
let crawlerContent = fs.readFileSync(crawlerPath, 'utf8');

// Fix contrast on Recommended score badge
crawlerContent = crawlerContent.replace(
  `text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20`,
  `text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/30`
);

// Fix contrast on posted ago line
crawlerContent = crawlerContent.replace(
  `className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500"`,
  `className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium"`
);

// Fix contrast on report bad match button
crawlerContent = crawlerContent.replace(
  `className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline cursor-pointer"`,
  `className="text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white underline font-medium cursor-pointer"`
);

// Fix contrast on footer
crawlerContent = crawlerContent.replace(
  `<div className="pt-6 pb-2 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500">`,
  `<div className="pt-6 pb-2 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-700 dark:text-neutral-300 font-medium">`
);

// Fix contrast on showing positions count
crawlerContent = crawlerContent.replace(
  `<span className="text-xs text-neutral-400">
                Showing`,
  `<span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                Showing`
);

fs.writeFileSync(crawlerPath, crawlerContent, 'utf8');
console.log('SUCCESS: Crawler page fixes applied');

// =============================================================
// 5. app/(auth)/login/page.tsx
// =============================================================
const loginPath = path.resolve('app/(auth)/login/page.tsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Replace low contrast text in demo preview / tables
loginContent = loginContent.replace(
  /text-\[1[01]px\] text-neutral-400/g,
  'text-xs text-neutral-700 dark:text-neutral-300 font-medium'
);
loginContent = loginContent.replace(
  /text-neutral-400 text-\[1[01]px\]/g,
  'text-xs text-neutral-700 dark:text-neutral-300 font-medium'
);
loginContent = loginContent.replace(
  /text-xs text-neutral-400/g,
  'text-xs text-neutral-700 dark:text-neutral-300 font-medium'
);
loginContent = loginContent.replace(
  /th className="pb-3 font-semibold"/g,
  'th className="pb-3 font-semibold text-neutral-700 dark:text-neutral-300"'
);

fs.writeFileSync(loginPath, loginContent, 'utf8');
console.log('SUCCESS: Login page fixes applied');

console.log('All targeted axe fixes applied successfully.');
