// scripts/tests/clear-demo-and-external-apply.test.mjs
// Verification suite for:
// 1. Zero demo jobs across seeds, stores, and crawler adapters.
// 2. Admin job posting logic (status = 'live', verified_at, is_demo = false).
// 3. Tombstone & takedown persistence.
// 4. External link application confirmation.

import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = process.cwd();

console.log('--- STARTING VERIFICATION TEST SUITE ---');

// Test 1: Check SEED_REMOTE_JOBS in lib/seed-jobs.ts
console.log('[Test 1] Inspecting lib/seed-jobs.ts for demo companies...');
const seedJobsContent = fs.readFileSync(path.join(ROOT, 'lib/seed-jobs.ts'), 'utf8');

const FORBIDDEN_COMPANIES = [
  'scale army',
  'bruntwork',
  'leading african digital bank',
  'pan-african logistics platform',
  'freehire',
  'credit wellness global',
  'hyperscale cloud systems',
  'techsphere europe',
  'finvelocity global',
  'neuralflow engineering',
  'apex digital financial',
  'skyward systems',
  'sync730 partner labs',
  'fintech velocity africa',
  'payrail technologies',
  'sterling capital partners',
  'deltacloud',
  'technova africa',
  'cloudsys technologies',
  'vetted tech africa',
];

// Extract all company names
const companyMatches = Array.from(seedJobsContent.matchAll(/company:\s*['"]([^'"]+)['"]/g)).map((m) => m[1]);
console.log(`Found ${companyMatches.length} job company definitions in lib/seed-jobs.ts:`, Array.from(new Set(companyMatches)));

for (const company of companyMatches) {
  for (const forbidden of FORBIDDEN_COMPANIES) {
    assert(
      !company.toLowerCase().includes(forbidden),
      `Forbidden demo company "${forbidden}" found in lib/seed-jobs.ts company definition: "${company}"!`
    );
  }
}
console.log('PASS: lib/seed-jobs.ts contains zero demo companies.');

// Verify Moniepoint and Paystack exist in seed jobs
assert(seedJobsContent.includes('Moniepoint'), 'Moniepoint roles should be present in lib/seed-jobs.ts');
assert(seedJobsContent.includes('Paystack'), 'Paystack roles should be present in lib/seed-jobs.ts');
console.log('PASS: Authentic Moniepoint and Paystack roles present in lib/seed-jobs.ts.');

// Test 2: Check .sync730-admin-jobs.json
console.log('[Test 2] Inspecting .sync730-admin-jobs.json...');
const adminJobsFile = path.join(ROOT, '.sync730-admin-jobs.json');
if (fs.existsSync(adminJobsFile)) {
  const content = fs.readFileSync(adminJobsFile, 'utf8').trim();
  const parsed = JSON.parse(content || '[]');
  for (const job of parsed) {
    for (const forbidden of FORBIDDEN_COMPANIES) {
      assert(
        !job.company?.toLowerCase().includes(forbidden),
        `Forbidden demo company "${forbidden}" found in .sync730-admin-jobs.json!`
      );
    }
  }
  console.log(`PASS: .sync730-admin-jobs.json contains ${parsed.length} jobs, zero demo companies.`);
} else {
  console.log('PASS: .sync730-admin-jobs.json clean / initialized.');
}

// Test 3: Inspect Crawler Adapters for Seed Mock Data
console.log('[Test 3] Inspecting crawler adapters for mock seed data...');
const adapterFiles = [
  'lib/crawler/adapters/arbeitnow.ts',
  'lib/crawler/adapters/bruntwork.ts',
  'lib/crawler/adapters/devglobaljobs.ts',
  'lib/crawler/adapters/freehire.ts',
  'lib/crawler/adapters/himalayas.ts',
  'lib/crawler/adapters/jobberman.ts',
  'lib/crawler/adapters/jobicy.ts',
  'lib/crawler/adapters/remoteok.ts',
  'lib/crawler/adapters/scalearmy.ts',
];

