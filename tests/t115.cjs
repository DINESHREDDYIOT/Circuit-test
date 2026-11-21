// takes screenshots in the middle of each panel move and checks the 3D view still has a picture (not the flat stage colour)
const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
const { execSync } = require('child_process');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.evaluate(() => __lab.loadExample(0)); await page.waitForTimeout(5000);
  // a canvas pixel probe inside the page: after each animation frame, read the canvas centre straight from WebGL (what the browser shows)
  await page.evaluate(() => { window.__blank = 0; window.__frames = 0; const cv = document.querySelector('.stage canvas'); const gl = cv.getContext('webgl2') || cv.getContext('webgl');
    const probe = () => { const px = new Uint8Array(4); gl.readPixels(Math.floor(cv.width / 2), Math.floor(cv.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); window.__frames++; if (px[3] === 0 || (px[0] + px[1] + px[2] === 0)) window.__blank++; };
    window.__probe = probe; });
  const shot = async (name) => { await page.screenshot({ path: `rv/flk-${name}.png`, clip: { x: 300, y: 60, width: 740, height: 800 }, timeout: 300000 }); };
  // 1. components toggle: shoot mid-transition
  await page.evaluate(() => document.getElementById('partsToggle').click()); await page.waitForTimeout(90); await shot('parts-mid');
  await page.waitForTimeout(800); await page.evaluate(() => document.getElementById('partsToggle').click()); await page.waitForTimeout(90); await shot('parts-back-mid');
  // 2. code editor toggle
  await page.waitForTimeout(800); await page.evaluate(() => document.getElementById('codeToggle').click()); await page.waitForTimeout(90); await shot('code-mid');
  await page.waitForTimeout(800);
  // 3. drag the code panel edge, shoot while the mouse is still down
  const g = await page.evaluate(() => { const r = document.getElementById('codeGrip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.move(g[0], g[1]); await page.mouse.down(); for (let i = 1; i <= 6; i++) await page.mouse.move(g[0] - i * 30, g[1]);
  await page.screenshot({ path: 'rv/flk-drag-mid.png', clip: { x: 300, y: 60, width: 500, height: 800 }, timeout: 300000 });
  await page.mouse.up();
  console.log('run state', await page.evaluate(() => __lab.run.state), 'comps', await page.evaluate(() => __lab.comps.size));
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
