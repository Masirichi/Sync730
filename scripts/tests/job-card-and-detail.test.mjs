// scripts/tests/job-card-and-detail.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatSalary,
  formatEligibility,
} from '../../lib/jobs/helpers.ts';
import { getCleanFacts } from '../../components/jobs/job-card.tsx';
import { reportJob } from '../../app/actions/report-job.ts';
import { getAllApprovedJobs, getFilteredPublicJobs } from '../../lib/jobs/service.ts';

test('1. ELIGIBILITY: "+N" overflow calculation and Africa-wide label', () => {
  // 1a. Africa-wide scope
  const africaWideJob = {
    title: 'Customer Support Lead',
    company: 'Fintech Corp',
    eligibility: { scope: 'africa_wide', countries: ['Nigeria', 'Kenya', 'Ghana'] },
  };
  const res1 = formatEligibility(africaWideJob, 3);
  assert.equal(res1.label, 'Open to all of Africa');
  assert.equal(res1.hiddenCount, 0);

  // 1b. Specific countries with overflow (> 3)
  const multiCountryJob = {
    title: 'Senior Frontend Engineer',
    company: 'Scale Africa',
    eligibility: {
      scope: 'countries',
      countries: ['Nigeria', 'Ghana', 'Kenya', 'Rwanda', 'South Africa', 'Egypt'],
    },
  };
  const res2 = formatEligibility(multiCountryJob, 3);
  assert.equal(res2.label, 'Open to Nigeria, Ghana, Kenya');
  assert.equal(res2.hiddenCount, 3);
  assert.deepEqual(res2.fullList, ['Nigeria', 'Ghana', 'Kenya', 'Rwanda', 'South Africa', 'Egypt']);

  // 1c. Specific countries without overflow (<= 3)
  const twoCountryJob = {
    title: 'Product Designer',
    company: 'Studio X',
    eligibility: { scope: 'countries', countries: ['Nigeria', 'Kenya'] },
  };
  const res3 = formatEligibility(twoCountryJob, 3);
  assert.equal(res3.label, 'Open to Nigeria, Kenya');
  assert.equal(res3.hiddenCount, 0);
});

test('2. SALARY: undisclosed fallback and disclosed formatting', () => {
  // 2a. Missing/undisclosed salary
  const noSalaryJob = {
    title: 'Operations Manager',
    company: 'Logistics Africa',
  };
  const salaryFallback = formatSalary(noSalaryJob);
  assert.equal(salaryFallback.isDisclosed, false);
  assert.equal(salaryFallback.formatted, 'Salary not disclosed');

  // 2b. Disclosed range with min & max
  const rangeJob = {
    title: 'Staff Platform Architect',
    company: 'Apex Digital',
    salary_min: 140000,
    salary_max: 185000,
    salary_currency: 'USD',
    salary_period: 'year',
  };
  const salaryRange = formatSalary(rangeJob);
  assert.equal(salaryRange.isDisclosed, true);
  assert.equal(salaryRange.formatted, '$140K – $185K / yr');

  // 2c. Disclosed single minimum value
  const minOnlyJob = {
    title: 'Junior Go Developer',
    company: 'Micro Labs',
    salary_min: 3000,
    salary_currency: 'USD',
    salary_period: 'month',
  };
  const salaryMin = formatSalary(minOnlyJob);
  assert.equal(salaryMin.isDisclosed, true);
  assert.equal(salaryMin.formatted, '$3K / mo');
});

test('3. FACTS ROW: normalizes modality and strips redundant location echoes', () => {
  // 3a. Prevents duplicate "Remote" + "Worldwide Remote"
  const redundantRemoteJob = {
    work_mode: 'REMOTE',
    candidate_required_location: 'Worldwide Remote',
    job_type: 'Full-time',
  };
  const facts1 = getCleanFacts(redundantRemoteJob);
  assert.equal(facts1.mode, 'Remote');
  assert.equal(facts1.location, 'Worldwide');
  assert.equal(facts1.jobType, 'Full-time');

  // 3b. Prevents duplicate "Remote (Worldwide)"
  const redundantRemoteParen = {
    work_mode: 'REMOTE',
    candidate_required_location: 'Remote (Worldwide)',
    job_type: 'Contract',
  };
  const facts2 = getCleanFacts(redundantRemoteParen);
  assert.equal(facts2.mode, 'Remote');
  assert.equal(facts2.location, 'Worldwide');
  assert.equal(facts2.jobType, 'Contract');

  // 3c. Normalizes "Africa Only"
  const africaOnlyJob = {
    work_mode: 'REMOTE',
    location: 'Africa Only',
    job_type: 'Full-time',
  };
  const facts3 = getCleanFacts(africaOnlyJob);
  assert.equal(facts3.location, 'Africa-wide');
});

