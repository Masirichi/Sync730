// scripts/tests/supporting-pages-and-links.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('1. /how-we-verify page redirects to /find-work as roles are verified before live', () => {
  const filePath = path.join(projectRoot, 'app/how-we-verify/page.tsx');
  assert.ok(fs.existsSync(filePath), 'app/how-we-verify/page.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify it performs redirection to /find-work
  assert.ok(content.includes("redirect('/find-work')"), 'app/how-we-verify/page.tsx must redirect to /find-work');
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

test('3. Verification checkmarker removed and clean routing to /find-work', () => {
  // 1. "Browse open roles" on homepage links to /find-work
  const beliefContent = fs.readFileSync(path.join(projectRoot, 'components/home/belief-section.tsx'), 'utf8');
  assert.ok(beliefContent.includes('belief.linkHref'), 'BeliefSection must link dynamically');

  const homeContent = fs.readFileSync(path.join(projectRoot, 'src/content/home.ts'), 'utf8');
  assert.ok(homeContent.includes("linkHref: '/find-work'"), 'HOME_CONTENT.belief must point to /find-work');

  // 2. JobCard must NOT display the redundant Role verified checkmark badge
  const jobCardContent = fs.readFileSync(path.join(projectRoot, 'components/jobs/job-card.tsx'), 'utf8');
  assert.ok(!jobCardContent.includes('<span>Role verified</span>'), 'JobCard must not display redundant Role verified badge');
  assert.ok(!jobCardContent.includes('href="/how-we-verify"'), 'JobCard must not link to /how-we-verify');

  // 3. The FAQ answer
  const faqContent = fs.readFileSync(path.join(projectRoot, 'components/home/faq-section.tsx'), 'utf8');
  assert.ok(!faqContent.includes('href="/how-we-verify"'), 'FAQSection must not link to /how-we-verify');

  // 4. The footer
  assert.ok(!homeContent.includes("href: '/how-we-verify'"), 'Footer content must not contain /how-we-verify link');

  // 5. The job dialog checklist heading
  const dialogContent = fs.readFileSync(path.join(projectRoot, 'components/jobs/job-detail-dialog.tsx'), 'utf8');
  assert.ok(!dialogContent.includes('href="/how-we-verify"'), 'JobDetailDialog must not link to /how-we-verify');
});
