// scripts/tests/homepage-top-half.test.mjs
// Automated verification for the top half of the homepage and content centralization

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Content Centralization in src/content/home.ts', async () => {
  const contentModule = await import('../../src/content/home.ts');
  const { HOME_CONTENT } = contentModule;

  assert.ok(HOME_CONTENT, 'HOME_CONTENT must be exported');

  // Meta
  assert.equal(HOME_CONTENT.meta.title, 'Sync730: Real remote jobs, open to Africa');
  assert.equal(
    HOME_CONTENT.meta.description,
    "Every role on Sync730 is confirmed real and open to people in Africa. No ghost jobs. No 'US only' surprises. Free for candidates."
  );

  // Hero
  assert.equal(HOME_CONTENT.hero.eyebrow, 'WE BELIEVE TALENT IS EVERYWHERE');
  assert.equal(HOME_CONTENT.hero.h1, 'Talent is everywhere. Real opportunity should be too.');
  assert.equal(
    HOME_CONTENT.hero.sub,
    "You've sent applications into the void. You've found \"worldwide remote\" jobs that weren't. We built Sync730 so every role you see is real, open to you in Africa, and one click from your pipeline."
  );
  assert.equal(HOME_CONTENT.hero.ctaPrimary, "I'm looking for work");
  assert.equal(HOME_CONTENT.hero.ctaSecondary, "I'm hiring in Africa");
  assert.equal(
    HOME_CONTENT.hero.proofLine,
    'Free for candidates · Humans make every hiring decision · Built for how Africa hires'
  );

  // Live stats
  assert.equal(HOME_CONTENT.liveStats.label, 'LIVE ON SYNC730');
  assert.equal(
    HOME_CONTENT.liveStats.rolesSuffix,
    'new roles in the last 24 hours, each checked before you saw it'
  );
  assert.equal(
    HOME_CONTENT.liveStats.talentsSuffix,
    'professionals already tracking their search in SyncFlow'
  );
  assert.equal(
    HOME_CONTENT.liveStats.partnersSuffix,
    'companies hiring from Africa right now'
  );

  // Belief
  assert.equal(HOME_CONTENT.belief.label, 'WHY WE EXIST');
  assert.equal(HOME_CONTENT.belief.h2, "Where you live shouldn't decide what you can become.");
  assert.equal(HOME_CONTENT.belief.paragraphs.length, 5);
  assert.ok(HOME_CONTENT.belief.paragraphs[0].includes('African professionals are among the most capable'));
  assert.ok(HOME_CONTENT.belief.paragraphs[1].includes('A listing that says "remote" but means "US residents only."'));
  assert.ok(HOME_CONTENT.belief.paragraphs[2].includes("That is not a talent problem. It's an information problem."));
  assert.ok(HOME_CONTENT.belief.paragraphs[3].includes('So we fixed the information.'));
  assert.ok(HOME_CONTENT.belief.paragraphs[4].includes('No false hope. Just a fair shot.'));
  assert.equal(HOME_CONTENT.belief.linkLabel, 'Read how we verify roles');
  assert.equal(HOME_CONTENT.belief.linkHref, '/how-we-verify');

  // For candidates
  assert.equal(HOME_CONTENT.forCandidates.eyebrow, "FOR THE ONES WHO'VE BEEN GHOSTED");
  assert.equal(HOME_CONTENT.forCandidates.h2, 'Stop applying into the void.');
  assert.ok(HOME_CONTENT.forCandidates.body.includes("You've done the work. You deserve a fair shot."));
  assert.equal(HOME_CONTENT.forCandidates.points.length, 3);
  assert.equal(HOME_CONTENT.forCandidates.points[0].title, 'Real, not ghost');
  assert.equal(HOME_CONTENT.forCandidates.points[1].title, 'Open to you, said upfront');
  assert.equal(HOME_CONTENT.forCandidates.points[2].title, 'One home for your search');
  assert.equal(
    HOME_CONTENT.forCandidates.reassurance,
    'Video interviews are short and work on your phone. Only the hiring team sees your recording.'
  );
  assert.equal(HOME_CONTENT.forCandidates.ctaPrimary, 'Create your free profile');
  assert.equal(HOME_CONTENT.forCandidates.ctaSecondary, 'See roles open to Africa');

  // How it works
  assert.equal(HOME_CONTENT.howItWorks.label, 'HOW IT WORKS');
  assert.equal(HOME_CONTENT.howItWorks.h2, 'From "is this real?" to "I\'m hired" in four steps.');
  assert.equal(HOME_CONTENT.howItWorks.steps.length, 4);
  assert.equal(HOME_CONTENT.howItWorks.steps[0].number, '01');
  assert.equal(HOME_CONTENT.howItWorks.steps[0].title, 'Create your profile');
  assert.equal(HOME_CONTENT.howItWorks.steps[1].number, '02');
  assert.equal(HOME_CONTENT.howItWorks.steps[1].title, 'See roles that are real');
  assert.equal(HOME_CONTENT.howItWorks.steps[2].number, '03');
  assert.equal(HOME_CONTENT.howItWorks.steps[2].title, 'Apply with confidence');
  assert.equal(HOME_CONTENT.howItWorks.steps[3].number, '04');
  assert.equal(HOME_CONTENT.howItWorks.steps[3].title, 'Track it in SyncFlow');
});

