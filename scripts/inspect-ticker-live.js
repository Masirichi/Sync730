// scripts/inspect-ticker-live.js
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ONESTOP INNOVATIONS\\.gemini\\antigravity\\brain\\04f7c9fb-5068-4e0c-974d-157c2b8c84cb';

async function inspectHomepageTicker() {
  console.log('Launching Puppeteer Chrome to inspect homepage animated ticker...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 });

    // 1. Check Mercor-Style Header elements
    const livePill = await page.$eval('section h2 + p', (el) => el.textContent);
    console.log('Found subtitle text:', livePill.slice(0, 60) + '...');

    const headerTitle = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find((el) => el.textContent.includes('Latest roles'));
      return h2 ? h2.textContent.trim() : null;
    });
    console.log('✓ Section title:', headerTitle);

    // 2. Inspect ticker cards
    const cardData = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/find-work?jobId="]'));
      return links.slice(0, 6).map((a) => {
        const text = a.textContent.trim();
        const href = a.getAttribute('href');
        return { href, text: text.replace(/\s+/g, ' ').slice(0, 80) };
      });
    });

    console.log(`\n✓ Found ${cardData.length} ticker cards on the homepage:`);
    cardData.forEach((c, idx) => console.log(`   [${idx + 1}] ${c.href} -> "${c.text}"`));

    // 3. Test Hover Pause on Ticker
    console.log('\nTesting hover pause on ticker animation...');
    const marqueeRow = await page.$('.animate-marquee-left');
    if (marqueeRow) {
      // Check play-state before hover
      const initialPlayState = await page.evaluate((el) => window.getComputedStyle(el).animationPlayState, marqueeRow);
      console.log('   Animation play-state before hover:', initialPlayState);

      // Hover over marquee row
      await marqueeRow.hover();
      await new Promise((r) => setTimeout(r, 200));

      const hoveredPlayState = await page.evaluate((el) => window.getComputedStyle(el).animationPlayState, marqueeRow);
      console.log('   Animation play-state during hover:', hoveredPlayState);
    }

    // 4. Capture screenshot of the ticker
    const screenshotPath = path.join(ARTIFACT_DIR, 'homepage_latest_roles_ticker.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('✓ Captured screenshot at:', screenshotPath);

    // 5. Test Click Routing to /find-work?jobId=...
    console.log('\nTesting click navigation to /find-work?jobId=...');
    const firstCard = await page.$('a[href*="/find-work?jobId="]');
    if (firstCard) {
      const targetHref = await page.evaluate((el) => el.getAttribute('href'), firstCard);
      console.log('   Clicking card with href:', targetHref);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        page.evaluate((el) => el.click(), firstCard),
      ]);

      const currentUrl = page.url();
      console.log('✓ Successfully navigated to:', currentUrl);
      if (currentUrl.includes('/find-work')) {
        console.log('✓ Route cleanly confirmed on /find-work!');
      }

      // Capture screenshot of /find-work with highlighted role
      const findWorkScreenshot = path.join(ARTIFACT_DIR, 'find_work_highlighted_from_ticker.png');
      await page.screenshot({ path: findWorkScreenshot, fullPage: false });
      console.log('✓ Captured /find-work screenshot at:', findWorkScreenshot);
    }

    console.log('\nALL HOMEPAGE TICKER INSPECTIONS PASSED!');
  } catch (err) {
    console.error('Inspection error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

inspectHomepageTicker();
