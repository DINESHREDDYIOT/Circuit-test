const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html'); await page.waitForFunction(() => window.__lab, null, { timeout: 90000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(800);
  await page.addStyleTag({ content: '#empty,#hint,.hint,#tip,.views,#status,.status,#toast{display:none!important}' });
  for (const [ex, t] of [[15, 'l293d'], [7, 'sshield']]) {
    await page.evaluate((ex) => __lab.loadExample(ex), ex); await page.waitForTimeout(1500);
    const B = await page.evaluate(() => { const b = [...__lab.comps.values()].find(c => c.type === 'arduino'); return [b.x, b.z]; });
    const shots = [[-1.05, 0.32, 'usb'], [-1.6, 0.05, 'side'], [-0.5, 0.75, 'q']];
    for (const [az, el, tag] of shots) {
      await page.evaluate(([az, el, B]) => { const V = __lab.camera.position.constructor, d = 150; __lab.flyTo(new V(B[0] + Math.sin(az) * Math.cos(el) * d, 12 + Math.sin(el) * d, B[1] + Math.cos(az) * Math.cos(el) * d), new V(B[0] - 10, 12, B[1])); }, [az, el, B]);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `rv/stk-${t}-${tag}.png`, clip: { x: 0, y: 70, width: 1040, height: 780 } });
    }
    console.log(t, await page.evaluate(() => { const s = [...__lab.comps.values()].find(c => __lab.TYPES[c.type].shield); return 'stack=' + s.stack + ' y=' + s.group.position.y.toFixed(2); }));
  }
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await browser.close();
})();
