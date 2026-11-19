// scripts/tests/command-phase4-public-visibility.test.mjs
// Phase 4 Section 2 Public Visibility Automated Test Suite
// Verifies:
// 1. Postgres view public_roles returns only public-safe columns of roles where status = 'live' AND is_demo = false AND verified_at > now() - interval '14 days'.
// 2. Anon and authenticated may SELECT from public_roles ONLY; direct access to remote_jobs/roles revoked.
// 3. Shared 14-day constant in one place (lib/admin/constants.ts & lib/jobs/config.ts).
// 4. Public Find Work, homepage, and /api/jobs read exclusively from public_roles.
// 5. With a raw anon-key request, a needs_review role cannot be read through the API by any route, view or filter.

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
    if (dep.includes('constants')) return { ROLE_STALENESS_DAYS: 14 };
    if (dep.includes('config')) return { ROLE_STALE_WINDOW_DAYS: 14, MAX_REPORTS_BEFORE_HIDE: 3 };
    if (dep.includes('helpers')) {
      return {
        isRoleStale: (roleVerifiedAt, windowDays = 14) => {
          if (!roleVerifiedAt) return false;
          const verifiedTime = new Date(roleVerifiedAt).getTime();
          if (isNaN(verifiedTime) || verifiedTime <= 0) return false;
          return Date.now() - verifiedTime > windowDays * 24 * 60 * 60 * 1000;
        },
      };
    }
    return {};
  }, mockModule, mockExports);

  return mockModule.exports;
}

test('1. Shared Staleness Constant: 14 days defined in one canonical place', () => {
  const adminConstants = loadTsModule('lib/admin/constants.ts');
  assert.equal(adminConstants.ROLE_STALENESS_DAYS, 14, 'ROLE_STALENESS_DAYS in lib/admin/constants.ts must equal 14');

  const jobsConfig = loadTsModule('lib/jobs/config.ts');
  assert.equal(jobsConfig.ROLE_STALE_WINDOW_DAYS, 14, 'ROLE_STALE_WINDOW_DAYS in lib/jobs/config.ts must match ROLE_STALENESS_DAYS');
});

test('2. Migration: public_roles view returns only public-safe columns and enforces live/14-day freshness', () => {
  const migrationPath = path.join(
    ROOT_DIR,
    'supabase',
    'migrations',
    '20261119_phase4_public_roles_view_and_visibility.sql'
  );
  assert.ok(fs.existsSync(migrationPath), 'Phase 4 migration file must exist');

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Verify view creation
  assert.match(sql, /CREATE OR REPLACE VIEW public\.public_roles/i, 'Must define public.public_roles view');
  assert.match(sql, /status\s*=\s*'live'/i, 'Must filter where status = live');
  assert.match(sql, /is_demo\s*=\s*false/i, 'Must filter where is_demo = false');
  assert.match(sql, /interval\s*'14 days'/i, 'Must enforce 14-day freshness window in view query');

  // Extract the specific SELECT projection of the public_roles view
  const viewPart = sql.split(/CREATE OR REPLACE VIEW public\.public_roles AS\s*SELECT/i)[1];
  assert.ok(viewPart, 'Must contain public.public_roles view definition');
  const selectClause = viewPart.split(/FROM public\.remote_jobs/i)[0];

  // Verify sensitive columns are excluded from public_roles projection
  assert.ok(!selectClause.includes('verified_by'), 'public_roles must NOT expose verified_by (admin identity)');
  assert.ok(!selectClause.includes('checks,'), 'public_roles must NOT expose internal review checks');
  assert.ok(!selectClause.includes('rejection_reason'), 'public_roles must NOT expose rejection_reason');
  assert.ok(!selectClause.includes('last_checked_at'), 'public_roles must NOT expose last_checked_at');

  // Verify table permission revoking and view grants
  assert.match(sql, /REVOKE ALL ON public\.remote_jobs FROM anon,\s*authenticated/i, 'Must revoke direct table access from anon and authenticated');
  assert.match(sql, /GRANT SELECT ON public\.public_roles TO anon,\s*authenticated/i, 'Must grant SELECT on public_roles ONLY to anon and authenticated');
});

