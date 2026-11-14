// scripts/audit-homepage.js
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const AXE_SOURCE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

async function auditHomepage() {
  console.log('Launching Chrome to audit Homepage (/)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 });

  // 1. Run Axe-core
  await page.evaluate(AXE_SOURCE);
  const axeResults = await page.evaluate(async () => {
    return await axe.run({
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
    });
  });

  console.log(`\n=== AXE-CORE AUDIT RESULTS ===`);
  console.log(`Violations: ${axeResults.violations.length}`);
  if (axeResults.violations.length > 0) {
    axeResults.violations.forEach((v) => {
      console.log(`- [${v.impact}] ${v.id}: ${v.description}`);
      console.log(`  Help: ${v.helpUrl}`);
      v.nodes.slice(0, 3).forEach((n) => console.log(`  Target: ${n.target.join(' ')}`));
    });
  } else {
    console.log('✓ 0 WCAG AA accessibility violations detected by axe-core!');
  }

  // 2. Mobile Viewport 360px check
  console.log('\n=== MOBILE VIEWPORT (360px) CHECK ===');
  await page.setViewport({ width: 360, height: 640 });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log(`Viewport 360px: scrollWidth = ${scrollWidth}, clientWidth = ${clientWidth}`);
  if (scrollWidth <= clientWidth) {
    console.log('✓ No horizontal scroll at 360px width!');
  } else {
    console.log(`⚠ Horizontal overflow: ${scrollWidth - clientWidth}px`);
  }

  await browser.close();
  console.log('\nAudit complete.');
}

auditHomepage().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
