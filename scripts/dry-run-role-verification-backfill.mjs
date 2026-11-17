// scripts/dry-run-role-verification-backfill.mjs
// Phase 4: Dry-run analysis for role verification backfill.
// Reports current role counts, public visibility, and backfill impact WITHOUT modifying any records.

import fs from 'fs';
import path from 'path';
import { SEED_REMOTE_JOBS } from '../lib/seed-jobs.ts';
import { SEED_ADMIN_REMOTE_JOBS } from '../lib/admin/store.ts';
import { getServerJobs } from '../lib/admin/server-store.ts';
import { getAllApprovedJobs } from '../lib/jobs/service.ts';
import { isRoleStale } from '../lib/jobs/helpers.ts';
import { ROLE_STALE_WINDOW_DAYS } from '../lib/jobs/config.ts';

export async function runDryRunReport() {
  console.log('================================================================');
  console.log('SYNC730 PHASE 4: ROLE VERIFICATION BACKFILL DRY-RUN REPORT');
  console.log('================================================================');
  console.log(`Generated at: ${new Date().toISOString()}`);
  console.log(`Stale threshold: ${ROLE_STALE_WINDOW_DAYS} days\n`);

  // 1. Gather all jobs from local and server persistent sources
  const serverJobs = getServerJobs();
  const seedJobs = SEED_REMOTE_JOBS;
  const adminSeedJobs = SEED_ADMIN_REMOTE_JOBS;

  const allJobsMap = new Map();
  serverJobs.forEach((j) => allJobsMap.set(j.id, { ...j, sourceOrigin: 'server_store' }));
  seedJobs.forEach((j, idx) => {
    const id = `seed-job-${idx + 1}`;
    if (!allJobsMap.has(id)) {
      allJobsMap.set(id, { ...j, id, sourceOrigin: 'seed_remote_jobs' });
    }
  });

  const totalExistingJobs = allJobsMap.size;
  const allJobs = Array.from(allJobsMap.values());

  // 2. Tally current statuses
  const statusCounts = {
    live: 0,
    needs_review: 0,
    ingested: 0,
    verified: 0,
    stale: 0,
    removed: 0,
    unassigned_legacy: 0,
  };

  allJobs.forEach((j) => {
    const s = (j.status || j.review_status || '').toLowerCase().replace('-', '_');
    if (s === 'live') statusCounts.live++;
    else if (s === 'needs_review') statusCounts.needs_review++;
    else if (s === 'ingested') statusCounts.ingested++;
    else if (s === 'verified') statusCounts.verified++;
    else if (s === 'stale') statusCounts.stale++;
    else if (s === 'removed' || s === 'rejected' || j.is_active === false) statusCounts.removed++;
    else statusCounts.unassigned_legacy++;
  });

  // 3. Count currently public roles
  const currentlyPublicJobs = getAllApprovedJobs();
  const publicCount = currentlyPublicJobs.length;

  // 4. Analyze Backfill Impact
  // A backfill would move all jobs that lack verified_at or have not passed human verification to 'needs_review'.
  let wouldMoveToNeedsReview = 0;
  let alreadyNeedsReview = 0;
  let wouldRemainLive = 0;

  allJobs.forEach((j) => {
    const isLive = j.status === 'live' || (j.is_active !== false && !j.review_status?.includes('needs'));
    const hasVerification = Boolean(j.verified_at && j.verified_by && j.checks?.live_on_employer_channel && j.checks?.hiring_contact_confirmed);
    const stale = isRoleStale(j.verified_at || j.roleVerifiedAt || j.published_at, ROLE_STALE_WINDOW_DAYS);

    if (hasVerification && !stale) {
      wouldRemainLive++;
    } else {
      if ((j.status || j.review_status) === 'needs_review' || (j.status || j.review_status) === 'needs-review') {
        alreadyNeedsReview++;
      } else {
        wouldMoveToNeedsReview++;
      }
    }
  });

  console.log('--- CURRENT STATE ---');
  console.log(`Total Existing Jobs Tracked: ${totalExistingJobs}`);
  console.log(`Currently Public (Find Work & Home): ${publicCount}`);
  console.log(`Currently Featured Pinned: ${serverJobs.filter((j) => j.is_featured && j.is_active).length}`);
  console.log('\n--- BREAKDOWN BY CURRENT STATUS ---');
  console.log(`- live: ${statusCounts.live}`);
  console.log(`- needs_review: ${statusCounts.needs_review}`);
  console.log(`- ingested: ${statusCounts.ingested}`);
  console.log(`- verified (pending publish): ${statusCounts.verified}`);
  console.log(`- stale: ${statusCounts.stale}`);
  console.log(`- removed / inactive: ${statusCounts.removed}`);
  console.log(`- legacy / unassigned: ${statusCounts.unassigned_legacy}`);

  console.log('\n--- BACKFILL IMPACT (DRY RUN ONLY) ---');
  console.log(`Jobs that would move to 'needs_review': ${wouldMoveToNeedsReview}`);
  console.log(`Jobs already in 'needs_review': ${alreadyNeedsReview}`);
  console.log(`Jobs that would remain 'live' (have complete verification & not stale): ${wouldRemainLive}`);
  console.log(`\nNote: As instructed by BACKFILL SAFETY, NO CHANGES HAVE BEEN APPLIED.`);
  console.log('================================================================\n');

  return {
    totalExistingJobs,
    publicCount,
    statusCounts,
    wouldMoveToNeedsReview,
    alreadyNeedsReview,
    wouldRemainLive,
  };
}

if (process.argv[1]?.includes('dry-run-role-verification-backfill')) {
  runDryRunReport().catch(console.error);
}