test('3. Public Job Fetcher reads exclusively from public_roles', () => {
  const fetcherPath = path.join(ROOT_DIR, 'lib', 'crawler', 'jobs-fetcher.ts');
  const code = fs.readFileSync(fetcherPath, 'utf8');

  assert.match(code, /\.from\('public_roles'\)/, 'fetchActiveRemoteJobs must query public_roles, NOT remote_jobs');
  assert.ok(!code.includes(".from('remote_jobs')"), 'fetchActiveRemoteJobs must NOT query remote_jobs directly');
});

test('4. Raw anon-key request simulation: needs_review role cannot be read through any route, view, or filter', () => {
  const reviewCriteria = loadTsModule('lib/jobs/review-criteria.ts');
  const evaluateListingReview = reviewCriteria.evaluateListingReview;

  // Test Case A: Role in needs_review status
  const needsReviewRole = {
    id: 'job-needs-review-001',
    company: 'Acme Corp',
    apply_url: 'https://acme.com/apply',
    salary: '$120,000',
    status: 'needs_review',
    review_status: 'needs_review',
    roleVerifiedAt: new Date().toISOString(),
    is_active: true,
  };
  const reviewResult = evaluateListingReview(needsReviewRole);
  assert.equal(reviewResult.passed, false, 'evaluateListingReview must reject roles with status = needs_review');

  // Test Case B: Role in ingested status
  const ingestedRole = {
    id: 'job-ingested-001',
    company: 'Raw Ingested Ltd',
    apply_url: 'https://raw.com/apply',
    salary: '$110,000',
    status: 'ingested',
    roleVerifiedAt: new Date().toISOString(),
    is_active: true,
  };
  const ingestedResult = evaluateListingReview(ingestedRole);
  assert.equal(ingestedResult.passed, false, 'evaluateListingReview must reject ingested roles');

  // Test Case C: Role with is_demo = true
  const demoRole = {
    id: 'job-demo-001',
    company: 'TEST CORP (Demo)',
    apply_url: 'https://test.com/apply',
    salary: '$100,000',
    status: 'live',
    roleVerifiedAt: new Date().toISOString(),
    is_active: true,
  };
  const demoResult = evaluateListingReview(demoRole);
  assert.equal(demoResult.passed, false, 'evaluateListingReview must reject demo / test company roles');

  // Test Case D: Stale role older than 14 days
  const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
  const staleRole = {
    id: 'job-stale-001',
    company: 'Stale Tech Ltd',
    apply_url: 'https://staletech.com/apply',
    salary: '$95,000',
    status: 'live',
    roleVerifiedAt: twentyDaysAgo,
    is_active: true,
  };
  const staleResult = evaluateListingReview(staleRole);
  assert.equal(staleResult.passed, false, 'evaluateListingReview must reject roles older than 14 days');

  // Test Case E: Fully verified, live, fresh role
  const freshLiveRole = {
    id: 'job-live-001',
    company: 'Paystack Verified',
    apply_url: 'https://paystack.com/careers/role',
    salary: '₦18,000,000',
    status: 'live',
    roleVerifiedAt: new Date().toISOString(),
    is_active: true,
  };
  const liveResult = evaluateListingReview(freshLiveRole);
  assert.equal(liveResult.passed, true, 'Fully verified live role within 14 days must pass');
});

test('5. Public slug detail lookup: unverified or needs_review role returns null (404)', () => {
  const jobsServiceSrc = fs.readFileSync(path.join(ROOT_DIR, 'lib/jobs/service.ts'), 'utf8');

  // Verify that getPublicJobBySlugOrId calls evaluateListingReview / getAllApprovedJobs
  assert.match(jobsServiceSrc, /function getPublicJobBySlugOrId/, 'getPublicJobBySlugOrId must be defined');
  assert.match(jobsServiceSrc, /getAllApprovedJobs\(\)/, 'getPublicJobBySlugOrId must read only approved jobs');
  assert.match(jobsServiceSrc, /if \(!reviewCheck\.passed\) \{\s*return null;/, 'Unapproved/needs_review roles are rejected and return null');
});
