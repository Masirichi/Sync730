// scripts/tests/job-model-and-helpers.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatSalary,
  formatSalaryNumber,
  formatEligibility,
  normalizeToCanonicalCategory,
  normalizeToCanonicalEligibility,
  isRoleStale,
} from '../../lib/jobs/helpers.ts';
import { validateJobPublishing } from '../../lib/jobs/validation.ts';
import { evaluateListingReview } from '../../lib/jobs/review-criteria.ts';
import { ROLE_STALE_WINDOW_DAYS } from '../../lib/jobs/config.ts';
import { computeLivePlatformMetrics } from '../../lib/stats/live-metrics.ts';
import { getAllApprovedJobs } from '../../lib/jobs/service.ts';
import { submitJobReport, hasUserReportedJobToday } from '../../lib/jobs/reports-and-alerts.ts';

test('1. VALIDATION RULES: rejects invalid publishing conditions', () => {
  // 1a. Reject salary <= 0
  const zeroSalaryMin = validateJobPublishing({
    company: 'Acme Corp',
    description: 'This is a valid long description that exceeds forty characters easily.',
    salary_min: 0,
    salary_max: 50000,
    salary_currency: 'USD',
  });
  assert.equal(zeroSalaryMin.valid, false);
  assert.ok(zeroSalaryMin.errors.some((e) => e.includes('greater than zero')));

  const rawZeroSalary = validateJobPublishing({
    company: 'Acme Corp',
    description: 'This is a valid long description that exceeds forty characters easily.',
    salary: '$0 / year',
    salary_currency: 'USD',
  });
  assert.equal(rawZeroSalary.valid, false);
  assert.ok(rawZeroSalary.errors.some((e) => e.includes('greater than zero')));

  // 1b. Reject min > max
  const minGreaterMax = validateJobPublishing({
    company: 'Acme Corp',
    description: 'This is a valid long description that exceeds forty characters easily.',
    salary_min: 100000,
    salary_max: 80000,
    salary_currency: 'USD',
  });
  assert.equal(minGreaterMax.valid, false);
  assert.ok(minGreaterMax.errors.some((e) => e.includes('cannot be greater than salary maximum')));

  // 1c. Reject currency missing
  const missingCurrency = validateJobPublishing({
    company: 'Acme Corp',
    description: 'This is a valid long description that exceeds forty characters easily.',
    salary_min: 50000,
    salary_max: 70000,
    salary: '50,000 - 70,000 / year',
  });
  assert.equal(missingCurrency.valid, false);
  assert.ok(missingCurrency.errors.some((e) => e.includes('currency is missing')));

  // 1d. Reject description under 40 characters
  const shortDesc = validateJobPublishing({
    company: 'Acme Corp',
    description: 'Too short.',
    salary_min: 50000,
    salary_max: 70000,
    salary_currency: 'USD',
  });
  assert.equal(shortDesc.valid, false);
  assert.ok(shortDesc.errors.some((e) => e.includes('at least 40 characters')));

  // 1e. Reject company name contains "test" (case-insensitive)
  const testCompany = validateJobPublishing({
    company: 'Test Corp Global',
    description: 'This is a valid long description that exceeds forty characters easily.',
    salary_min: 50000,
    salary_max: 70000,
    salary_currency: 'USD',
  });
  assert.equal(testCompany.valid, false);
  assert.ok(testCompany.errors.some((e) => e.includes('cannot contain "test"')));

  // 1f. Accept fully compliant job
  const validJob = validateJobPublishing({
    company: 'PayRail Technologies',
    description: 'Lead design systems, interactive prototyping, and user journey optimization for our payments platform.',
    salary_min: 850000,
    salary_max: 1200000,
    salary_currency: 'NGN',
  });
  assert.equal(validJob.valid, true);
  assert.equal(validJob.errors.length, 0);
});

