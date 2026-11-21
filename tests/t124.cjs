const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  const setTrim = (type, key, v) => page.evaluate(([type, key, v]) => { const c = [...__lab.comps.values()].find((o) => o.type === type); c.props.trim = c.props.trim || {}; c.props.trim[key] = v; __lab.markDirty(); }, [type, key, v]);
  // LDR with the lamp switched off
  await page.evaluate(() => __lab.loadExample(1)); await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 300000 }); await page.waitForTimeout(3000);
  await page.evaluate(() => { for (const c of __lab.comps.values()) if (c.props && 'on' in c.props && c.type !== 'ldr') c.props.on = false; __lab.markDirty(); }); await page.waitForTimeout(2500);
  const L = await page.evaluate(() => [...__lab.comps.values()].find((o) => o.type === 'ldr').props.light);
  const probe = () => page.evaluate(() => { const c = [...__lab.comps.values()].find((o) => o.type === 'ldr'), l = [...__lab.comps.values()].find((o) => o.type === 'led'); return `dark=${c.state.dark} LED glow ${l.glow.toFixed(2)}`; });
  await setTrim('ldr', 'dark', 5); await page.waitForTimeout(2500); const a = await probe();
  await setTrim('ldr', 'dark', 80); await page.waitForTimeout(2500); const b = await probe();
  console.log(`LDR light ${L.toFixed(0)}% | turns on below 5% → ${a} | below 80% → ${b}`);
  await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForTimeout(1000);
  // IR: a board, the IR wired up, and the obstacle prop it brings when the simulation starts
  await page.evaluate(() => { for (const c of [...__lab.comps.values()]) __lab.removeComp(c); const a = __lab.createComp('arduino', -80, 40), s = __lab.createComp('ir', 40, -60); __lab.addWire(`${s.id}:VCC`, `${a.id}:5V`, null, false); __lab.addWire(`${s.id}:GND`, `${a.id}:GND2`, null, false); __lab.addWire(`${s.id}:OUT`, `${a.id}:D2`, null, false); });
  await page.waitForTimeout(1000); await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 300000 }); await page.waitForTimeout(3000);
  const irp = () => page.evaluate(() => { const c = [...__lab.comps.values()].find((o) => o.type === 'ir'); return c.state.hit ? `object at ${(c.state.hit.dist / 10).toFixed(1)} cm, OUT ${c.state.detect ? 'LOW (seen)' : 'HIGH'}` : `nothing seen, OUT HIGH`; });
  await setTrim('ir', 'range', 300); await page.waitForTimeout(2000); const r3 = await irp();
  await setTrim('ir', 'range', 20); await page.waitForTimeout(2000); const r0 = await irp();
  console.log(`IR range 30 cm → ${r3} | range 2 cm → ${r0}`);
  console.log('props in scene', await page.evaluate(() => [...__lab.comps.values()].map((c) => c.type).join(',')));
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
