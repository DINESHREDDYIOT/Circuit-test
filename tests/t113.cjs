const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.evaluate(() => { localStorage.clear(); __lab.loadExample(16); }); await page.waitForTimeout(3000);
  await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 300000 }); await page.waitForTimeout(3000);
  await page.screenshot({ path: 'rv/out-1.png', timeout: 300000 });   // drawer closed by default, green dot on Serial monitor
  await page.evaluate(() => document.getElementById('outToggle').click()); await page.waitForTimeout(1500);
  await page.screenshot({ path: 'rv/out-2.png', clip: { x: 1040, y: 60, width: 400, height: 800 }, timeout: 300000 });
  await page.evaluate(() => document.querySelector('.out-seg button[data-out="read"]').click()); await page.waitForTimeout(1500);
  await page.screenshot({ path: 'rv/out-3.png', clip: { x: 1040, y: 60, width: 400, height: 800 }, timeout: 300000 });
  await page.evaluate(() => document.getElementById('codeToggle').click()); await page.waitForTimeout(1500);
  console.log('code panel width when hidden', await page.evaluate(() => Math.round(document.getElementById('sideCode').getBoundingClientRect().width)));
  await page.screenshot({ path: 'rv/out-4.png', timeout: 300000 });
  await page.evaluate(() => document.getElementById('codeToggle').click()); await page.waitForTimeout(1500);
  console.log('code panel width restored', await page.evaluate(() => Math.round(document.getElementById('sideCode').getBoundingClientRect().width)));
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
