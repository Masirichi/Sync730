import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('Recruiter Console Navigation contains /console/messages tab', () => {
  const layoutPath = path.join(projectRoot, 'app/(recruiter)/console/layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(content.includes("href: '/console/messages'"), 'layout should have link to /console/messages');
  assert.ok(content.includes("name: 'Messages'"), 'layout should name the tab as Messages');
  assert.ok(content.includes("pathname.startsWith('/console/messages')"), 'layout should handle page title for /console/messages');
});

test('Messaging store supports candidate threads and recruiter sender', () => {
  const storePath = path.join(projectRoot, 'lib/messages/store.ts');
  const content = fs.readFileSync(storePath, 'utf8');

  assert.ok(content.includes('candidateId?: string'), 'MessageThread should include candidateId');
  assert.ok(content.includes('candidateName?: string'), 'MessageThread should include candidateName');
  assert.ok(content.includes('candidateRole?: string'), 'MessageThread should include candidateRole');
  assert.ok(content.includes("sender: 'candidate' | 'recruiter'"), 'ChatMessage should support recruiter and candidate sender');
  assert.ok(content.includes('export function getOrCreateTalentThread'), 'store should export getOrCreateTalentThread helper');
});

test('Recruiter Messages View renders candidate threads and chat actions', () => {
  const viewPath = path.join(projectRoot, 'components/recruiter/recruiter-messages-view.tsx');
  assert.ok(fs.existsSync(viewPath), 'recruiter-messages-view.tsx should exist');

  const content = fs.readFileSync(viewPath, 'utf8');
  assert.ok(content.includes('RecruiterMessagesView'), 'should export RecruiterMessagesView');
  assert.ok(content.includes('talentParam'), 'should handle ?talent query param');
  assert.ok(content.includes('handleSendMessage'), 'should handle sending replies');
  assert.ok(content.includes('handleQuickPrompt'), 'should support quick prompt starters');
  assert.ok(content.includes('Browse Vetted Talent'), 'should link to /console/talent');
});

test('Console Talent Dashboard integrates Direct Chat and Chat buttons', () => {
  const talentPath = path.join(projectRoot, 'app/(recruiter)/console/talent/page.tsx');
  const content = fs.readFileSync(talentPath, 'utf8');

  // Card chat buttons
  assert.ok(content.includes('handleOpenTalentChat'), 'should have handleOpenTalentChat handler');
  assert.ok(content.includes('Chat with Talent'), 'should have Chat with Talent button text');
  assert.ok(content.includes('handleSendDirectChatMessage'), 'should handle direct chat sending');

  // Contact Modal CHAT channel
  assert.ok(content.includes("contactChannel === 'CHAT'"), 'contact modal should have CHAT option');
  assert.ok(content.includes('Send Chat & Open Thread'), 'contact modal should have chat submit label');

  // Direct Talent Chat Dialog
  assert.ok(content.includes('DIRECT TALENT CHAT MODAL'), 'should contain Direct Talent Chat Modal comment');
  assert.ok(content.includes('open={Boolean(chatCandidate)}'), 'modal should open on chatCandidate');
  assert.ok(content.includes('/console/messages?talent='), 'modal should link to full messages view');
});

test('Recruiter Candidates Pool enables messaging talents', () => {
  const candidatesPath = path.join(projectRoot, 'app/(recruiter)/recruiter/candidates/page.tsx');
  const content = fs.readFileSync(candidatesPath, 'utf8');

  assert.ok(content.includes('handleMessageCandidate'), 'should have handleMessageCandidate handler');
  assert.ok(content.includes('getOrCreateTalentThread'), 'should create talent thread on click');
  assert.ok(content.includes('/recruiter/messages?talent='), 'should route to messages view with talent ID');
});

test('Recruiter contact API and types accept CHAT channel', () => {
  const typesPath = path.join(projectRoot, 'lib/recruiter/types.ts');
  const apiPath = path.join(projectRoot, 'app/api/recruiter/talent/contact/route.ts');

  const typesContent = fs.readFileSync(typesPath, 'utf8');
  const apiContent = fs.readFileSync(apiPath, 'utf8');

  assert.ok(typesContent.includes("'CHAT'"), 'types should allow CHAT contact type');
  assert.ok(apiContent.includes("'CHAT'"), 'API route should accept CHAT contact type');
});