test('2. HELPERS: formatSalary with symbol, abbreviations, en dash, suffix, and missing marker', () => {
  // Example 1: NGN monthly
  const res1 = formatSalary({
    salary_min: 850000,
    salary_max: 1200000,
    salary_currency: 'NGN',
    salary_period: 'month',
  });
  assert.equal(res1.formatted, '₦850K – ₦1.2M / mo');
  assert.equal(res1.isDisclosed, true);

  // Example 2: USD yearly
  const res2 = formatSalary({
    salary_min: 120000,
    salary_max: 160000,
    salary_currency: 'USD',
    salary_period: 'year',
  });
  assert.equal(res2.formatted, '$120K – $160K / yr');
  assert.equal(res2.isDisclosed, true);

  // Missing salary returns marker for muted "Salary not disclosed"
  const resMissing = formatSalary({});
  assert.equal(resMissing.formatted, 'Salary not disclosed');
  assert.equal(resMissing.text, 'Salary not disclosed');
  assert.equal(resMissing.isDisclosed, false);
  assert.equal(String(resMissing), 'Salary not disclosed');

  // $0 salary returns undisclosed marker
  const resZero = formatSalary({ salary: '$0' });
  assert.equal(resZero.formatted, 'Salary not disclosed');
  assert.equal(resZero.isDisclosed, false);
});

test('3. HELPERS: formatEligibility for countries and africa_wide', () => {
  // 3a. Scope countries with > 3 items
  const resCountries = formatEligibility({
    eligibility: {
      scope: 'countries',
      countries: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Rwanda', 'Egypt', 'Uganda'],
    },
  }, 3);
  assert.equal(resCountries.label, 'Open to Nigeria, Ghana, Kenya');
  assert.equal(resCountries.hiddenCount, 4);
  assert.equal(resCountries.fullList.length, 7);

  // 3b. Scope africa_wide returns "Open to all of Africa"
  const resAfricaWide = formatEligibility({
    eligibility: {
      scope: 'africa_wide',
      countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa'],
    },
  });
  assert.equal(resAfricaWide.label, 'Open to all of Africa');
  assert.equal(resAfricaWide.hiddenCount, 0);

  // 3c. Scope countries with <= 3 items
  const resSmall = formatEligibility({
    eligibility: {
      scope: 'countries',
      countries: ['Nigeria', 'Kenya'],
    },
  }, 3);
  assert.equal(resSmall.label, 'Open to Nigeria, Kenya');
  assert.equal(resSmall.hiddenCount, 0);
});

test('4. STALE RULE: excludes roles older than 14 days', () => {
  assert.equal(ROLE_STALE_WINDOW_DAYS, 14);

  const now = Date.now();
  const fiveDaysAgo = new Date(now - 5 * 24 * 3600 * 1000).toISOString();
  const fifteenDaysAgo = new Date(now - 15 * 24 * 3600 * 1000).toISOString();

  assert.equal(isRoleStale(fiveDaysAgo), false);
  assert.equal(isRoleStale(fifteenDaysAgo), true);

  // Test through evaluateListingReview
  const freshJob = evaluateListingReview({
    company: 'Apex Digital Financial',
    apply_url: 'https://himalayas.app/jobs/1',
    salary: '$140,000 – $185,000 / year',
    roleVerifiedAt: fiveDaysAgo,
  });
  assert.equal(freshJob.passed, true);

  const staleJob = evaluateListingReview({
    company: 'Apex Digital Financial',
    apply_url: 'https://himalayas.app/jobs/1',
    salary: '$140,000 – $185,000 / year',
    roleVerifiedAt: fifteenDaysAgo,
  });
  assert.equal(staleJob.passed, false);
  assert.ok(staleJob.reasons.some((r) => r.includes('stale')));
});

