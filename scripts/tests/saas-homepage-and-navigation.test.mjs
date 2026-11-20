// scripts/tests/saas-homepage-and-navigation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());

test('1. Master Home Copy: AI Recruitment Solutions SaaS positioning', () => {
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

  // Verify Footer Address
  assert.ok(fileContent.includes("address: 'Abuja, Nigeria'"), 'Footer address must be Abuja, Nigeria');

  // Verify SaaS Hero Copy
  assert.ok(fileContent.includes('AI RECRUITMENT SOLUTIONS FOR GLOBAL TEAMS'), 'Eyebrow states AI Recruitment Solutions');
  assert.ok(fileContent.includes('Autonomous AI recruitment for modern engineering teams.'), 'H1 states autonomous AI recruitment');

  // Verify strict no emoji rule in homeCopy
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.ok(!emojiRegex.test(fileContent), 'home.ts should not contain emoji characters');
});

test('2. Site Footer: Displays Abuja, Nigeria address and updated columns', () => {
  const footerPath = path.join(projectRoot, 'components', 'site', 'site-footer.tsx');
  const fileContent = fs.readFileSync(footerPath, 'utf8');

  assert.ok(fileContent.includes('Abuja, Nigeria'), 'Footer must display Abuja, Nigeria');
  assert.ok(fileContent.includes('MapPin'), 'Footer should have MapPin icon for address');
  assert.ok(fileContent.includes('columns.products'), 'Footer must render Products column');
  assert.ok(fileContent.includes('columns.solutions'), 'Footer must render Solutions column');
  assert.ok(fileContent.includes('columns.hiring'), 'Footer must render Hiring column');
});

test('3. Dedicated SaaS Pages Exist: /products, /solutions, /hiring', () => {
  const productsPath = path.join(projectRoot, 'app', 'products', 'page.tsx');
  const solutionsPath = path.join(projectRoot, 'app', 'solutions', 'page.tsx');
  const hiringPath = path.join(projectRoot, 'app', 'hiring', 'page.tsx');

  assert.ok(fs.existsSync(productsPath), 'app/products/page.tsx must exist');
  assert.ok(fs.existsSync(solutionsPath), 'app/solutions/page.tsx must exist');
  assert.ok(fs.existsSync(hiringPath), 'app/hiring/page.tsx must exist');

  const productsContent = fs.readFileSync(productsPath, 'utf8');
  assert.ok(productsContent.includes('AI Autonomous Sourcing'), 'Products page covers sourcing');
  assert.ok(productsContent.includes('AI Video & Technical Interviewer'), 'Products page covers video interviews');
  assert.ok(productsContent.includes('SyncFlow ATS'), 'Products page covers SyncFlow ATS');
  assert.ok(productsContent.includes('Abuja, Nigeria'), 'Products page references Abuja, Nigeria HQ');

  const solutionsContent = fs.readFileSync(solutionsPath, 'utf8');
  assert.ok(solutionsContent.includes('For High-Growth Startups'), 'Solutions covers startups');
  assert.ok(solutionsContent.includes('For Global Distributed Enterprises'), 'Solutions covers global remote teams');
  assert.ok(solutionsContent.includes('For CTOs & Engineering Leaders'), 'Solutions covers tech leaders');
  assert.ok(solutionsContent.includes('Abuja, Nigeria'), 'Solutions page references Abuja, Nigeria HQ');

  const hiringContent = fs.readFileSync(hiringPath, 'utf8');
  assert.ok(hiringContent.includes('HOW RECRUITING WORKS') || hiringContent.includes('From role posting to verified hire'), 'Hiring page covers workflow');
  assert.ok(hiringContent.includes('Pay As You Hire'), 'Hiring page covers pricing/tokens');
  assert.ok(hiringContent.includes('Abuja, Nigeria'), 'Hiring page references Abuja, Nigeria HQ');
});

test('4. Homepage Layout: Hero, Products, Solutions, Hiring integration', () => {
  const homeViewPath = path.join(projectRoot, 'components', 'home', 'home-view.tsx');
  const homeViewContent = fs.readFileSync(homeViewPath, 'utf8');

  assert.ok(homeViewContent.includes('<ProductsSection />'), 'HomeView must include ProductsSection');
  assert.ok(homeViewContent.includes('<SolutionsSection />'), 'HomeView must include SolutionsSection');
  assert.ok(homeViewContent.includes('<HeroSection'), 'HomeView must include HeroSection');

  const heroPath = path.join(projectRoot, 'components', 'home', 'hero-section.tsx');
  const heroContent = fs.readFileSync(heroPath, 'utf8');
  assert.ok(heroContent.includes('AI Match Dossier'), 'Hero section provides AI Match Dossier preview');
  assert.ok(heroContent.includes('Direct Chat'), 'Hero section features direct chat button');
  assert.ok(heroContent.includes('Find Work'), 'Hero section links candidates to Find Work');
});
