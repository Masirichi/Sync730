// scripts/tests/saas-homepage-and-navigation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());

test('1. Master Home Copy: CoreShift positioning without literal AIDA initials or non-footer Abuja', () => {
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

  // Verify Footer Address is strictly Abuja, Nigeria (without HQ)
  assert.ok(fileContent.includes("address: 'Abuja, Nigeria'"), 'Footer address must be Abuja, Nigeria');
  assert.ok(!fileContent.includes('Abuja HQ') && !fileContent.includes('Sync730 HQ'), 'Address must not include HQ');

  // Verify Abuja is NOT in hero section (only in footer)
  const heroSlice = fileContent.slice(fileContent.indexOf('hero: {'), fileContent.indexOf('products: {'));
  assert.ok(!heroSlice.includes('Abuja'), 'Hero section must not contain Abuja');

  // Verify removal of literal AIDA initials and explanations (concept alone remains)
  assert.ok(!fileContent.includes('A — ATTENTION'), 'homeCopy must not contain literal A — ATTENTION');
  assert.ok(!fileContent.includes('I — INTEREST'), 'homeCopy must not contain literal I — INTEREST');
  assert.ok(!fileContent.includes('D — DESIRE'), 'homeCopy must not contain literal D — DESIRE');
  assert.ok(!fileContent.includes('A — ACTION'), 'homeCopy must not contain literal A — ACTION');

  // Verify CoreShift All-in-one headline
  assert.ok(fileContent.includes('All-in-one AI recruitment platform'), 'H1 matches CoreShift All-in-one pattern');

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

test('5. Hero Section: CoreShift Connected Platform Hub, no location icon & no Abuja', () => {
  const heroPath = path.join(projectRoot, 'components', 'home', 'hero-section.tsx');
  const heroContent = fs.readFileSync(heroPath, 'utf8');

  assert.ok(heroContent.includes('CoreShift Platform Hub'), 'Hero includes CoreShift Platform Hub switcher');
  assert.ok(heroContent.includes('Sync730 Core AI'), 'Hero includes central AI hub node');
  assert.ok(heroContent.includes('#FF5500'), 'Hero section has vibrant orange CTA');
  assert.ok(heroContent.includes('Direct Chat'), 'Hero section features direct chat button');
  assert.ok(!heroContent.includes('MapPin'), 'Hero section must not include MapPin location icon');
  assert.ok(!heroContent.includes('Abuja'), 'Hero section must not include Abuja');
});

test('6. Section Directly Below Hero: CoreSolutionsSection inspired by reference image', () => {
  const homeViewPath = path.join(projectRoot, 'components', 'home', 'home-view.tsx');
  const homeViewContent = fs.readFileSync(homeViewPath, 'utf8');

  // Must be directly below HeroSection
  const heroIndex = homeViewContent.indexOf('<HeroSection');
  const coreSolutionsIndex = homeViewContent.indexOf('<CoreSolutionsSection');
  assert.ok(heroIndex !== -1, 'HeroSection must be in HomeView');
  assert.ok(coreSolutionsIndex !== -1, 'CoreSolutionsSection must be in HomeView');
  assert.ok(coreSolutionsIndex > heroIndex, 'CoreSolutionsSection must be directly below HeroSection');

  // Verify CoreSolutionsSection component file
  const coreSolutionsPath = path.join(projectRoot, 'components', 'home', 'core-solutions-section.tsx');
  assert.ok(fs.existsSync(coreSolutionsPath), 'core-solutions-section.tsx must exist');

  const coreSolutionsContent = fs.readFileSync(coreSolutionsPath, 'utf8');
  assert.ok(coreSolutionsContent.includes('Core recruitment'), 'Must feature Core recruitment solutions title');
  assert.ok(coreSolutionsContent.includes('Learn more'), 'Must include Learn more action');
  assert.ok(!coreSolutionsContent.includes('Abuja'), 'CoreSolutionsSection must not mention Abuja');

  // Check no emojis in core-solutions-section.tsx
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.ok(!emojiRegex.test(coreSolutionsContent), 'core-solutions-section.tsx must not contain emoji characters');
});

test('7. AI Recruitment Engine Section: Redesigned with Part 1 (3 cards) & Part 2 (supporting 2 cards) with animations', () => {
  const productsSectionPath = path.join(projectRoot, 'components', 'home', 'products-section.tsx');
  assert.ok(fs.existsSync(productsSectionPath), 'products-section.tsx must exist');

  const content = fs.readFileSync(productsSectionPath, 'utf8');

  // Verify Heading & Section setup
  assert.ok(content.includes('Built for everyone'), 'Must feature "Built for everyone" heading');
  assert.ok(content.includes('products.label'), 'Must render eyebrow label');

  // Verify Part 1 (3 Bento Cards from Reference Image 2)
  assert.ok(content.includes('For HR professionals'), 'Must contain "For HR professionals" card');
  assert.ok(content.includes('+45%'), 'Must contain "+45%" evaluation report peak badge');
  assert.ok(content.includes('For managers & leaders'), 'Must contain "For managers & leaders" card');
  assert.ok(content.includes('Access Real-Time Insights'), 'Must contain "Access Real-Time Insights" stacked pill');
  assert.ok(content.includes('For legal teams'), 'Must contain "For legal teams" card');
  assert.ok(content.includes('ShieldCheck'), 'Must contain ShieldCheck icon for compliance');

  // Verify Part 2 (Supporting Bento Row from Reference Image 1)
  assert.ok(content.includes('All employee data at once'), 'Must contain "All employee data at once" wide card');
  assert.ok(content.includes('Project Dept'), 'Must contain Project Dept filter pill');
  assert.ok(content.includes('46%'), 'Must contain "46%" participation metric badge');
  assert.ok(content.includes('For teams & employees'), 'Must contain "For teams & employees" compact card');
  assert.ok(content.includes('ORBIT_TALENTS'), 'Must define orbital talent roster');

  // Verify Animations & African Talent Portraits
  assert.ok(content.includes('motion.div'), 'Must use Framer Motion for animations');
  assert.ok(content.includes('rotate: 360'), 'Must animate orbital wheel');
  assert.ok(content.includes('rotate: -360'), 'Must counter-rotate avatars so portraits stay upright');
  assert.ok(content.includes('photo-1531384441138-2736e62e0919'), 'Must feature African engineer Chidi N.');
  assert.ok(content.includes('photo-1573496359142-b8d87734a5a2'), 'Must feature African engineer Fatima B.');

  // Verify Strict Constraints
  assert.ok(!content.includes('Abuja'), 'Must not mention Abuja outside footer');
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.ok(!emojiRegex.test(content), 'products-section.tsx must not contain emoji characters');
});

