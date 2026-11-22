import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_REMOTE_JOBS } from '../../lib/seed-jobs.ts';
import { getAllApprovedJobs, getFilteredPublicJobs } from '../../lib/jobs/service.ts';
import { evaluateListingReview } from '../../lib/jobs/review-criteria.ts';
import { VERIFIED_COMPANY_BOARDS, VERIFIED_STARTUP_VACANCIES } from '../../lib/crawler/universal-careers-crawler.ts';

test('1. Verify Moniepoint and Paystack live pulled jobs in SEED_REMOTE_JOBS', () => {
  const moniepointJobs = SEED_REMOTE_JOBS.filter(j => j.company === 'Moniepoint');
  const paystackJobs = SEED_REMOTE_JOBS.filter(j => j.company === 'Paystack');

  assert.ok(moniepointJobs.length >= 6, `Expected at least 6 Moniepoint jobs, found ${moniepointJobs.length}`);
  assert.ok(paystackJobs.length >= 8, `Expected at least 8 Paystack jobs, found ${paystackJobs.length}`);

  // Verify Moniepoint jobs
  for (const job of moniepointJobs) {
    assert.strictEqual(job.company, 'Moniepoint');
    assert.strictEqual(job.source_url, 'https://moniepoint.com/careers');
    assert.ok(job.apply_url.includes('greenhouse.io/moniepoint/jobs/'), `Invalid Moniepoint apply_url: ${job.apply_url}`);
    assert.ok(job.salary.includes('₦') || job.salary.includes('$'), `Salary must have currency symbol: ${job.salary}`);
    assert.strictEqual(job.open_to_nigeria, true);
  }

  // Verify Paystack jobs
  for (const job of paystackJobs) {
    assert.strictEqual(job.company, 'Paystack');
    assert.strictEqual(job.source_url, 'https://paystack.com/careers');
    assert.ok(job.apply_url.includes('careers.paystack.com/jobs/'), `Invalid Paystack apply_url: ${job.apply_url}`);
    assert.ok(job.salary.includes('₦') || job.salary.includes('$'), `Salary must have currency symbol: ${job.salary}`);
    assert.strictEqual(job.open_to_nigeria, true);
  }
});

test('2. Verify All Moniepoint and Paystack jobs pass Sync730 Listing Review Criteria', () => {
  const targetJobs = SEED_REMOTE_JOBS.filter(j => j.company === 'Moniepoint' || j.company === 'Paystack');
  
  for (const job of targetJobs) {
    const reviewResult = evaluateListingReview(job);
    assert.ok(reviewResult.passed, `Job "${job.title}" failed review: ${reviewResult.reasons.join(', ')}`);
    assert.ok(reviewResult.checks.employerIdentified, 'Employer must be identified');
    assert.ok(reviewResult.checks.workingApplyLink, 'Must have working apply link');
    assert.ok(reviewResult.checks.payRangeProvided, 'Must have transparent pay');
    assert.ok(reviewResult.checks.notStale, 'Must be fresh within 14 days');
    assert.ok(reviewResult.checks.notTestCompany, 'Must not be test company');
  }
});

test('3. Verify Public Jobboard displays Moniepoint and Paystack roles via service', () => {
  const allJobs = getAllApprovedJobs();
  const moniepointApproved = allJobs.filter(j => j.company === 'Moniepoint');
  const paystackApproved = allJobs.filter(j => j.company === 'Paystack');

  assert.ok(moniepointApproved.length >= 6, `Expected approved Moniepoint jobs in getAllApprovedJobs, found ${moniepointApproved.length}`);
  assert.ok(paystackApproved.length >= 8, `Expected approved Paystack jobs in getAllApprovedJobs, found ${paystackApproved.length}`);

  // Test query search for Moniepoint
  const moniepointFilter = getFilteredPublicJobs({ q: 'Moniepoint' });
  assert.ok(moniepointFilter.jobs.length >= 6, 'Filter q=Moniepoint must return jobs');

  // Test query search for Paystack
  const paystackFilter = getFilteredPublicJobs({ q: 'Paystack' });
  assert.ok(paystackFilter.jobs.length >= 8, 'Filter q=Paystack must return jobs');
});

test('4. Verify Universal Careers Crawler includes Teamtailor and Greenhouse configs', () => {
  const paystackBoard = VERIFIED_COMPANY_BOARDS.find(b => b.id === 'paystack');
  assert.ok(paystackBoard, 'Paystack board must be in crawler');
  assert.strictEqual(paystackBoard.ats, 'teamtailor', 'Paystack ATS must be teamtailor');
  assert.strictEqual(paystackBoard.website, 'https://paystack.com/careers');

  const moniepointBoard = VERIFIED_COMPANY_BOARDS.find(b => b.id === 'moniepoint');
  assert.ok(moniepointBoard, 'Moniepoint board must be in crawler');
  assert.strictEqual(moniepointBoard.ats, 'greenhouse');
  assert.strictEqual(moniepointBoard.website, 'https://moniepoint.com/careers');

  // Verify verified startup vacancies contain Moniepoint and Paystack
  const startupMoniepoint = VERIFIED_STARTUP_VACANCIES.filter(v => v.company === 'Moniepoint');
  const startupPaystack = VERIFIED_STARTUP_VACANCIES.filter(v => v.company === 'Paystack');
  assert.ok(startupMoniepoint.length >= 2, 'Must have verified startup vacancies for Moniepoint');
  assert.ok(startupPaystack.length >= 3, 'Must have verified startup vacancies for Paystack');
});

test('5. Strict Compliance: Zero Emojis and Zero Abuja in all Moniepoint/Paystack jobs', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const targetJobs = SEED_REMOTE_JOBS.filter(j => j.company === 'Moniepoint' || j.company === 'Paystack');

  for (const job of targetJobs) {
    // Emojis check
    assert.ok(!emojiRegex.test(job.title), `Emoji in title: ${job.title}`);
    assert.ok(!emojiRegex.test(job.description), `Emoji in description: ${job.description}`);
    assert.ok(!emojiRegex.test(job.responsibilities), `Emoji in responsibilities`);
    assert.ok(!emojiRegex.test(job.requirements), `Emoji in requirements`);

    // Abuja constraint: no Abuja in title, location, description, or tags
    assert.ok(!job.title.toLowerCase().includes('abuja'), `Abuja found in job title: ${job.title}`);
    assert.ok(!job.candidate_required_location.toLowerCase().includes('abuja'), `Abuja found in location: ${job.candidate_required_location}`);
    assert.ok(!job.description.toLowerCase().includes('abuja'), `Abuja found in description: ${job.description}`);
    (job.tags || []).forEach(t => {
      assert.ok(!t.toLowerCase().includes('abuja'), `Abuja found in tag: ${t}`);
    });
  }
});
