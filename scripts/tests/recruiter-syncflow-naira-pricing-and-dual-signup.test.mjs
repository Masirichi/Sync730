// scripts/tests/recruiter-syncflow-naira-pricing-and-dual-signup.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());

test('1. Verify Abuja is removed from everywhere on the website EXCEPT at the footer', () => {
  const checkDirs = ['app', 'components', 'content'];
  const allowedFooterFiles = [
    path.join(projectRoot, 'components', 'site', 'site-footer.tsx'),
    path.join(projectRoot, 'content', 'home.ts'),
  ];

  let violations = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (/\.(tsx|ts)$/.test(entry.name)) {
        if (allowedFooterFiles.includes(fullPath)) {
          continue;
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        // Ignore regex replacement expressions like city.replace(/abuja/i, 'Nigeria')
        const cleaned = content
          .replace(/city\.replace\(\/abuja\/i/g, '')
          .replace(/['"]abuja['"]/g, '');

        if (/abuja/i.test(cleaned)) {
          violations.push(path.relative(projectRoot, fullPath));
        }
      }
    }
  }

  checkDirs.forEach((d) => scan(path.join(projectRoot, d)));

  assert.deepEqual(violations, [], `Abuja found outside footer in: ${violations.join(', ')}`);

  // Verify footer specifically HAS Abuja, Nigeria
  const footerPath = path.join(projectRoot, 'components', 'site', 'site-footer.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf8');
  assert.ok(footerContent.includes('Abuja, Nigeria'), 'Footer must contain Abuja, Nigeria');
  assert.ok(!footerContent.includes('Abuja HQ'), 'Footer must not contain HQ');
});

test('2. Verify Pricing is displayed in Naira (₦ / NGN)', () => {
  const hiringPath = path.join(projectRoot, 'app', 'hiring', 'page.tsx');
  const hiringContent = fs.readFileSync(hiringPath, 'utf8');

  // Verify Naira symbols and token pricing
  assert.ok(hiringContent.includes('₦100,000'), 'Hiring pricing must include ₦100,000 starter tier');
  assert.ok(hiringContent.includes('₦270,000'), 'Hiring pricing must include ₦270,000 growth tier');
  assert.ok(hiringContent.includes('₦800,000'), 'Hiring pricing must include ₦800,000 enterprise tier');
  assert.ok(hiringContent.includes('₦15,000,000'), 'Hiring page must reference ₦15,000,000 agency retainers');
  assert.ok(!hiringContent.includes('$499'), 'Hiring pricing must NOT include $499 USD');
  assert.ok(!hiringContent.includes('$25,000'), 'Hiring pricing must NOT include $25,000 USD');

  // Solutions page check
  const solutionsPath = path.join(projectRoot, 'app', 'solutions', 'page.tsx');
  const solutionsContent = fs.readFileSync(solutionsPath, 'utf8');
  assert.ok(solutionsContent.includes('₦15,000,000'), 'Solutions page must reference ₦15,000,000 agency retainers');
  assert.ok(!solutionsContent.includes('$25,000'), 'Solutions page must NOT include $25,000 USD');

  // Solutions section check
  const solutionsSectionPath = path.join(projectRoot, 'components', 'home', 'solutions-section.tsx');
  const sectionContent = fs.readFileSync(solutionsSectionPath, 'utf8');
  assert.ok(sectionContent.includes('₦15,000,000'), 'Solutions section must reference ₦15,000,000 agency retainers');
  assert.ok(!sectionContent.includes('$25,000'), 'Solutions section must NOT include $25,000 USD');
});

test('3. Verify SyncFlow is integrated into the Recruiter Portal for Talent Management', () => {
  // Check Recruiter Console Layout
  const consoleLayoutPath = path.join(projectRoot, 'app', '(recruiter)', 'console', 'layout.tsx');
  const layoutContent = fs.readFileSync(consoleLayoutPath, 'utf8');
  assert.ok(layoutContent.includes("name: 'SyncFlow Pipeline'"), 'Recruiter Console layout must have SyncFlow Pipeline nav item');
  assert.ok(layoutContent.includes("href: '/console/syncflow'"), 'Nav item must link to /console/syncflow');
  assert.ok(layoutContent.includes("pathname.startsWith('/console/syncflow')"), 'Page title handles syncflow');

  // Check Recruiter SyncFlow Page
  const syncflowPagePath = path.join(projectRoot, 'app', '(recruiter)', 'console', 'syncflow', 'page.tsx');
  assert.ok(fs.existsSync(syncflowPagePath), 'app/(recruiter)/console/syncflow/page.tsx must exist');

  const syncflowContent = fs.readFileSync(syncflowPagePath, 'utf8');
  assert.ok(syncflowContent.includes('SyncFlow Talent Pipeline'), 'Must render SyncFlow Talent Pipeline header');
  assert.ok(syncflowContent.includes('Sourced & Matched'), 'Must include Sourced & Matched stage');
  assert.ok(syncflowContent.includes('AI Screening & Rubric'), 'Must include Screening stage');
  assert.ok(syncflowContent.includes('Interview Scheduled'), 'Must include Interview Scheduled stage');
  assert.ok(syncflowContent.includes('Offer Extended'), 'Must include Offer Extended stage');
  assert.ok(syncflowContent.includes('Hired & Onboarded'), 'Must include Hired & Onboarded stage');
  assert.ok(syncflowContent.includes('handleMoveStage'), 'Must support advancing stages');
  assert.ok(syncflowContent.includes('/console/messages?candidate='), 'Must support direct candidate chat');

  // Check Recruiter Talent Page integration
  const talentPagePath = path.join(projectRoot, 'app', '(recruiter)', 'console', 'talent', 'page.tsx');
  const talentContent = fs.readFileSync(talentPagePath, 'utf8');
  assert.ok(talentContent.includes('handleAddToSyncFlow'), 'Talent pool must have handleAddToSyncFlow');
  assert.ok(talentContent.includes('SyncFlow'), 'Talent cards must render SyncFlow action button');
});

test('4. Verify Signup Screen supports both Recruiters and Talent', () => {
  const registerPath = path.join(projectRoot, 'app', '(auth)', 'register', 'page.tsx');
  assert.ok(fs.existsSync(registerPath), 'register page must exist');

  const content = fs.readFileSync(registerPath, 'utf8');
  assert.ok(content.includes('I am Talent'), 'Register form must offer Talent option');
  assert.ok(content.includes('I am a Recruiter'), 'Register form must offer Recruiter option');
  assert.ok(content.includes('handleTalentRegister'), 'Must handle talent registration');
  assert.ok(content.includes('handleRecruiterRegister'), 'Must handle recruiter registration');
  assert.ok(content.includes('saveLocalWorkspace'), 'Recruiter registration initializes workspace');
  assert.ok(content.includes('token_balance: 2'), 'Recruiter registration gives 2 free tokens');

  // Recruiter redirect route
  const recruiterRegisterPath = path.join(projectRoot, 'app', '(auth)', 'register', 'recruiter', 'page.tsx');
  const recruiterContent = fs.readFileSync(recruiterRegisterPath, 'utf8');
  assert.ok(recruiterContent.includes("redirect('/register?role=recruiter')"), 'Recruiter register routes to dual signup with recruiter preset');
});

test('5. Zero Emojis Compliance in all updated components', () => {
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  const targetFiles = [
    'app/hiring/page.tsx',
    'app/products/page.tsx',
    'app/solutions/page.tsx',
    'app/(recruiter)/console/syncflow/page.tsx',
    'app/(recruiter)/console/layout.tsx',
    'app/(recruiter)/console/talent/page.tsx',
    'app/(auth)/register/page.tsx',
    'components/site/site-header.tsx',
    'components/site/site-footer.tsx',
  ];

  targetFiles.forEach((f) => {
    const full = path.join(projectRoot, f);
    if (fs.existsSync(full)) {
      const code = fs.readFileSync(full, 'utf8');
      assert.ok(!emojiRegex.test(code), `Emoji detected in ${f}`);
    }
  });
});