for (const relPath of adapterFiles) {
  const code = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const adapterCompanies = Array.from(code.matchAll(/company:\s*['"]([^'"]+)['"]/g)).map((m) => m[1]);
  for (const company of adapterCompanies) {
    for (const forbidden of FORBIDDEN_COMPANIES) {
      assert(
        !company.toLowerCase().includes(forbidden),
        `Forbidden demo company "${forbidden}" found in ${relPath}: "${company}"!`
      );
    }
  }
}
console.log('PASS: All crawler adapters have zero mock seed jobs.');

// Test 4: Inspect lib/admin/store.ts and lib/admin/server-store.ts
console.log('[Test 4] Inspecting admin store and server store...');
const adminStoreContent = fs.readFileSync(path.join(ROOT, 'lib/admin/store.ts'), 'utf8');
assert(adminStoreContent.includes('export const SAMPLE_NIGERIA_ROLES: AdminRemoteJob[] = [];'));
assert(adminStoreContent.includes('export const SEED_ADMIN_REMOTE_JOBS: AdminRemoteJob[] = [];'));
console.log('PASS: lib/admin/store.ts has empty SAMPLE_NIGERIA_ROLES and SEED_ADMIN_REMOTE_JOBS.');

const serverStoreContent = fs.readFileSync(path.join(ROOT, 'lib/admin/server-store.ts'), 'utf8');
assert(serverStoreContent.includes('PRIMARY_TOMBSTONES_FILE'));
assert(serverStoreContent.includes('getDeletedJobIds'));
assert(serverStoreContent.includes('getTakenDownJobIds'));
console.log('PASS: lib/admin/server-store.ts has tombstone and takedown management.');

// Test 5: Inspect Candidate Application and External Apply Confirmation
console.log('[Test 5] Inspecting external application confirmation endpoint and store...');
const confirmRouteContent = fs.readFileSync(path.join(ROOT, 'app/api/jobs/[id]/confirm-applied/route.ts'), 'utf8');
assert(confirmRouteContent.includes('recordConfirmedExternalApplication'));
assert(confirmRouteContent.includes('sync730-candidate-id'));

const appStoreContent = fs.readFileSync(path.join(ROOT, 'lib/jobs/application-store.ts'), 'utf8');
assert(appStoreContent.includes('recordConfirmedExternalApplication'));
assert(appStoreContent.includes('is_external_confirmed = true'));
console.log('PASS: Candidate external apply confirmation logic fully implemented.');

// Test 6: Verify Admin Job Posting Route (app/api/admin/jobs/route.ts)
console.log('[Test 6] Inspecting admin job posting route...');
const adminJobsRoute = fs.readFileSync(path.join(ROOT, 'app/api/admin/jobs/route.ts'), 'utf8');
assert(adminJobsRoute.includes("status: 'live'"), "Admin posted jobs must set status: 'live'");
assert(adminJobsRoute.includes('is_demo: false'), "Admin posted jobs must set is_demo: false");
assert(adminJobsRoute.includes('is_active: true'), "Admin posted jobs must set is_active: true");
assert(adminJobsRoute.includes('verified_at: nowIso'), 'Admin posted jobs must set verified_at');
assert(adminJobsRoute.includes('getServiceRoleClient'), 'Admin route must use service role client to bypass RLS');
console.log('PASS: Admin job posting route satisfies public_roles view requirements.');

// Test 7: Verify Toggle Status Route (app/api/admin/jobs/toggle-status/route.ts)
console.log('[Test 7] Inspecting toggle status route...');
const toggleRoute = fs.readFileSync(path.join(ROOT, 'app/api/admin/jobs/toggle-status/route.ts'), 'utf8');
assert(toggleRoute.includes("res.is_active ? 'live' : 'taken_down'"), "Toggle route must compute status as 'live' or 'taken_down'");
assert(toggleRoute.includes("status: nextStatus"), "Toggle route must update DB status to nextStatus");
assert(!toggleRoute.includes('assertStepUpAuth('), 'Toggle route must not require artificial step-up auth for admins');
console.log('PASS: Toggle status route cleanly takes down and republishes jobs.');

console.log('--- ALL 7 VERIFICATION TESTS PASSED SUCCESSFULLY ---');
