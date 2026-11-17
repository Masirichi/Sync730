import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

test('Phase 6: Video review data layer never changes score and never auto-rejects based on integrity flags', async () => {
  const typesPath = path.join(ROOT_DIR, 'lib/recruiter/types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  // Verify that VideoAssessment interface supports separate scores and moderation fields
  assert.ok(
    typesContent.includes('interview_score') && typesContent.includes('resume_match_score'),
    'Types must support separate interview_score and resume_match_score'
  );
  assert.ok(typesContent.includes('VideoAssessmentFlag'), 'Types must define VideoAssessmentFlag');
  assert.ok(typesContent.includes('VideoModerationStatus'), 'Types must define VideoModerationStatus');

  const vettingApiPath = path.join(ROOT_DIR, 'app/api/admin/vetting/route.ts');
  const vettingApiContent = fs.readFileSync(vettingApiPath, 'utf8');

  // Verify formatting in vetting route preserves scores without deduction
  assert.ok(vettingApiContent.includes('interview_score:'), 'Vetting API must output interview_score');
  assert.ok(vettingApiContent.includes('resume_match_score:'), 'Vetting API must output resume_match_score');
  assert.ok(
    !vettingApiContent.includes('score -') && !vettingApiContent.includes('score *') && !vettingApiContent.includes('penalty'),
    'Vetting API must NEVER apply penalty to candidate scores'
  );

  // Verify flags do not automatically reject candidate
  assert.ok(
    vettingApiContent.includes("modStatus = structuredFlags.length > 0 ? 'FLAGGED' : 'PENDING'"),
    'Candidates with integrity flags must route to FLAGGED queue for human review, never auto-rejected'
  );
});

test('Phase 6: Moderation endpoint enforces min 10-char reason for REJECTED and RETAKE_REQUESTED', async () => {
  const moderatePath = path.join(ROOT_DIR, 'app/api/admin/vetting/moderate/route.ts');
  const moderateContent = fs.readFileSync(moderatePath, 'utf8');

  assert.ok(moderateContent.includes("reason.trim().length < 10"), 'Server-side enforcement of min 10 chars reason required');
  assert.ok(moderateContent.includes("ai_overridden"), 'Must record whether human reviewer overrode AI recommendation');
  assert.ok(moderateContent.includes("decision_by"), 'Must record who made the decision');
  assert.ok(moderateContent.includes("saveAdminAuditLog"), 'Must append to audit log for all moderation decisions');
});

test('Phase 6: Candidate video access logging and reviewer authorization', async () => {
  const logAccessPath = path.join(ROOT_DIR, 'app/api/admin/vetting/log-access/route.ts');
  assert.ok(fs.existsSync(logAccessPath), 'Must have server-side video access logging endpoint');

  const logAccessContent = fs.readFileSync(logAccessPath, 'utf8');
  assert.ok(logAccessContent.includes('VIDEO_VIEW_OPENED'), 'Must log VIDEO_VIEW_OPENED action in audit trail');
  assert.ok(logAccessContent.includes('PLATFORM_ADMIN') || logAccessContent.includes('video_reviewer'), 'Must verify authorization');
});

test('Phase 6: UI component provides evidence jump, separate scores, and keyboard shortcuts', async () => {
  const pagePath = path.join(ROOT_DIR, 'app/(admin)/command/video-review/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  // Check 5 queue tabs
  assert.ok(pageContent.includes('Pending'), 'Must include Pending queue');
  assert.ok(pageContent.includes('Flagged'), 'Must include Flagged queue');
  assert.ok(pageContent.includes('Retake requested'), 'Must include Retake requested queue');
  assert.ok(pageContent.includes('Approved'), 'Must include Approved queue');
  assert.ok(pageContent.includes('Rejected'), 'Must include Rejected queue');

  // Check Evidence timeline jump
  assert.ok(pageContent.includes('handleJumpToTimestamp'), 'Must have jump to moment handler');
  assert.ok(pageContent.includes('Flags can be caused by shared homes'), 'Must include human-first review guidance note');

  // Check Score pending review
  assert.ok(pageContent.includes('Score pending review'), 'Must show Score pending review when flags present before decision');

  // Check Keyboard shortcuts
  assert.ok(pageContent.includes("'KeyA'") || pageContent.includes("key === 'a'"), 'Must handle A shortcut');
  assert.ok(pageContent.includes("'KeyR'") || pageContent.includes("key === 'r'"), 'Must handle R shortcut');
  assert.ok(pageContent.includes("'KeyX'") || pageContent.includes("key === 'x'"), 'Must handle X shortcut');
  assert.ok(pageContent.includes("'KeyJ'") || pageContent.includes("key === 'j'"), 'Must handle J shortcut');
  assert.ok(pageContent.includes("'KeyK'") || pageContent.includes("key === 'k'"), 'Must handle K shortcut');

  // Check personal data retention notice
  assert.ok(pageContent.includes('Candidate video is personal data'), 'Must surface personal data notice');
  assert.ok(pageContent.includes('Not defined yet'), 'Must state retention status accurately');
});
