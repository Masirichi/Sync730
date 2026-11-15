// scripts/tests/supporting-pages-and-links.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('1. /how-we-verify page structure and honest claims', () => {
  const filePath = path.join(projectRoot, 'app/how-we-verify/page.tsx');
  assert.ok(fs.existsSync(filePath), 'app/how-we-verify/page.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify Metadata
  assert.ok(content.includes('title:'), 'Must have title in metadata');
  assert.ok(content.includes('description:'), 'Must have description in metadata');

  // Single H1 check
  const h1Matches = content.match(/<h1[^>]*>/g) || [];
  assert.equal(h1Matches.length, 1, 'Must have exactly one <h1> element');

  // Section (a) What "Role verified" means
  assert.ok(content.includes('What &ldquo;Role verified&rdquo; means') || content.includes('Role verified'), 'Missing section (a)');
  assert.ok(content.includes('confirmed this role exists, is currently open, and accepts applicants'), 'Missing role verified definition');
  assert.ok(content.includes("Pay and hiring decisions are the employer's") || content.includes("employer&apos;s"), 'Missing employer decisions caveat');

  // Section (b) What "Open to Africa" means & country list example
  assert.ok(content.includes('What &ldquo;Open to Africa&rdquo; means') || content.includes('Open to Africa'), 'Missing section (b)');
  assert.ok(content.includes('Open to Nigeria, Ghana, Kenya +4'), 'Missing card country list example');
  assert.ok(content.includes('Open to all of Africa'), 'Missing Africa-wide example');

  // Section (c) What we check
  assert.ok(content.includes('What we check'), 'Missing section (c)');
  assert.ok(content.includes("Live on employer's channel") || content.includes("employer&apos;s channel"), 'Missing check 1');
  assert.ok(content.includes('Hiring contact confirmed'), 'Missing check 2');
  assert.ok(content.includes('Eligible countries confirmed'), 'Missing check 3');

  // Section (d) What we don't do
  assert.ok(content.includes("What we don't do") || content.includes("don&apos;t do"), 'Missing section (d)');
  assert.ok(content.includes('no CAC, TIN'), 'Must explicitly disclaim CAC/TIN');
  assert.ok(content.includes('guarantee pay, contracts'), 'Must explicitly disclaim pay/contract guarantees');

  // Section (e) How roles are re-checked and removed
  assert.ok(content.includes('How roles are re-checked and removed'), 'Missing section (e)');
  assert.ok(content.includes('ROLE_STALE_WINDOW_DAYS') || content.includes('14'), 'Must mention stale rule');
  assert.ok(content.includes('TODO: Process Detail'), 'Must contain TODO comment for unverified process details');

  // Section (f) How to report a job
  assert.ok(content.includes('How to report a job'), 'Missing section (f)');
  assert.ok(content.includes('Report this job') || content.includes('Report this role'), 'Must describe report action');
  assert.ok(content.includes('MAX_REPORTS_BEFORE_HIDE') || content.includes('3 community reports'), 'Must mention 3 reports hide rule');
  assert.ok(content.includes('/find-work'), 'Must link to find work');
});

test('2. /why-we-built-this page structure, belief copy, placeholder, and noindex', () => {
  const filePath = path.join(projectRoot, 'app/why-we-built-this/page.tsx');
  assert.ok(fs.existsSync(filePath), 'app/why-we-built-this/page.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify Metadata with noindex
  assert.ok(content.includes('title:'), 'Must have title in metadata');
  assert.ok(content.includes('description:'), 'Must have description in metadata');
  assert.ok(content.includes('index: false'), 'Must be marked noindex');
  assert.ok(content.includes('follow: false'), 'Must be marked nofollow');

  // Single H1 check
  const h1Matches = content.match(/<h1[^>]*>/g) || [];
  assert.equal(h1Matches.length, 1, 'Must have exactly one <h1> element');

  // Belief copy from homepage
  assert.ok(content.includes('belief.paragraphs'), 'Must render belief paragraphs');

  // Clearly marked placeholder for founders' story & meaning of 730
  assert.ok(content.includes('FOUNDERS&apos; STORY &amp; THE MEANING OF &ldquo;730&rdquo;') || content.includes('730'), 'Missing placeholder label');
  assert.ok(content.includes('This section is reserved for the founders'), 'Must state reserved placeholder');
  assert.ok(content.includes('TODO: Founder Story & Meaning of 730'), 'Must contain TODO comment');

  // Verify footer does not link to /why-we-built-this
  const footerContent = fs.readFileSync(path.join(projectRoot, 'components/site/site-footer.tsx'), 'utf8');
  assert.ok(!footerContent.includes('/why-we-built-this'), 'Footer must not link to /why-we-built-this until real copy exists');
});

test('3. Internal Link Wiring across the platform', () => {
  // 1. "Read how we verify roles" on homepage
  const beliefContent = fs.readFileSync(path.join(projectRoot, 'components/home/belief-section.tsx'), 'utf8');
  assert.ok(beliefContent.includes('belief.linkHref'), 'BeliefSection must link to how-we-verify');

  const homeContent = fs.readFileSync(path.join(projectRoot, 'src/content/home.ts'), 'utf8');
  assert.ok(homeContent.includes("linkHref: '/how-we-verify'"), 'HOME_CONTENT.belief must point to /how-we-verify');

  // 2. The "Role verified" tooltip in JobCard
  const jobCardContent = fs.readFileSync(path.join(projectRoot, 'components/jobs/job-card.tsx'), 'utf8');
  assert.ok(jobCardContent.includes('href="/how-we-verify"'), 'JobCard tooltip must link to /how-we-verify');
  assert.ok(jobCardContent.includes('Learn how we verify'), 'JobCard tooltip must have Learn how we verify text');

  // 3. The FAQ answer
  const faqContent = fs.readFileSync(path.join(projectRoot, 'components/home/faq-section.tsx'), 'utf8');
  assert.ok(faqContent.includes('href="/how-we-verify"'), 'FAQSection must link to /how-we-verify on Role verified answer');

  // 4. The footer
  const footerContent = fs.readFileSync(path.join(projectRoot, 'components/site/site-footer.tsx'), 'utf8');
  assert.ok(homeContent.includes("href: '/how-we-verify'"), 'Footer content must contain /how-we-verify link');

  // 5. The job dialog checklist heading
  const dialogContent = fs.readFileSync(path.join(projectRoot, 'components/jobs/job-detail-dialog.tsx'), 'utf8');
  assert.ok(dialogContent.includes('href="/how-we-verify"'), 'JobDetailDialog must link to /how-we-verify on checklist heading');
});
