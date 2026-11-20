// scripts/tests/saas-homepage-and-navigation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());

test('1. Master Home Copy: CoreShift & AIDA Framework positioning', () => {
  const homeCopyPath = path.join(projectRoot, 'content', 'home.ts');
  const fileContent = fs.readFileSync(homeCopyPath, 'utf8');

  // Verify Nav Links
  assert.ok(fileContent.includes("label: 'Find Work', href: '/find-work'"), 'Nav must contain Find Work');
  assert.ok(fileContent.includes("label: 'Products', href: '/products'"), 'Nav must contain Products');
  assert.ok(fileContent.includes("label: 'Solutions', href: '/solutions'"), 'Nav must contain Solutions');
  assert.ok(fileContent.includes("label: 'Hiring', href: '/hiring'"), 'Nav must contain Hiring');

  // Verify Sign In and Start Hiring
  assert.ok(fileContent.includes("signInHref: '/login'"), 'Sign in should link to /login');
  assert.ok(fileContent.includes("createProfileLabel: 'Start Hiring'"), 'Primary button should be Start Hiring');
  assert.ok(fileContent.includes("createProfileHref: '/hiring'"), 'Primary button links to /hiring');

  // Verify Footer Address (Strictly No HQ)
  assert.ok(fileContent.includes("address: 'Abuja, Nigeria'"), 'Footer address must be Abuja, Nigeria');
  assert.ok(!fileContent.includes('Abuja HQ') && !fileContent.includes('Sync730 HQ'), 'Address must not include HQ');

  // Verify AIDA Positioning
  assert.ok(fileContent.includes('A — ATTENTION'), 'Hero eyebrow contains A — ATTENTION');
  assert.ok(fileContent.includes('All-in-one AI recruitment platform'), 'H1 matches CoreShift All-in-one pattern');
  assert.ok(fileContent.includes('I — INTEREST'), 'Products section contains I — INTEREST');
  assert.ok(fileContent.includes('D — DESIRE'), 'Solutions/employers section contains D — DESIRE');
  assert.ok(fileContent.includes('A — ACTION'), 'Closing CTA section contains A — ACTION');

  // Verify strict no emoji rule in homeCopy
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.ok(!emojiRegex.test(fileContent), 'home.ts should not contain emoji characters');
});

test('2. Site Header: SyncFlow removed, vibrant orange CTA button', () => {
  const headerPath = path.join(projectRoot, 'components', 'site', 'site-header.tsx');
  const fileContent = fs.readFileSync(headerPath, 'utf8');

  // Verify SyncFlow button is removed from header
  assert.ok(!fileContent.includes('Open SyncFlow pipeline'), 'Header should not have Open SyncFlow pipeline button');
  assert.ok(!fileContent.includes('homeCopy.nav.syncFlowLabel'), 'Header should not render syncFlowLabel');

  // Verify orange button styling
  assert.ok(fileContent.includes('#FF5500') || fileContent.includes('bg-orange'), 'Header should have orange CTA button');
});

test('3. Site Footer: Displays Abuja, Nigeria address at bottom with animation, without HQ', () => {
  const footerPath = path.join(projectRoot, 'components', 'site', 'site-footer.tsx');
  const fileContent = fs.readFileSync(footerPath, 'utf8');

  assert.ok(fileContent.includes('Abuja, Nigeria'), 'Footer must display Abuja, Nigeria');
  assert.ok(!fileContent.includes('Sync730 HQ') && !fileContent.includes('Abuja HQ'), 'Footer must not contain HQ');
  assert.ok(fileContent.includes('animate-ping'), 'Footer address must have pulse/ping animation');
  assert.ok(fileContent.includes('columns.products'), 'Footer must render Products column');
  assert.ok(fileContent.includes('columns.solutions'), 'Footer must render Solutions column');
  assert.ok(fileContent.includes('columns.hiring'), 'Footer must render Hiring column');
});

test('4. Dedicated SaaS Pages: /products, /solutions, /hiring with orange accents & no HQ', () => {
  const productsPath = path.join(projectRoot, 'app', 'products', 'page.tsx');
  const solutionsPath = path.join(projectRoot, 'app', 'solutions', 'page.tsx');
  const hiringPath = path.join(projectRoot, 'app', 'hiring', 'page.tsx');

  assert.ok(fs.existsSync(productsPath), 'app/products/page.tsx must exist');
  assert.ok(fs.existsSync(solutionsPath), 'app/solutions/page.tsx must exist');
  assert.ok(fs.existsSync(hiringPath), 'app/hiring/page.tsx must exist');

  const productsContent = fs.readFileSync(productsPath, 'utf8');
  assert.ok(productsContent.includes('AI Autonomous Sourcing'), 'Products page covers sourcing');
  assert.ok(productsContent.includes('#FF5500'), 'Products page uses orange button');
  assert.ok(!productsContent.includes('Abuja, Nigeria HQ'), 'Products page should not have HQ');

  const solutionsContent = fs.readFileSync(solutionsPath, 'utf8');
  assert.ok(solutionsContent.includes('For High-Growth Startups'), 'Solutions covers startups');
  assert.ok(solutionsContent.includes('#FF5500'), 'Solutions page uses orange button');
  assert.ok(!solutionsContent.includes('Abuja, Nigeria HQ') && !solutionsContent.includes('Abuja (HQ)'), 'Solutions page should not have HQ');

  const hiringContent = fs.readFileSync(hiringPath, 'utf8');
  assert.ok(hiringContent.includes('HOW RECRUITING WORKS') || hiringContent.includes('From role posting to verified hire'), 'Hiring page covers workflow');
  assert.ok(hiringContent.includes('#FF5500'), 'Hiring page uses orange button');
  assert.ok(!hiringContent.includes('Abuja, Nigeria HQ'), 'Hiring page should not have HQ');
});

test('5. Hero Section: CoreShift Connected Platform Hub & AIDA Integration', () => {
  const heroPath = path.join(projectRoot, 'components', 'home', 'hero-section.tsx');
  const heroContent = fs.readFileSync(heroPath, 'utf8');

  assert.ok(heroContent.includes('CoreShift Platform Hub'), 'Hero includes CoreShift Platform Hub switcher');
  assert.ok(heroContent.includes('Sync730 Core AI'), 'Hero includes central AI hub node');
  assert.ok(heroContent.includes('#FF5500'), 'Hero section has vibrant orange CTA');
  assert.ok(heroContent.includes('Direct Chat'), 'Hero section features direct chat button');
  assert.ok(!heroContent.includes('Abuja HQ'), 'Hero section should not have HQ');

  // Verify AIDA stages throughout sections
  const productsSectionPath = path.join(projectRoot, 'components', 'home', 'products-section.tsx');
  const productsSectionContent = fs.readFileSync(productsSectionPath, 'utf8');
  assert.ok(productsSectionContent.includes('animate-ping'), 'Products section includes animated beacon');

  const solutionsSectionPath = path.join(projectRoot, 'components', 'home', 'solutions-section.tsx');
  const solutionsSectionContent = fs.readFileSync(solutionsSectionPath, 'utf8');
  assert.ok(solutionsSectionContent.includes('animate-ping'), 'Solutions section includes animated beacon');

  const finalCtaPath = path.join(projectRoot, 'components', 'home', 'final-cta-section.tsx');
  const finalCtaContent = fs.readFileSync(finalCtaPath, 'utf8');
  assert.ok(finalCtaContent.includes('A — ACTION'), 'Closing CTA section features A — ACTION eyebrow');
});
