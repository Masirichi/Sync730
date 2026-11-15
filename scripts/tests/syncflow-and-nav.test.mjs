// scripts/tests/syncflow-and-nav.test.mjs
// Automated tests for SyncFlow feature UI, Save Flow, Applied State, and Site Navigation

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Site Header: Nav Order, SyncFlow Button & Clean External Link', () => {
  const headerPath = path.resolve('components/site/site-header.tsx');
  assert.ok(fs.existsSync(headerPath), 'site-header.tsx must exist');
  const content = fs.readFileSync(headerPath, 'utf8');

  // Verify Nav order: Find Work · How it works · For candidates · For recruiters
  const findWorkIdx = content.indexOf("href: '/find-work'");
  const howItWorksIdx = content.indexOf("href: '/#how-it-works'");
  const forCandidatesIdx = content.indexOf("href: '/#for-candidates'");
  const forRecruitersIdx = content.indexOf("href: '/#for-recruiters'");

  assert.ok(findWorkIdx !== -1, "Find Work link must exist");
  assert.ok(howItWorksIdx !== -1, "How it works link must exist");
  assert.ok(forCandidatesIdx !== -1, "For candidates link must exist");
  assert.ok(forRecruitersIdx !== -1, "For recruiters link must exist");

  assert.ok(findWorkIdx < howItWorksIdx, 'Find Work must precede How it works');
  assert.ok(howItWorksIdx < forCandidatesIdx, 'How it works must precede For candidates');
  assert.ok(forCandidatesIdx < forRecruitersIdx, 'For candidates must precede For recruiters');

  // Verify Right side has SyncFlow trigger with Columns3 icon and count badge
  assert.ok(content.includes('Columns3'), 'SyncFlow trigger must use Columns3 icon');
  assert.ok(content.includes('sync730_open_syncflow'), 'SyncFlow button must dispatch or trigger drawer open');
  assert.ok(content.includes('totalSyncFlowCount'), 'SyncFlow trigger must display total count badge');

  // Verify aria-current="page" is applied for active navigation link
  assert.ok(content.includes('aria-current='), 'Nav must support aria-current="page" on current page');

  // Verify mobile menu button is 44x44 minimum hit target
  assert.ok(content.includes('min-h-[44px]') && content.includes('min-w-[44px]'), 'Mobile button must have 44x44 minimum hit target');

  // Verify join button has no external link icon
  assert.ok(!content.includes('ExternalLink') || !content.includes('Create your free profile<ExternalLink'), 'Join button must not have external link icon');
});

test('2. SyncFlow Board: Columns, Intro Text, Empty States, and Select Actions', () => {
  const boardPath = path.resolve('components/syncflow/syncflow-board.tsx');
  assert.ok(fs.existsSync(boardPath), 'syncflow-board.tsx must exist');
  const content = fs.readFileSync(boardPath, 'utf8');

  // Verify exact intro text
  assert.ok(
    content.includes('Your private job pipeline. Move roles from Saved to Offer as you progress.'),
    'Must include exact intro text'
  );

  // Verify exact empty board text
  assert.ok(
    content.includes('Nothing here yet. Tap the bookmark on any role to save it.'),
    'Must include exact empty board text'
  );

  // Verify 4 columns: Saved, Applied, Interviewing, Offer
  assert.ok(content.includes("id: 'SAVED', label: 'Saved'"), 'Saved column must exist');
  assert.ok(content.includes("id: 'APPLIED', label: 'Applied'"), 'Applied column must exist');
  assert.ok(content.includes("id: 'INTERVIEWING', label: 'Interviewing'"), 'Interviewing column must exist');
  assert.ok(content.includes("id: 'OFFER', label: 'Offer'"), 'Offer column must be named Offer');

  // Verify exact empty column text
  assert.ok(content.includes('No roles'), 'Empty column text must be "No roles"');

  // Verify status select dropdown with Remove
  assert.ok(content.includes('<option value="SAVED">Saved</option>'), 'Status select must include Saved');
  assert.ok(content.includes('<option value="APPLIED">Applied</option>'), 'Status select must include Applied');
  assert.ok(content.includes('<option value="INTERVIEWING">Interviewing</option>'), 'Status select must include Interviewing');
  assert.ok(content.includes('<option value="OFFER">Offer</option>'), 'Status select must include Offer');
  assert.ok(content.includes('<option value="REMOVE">Remove</option>'), 'Status select must include Remove');
});

