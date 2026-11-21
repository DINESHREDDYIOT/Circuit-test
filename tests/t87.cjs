const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
const ex = Number(process.argv[2] || 1), tag = process.argv[3] || 'v';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html'); await page.waitForFunction(() => window.__lab, null, { timeout: 90000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(800);
  await page.addStyleTag({ content: '#hint,.hint,#toast{display:none!important}' });
  await page.evaluate((i) => __lab.loadExample(i), ex); await page.waitForTimeout(2500);
  await page.click('[data-view="fit"]'); await page.waitForTimeout(1500);
  await page.screenshot({ path: `rv/${tag}-fit.png`, clip: { x: 0, y: 60, width: 1040, height: 800 } });
  // a close look at the board, like a photo
  await page.evaluate(() => { const a = [...__lab.comps.values()].find(c => c.type === 'arduino'); const p = a.group.position, V = p.constructor; __lab.flyTo(new V(p.x + 70, 85, p.z + 95), new V(p.x + 5, 5, p.z), 1); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `rv/${tag}-close.png`, clip: { x: 0, y: 60, width: 1040, height: 800 } });
  console.log(errs.length ? errs.join('\n') : 'no page errors'); await browser.close();
})();
