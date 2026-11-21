const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 650 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  for (const ex of [0, 2, 10, 11, 13, 7, 15]) {
    await page.evaluate((i) => __lab.loadExample(i), ex); await page.waitForTimeout(1500);
    await page.evaluate(() => document.getElementById('btnRun').click());
    await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 300000 }).catch(() => {});
    await page.waitForTimeout(2500);
    console.log(ex, await page.evaluate(() => [__lab.run.state, [...__lab.comps.values()].map((c) => c.type).join(',')]).then((r) => r.join(' · ')));
    await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForTimeout(600);
  }
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