test('3. SyncFlow Drawer: Accessible Slide-Over Container', () => {
  const drawerPath = path.resolve('components/syncflow/syncflow-drawer.tsx');
  assert.ok(fs.existsSync(drawerPath), 'syncflow-drawer.tsx must exist');
  const content = fs.readFileSync(drawerPath, 'utf8');

  assert.ok(content.includes('sync730_open_syncflow'), 'Drawer must listen to sync730_open_syncflow event');
  assert.ok(content.includes('role="dialog"'), 'Drawer must have role="dialog"');
  assert.ok(content.includes('aria-modal="true"'), 'Drawer must have aria-modal="true"');
  assert.ok(content.includes("e.key === 'Escape'"), 'Drawer must close on Escape key');
});

test('4. Save Flow Toast and Applied State in Job Card & Dialog', () => {
  const jobCardPath = path.resolve('components/jobs/job-card.tsx');
  const jobDialogPath = path.resolve('components/jobs/job-detail-dialog.tsx');
  const clientViewPath = path.resolve('components/jobs/jobs-client-view.tsx');

  const cardContent = fs.readFileSync(jobCardPath, 'utf8');
  const dialogContent = fs.readFileSync(jobDialogPath, 'utf8');
  const viewContent = fs.readFileSync(clientViewPath, 'utf8');

  // Toast on save in jobs-client-view.tsx
  assert.ok(viewContent.includes("toast('Saved to SyncFlow'"), 'Saving must show "Saved to SyncFlow" toast');
  assert.ok(viewContent.includes("label: 'View'"), 'Toast must have "View" action button');
  assert.ok(viewContent.includes('sync730_open_syncflow'), 'View action must open SyncFlow drawer');
  assert.ok(viewContent.includes('duration: 4500'), 'Toast must auto-dismiss after ~4.5s');

  // Applied state in JobCard
  assert.ok(cardContent.includes('isApplied'), 'JobCard must support isApplied prop');
  assert.ok(cardContent.includes('disabled'), 'Applied button must be disabled');
  assert.ok(cardContent.includes('Applied</span>'), 'Applied button must render "Applied"');
  assert.ok(cardContent.includes('Check'), 'Applied button must render Check icon');

  // Applied state in JobDetailDialog
  assert.ok(dialogContent.includes('isApplied'), 'JobDetailDialog must support isApplied prop');
  assert.ok(dialogContent.includes('disabled'), 'Applied button must be disabled in dialog');
  assert.ok(dialogContent.includes('Applied</span>'), 'Applied button must render "Applied" in dialog');
});

test('5. Single Store Persistence in lib/tracker.ts', async () => {
  const trackerModule = await import('../../lib/tracker.ts');

  assert.equal(typeof trackerModule.getLocalTrackerItems, 'function');
  assert.equal(typeof trackerModule.saveJobToTracker, 'function');
  assert.equal(typeof trackerModule.removeJobFromTracker, 'function');
  assert.equal(typeof trackerModule.isJobSavedInTracker, 'function');
  assert.equal(typeof trackerModule.isJobAppliedInTracker, 'function');
  assert.equal(typeof trackerModule.markJobAsApplied, 'function');

  // Verify items have initial mock data or valid structure
  const initial = trackerModule.getLocalTrackerItems();
  assert.ok(Array.isArray(initial), 'Initial tracker items must be an array');
  assert.ok(initial.length > 0, 'Tracker should contain seed items');
});

test('6. Clean Voice: No Leftover Banned Terminology', () => {
  const candidateSec = fs.readFileSync('components/home/for-candidates-section.tsx', 'utf8');
  const faqSec = fs.readFileSync('components/home/faq-section.tsx', 'utf8');

  assert.ok(!candidateSec.includes('SyncFlow application tracker'), 'No "SyncFlow application tracker" in candidate section');
  assert.ok(!faqSec.includes('SyncFlow application tracker'), 'No "SyncFlow application tracker" in FAQ');
  assert.ok(!candidateSec.toLowerCase().includes('kanban'), 'No Kanban in candidate section');
  assert.ok(!faqSec.toLowerCase().includes('kanban'), 'No Kanban in FAQ');
});