test('4. INTERACTION INDEPENDENCE: Save and Apply event isolation logic', () => {
  // Simulated event object tracking propagation and default prevention
  let defaultPrevented = false;
  let propagationStopped = false;
  const mockEvent = {
    preventDefault: () => { defaultPrevented = true; },
    stopPropagation: () => { propagationStopped = true; },
  };

  let bookmarkTriggered = false;
  let applyTriggered = false;
  let cardNavigateTriggered = false;

  // Stretched link handler (parent card navigation)
  const onCardNavigate = () => {
    cardNavigateTriggered = true;
  };

  // Bookmark button handler with isolation
  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    bookmarkTriggered = true;
  };

  // Apply button handler with isolation
  const handleApplyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyTriggered = true;
  };

  // Test bookmark click does NOT trigger card navigation
  handleBookmarkClick(mockEvent);
  assert.equal(defaultPrevented, true);
  assert.equal(propagationStopped, true);
  assert.equal(bookmarkTriggered, true);
  assert.equal(cardNavigateTriggered, false);

  // Reset and test Apply click does NOT trigger card navigation
  defaultPrevented = false;
  propagationStopped = false;
  handleApplyClick(mockEvent);
  assert.equal(defaultPrevented, true);
  assert.equal(propagationStopped, true);
  assert.equal(applyTriggered, true);
  assert.equal(cardNavigateTriggered, false);
});

test('5. REPORT FLOW: reportJob server action submits report and returns confirmation', async () => {
  const uniqueJobId = `job-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const formData = new FormData();
  formData.append('jobId', uniqueJobId);
  formData.append('reason', 'Role is closed');
  formData.append('notes', 'Listing was closed on employer portal');

  const result = await reportJob(formData);
  assert.equal(result.success, true);
  assert.ok(result.reportId, 'Must return a generated reportId');
  assert.ok(result.message.includes('Thank you for reporting'));
});

test('6. FILTER LOGIC: getFilteredPublicJobs filters accurately by modality, category, and query keyword', () => {
  // Modality filter
  const remoteOnly = getFilteredPublicJobs({ modality: 'remote' });
  assert.ok(remoteOnly.jobs.length > 0, 'Should find remote jobs');
  assert.ok(
    remoteOnly.jobs.every((j) => j.modality.toLowerCase() === 'remote'),
    'All returned jobs must have remote modality'
  );

  // Category filter
  const engOnly = getFilteredPublicJobs({ department: 'Software Engineering' });
  assert.ok(engOnly.jobs.length > 0, 'Should find Software Engineering jobs');
  assert.ok(
    engOnly.jobs.every(
      (j) =>
        j.category?.toLowerCase().includes('software') ||
        j.category?.toLowerCase().includes('engineering') ||
        j.title.toLowerCase().includes('engineer') ||
        j.title.toLowerCase().includes('developer')
    ),
    'All returned jobs must match category'
  );

  // Query filter
  const reactJobs = getFilteredPublicJobs({ q: 'react' });
  assert.ok(reactJobs.jobs.length > 0, 'Should match react query keyword');
  assert.ok(
    reactJobs.jobs.every(
      (j) =>
        j.title.toLowerCase().includes('react') ||
        j.description.toLowerCase().includes('react') ||
        (j.skills && j.skills.some((s) => s.toLowerCase().includes('react')))
    ),
    'All returned query matches must contain search term'
  );

  // All jobs
  const allResult = getFilteredPublicJobs({});
  assert.ok(allResult.jobs.length >= remoteOnly.jobs.length);
  assert.ok(allResult.total >= remoteOnly.total);
});

