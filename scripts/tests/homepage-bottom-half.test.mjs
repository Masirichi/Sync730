// scripts/tests/homepage-bottom-half.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('1. Copy Centralization in src/content/home.ts for Bottom Half', () => {
  const contentFile = fs.readFileSync(path.join(projectRoot, 'src/content/home.ts'), 'utf8');

  // Verify Latest roles copy
  assert.ok(contentFile.includes('HIRING NOW · LIVE FEED'), 'Missing latestRoles eyebrow');
  assert.ok(contentFile.includes('Roles you can actually apply for.'), 'Missing latestRoles h2');
  assert.ok(contentFile.includes('Curated remote, hybrid and onsite roles in Lagos, Abuja and across Africa'), 'Missing latestRoles body');
  assert.ok(contentFile.includes('live roles · Remote, hybrid & onsite · One profile, every application'), 'Missing latestRoles metaSuffix');
  assert.ok(contentFile.includes('Find Work'), 'Missing latestRoles buttonText');

  // Verify Differentiators copy
  assert.ok(contentFile.includes('THE SYNC730 DIFFERENCE'), 'Missing differentiators label');
  assert.ok(contentFile.includes('No false hope. Just real roles.'), 'Missing differentiators h2');
  assert.ok(contentFile.includes('01'), 'Missing 01');
  assert.ok(contentFile.includes('Real, not ghost'), 'Missing Real, not ghost');
  assert.ok(contentFile.includes('02'), 'Missing 02');
  assert.ok(contentFile.includes('Open to you, upfront'), 'Missing Open to you, upfront');
  assert.ok(contentFile.includes('03'), 'Missing 03');
  assert.ok(contentFile.includes('Seen for who you are'), 'Missing Seen for who you are');
  assert.ok(contentFile.includes('04'), 'Missing 04');
  assert.ok(contentFile.includes('Humans decide'), 'Missing Humans decide');
  assert.ok(contentFile.includes('Sync730 verifies that roles are real and open to Africa. Hiring decisions are made by the employer.'), 'Missing differentiators mutedLine');

  // Verify For recruiters copy
  assert.ok(contentFile.includes('WE BELIEVE IN HIRING THE PERSON, NOT THE ADDRESS'), 'Missing forRecruiters eyebrow');
  assert.ok(contentFile.includes('Meet the person behind the résumé.'), 'Missing forRecruiters h2');
  assert.ok(contentFile.includes('Everyone gets a fair shot.'), 'Missing Everyone gets a fair shot.');
  assert.ok(contentFile.includes('Evidence, not guesswork.'), 'Missing Evidence, not guesswork.');
  assert.ok(contentFile.includes('You decide. Together.'), 'Missing You decide. Together.');
  assert.ok(contentFile.includes('Senior Backend Engineer'), 'Missing Senior Backend Engineer');
  assert.ok(contentFile.includes('Candidate #A7F2'), 'Missing Candidate #A7F2');
  assert.ok(contentFile.includes('Strong on retries and reconciliation. Gap: distributed tracing.'), 'Missing sample report quote');
  assert.ok(contentFile.includes('Identity verified, 0 integrity flags'), 'Missing sample report integrity');
  assert.ok(contentFile.includes('Evaluation advisory: humans decide.'), 'Missing sample report advisory');
  assert.ok(contentFile.includes('Book a demo'), 'Missing forRecruiters ctaPrimary');
  assert.ok(contentFile.includes('See a sample report'), 'Missing forRecruiters ctaSecondary');

  // Verify Social proof copy
  assert.ok(contentFile.includes('FROM THE PEOPLE USING IT'), 'Missing socialProof label');
  assert.ok(contentFile.includes('Real roles. Real people.'), 'Missing socialProof h2');

  // Verify FAQ copy
  assert.ok(contentFile.includes('QUESTIONS WE HEAR OFTEN'), 'Missing faq label');
  assert.ok(contentFile.includes('Is Sync730 free?'), 'Missing FAQ 1');
  assert.ok(contentFile.includes('What does "Role verified" mean?'), 'Missing FAQ 2');
  assert.ok(contentFile.includes("Do you guarantee I\\'ll get a job?") || contentFile.includes("Do you guarantee"), 'Missing FAQ 3');
  assert.ok(contentFile.includes('What is SyncFlow?'), 'Missing FAQ 4');
  assert.ok(contentFile.includes('Will AI decide whether I get hired?'), 'Missing FAQ 5');
  assert.ok(contentFile.includes("What if I find a role that isn\\'t real") || contentFile.includes("What if I find a role"), 'Missing FAQ 6');

  // Verify Closing CTA copy
  assert.ok(contentFile.includes("You've waited long enough for a fair shot."), 'Missing closingCta h2');
  assert.ok(contentFile.includes('+ professionals searching smarter, and the companies hiring them.'), 'Missing closingCta bodySuffix');
  assert.ok(contentFile.includes('Create your free profile'), 'Missing closingCta ctaPrimary');
  assert.ok(contentFile.includes("I'm hiring in Africa"), 'Missing closingCta ctaSecondary');
  assert.ok(contentFile.includes('Free for candidates. No credit card. Takes about 3 minutes.'), 'Missing closingCta microcopy');

  // Verify Footer copy
  assert.ok(contentFile.includes('Talent is everywhere. Real opportunity should be too.'), 'Missing footer tagline');
  assert.ok(contentFile.includes('Sync730 verifies that roles are real and open to Africa. Hiring decisions are made by employers.'), 'Missing footer smallPrint');
});