test('2. Homepage Layout Order in components/home/home-view.tsx', () => {
  const homeViewPath = path.resolve('components/home/home-view.tsx');
  assert.ok(fs.existsSync(homeViewPath), 'home-view.tsx must exist');
  const code = fs.readFileSync(homeViewPath, 'utf8');

  // Order: Hero → Live stats → Belief → For candidates → How it works → (part B)
  const heroIdx = code.indexOf('<HeroSection');
  const statsIdx = code.indexOf('<LiveStatsBand');
  const beliefIdx = code.indexOf('<BeliefSection');
  const candidatesIdx = code.indexOf('<ForCandidatesSection');
  const howItWorksIdx = code.indexOf('<HowItWorksSection');
  const recruitersIdx = code.indexOf('<ForRecruitersSection');

  assert.ok(heroIdx !== -1, 'HeroSection must be present');
  assert.ok(statsIdx !== -1, 'LiveStatsBand must be present');
  assert.ok(beliefIdx !== -1, 'BeliefSection must be present');
  assert.ok(candidatesIdx !== -1, 'ForCandidatesSection must be present');
  assert.ok(howItWorksIdx !== -1, 'HowItWorksSection must be present');
  assert.ok(recruitersIdx !== -1, 'ForRecruitersSection must be present');

  assert.ok(heroIdx < statsIdx, 'Hero must precede Live stats');
  assert.ok(statsIdx < beliefIdx, 'Live stats must precede Belief');
  assert.ok(beliefIdx < candidatesIdx, 'Belief must precede For candidates');
  assert.ok(candidatesIdx < howItWorksIdx, 'For candidates must precede How it works');
  assert.ok(howItWorksIdx < recruitersIdx, 'How it works must precede Part B (recruiters)');
});

test('3. Hero Section: Exactly One H1, Sample Job Card, and Sample Report Moved', () => {
  const heroPath = path.resolve('components/home/hero-section.tsx');
  const heroCode = fs.readFileSync(heroPath, 'utf8');

  // Verify only one H1
  const h1Matches = heroCode.match(/<h1[^>]*>/g);
  assert.equal(h1Matches?.length, 1, 'Hero must contain exactly one <h1>');
  assert.ok(heroCode.includes('{hero.h1}'), 'Hero H1 must reference centralized copy');

  // Verify Sample Job Card with JobCard reuse
  assert.ok(heroCode.includes('<JobCard'), 'Hero must render sample JobCard');
  assert.ok(heroCode.includes('SAMPLE_HERO_JOB'), 'Hero must pass sample job props');
  assert.ok(heroCode.includes('Role verified') || heroCode.includes('role_verified: true'), 'Sample job must have Role verified');
  assert.ok(heroCode.includes('Nigeria') && heroCode.includes('Ghana') && heroCode.includes('Kenya'), 'Sample job must have African countries');
  assert.ok(heroCode.includes('{hero.sampleBadge}'), 'Hero must show "Sample" badge');

  // Verify dark "Sample interview report" card is moved out of Hero into For recruiters
  assert.ok(!heroCode.includes('SAMPLE INTERVIEW REPORT'), 'Dark sample interview report card must be removed from Hero');

  const recruiterPath = path.resolve('components/home/for-recruiters-section.tsx');
  const recruiterCode = fs.readFileSync(recruiterPath, 'utf8');
  assert.ok(recruiterCode.includes('SAMPLE INTERVIEW REPORT'), 'Dark sample interview report card must be placed in For recruiters');
});

test('4. Anchor IDs and Section Structure', () => {
  const beliefCode = fs.readFileSync('components/home/belief-section.tsx', 'utf8');
  const candidateCode = fs.readFileSync('components/home/for-candidates-section.tsx', 'utf8');
  const howCode = fs.readFileSync('components/home/how-it-works-section.tsx', 'utf8');

  assert.ok(beliefCode.includes('id="belief"'), 'Belief section must have id="belief"');
  assert.ok(candidateCode.includes('id="for-candidates"'), 'For candidates section must have id="for-candidates"');
  assert.ok(howCode.includes('id="how-it-works"'), 'How it works section must have id="how-it-works"');

  // Candidates section preserves sample profile card labelled "Sample"
  assert.ok(candidateCode.includes('Example profile'), 'Candidate section must show example profile');
  assert.ok(candidateCode.includes('Sample'), 'Candidate profile card must be labelled Sample');

  // Destination /how-we-verify page exists
  assert.ok(fs.existsSync('app/how-we-verify/page.tsx'), 'Destination page /how-we-verify must exist');
});