test('5. CATEGORY NORMALIZATION: maps to the 10 canonical categories', () => {
  assert.equal(normalizeToCanonicalCategory('DevOps & Cloud', 'SRE Lead'), 'Software Engineering');
  assert.equal(normalizeToCanonicalCategory('Data & AI', 'AI Automation Engineer'), 'Data');
  assert.equal(normalizeToCanonicalCategory('Product & Design', 'Senior Product Designer'), 'Design');
  assert.equal(normalizeToCanonicalCategory('Product & Design', 'Technical Product Manager'), 'Product');
  assert.equal(normalizeToCanonicalCategory('Customer Support & Ops', 'Technical Support Specialist'), 'Customer Support');
  assert.equal(normalizeToCanonicalCategory('Finance & Accounting', 'Financial Analyst'), 'Finance');
  assert.equal(normalizeToCanonicalCategory('Sales & Marketing', 'Head of Growth Marketing'), 'Marketing');
  assert.equal(normalizeToCanonicalCategory('Sales & Marketing', 'Enterprise Account Executive'), 'Sales');
  assert.equal(normalizeToCanonicalCategory('Operations & Finance', 'Operations & Expansion Lead'), 'Operations');
  assert.equal(normalizeToCanonicalCategory('General', 'Executive Assistant'), 'Other');
});

test('6. SINGLE SOURCE OF TRUTH FOR LIVE NUMBERS: rolesLast24h <= rolesLive', () => {
  const metrics = computeLivePlatformMetrics();
  assert.equal(typeof metrics.rolesLive, 'number');
  assert.equal(typeof metrics.rolesLast24h, 'number');
  assert.equal(typeof metrics.talents, 'number');
  assert.equal(typeof metrics.partners, 'number');

  // Math invariant: 24h count can never exceed total live roles
  assert.ok(
    metrics.rolesLast24h <= metrics.rolesLive,
    `rolesLast24h (${metrics.rolesLast24h}) must be <= rolesLive (${metrics.rolesLive})`
  );
  assert.ok(metrics.rolesLive > 0);
  assert.ok(metrics.talents > 0);
  assert.ok(metrics.partners > 0);
});

test('7. DATA CLEANING & REVIEWS: test and flagged records excluded from public jobs', () => {
  const publicJobs = getAllApprovedJobs();

  // 7a. Test record must NOT appear
  const testJob = publicJobs.find((j) => j.id === 'admin-job-1794490024525' || /test corp/i.test(j.company));
  assert.equal(testJob, undefined, 'TEST CORP / $0 record must not appear in public jobs');

  // 7b. $3.5M-$5M / month record must be flagged as needs-review and hidden from public lists
  const flaggedJob = publicJobs.find((j) => j.id === 'd9fdc75f-cf7e-44c6-b871-003855c1a548');
  assert.equal(flaggedJob, undefined, '$3.5M-$5M flagged record must not appear in public jobs');

  // 7c. Ensure all public jobs have valid category, eligibility, and roleVerifiedAt
  for (const job of publicJobs) {
    assert.ok(job.category, `Job ${job.id} must have a category`);
    assert.ok(job.eligibility, `Job ${job.id} must have eligibility`);
    assert.ok(['africa_wide', 'countries'].includes(job.eligibility.scope));
    assert.ok(job.roleVerifiedAt, `Job ${job.id} must have roleVerifiedAt`);
  }
});

test('8. JOB REPORTS: rate limiting and auto-hiding at 3 reports', () => {
  const testJobId = 'test-job-rep-' + Date.now();
  const testIp = '192.168.1.100';

  // First report succeeds
  const rep1 = submitJobReport({
    jobId: testJobId,
    reason: 'Role is closed',
    note: 'Link 404s',
    reporterIp: testIp,
  });
  assert.equal(rep1.success, true);
  assert.equal(rep1.totalReports, 1);
  assert.equal(rep1.isHidden, false);

  // Second report from same IP today is rate limited
  const repDuplicate = submitJobReport({
    jobId: testJobId,
    reason: 'Role is closed',
    note: 'Duplicate attempt',
    reporterIp: testIp,
  });
  assert.equal(repDuplicate.success, false);
  assert.ok(repDuplicate.error?.includes('already reported'));

  // Reports from 2 distinct IPs trigger hide threshold (total >= 3)
  submitJobReport({ jobId: testJobId, reason: 'Looks like a scam', reporterIp: '192.168.1.101' });
  const rep3 = submitJobReport({ jobId: testJobId, reason: 'Other', reporterIp: '192.168.1.102' });
  assert.equal(rep3.success, true);
  assert.equal(rep3.totalReports, 3);
  assert.equal(rep3.isHidden, true);
});
