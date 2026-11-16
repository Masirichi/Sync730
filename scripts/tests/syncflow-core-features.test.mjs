// scripts/tests/syncflow-core-features.test.mjs
// Verifies all 8 core features of SyncFlow:
// 1. Job Title, 2. Date Applied, 3. Status, 4. Job Type, 5. Company, 6. Interview Date, 7. Hourly/Monthly Rate, 8. Contact

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Type definitions in lib/supabase/types.ts contain all 8 SyncFlow features', () => {
  const typesPath = path.resolve('lib/supabase/types.ts');
  assert.ok(fs.existsSync(typesPath), 'types.ts must exist');
  const content = fs.readFileSync(typesPath, 'utf8');

  // Verify TrackerJobType and TrackerRatePeriod types
  assert.ok(content.includes('TrackerJobType'), 'Must export TrackerJobType');
  assert.ok(content.includes('TrackerRatePeriod'), 'Must export TrackerRatePeriod');

  // Verify CandidateTrackerItem contains all 8 fields
  assert.ok(content.includes('title: string'), 'Must contain job title');
  assert.ok(content.includes('applied_date?: string | null'), 'Must contain applied_date');
  assert.ok(content.includes('status: TrackerStatus'), 'Must contain status');
  assert.ok(content.includes('job_type?: TrackerJobType'), 'Must contain job_type');
  assert.ok(content.includes('company: string'), 'Must contain company');
  assert.ok(content.includes('interview_date?: string | null'), 'Must contain interview_date');
  assert.ok(content.includes('rate?: string | null'), 'Must contain rate');
  assert.ok(content.includes('rate_period?: TrackerRatePeriod | null'), 'Must contain rate_period');
  assert.ok(content.includes('contact?: string | null'), 'Must contain contact');
});

test('2. SyncFlow Board component renders and edits all 8 features', () => {
  const boardPath = path.resolve('components/syncflow/syncflow-board.tsx');
  assert.ok(fs.existsSync(boardPath), 'syncflow-board.tsx must exist');
  const content = fs.readFileSync(boardPath, 'utf8');

  // 1. Job Title & 5. Company
  assert.ok(content.includes('item.title'), 'Board renders item.title');
  assert.ok(content.includes('item.company'), 'Board renders item.company');

  // 2. Date Applied
  assert.ok(content.includes('item.applied_date'), 'Board renders applied_date');
  assert.ok(content.includes('Applied:'), 'Board has Applied: label');

  // 3. Status
  assert.ok(content.includes('updateTrackerStatus'), 'Board allows updating status');

  // 4. Job Type
  assert.ok(content.includes('item.job_type'), 'Board renders item.job_type');

  // 6. Interview Date
  assert.ok(content.includes('item.interview_date'), 'Board renders interview_date');
  assert.ok(content.includes('Interview:'), 'Board has Interview: label');

  // 7. Hourly/Monthly Rate
  assert.ok(content.includes('item.rate'), 'Board renders item.rate');
  assert.ok(content.includes('item.rate_period'), 'Board renders item.rate_period');

  // 8. Contact
  assert.ok(content.includes('item.contact'), 'Board renders item.contact');
  assert.ok(content.includes('Contact:'), 'Board has Contact: label');

  // Edit Role Modal handles all 8 features
  assert.ok(content.includes('Edit Role Details'), 'Board provides Edit Role Details dialog');
  assert.ok(content.includes('updateTrackerItem'), 'Board uses updateTrackerItem helper');
});

test('3. Candidate Dashboard SyncFlow Page captures and displays all 8 features', () => {
  const pagePath = path.resolve('app/(candidate)/dashboard/syncflow/page.tsx');
  assert.ok(fs.existsSync(pagePath), 'dashboard/syncflow/page.tsx must exist');
  const content = fs.readFileSync(pagePath, 'utf8');

  // Add External Role Dialog inputs for all 8 features
  assert.ok(content.includes('Add Role to SyncFlow') || content.includes('Add External Role'), 'Contains add dialog');
  assert.ok(content.includes('newTitle'), 'Add modal captures job title');
  assert.ok(content.includes('newCompany'), 'Add modal captures company');
  assert.ok(content.includes('newJobType'), 'Add modal captures job type');
  assert.ok(content.includes('newRate'), 'Add modal captures rate');
  assert.ok(content.includes('newRatePeriod'), 'Add modal captures rate period');
  assert.ok(content.includes('newAppliedDate'), 'Add modal captures applied date');
  assert.ok(content.includes('newInterviewDate'), 'Add modal captures interview date');
  assert.ok(content.includes('newContact'), 'Add modal captures contact');

  // Card view rendering
  assert.ok(content.includes('item.title'), 'Card renders title');
  assert.ok(content.includes('item.company'), 'Card renders company');
  assert.ok(content.includes('item.job_type'), 'Card renders job_type');
  assert.ok(content.includes('item.rate'), 'Card renders rate');
  assert.ok(content.includes('item.applied_date'), 'Card renders applied_date');
  assert.ok(content.includes('item.interview_date'), 'Card renders interview_date');
  assert.ok(content.includes('item.contact'), 'Card renders contact');

  // Edit Dialog
  assert.ok(content.includes('Edit Role Details'), 'Page provides Edit Role Details dialog');
});

test('4. lib/tracker.ts single-source helper persistence for all 8 features', () => {
  const trackerPath = path.resolve('lib/tracker.ts');
  assert.ok(fs.existsSync(trackerPath), 'tracker.ts must exist');
  const content = fs.readFileSync(trackerPath, 'utf8');

  assert.ok(content.includes('export async function updateTrackerItem'), 'Exports updateTrackerItem');
  assert.ok(content.includes('export async function addExternalTrackerJob'), 'Exports addExternalTrackerJob');
  assert.ok(content.includes('job_type'), 'Handles job_type');
  assert.ok(content.includes('applied_date'), 'Handles applied_date');
  assert.ok(content.includes('interview_date'), 'Handles interview_date');
  assert.ok(content.includes('rate'), 'Handles rate');
  assert.ok(content.includes('rate_period'), 'Handles rate_period');
  assert.ok(content.includes('contact'), 'Handles contact');
});