test('2. Homepage Layout Order in components/home/home-view.tsx', () => {
  const homeView = fs.readFileSync(path.join(projectRoot, 'components/home/home-view.tsx'), 'utf8');

  // Verify exact sequential order of components
  const heroIdx = homeView.indexOf('<HeroSection');
  const liveStatsIdx = homeView.indexOf('<LiveStatsBand');
  const beliefIdx = homeView.indexOf('<BeliefSection');
  const forCandidatesIdx = homeView.indexOf('<ForCandidatesSection');
  const howItWorksIdx = homeView.indexOf('<HowItWorksSection');
  const latestRolesIdx = homeView.indexOf('<LatestRolesSection');
  const differentiatorsIdx = homeView.indexOf('<DifferentiatorsSection');
  const forRecruitersIdx = homeView.indexOf('<ForRecruitersSection');
  const socialProofIdx = homeView.indexOf('<SocialProofSection');
  const faqIdx = homeView.indexOf('<FaqSection');
  const finalCtaIdx = homeView.indexOf('<FinalCtaSection');
  const footerIdx = homeView.indexOf('<SiteFooter');

  assert.ok(heroIdx > -1, 'HeroSection missing');
  assert.ok(liveStatsIdx > heroIdx, 'LiveStatsBand must be after HeroSection');
  assert.ok(beliefIdx > liveStatsIdx, 'BeliefSection must be after LiveStatsBand');
  assert.ok(forCandidatesIdx > beliefIdx, 'ForCandidatesSection must be after BeliefSection');
  assert.ok(howItWorksIdx > forCandidatesIdx, 'HowItWorksSection must be after ForCandidatesSection');
  assert.ok(latestRolesIdx > howItWorksIdx, 'LatestRolesSection must be after HowItWorksSection');
  assert.ok(differentiatorsIdx > latestRolesIdx, 'DifferentiatorsSection must be after LatestRolesSection');
  assert.ok(forRecruitersIdx > differentiatorsIdx, 'ForRecruitersSection must be after DifferentiatorsSection');
  assert.ok(socialProofIdx > forRecruitersIdx, 'SocialProofSection must be after ForRecruitersSection');
  assert.ok(faqIdx > socialProofIdx, 'FaqSection must be after SocialProofSection');
  assert.ok(finalCtaIdx > faqIdx, 'FinalCtaSection must be after FaqSection');
  assert.ok(footerIdx > finalCtaIdx, 'SiteFooter must be after FinalCtaSection');
});

test('3. Latest Roles Feed uses Phase JobCard component', () => {
  const latestRolesFile = fs.readFileSync(path.join(projectRoot, 'components/home/latest-roles-section.tsx'), 'utf8');
  assert.ok(latestRolesFile.includes("import { JobCard } from '@/components/jobs/job-card'"), 'Must import Phase JobCard');
  assert.ok(latestRolesFile.includes('<JobCard'), 'Must render JobCard');
  assert.ok(latestRolesFile.includes('slice(0, 6)'), 'Must limit to 3-6 jobs');
  assert.ok(!latestRolesFile.includes('Synced live with verified employers'), 'Banned phrase found');
  assert.ok(!latestRolesFile.includes('Vet-Once Profile'), 'Banned phrase found');
});

test('4. Social Proof Section is conditionally hidden when no real data exists', () => {
  const socialProofFile = fs.readFileSync(path.join(projectRoot, 'components/home/social-proof-section.tsx'), 'utf8');
  assert.ok(socialProofFile.includes('if (!hasRealTestimonials && !hasPartners)'), 'Must check real data existence');
  assert.ok(socialProofFile.includes('return null;'), 'Must return null when no real testimonials or partners exist');
});

test('5. FAQ Section has accessible accordion and FAQPage JSON-LD', () => {
  const faqFile = fs.readFileSync(path.join(projectRoot, 'components/home/faq-section.tsx'), 'utf8');
  assert.ok(faqFile.includes("'@type': 'FAQPage'"), 'Must include FAQPage JSON-LD');
  assert.ok(faqFile.includes('aria-expanded={isOpen}'), 'Must have aria-expanded on button');
  assert.ok(faqFile.includes('role="region"'), 'Must have role=region on accordion panel');
  assert.ok(faqFile.includes('<button'), 'Must use button headers for accordion');
});

test('6. Footer contains no dead links', () => {
  const footerFile = fs.readFileSync(path.join(projectRoot, 'components/site/site-footer.tsx'), 'utf8');
  // Check explore links
  assert.ok(footerFile.includes('content.columns.explore'), 'Must map explore links');
  assert.ok(footerFile.includes('content.columns.company'), 'Must map company links');
  assert.ok(footerFile.includes('content.columns.legal'), 'Must map legal links');

  // Verify pages exist
  assert.ok(fs.existsSync(path.join(projectRoot, 'app/find-work')), 'app/find-work missing');
  assert.ok(fs.existsSync(path.join(projectRoot, 'app/about/page.tsx')), 'app/about missing');
  assert.ok(fs.existsSync(path.join(projectRoot, 'app/how-we-verify/page.tsx')), 'app/how-we-verify missing');
  assert.ok(fs.existsSync(path.join(projectRoot, 'app/contact/page.tsx')), 'app/contact missing');
  assert.ok(fs.existsSync(path.join(projectRoot, 'app/privacy/page.tsx')), 'app/privacy missing');
  assert.ok(fs.existsSync(path.join(projectRoot, 'app/terms/page.tsx')), 'app/terms missing');
  assert.ok(fs.existsSync(path.join(projectRoot, 'app/scoring-methodology/page.tsx')), 'app/scoring-methodology missing');
  assert.ok(fs.existsSync(path.join(projectRoot, 'app/ai-transparency/page.tsx')), 'app/ai-transparency missing');
});
