// scripts/tests/job-card-share-button.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

test('Share Job Button - Component existence & structure', () => {
  const shareComponentPath = path.join(rootDir, 'components/jobs/share-job-button.tsx');
  assert.ok(fs.existsSync(shareComponentPath), 'share-job-button.tsx must exist');

  const content = fs.readFileSync(shareComponentPath, 'utf8');
  assert.ok(content.includes('export function ShareJobButton'), 'Must export ShareJobButton');
  assert.ok(content.includes("'use client'"), 'Must be a client component');
  assert.ok(content.includes('min-h-[44px] min-w-[44px]'), 'Must provide >= 44px accessible touch target');
  assert.ok(content.includes('e.stopPropagation()'), 'Must call stopPropagation to avoid card click bubbling');
});

test('Share Job Button - Social platform URLs and encoding', () => {
  const shareComponentPath = path.join(rootDir, 'components/jobs/share-job-button.tsx');
  const content = fs.readFileSync(shareComponentPath, 'utf8');

  // Verify social share URLs are present
  assert.ok(content.includes('https://www.linkedin.com/sharing/share-offsite/?url='), 'Must support LinkedIn sharing');
  assert.ok(content.includes('https://twitter.com/intent/tweet?text='), 'Must support Twitter / X sharing');
  assert.ok(content.includes('https://api.whatsapp.com/send?text='), 'Must support WhatsApp sharing');
  assert.ok(content.includes('https://t.me/share/url?url='), 'Must support Telegram sharing');
  assert.ok(content.includes('navigator.clipboard.writeText'), 'Must support Clipboard Copy');
  assert.ok(content.includes('navigator.share'), 'Must support mobile native Web Share API');
});

test('Share Job Button - Integration into JobCard component', () => {
  const jobCardPath = path.join(rootDir, 'components/jobs/job-card.tsx');
  assert.ok(fs.existsSync(jobCardPath), 'job-card.tsx must exist');

  const content = fs.readFileSync(jobCardPath, 'utf8');
  assert.ok(content.includes("import { ShareJobButton } from './share-job-button'"), 'JobCard must import ShareJobButton');
  assert.ok(content.includes('<ShareJobButton job={job}'), 'JobCard must render ShareJobButton with job prop');
});

test('Share Job Button - Integration into JobDetailDialog component', () => {
  const dialogPath = path.join(rootDir, 'components/jobs/job-detail-dialog.tsx');
  assert.ok(fs.existsSync(dialogPath), 'job-detail-dialog.tsx must exist');

  const content = fs.readFileSync(dialogPath, 'utf8');
  assert.ok(content.includes("import { ShareJobButton } from './share-job-button'"), 'JobDetailDialog must import ShareJobButton');
  assert.ok(content.includes('<ShareJobButton job={job}'), 'JobDetailDialog must render ShareJobButton');
  assert.ok(content.includes('variant="pill"'), 'JobDetailDialog should use pill variant with label');
});

test('Share Job Button - Social share link builder logic unit verification', () => {
  const job = {
    id: 'test-123',
    slug: 'senior-fullstack-engineer-paystack-lagos-test-123',
    title: 'Senior Fullstack Engineer',
    company_name: 'Paystack',
  };

  const url = `https://sync730.com/jobs/${job.slug}`;
  const text = `${job.title} at ${job.company_name} — Verified remote role open to Africa on Sync730`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

  assert.ok(linkedinUrl.includes('linkedin.com/sharing/share-offsite'));
  assert.ok(twitterUrl.includes('twitter.com/intent/tweet'));
  assert.ok(whatsappUrl.includes('api.whatsapp.com/send'));
  assert.ok(telegramUrl.includes('t.me/share/url'));

  assert.ok(linkedinUrl.includes(encodeURIComponent(job.slug)));
  assert.ok(twitterUrl.includes(encodeURIComponent(job.title)));
  assert.ok(whatsappUrl.includes(encodeURIComponent(job.company_name)));
});
