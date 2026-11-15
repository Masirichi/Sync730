import { validateJobPublishing } from '../lib/jobs/validation.ts';
import { getAllApprovedJobs } from '../lib/jobs/service.ts';
import { computeLivePlatformMetrics } from '../lib/stats/live-metrics.ts';

console.log('--- DATA INTEGRITY AUDIT ---');
const approvedJobs = getAllApprovedJobs();
console.log('Total Approved Public Jobs:', approvedJobs.length);

const invalidJobs = [];

approvedJobs.forEach((job) => {
  const result = validateJobPublishing({
    company: job.company || job.company_name,
    description: job.description || '',
    salary: job.salary,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: job.salary_currency,
    eligibility: job.eligibility,
  });

  if (!result.valid) {
    invalidJobs.push({
      id: job.id,
      title: job.title,
      company: job.company,
      errors: result.errors,
    });
  }
});

console.log('Invalid publicly visible jobs count:', invalidJobs.length);
if (invalidJobs.length > 0) {
  console.log('INVALID JOBS DETAILS:', JSON.stringify(invalidJobs, null, 2));
} else {
  console.log('SUCCESS: Zero invalid jobs! Every approved job has valid salary/currency, description >= 40 chars, no test company, and valid eligibility.');
}

const metrics = computeLivePlatformMetrics();
console.log('\n--- LIVE METRICS VERIFICATION ---');
console.log('rolesLive:', metrics.rolesLive);
console.log('rolesLast24h:', metrics.rolesLast24h);
console.log('talents:', metrics.talents);
console.log('partners:', metrics.partners);
console.log('rolesLast24h <= rolesLive:', metrics.rolesLast24h <= metrics.rolesLive);
console.log('rolesLive matches approvedJobs length:', metrics.rolesLive === approvedJobs.length);
