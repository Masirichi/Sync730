// scripts/tests/resume-studio.test.mjs
// Automated tests for Resume Studio:
// 1. ATS Resume Analyzer (scoring, keyword matching, metric/action detection, weak bullet rewrites)
// 2. Tailored ATS Resume Generator (Markdown formatting, profile mapping)
// 3. Candidate Navigation & Standalone Page Integration
// 4. SyncFlow 1-click Tailor Resume button

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. lib/resume/analyzer.ts evaluates ATS metrics, keywords, and weak bullets', async () => {
  const { analyzeResumeATS } = await import('../../lib/resume/analyzer.ts');

  const sampleResume = `# JANE DOE
Lagos, Nigeria | Email: jane.doe@sync730.com | Phone: +234 812 345 6789
LinkedIn: linkedin.com/in/sync730-candidate | GitHub: github.com/sync730-candidate

## PROFESSIONAL SUMMARY
Results-driven Senior Frontend Engineer with 5+ years of experience.

## CORE COMPETENCIES
- React, Next.js, TypeScript, Tailwind CSS, Docker, PostgreSQL

## EXPERIENCE
- Architected responsive Next.js web applications, improving Largest Contentful Paint by 45% and boosting conversion by 28%.
- Worked on frontend features and fixed bugs for the application.
- Engineered microservices with 99.9% uptime across 350,000 monthly active users.`;

  const result = analyzeResumeATS(sampleResume, 'Senior Frontend Engineer', 'Paystack', 'Requires React, TypeScript, Next.js, and CI/CD');

  assert.ok(typeof result.overallScore === 'number', 'Overall score must be a number');
  assert.ok(result.overallScore >= 0 && result.overallScore <= 100, 'Score must be between 0 and 100');
  assert.ok(result.breakdown.keywordMatch > 0, 'Keyword match must be scored');
  assert.ok(result.breakdown.impactScore > 0, 'Impact score must be scored');
  assert.ok(result.breakdown.sectionCompleteness > 0, 'Section completeness must be scored');
  assert.ok(result.breakdown.readabilityScore > 0, 'Readability score must be scored');

  // Verify keyword matching
  assert.ok(result.matchedKeywords.includes('React'), 'Must detect React in matchedKeywords');
  assert.ok(result.matchedKeywords.includes('TypeScript'), 'Must detect TypeScript in matchedKeywords');

  // Verify weak bullet rewrite detection
  assert.ok(result.weakBulletsWithFixes.length > 0, 'Must identify weak bullet and offer rewrite');
  const weak = result.weakBulletsWithFixes[0];
  assert.ok(weak.original.includes('Worked on'), 'Must identify passive phrase "Worked on"');
  assert.ok(weak.suggestedRewrite.length > weak.original.length, 'Suggested rewrite must be more detailed');
});

test('2. lib/resume/tailorer.ts generates clean ATS Markdown resume', async () => {
  const { generateTemplateResume } = await import('../../lib/resume/tailorer.ts');

  const resume = generateTemplateResume({
    title: 'Senior Frontend Engineer',
    company: 'Moniepoint',
    description: 'Lead architecture of high-scale payment dashboards in Next.js',
  });

  assert.ok(typeof resume === 'string', 'Resume must be a string');
  assert.ok(resume.includes('PROFESSIONAL SUMMARY'), 'Must include summary header');
  assert.ok(resume.includes('Moniepoint'), 'Must include company name');
  assert.ok(resume.includes('CORE COMPETENCIES'), 'Must include core competencies');
  assert.ok(resume.includes('PROFESSIONAL WORK EXPERIENCE'), 'Must include experience');
});

