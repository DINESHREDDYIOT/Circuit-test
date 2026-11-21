const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.waitForTimeout(6000); await page.screenshot({ path: 'rv/tabs-1.png', timeout: 300000 });
  await page.evaluate(() => { document.getElementById('codeToggle').click(); document.getElementById('partsToggle').click(); }); await page.waitForTimeout(2500);
  await page.screenshot({ path: 'rv/tabs-2.png', timeout: 300000 });
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
