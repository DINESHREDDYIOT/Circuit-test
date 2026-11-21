const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(6000);
  await page.screenshot({ path: 'rv/lay-1.png', timeout: 300000 });
  // drag the code panel edge to the middle
  const g = await page.evaluate(() => { const r = document.getElementById('codeGrip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.move(g[0], g[1]); await page.mouse.down(); for (let i = 1; i <= 12; i++) await page.mouse.move(g[0] - i * 60, g[1]); await page.mouse.up();
  await page.waitForTimeout(1500);
  console.log('code width after drag', await page.evaluate(() => Math.round(document.getElementById('sideCode').getBoundingClientRect().width)), 'half', 1440 / 2);
  // switch to Python, collapse components
  await page.evaluate(() => { document.querySelector('.lang button[data-lang="py"]').click(); document.getElementById('partsToggle').click(); });
  await page.waitForTimeout(1500);
  console.log('lang file', await page.evaluate(() => document.getElementById('codeFile').textContent), 'parts width', await page.evaluate(() => Math.round(document.getElementById('sideParts').getBoundingClientRect().width)));
  await page.screenshot({ path: 'rv/lay-2.png', timeout: 300000 });
  // load the Pi blink example and run it with the switch
  await page.evaluate(() => { document.getElementById('partsToggle').click(); __lab.loadExample(16); }); await page.waitForTimeout(2000);
  console.log('after example lang', await page.evaluate(() => document.getElementById('codeFile').textContent));
  await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 300000 }); await page.waitForTimeout(3000);
  console.log('running', await page.evaluate(() => __lab.run.state));
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
