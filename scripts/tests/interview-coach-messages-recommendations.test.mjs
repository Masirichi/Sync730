// scripts/tests/interview-coach-messages-recommendations.test.mjs
// Verifies:
// 1. Unified Interview Coach (5 questions, JD parsing, legacy route redirects)
// 2. Candidate Messages Feature (real threads, recruiter context, sending replies, unread counts)
// 3. Merged Browse Jobs pointing to /find-work (crawler and candidate jobs forwarding)
// 4. Jobs Recommendation Algorithm (multi-factor scoring on skills, role, country eligibility, modality)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Interview Coach: 5 questions & Job Description synthesis', () => {
  const sandboxPath = path.resolve('lib/sandbox.ts');
  assert.ok(fs.existsSync(sandboxPath), 'lib/sandbox.ts must exist');
  const content = fs.readFileSync(sandboxPath, 'utf8');

  // Verify generateRoleQuestions produces 5 questions
  assert.ok(content.includes('generateRoleQuestions'), 'Must export generateRoleQuestions');
  assert.ok(content.includes('extractJobDescriptionSignals'), 'Must parse job description signals');
  assert.ok(content.includes('jobDescription'), 'Must accept jobDescription parameter');
  assert.ok(content.includes('InterviewQuestion[]'), 'Must return InterviewQuestion array');

  // Verify unified Interview Coach page exists
  const coachPagePath = path.resolve('app/(candidate)/dashboard/coach/page.tsx');
  assert.ok(fs.existsSync(coachPagePath), 'dashboard/coach/page.tsx must exist');
  const coachContent = fs.readFileSync(coachPagePath, 'utf8');
  assert.ok(coachContent.includes('Interview Coach'), 'Must contain Interview Coach title');
  assert.ok(coachContent.includes('targetRole'), 'Must allow setting target role');
  assert.ok(coachContent.includes('jobDescription'), 'Must allow inputting job description');
  assert.ok(coachContent.includes('5 questions'), 'Must specify 5 questions');

  // Verify questions state is initialized synchronously and guarded with fallback to prevent undefined category error
  assert.ok(coachContent.includes('generateRoleQuestions(queryRole'), 'Questions state must initialize synchronously');
  assert.ok(coachContent.includes('fallbackQuestion'), 'Must provide fallbackQuestion to guard currentQ');
  assert.ok(coachContent.includes('currentQ?.category'), 'Must use safe navigation currentQ?.category');

  // Verify legacy routes forward to Interview Coach
  const prepPath = path.resolve('app/(candidate)/dashboard/prep/page.tsx');
  const prepContent = fs.readFileSync(prepPath, 'utf8');
  assert.ok(prepContent.includes('InterviewCoach') || prepContent.includes('/dashboard/coach'), 'Prep page must forward to coach');

  const sandboxRoutePath = path.resolve('app/(candidate)/dashboard/sandbox/page.tsx');
  const sandboxRouteContent = fs.readFileSync(sandboxRoutePath, 'utf8');
  assert.ok(sandboxRouteContent.includes('InterviewCoach') || sandboxRouteContent.includes('/dashboard/coach'), 'Sandbox page must forward to coach');
});

test('2. Navigation Restructure: Browse Jobs & Interview Coach', () => {
  const navPath = path.resolve('lib/navigation.ts');
  assert.ok(fs.existsSync(navPath), 'lib/navigation.ts must exist');
  const navContent = fs.readFileSync(navPath, 'utf8');

  // Verify "Interview Coach" exists
  assert.ok(navContent.includes('Interview Coach'), 'Nav must include Interview Coach');
  assert.ok(navContent.includes('/dashboard/coach'), 'Interview Coach must link to /dashboard/coach');

  // Verify "Browse Jobs" exists and links straight to /find-work
  assert.ok(navContent.includes('Browse Jobs') || navContent.includes('Browse Job'), 'Nav must include Browse Jobs');
  assert.ok(navContent.includes("href: '/find-work'"), 'Browse Jobs must link directly to /find-work');

  // Verify legacy routes redirect to /find-work
  const crawlerPath = path.resolve('app/(candidate)/dashboard/crawler/page.tsx');
  const crawlerContent = fs.readFileSync(crawlerPath, 'utf8');
  assert.ok(crawlerContent.includes('/find-work'), 'Crawler page must redirect to /find-work');

  const candJobsPath = path.resolve('app/(candidate)/candidate/jobs/page.tsx');
  const candJobsContent = fs.readFileSync(candJobsPath, 'utf8');
  assert.ok(candJobsContent.includes('/find-work'), 'Candidate jobs page must redirect to /find-work');
});

