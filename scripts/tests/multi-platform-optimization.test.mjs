import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('1. Platform Detector: Detects all major ATS and job platforms accurately', async () => {
  const { detectJobPlatform, getJobPlatformInfo, optimizeUrlForPlatform } = await import(
    '../../lib/jobs/platform-detector.ts'
  );

  // Manatal ATS
  assert.equal(detectJobPlatform('https://app.manatal.com/career/acme-africa/jobs/12345'), 'manatal');
  assert.equal(detectJobPlatform('https://careers.manatal.com/roles/dev'), 'manatal');

  // Mercor AI Platform
  assert.equal(detectJobPlatform('https://mercor.com/jobs/ai-engineer-9912'), 'mercor');
  assert.equal(detectJobPlatform('https://mercor.io/talent/apply'), 'mercor');

  // Greenhouse ATS
  assert.equal(detectJobPlatform('https://boards.greenhouse.io/moniepoint/jobs/4567'), 'greenhouse');
  assert.equal(detectJobPlatform('https://company.com/career?gh_jid=123'), 'greenhouse');

  // Lever ATS
  assert.equal(detectJobPlatform('https://jobs.lever.co/flutterwave/89abc'), 'lever');

  // Ashby ATS
  assert.equal(detectJobPlatform('https://jobs.ashbyhq.com/kuda/3214'), 'ashby');

  // Workable ATS
  assert.equal(detectJobPlatform('https://apply.workable.com/wasoko/j/99AA'), 'workable');

  // Direct Careers
  assert.equal(detectJobPlatform('https://company.com/careers/lead-architect'), 'direct');

  // Platform info metadata
  const manatalInfo = getJobPlatformInfo('manatal');
  assert.equal(manatalInfo.name, 'Manatal ATS');
  assert.ok(manatalInfo.badgeClass.includes('blue'), 'Manatal badge should have blue accent styling');

  const mercorInfo = getJobPlatformInfo('mercor');
  assert.equal(mercorInfo.name, 'Mercor AI Marketplace');
  assert.ok(mercorInfo.badgeClass.includes('purple'), 'Mercor badge should have purple accent styling');

  // URL Cross-Platform Optimization (Mobile, Webview & Desktop)
  const messyUrl = 'http://company.com/careers/role?utm_source=linkedin&utm_medium=cpc&utm_campaign=hiring&ref=direct';
  const cleanUrl = optimizeUrlForPlatform(messyUrl);
  assert.ok(cleanUrl.startsWith('https://'), 'Should enforce secure https protocol');
  assert.ok(!cleanUrl.includes('utm_medium'), 'Should strip unnecessary tracking parameters');
});

test('2. Command Center Add Job Modal: Responsive across all platforms and displays ATS selector', () => {
  const rolesPagePath = path.join(projectRoot, 'app/(admin)/command/roles/page.tsx');
  const content = fs.readFileSync(rolesPagePath, 'utf8');

  // Viewport & device platform responsiveness (iOS/Android/Tablet/Desktop)
  assert.ok(content.includes('w-[95vw] sm:max-w-xl'), 'Modal must have responsive width constraints');
  assert.ok(content.includes('max-h-[90vh] overflow-y-auto'), 'Modal must have vertical scrolling on smaller viewports');

  // ATS / Sourcing Platform Integration
  assert.ok(content.includes('ATS & Sourcing Platform'), 'Modal must include ATS & Sourcing Platform selector');
  assert.ok(content.includes('handleCareerUrlChange'), 'Career URL input must auto-detect platform');
  assert.ok(content.includes('sourcePlatform'), 'State must track selected/detected platform');

  // Source Filter expansion for platforms
  assert.ok(content.includes('value="manatal"'), 'Filter must allow filtering by Manatal');
  assert.ok(content.includes('value="mercor"'), 'Filter must allow filtering by Mercor');
  assert.ok(content.includes('value="greenhouse"'), 'Filter must allow filtering by Greenhouse');
  assert.ok(content.includes('value="lever"'), 'Filter must allow filtering by Lever');
});

test('3. Universal Careers Crawler: Multi-platform support including Manatal and Mercor', () => {
  const crawlerPath = path.join(projectRoot, 'lib/crawler/universal-careers-crawler.ts');
  const content = fs.readFileSync(crawlerPath, 'utf8');

  // ATS types
  assert.ok(content.includes("'manatal'"), 'Crawler must support manatal');
  assert.ok(content.includes("'mercor'"), 'Crawler must support mercor');
  assert.ok(content.includes("'workable'"), 'Crawler must support workable');

  // Verified Boards
  assert.ok(content.includes("id: 'alx-africa'"), 'Should include ALX Africa (Manatal ATS)');
  assert.ok(content.includes("id: 'mercor-global'"), 'Should include Mercor Global AI Marketplace');

  // Handlers hooked up
  assert.ok(content.includes('crawlManatalBoard'), 'crawlManatalBoard must be defined and called');
  assert.ok(content.includes('crawlMercorBoard'), 'crawlMercorBoard must be defined and called');
});

test('4. Candidate Views: Job Card & Details Dialog integrate platform badge & optimized URLs', () => {
  const cardPath = path.join(projectRoot, 'components/jobs/job-card.tsx');
  const dialogPath = path.join(projectRoot, 'components/jobs/job-detail-dialog.tsx');

  const cardContent = fs.readFileSync(cardPath, 'utf8');
  const dialogContent = fs.readFileSync(dialogPath, 'utf8');

  assert.ok(cardContent.includes('detectJobPlatform'), 'Job card must detect and display platform badges');
  assert.ok(dialogContent.includes('detectJobPlatform'), 'Job detail dialog must detect platform info');
  assert.ok(dialogContent.includes('getJobPlatformInfo'), 'Job detail dialog must render platform info');
});