test('3. Candidate Navigation & Standalone Page Existence', () => {
  const navPath = path.resolve('lib/navigation.ts');
  const navContent = fs.readFileSync(navPath, 'utf8');

  assert.ok(navContent.includes('Resume Studio'), 'Nav must include Resume Studio');
  assert.ok(navContent.includes('/dashboard/resume'), 'Resume Studio must link to /dashboard/resume');

  const pagePath = path.resolve('app/(candidate)/dashboard/resume/page.tsx');
  assert.ok(fs.existsSync(pagePath), 'dashboard/resume/page.tsx must exist');

  const pageContent = fs.readFileSync(pagePath, 'utf8');
  assert.ok(pageContent.includes('Resume Studio'), 'Page must contain Resume Studio title');
  assert.ok(pageContent.includes('ATS Resume Analyzer'), 'Page must contain ATS Analyzer mode');
  assert.ok(pageContent.includes('Tailored ATS Resume Generator'), 'Page must contain Generator mode');

  const aliasPath = path.resolve('app/(candidate)/candidate/resume/page.tsx');
  assert.ok(fs.existsSync(aliasPath), 'candidate/resume/page.tsx alias must exist');
});

test('4. SyncFlow 1-Click Tailor Resume Integration', () => {
  const syncflowPath = path.resolve('app/(candidate)/dashboard/syncflow/page.tsx');
  const content = fs.readFileSync(syncflowPath, 'utf8');

  assert.ok(content.includes('/dashboard/resume'), 'SyncFlow must contain link to /dashboard/resume');
  assert.ok(content.includes('Tailor Resume'), 'SyncFlow card must provide Tailor Resume button');
});

test('5. OpenXML (.docx) Resume Generation and Markdown to Word XML conversion', async () => {
  const { createResumeDocxBuffer, markdownToWordXml } = await import('../../lib/resume/docx-builder.ts');

  const markdown = `# JOHN DOE
john@sync730.com | Lagos, Nigeria | +234 800 000 0000

## PROFESSIONAL SUMMARY
Senior Full Stack Engineer with 6 years experience.

## CORE COMPETENCIES
- Next.js, React, TypeScript, Node.js, PostgreSQL

## WORK EXPERIENCE
### Senior Engineer | Paystack
- Spearheaded core checkout optimization, reducing transaction latency by 35%.`;

  const wordXml = markdownToWordXml(markdown);
  assert.ok(wordXml.includes('<w:document'), 'Must produce valid w:document XML');
  assert.ok(wordXml.includes('JOHN DOE'), 'Must include candidate name');
  assert.ok(wordXml.includes('PROFESSIONAL SUMMARY'), 'Must include section header');
  assert.ok(wordXml.includes('Paystack'), 'Must include company name');

  const docxBuffer = createResumeDocxBuffer(markdown);
  assert.ok(Buffer.isBuffer(docxBuffer), 'Must return a Buffer');
  assert.ok(docxBuffer.length > 500, 'DOCX buffer must be populated with OpenXML files');
  assert.equal(docxBuffer[0], 0x50, 'Must have PK ZIP magic byte 0');
  assert.equal(docxBuffer[1], 0x4b, 'Must have PK ZIP magic byte 1');
});

test('6. PDF Printable HTML Generation & Formatting', async () => {
  const { markdownToPrintableHtml } = await import('../../lib/resume/exporter.ts');

  const markdown = `# JANE DOE
jane@sync730.com | Lagos, Nigeria

## PROFESSIONAL SUMMARY
Lead Frontend Engineer.

## WORK EXPERIENCE
- Architected design system and microfrontends.`;

  const html = markdownToPrintableHtml(markdown, 'Jane Doe Resume');
  assert.ok(html.includes('<!DOCTYPE html>'), 'Must produce valid HTML document');
  assert.ok(html.includes('JANE DOE'), 'Must render name');
  assert.ok(html.includes('@media print'), 'Must include print media stylesheet');
  assert.ok(html.includes('resume-container'), 'Must include container styling');
});

test('7. Candidate Sidebar & Coach Page layout fixes', () => {
  const sidebarPath = path.resolve('components/dashboard/dashboard-sidebar.tsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  assert.ok(sidebarContent.includes('overflow-y-auto'), 'Sidebar must support scroll container to avoid clipping');

  const coachPath = path.resolve('app/(candidate)/dashboard/coach/page.tsx');
  const coachContent = fs.readFileSync(coachPath, 'utf8');
  assert.ok(coachContent.includes("simStage !== 'SETUP'"), 'Coach page stepper must not display question 1 of 5 during setup stage');
  assert.ok(coachContent.includes('/dashboard/resume'), 'Coach page must link to Resume Studio');
});
