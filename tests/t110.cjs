const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 780 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.evaluate(() => __lab.loadExample(0)); await page.waitForTimeout(3000);
  const cam = () => page.evaluate(() => { const p = __lab.camera.position, t = __lab.controls.target; return [p.x, p.y, p.z, t.x, t.y, t.z].map(v => +v.toFixed(1)); });
  const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  // move the "finger" (no button) with Shift, then with Ctrl, then plain
  const moveWith = async (key) => { await page.mouse.move(box[0], box[1]); if (key) await page.keyboard.down(key); for (let i = 1; i <= 10; i++) await page.mouse.move(box[0] + i * 12, box[1] + i * 4); if (key) await page.keyboard.up(key); await page.waitForTimeout(400); };
  const c0 = await cam(); await moveWith('Shift'); const c1 = await cam(); await moveWith('Control'); const c2 = await cam(); await moveWith(null); const c3 = await cam();
  console.log('start', c0); console.log('shift (rotate)', c1); console.log('ctrl (pan)', c2); console.log('plain move', c3);
  // fly away, then Space
  await page.evaluate(() => { const V = __lab.camera.position.constructor; __lab.flyTo(new V(900, 300, 900), new V(700, 0, 700), 1); }); await page.waitForTimeout(1500);
  await page.keyboard.press('Space'); await page.waitForTimeout(2500);
  console.log('after space', await cam());
  await page.screenshot({ path: 'rv/space.png', timeout: 300000 });
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