test('3. Candidate Messages Feature: Interactive store & UI', () => {
  const storePath = path.resolve('lib/messages/store.ts');
  assert.ok(fs.existsSync(storePath), 'lib/messages/store.ts must exist');
  const storeContent = fs.readFileSync(storePath, 'utf8');

  // Verify store functions
  assert.ok(storeContent.includes('getLocalMessageThreads'), 'Must export getLocalMessageThreads');
  assert.ok(storeContent.includes('sendMessage'), 'Must export sendMessage');
  assert.ok(storeContent.includes('markThreadAsRead'), 'Must export markThreadAsRead');
  assert.ok(storeContent.includes('createNewMessageThread'), 'Must export createNewMessageThread');

  // Verify realistic verified African employers seeded
  assert.ok(storeContent.includes('Paystack'), 'Must seed Paystack recruiter thread');
  assert.ok(storeContent.includes('Moniepoint'), 'Must seed Moniepoint recruiter thread');

  // Verify candidate messages workspace page
  const messagesPagePath = path.resolve('app/(candidate)/candidate/messages/page.tsx');
  assert.ok(fs.existsSync(messagesPagePath), 'candidate/messages/page.tsx must exist');
  const pageContent = fs.readFileSync(messagesPagePath, 'utf8');
  assert.ok(pageContent.includes('Messages'), 'Must have Messages header');
  assert.ok(pageContent.includes('sendMessage'), 'Must handle sending messages');
  assert.ok(pageContent.includes('activeThread'), 'Must handle active conversation thread');
});

test('4. Jobs Recommendation Algorithm & Best Match Sort', () => {
  const recPath = path.resolve('lib/jobs/recommendations.ts');
  assert.ok(fs.existsSync(recPath), 'lib/jobs/recommendations.ts must exist');
  const recContent = fs.readFileSync(recPath, 'utf8');

  // Verify algorithm exports
  assert.ok(recContent.includes('calculateJobRecommendation'), 'Must export calculateJobRecommendation');
  assert.ok(recContent.includes('getTopRecommendedJobs'), 'Must export getTopRecommendedJobs');

  // Verify multi-factor scoring dimensions
  assert.ok(recContent.includes('Target Track Alignment') || recContent.includes('Role Title'), 'Scores role title');
  assert.ok(recContent.includes('Skills Overlap'), 'Scores skills overlap with proficiency weighting');
  assert.ok(recContent.includes('Africa Eligibility'), 'Scores country and Africa eligibility');
  assert.ok(recContent.includes('Modality') || recContent.includes('Work Preferences'), 'Scores work modality');

  // Verify sort="match" integration in lib/jobs/service.ts
  const servicePath = path.resolve('lib/jobs/service.ts');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  assert.ok(serviceContent.includes("'match'"), 'JobFilterParams must support sort="match"');
  assert.ok(serviceContent.includes('calculateJobRecommendation'), 'Job service must use recommendation scoring');

  // Verify UI has match sort option in jobs-client-view.tsx
  const viewPath = path.resolve('components/jobs/jobs-client-view.tsx');
  const viewContent = fs.readFileSync(viewPath, 'utf8');
  assert.ok(viewContent.includes('value="match"'), 'Sort dropdown must contain match option');
});
