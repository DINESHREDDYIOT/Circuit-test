// counts frames the browser would show blank: the canvas was resized after its last draw call (a resize wipes the picture)
const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
const file = process.argv[2] || 'test.html';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.addInitScript(() => {
    window.__blank = 0; window.__resizes = 0;
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...a) {
      const ctx = orig.call(this, type, ...a);
      if (ctx && /webgl/.test(type) && !ctx.__hooked) {
        ctx.__hooked = true; const cv = this; let w = 0, h = 0;
        for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) { const f = ctx[fn]; if (f) ctx[fn] = function (...x) { w = cv.width; h = cv.height; return f.apply(this, x); }; }
        let lw = 0, lh = 0;
        const tick = () => { if (!cv.closest('.stage')) { requestAnimationFrame(tick); return; } if (w && (cv.width !== w || cv.height !== h)) window.__blank++; if (cv.width !== lw || cv.height !== lh) { window.__resizes++; lw = cv.width; lh = cv.height; } requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
      return ctx;
    };
  });
  await page.goto('http://localhost:8765/' + file, { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.evaluate(() => __lab.loadExample(0)); await page.waitForTimeout(5000);
  await page.evaluate(() => { window.__blank = 0; window.__resizes = 0; });
  for (const id of ['partsToggle', 'partsToggle', 'codeToggle', 'codeToggle', 'codeToggle']) { await page.evaluate((i) => document.getElementById(i).click(), id); await page.waitForTimeout(900); }
  const g = await page.evaluate(() => { const r = document.getElementById('codeGrip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.move(g[0], g[1]); await page.mouse.down(); for (let i = 1; i <= 20; i++) { await page.mouse.move(g[0] - i * 15, g[1]); await page.waitForTimeout(30); } for (let i = 20; i >= 0; i--) { await page.mouse.move(g[0] - i * 15, g[1]); await page.waitForTimeout(30); } await page.mouse.up();
  await page.waitForTimeout(800);
  console.log(file, '→ canvas resizes', await page.evaluate(() => window.__resizes), '| frames shown blank', await page.evaluate(() => window.__blank));
  await browser.close();
})();
