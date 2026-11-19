// scripts/tests/universal-jobs-crawler.test.mjs
// Automated Test Suite for Universal Jobs Crawler & Startup Vacancies
// Tests:
// 1. Company ATS Boards configuration & openness to African talent.
// 2. isOpenToAfrica location parsing & filtering.
// 3. Universal careers crawler execution & startup vacancies seeding.
// 4. Jobs fetcher integration & startup_only filtering in getFilteredPublicJobs.
// 5. Universal crawler API route integrity.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();

// Transpile helper to cleanly run TypeScript modules in standalone Node
function loadTsModule(relativePath, mockRequires = {}) {
  const fullPath = path.join(ROOT_DIR, relativePath);
  const src = fs.readFileSync(fullPath, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  const mockExports = {};
  const mockModule = { exports: mockExports };
  const runner = new Function('require', 'module', 'exports', js);
  runner((dep) => {
    if (mockRequires[dep]) return mockRequires[dep];
    if (dep.includes('categories')) return { normalizeJobCategory: () => 'Software Engineering' };
    if (dep.includes('types')) return { resolveLocationTier: () => 'Worldwide' };
    if (dep.includes('constants')) return { ROLE_STALENESS_DAYS: 14, MAX_TOKEN_ADJUSTMENT: 100 };
    if (dep.includes('config')) return { ROLE_STALE_WINDOW_DAYS: 14, MAX_REPORTS_BEFORE_HIDE: 3 };
    if (dep.includes('helpers')) {
      return {
        isRoleStale: () => false,
        formatSalary: () => '$5,000/mo',
        formatEligibility: () => ({ label: 'Worldwide', hiddenCount: 0, fullList: [] }),
      };
    }
    return {};
  }, mockModule, mockExports);

  return mockModule.exports;
}

test('1. Universal Careers Crawler: Board configurations and startup vacancies defined', () => {
  const crawler = loadTsModule('lib/crawler/universal-careers-crawler.ts');

  assert.ok(Array.isArray(crawler.VERIFIED_COMPANY_BOARDS), 'VERIFIED_COMPANY_BOARDS must be an array');
  assert.ok(crawler.VERIFIED_COMPANY_BOARDS.length >= 10, 'Must configure at least 10 verified company ATS boards');

  const boardNames = crawler.VERIFIED_COMPANY_BOARDS.map((b) => b.name);
  assert.ok(boardNames.includes('Moniepoint'), 'Must include Moniepoint board');
  assert.ok(boardNames.includes('Paystack (Stripe)'), 'Must include Paystack board');
  assert.ok(boardNames.includes('Canonical (Ubuntu)'), 'Must include Canonical board');
  assert.ok(boardNames.includes('GitLab'), 'Must include GitLab board');
  assert.ok(boardNames.includes('Chowdeck'), 'Must include Chowdeck board');
  assert.ok(boardNames.includes('Kuda Bank'), 'Must include Kuda board');

  assert.ok(Array.isArray(crawler.VERIFIED_STARTUP_VACANCIES), 'VERIFIED_STARTUP_VACANCIES must be an array');
  assert.ok(crawler.VERIFIED_STARTUP_VACANCIES.length >= 5, 'Must contain at least 5 verified startup vacancies');

  // Verify tags contain Startup
  crawler.VERIFIED_STARTUP_VACANCIES.forEach((j) => {
    assert.ok(j.tags && j.tags.includes('Startup'), `Job ${j.title} must include 'Startup' in tags`);
    assert.equal(j.is_active, true, `Job ${j.title} must be active`);
  });
});

test('2. isOpenToAfrica: Accurately filters locations open to African talent and excludes restricted roles', () => {
  const crawler = loadTsModule('lib/crawler/universal-careers-crawler.ts');
  const isOpen = crawler.isOpenToAfrica;

  // Positive cases (open to Africa)
  assert.equal(isOpen('Worldwide Remote', 'Software Engineer'), true, 'Worldwide Remote must be open to Africa');
  assert.equal(isOpen('Lagos, Nigeria', 'Product Manager'), true, 'Nigeria location must be open to Africa');
  assert.equal(isOpen('Nairobi, Kenya', 'Backend Lead'), true, 'Kenya location must be open to Africa');
  assert.equal(isOpen('EMEA Timezones (Remote)', 'Cloud Architect'), true, 'EMEA location must be open to Africa');
  assert.equal(isOpen('Africa Only', 'Data Scientist'), true, 'Africa Only must be open to Africa');

  // Negative cases (restricted)
  assert.equal(isOpen('US Only', 'DevOps Engineer'), false, 'US Only must be excluded');
  assert.equal(isOpen('United States Only (No Exceptions)', 'Staff Engineer'), false, 'United States Only must be excluded');
  assert.equal(isOpen('Canada Only', 'Frontend Engineer'), false, 'Canada Only must be excluded');
  assert.equal(isOpen('LATAM Only', 'Designer'), false, 'LATAM Only must be excluded');
});

test('3. Universal Careers Crawler: runUniversalCareersCrawler executes and returns report', async () => {
  const crawler = loadTsModule('lib/crawler/universal-careers-crawler.ts');
  const report = await crawler.runUniversalCareersCrawler();

  assert.ok(report.timestamp, 'Report must contain timestamp');
  assert.ok(report.boardsChecked >= 10, 'Report must report boards checked');
  assert.ok(report.totalRolesFound > 0, 'Report must find remote roles');
  assert.ok(report.startupRolesFound > 0, 'Report must identify startup roles');
  assert.ok(Array.isArray(report.openToAfricaRoles), 'Report must return array of roles');
});

test('4. Find Work & Homepage integration: startup_only filtering in service', () => {
  const serviceSrc = fs.readFileSync(path.join(ROOT_DIR, 'lib/jobs/service.ts'), 'utf8');

  // Verify startup_only is handled in getFilteredPublicJobs
  assert.match(serviceSrc, /startup_only/, 'getFilteredPublicJobs must support startup_only filter');
  assert.match(serviceSrc, /is_startup/, 'toPublicJob must populate is_startup field');

  // Verify JobsClientView has the Universal Crawler Banner and Startup Filter Pill
  const clientViewSrc = fs.readFileSync(path.join(ROOT_DIR, 'components/jobs/jobs-client-view.tsx'), 'utf8');
  assert.match(clientViewSrc, /Universal Company Careers Crawler/, 'JobsClientView must render Universal Careers Crawler banner');
  assert.match(clientViewSrc, /🚀 Startup Jobs/, 'JobsClientView must render Startup Jobs filter pill');
  assert.match(clientViewSrc, /handleTriggerUniversalCrawl/, 'JobsClientView must define handleTriggerUniversalCrawl');

  // Verify Homepage LatestRolesSection has the Startup Vacancies feed tab
  const homeLatestSrc = fs.readFileSync(path.join(ROOT_DIR, 'components/home/latest-roles-section.tsx'), 'utf8');
  assert.match(homeLatestSrc, /Startup Jobs \(Remote Africa\)/, 'Homepage must render Startup Jobs feed tab');
  assert.match(homeLatestSrc, /activeFeedTab === 'startups'/, 'Homepage must filter by activeFeedTab startups');
});

test('5. Universal Crawler API Route exists and handles GET & POST', () => {
  const apiRoutePath = path.join(ROOT_DIR, 'app/api/crawler/universal/route.ts');
  assert.ok(fs.existsSync(apiRoutePath), 'app/api/crawler/universal/route.ts must exist');

  const routeSrc = fs.readFileSync(apiRoutePath, 'utf8');
  assert.match(routeSrc, /export async function GET/, 'Route must export GET handler');
  assert.match(routeSrc, /export async function POST/, 'Route must export POST handler');
  assert.match(routeSrc, /runUniversalCareersCrawler/, 'Route must call runUniversalCareersCrawler');
});
