const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
const tag = process.argv[2] || 'led', env = process.argv[3] || 'rbs';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 860 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__lab, null, { timeout: 90000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(800);
  await page.addStyleTag({ content: '#empty,#hint,.hint,#tip,#toast{display:none!important}' });
  if (env === 'lab') await page.evaluate(() => window.setEnv && setEnv('lab'));
  await page.evaluate(() => { for (const c of [...__lab.comps.values()]) __lab.removeComp(c);
    const b = __lab.createComp('breadboard', 0, 0); const cols = ['red', 'yellow', 'green', 'blue', 'white'];
    cols.forEach((k, i) => { const l = __lab.createComp('led', 0, 0, 0, { color: k }); __lab.placeOnHoles(l, b, 'A', 'e' + (6 + i * 5));
      if (i % 2 === 0) { const T = __lab.TYPES.led; l.tick = null; l.__force = true; } });
    window.__force = true; });
  await page.evaluate(() => { const T = __lab.TYPES.led, orig = T.tick; T.tick = function (c, dt) { orig.call(this, c, dt); const i = ['red','yellow','green','blue','white'].indexOf(c.props.color); if (i % 2 === 0) { if (__lab.ledLook) { c.glow = 1; __lab.ledLook(c, 1); } else { c.glow = 1; c.mat.emissiveIntensity = c.props.color === 'white' ? 1.2 : 2.1; c.die.emissiveIntensity = 9; c.halo.material.opacity = 0.95; c.halo.scale.setScalar(28); c.pool.material.opacity = 0.55; } } }; });
  await page.waitForTimeout(600);
  const shots = [[[0, 70, 75], 'wide'], [[0, 18, 34], 'close']];
  for (const [p, n] of shots) { await page.evaluate(([p, n]) => { const ls = [...__lab.comps.values()].filter(o => o.type === 'led'); const V = ls[0].group.position.constructor; const A = ls[0].group.position, B = ls[ls.length - 1].group.position; const t = n === 'wide' ? A.clone().lerp(B, 0.5) : ls[1].group.position.clone(); t.y += 6; __lab.flyTo(new V(t.x + p[0], t.y + p[1], t.z + p[2]), t, 1); }, [p, n]); await page.waitForTimeout(1500); await page.screenshot({ path: `rv/${tag}-${n}.png`, clip: { x: 0, y: 60, width: 900, height: 800 } }); }
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
