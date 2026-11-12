const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const AXE_SOURCE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const ROUTES = [
  { name: 'Login Page', url: 'http://localhost:3000/login', auth: false },
  { name: 'Jobs Board (/dashboard/crawler)', url: 'http://localhost:3000/dashboard/crawler', auth: true },
  { name: 'Job Detail Page (/dashboard/jobs/seed-job-1)', url: 'http://localhost:3000/dashboard/jobs/seed-job-1', auth: true },
  { name: 'Application Tracker (/dashboard/tracker)', url: 'http://localhost:3000/dashboard/tracker', auth: true },
  { name: 'Candidate Profile (/dashboard/profile)', url: 'http://localhost:3000/dashboard/profile', auth: true },
];

async function runAudit() {
  console.log('Launching headless Chrome for accessibility testing...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });

  const auditResults = [];

  for (const route of ROUTES) {
    console.log(`\n========================================`);
    console.log(`Testing: ${route.name} (${route.url})`);
    console.log(`========================================`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    if (route.auth) {
      await page.setCookie({
        name: 'sync730-demo-role',
        value: 'candidate',
        domain: 'localhost',
        path: '/',
      });
    } else {
      // Clear all cookies for unauthenticated routes
      const client = await page.createCDPSession();
      await client.send('Network.clearBrowserCookies');
    }

    try {
      await page.goto(route.url, { waitUntil: 'networkidle2', timeout: 30000 });
      // Inject axe-core
      await page.evaluate(AXE_SOURCE);

      // Run axe evaluation
      const results = await page.evaluate(async () => {
        return await axe.run({
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
          },
        });
      });

      console.log(`Passes: ${results.passes.length}`);
      console.log(`Violations: ${results.violations.length}`);
      console.log(`Incomplete: ${results.incomplete.length}`);

      if (results.violations.length > 0) {
        console.log(`\nViolations breakdown for ${route.name}:`);
        results.violations.forEach((v, idx) => {
          console.log(`  [${idx + 1}] ID: ${v.id} | Impact: ${v.impact}`);
          console.log(`      Description: ${v.description}`);
          console.log(`      Help: ${v.help} (${v.helpUrl})`);
          console.log(`      Nodes affected: ${v.nodes.length}`);
          v.nodes.slice(0, 3).forEach((n, nIdx) => {
            console.log(`        - Node ${nIdx + 1}: ${n.html.slice(0, 100)}`);
            if (n.failureSummary) console.log(`          Failure: ${n.failureSummary}`);
          });
        });
      } else {
        console.log(`>>> ZERO VIOLATIONS! Full WCAG AA Pass! <<<`);
      }

      auditResults.push({
        name: route.name,
        url: route.url,
        passes: results.passes.length,
        violations: results.violations.length,
        incomplete: results.incomplete.length,
        details: results.violations,
      });
    } catch (err) {
      console.error(`Error auditing ${route.name}:`, err.message);
      auditResults.push({
        name: route.name,
        url: route.url,
        error: err.message,
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  fs.writeFileSync('scripts/axe-audit-results.json', JSON.stringify(auditResults, null, 2), 'utf8');
  console.log('\nAudit complete! Results saved to scripts/axe-audit-results.json');
}

runAudit().catch(console.error);
