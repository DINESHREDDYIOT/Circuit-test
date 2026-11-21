const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  const run = async (i) => { await page.evaluate((i) => __lab.loadExample(i), i); await page.waitForTimeout(1500); await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 300000 }); await page.waitForTimeout(3000); };
  const stop = () => page.evaluate(() => document.getElementById('btnRun').click());
  const setTrim = (type, key, v) => page.evaluate(([type, key, v]) => { const c = [...__lab.comps.values()].find((o) => o.type === type); c.props.trim = c.props.trim || {}; c.props.trim[key] = v; __lab.markDirty(); }, [type, key, v]);
  const sens = (type, f) => page.evaluate(([type, f]) => { const c = [...__lab.comps.values()].find((o) => o.type === type); return new Function('c', 'return ' + f)(c); }, [type, f]);
  // LDR: Night light (D9 LED on when DO is HIGH = dark)
  await run(1);
  const L = await sens('ldr', 'c.props.light');
  await setTrim('ldr', 'dark', Math.max(5, L - 10)); await page.waitForTimeout(1500);
  const a = await sens('ldr', '[c.state.dark]'), la = await page.evaluate(() => [...__lab.comps.values()].find((o) => o.type === 'led').glow.toFixed(2));
  await setTrim('ldr', 'dark', Math.min(80, L + 10)); await page.waitForTimeout(1500);
  const b = await sens('ldr', '[c.state.dark]'), lb = await page.evaluate(() => [...__lab.comps.values()].find((o) => o.type === 'led').glow.toFixed(2));
  console.log(`LDR light ${L.toFixed(0)}%: threshold below it → dark=${a} LED ${la} | threshold above it → dark=${b} LED ${lb}`);
  await stop(); await page.waitForTimeout(800);
  // Rain alarm: wet plate; full sensitivity vs none
  await run(12); await page.waitForTimeout(5000);
  const w = await sens('rain', 'c.state.wet');
  await setTrim('rain', 'sens', 100); await page.waitForTimeout(1200); const r1 = await sens('rain', '[c.state.isWet, c.state.wet.toFixed(2)]');
  await setTrim('rain', 'sens', 0); await page.waitForTimeout(1200); const r0 = await sens('rain', '[c.state.isWet, c.state.wet.toFixed(2)]');
  console.log(`Rain wet ${w.toFixed(2)}: sensitivity 100% → isWet ${r1} | 0% → isWet ${r0}`);
  await stop(); await page.waitForTimeout(800);
  // PIR: Motion alarm, walk the person up, compare how long OUT stays HIGH
  for (const d of [5, 40]) {
    await run(3); await setTrim('pir', 'delay', d);
    await page.evaluate(() => { const c = [...__lab.comps.values()].find((o) => o.type === 'pir'); __lab.select({ kind: 'comp', id: c.id }); document.querySelector('#seltools [data-act="walk"]')?.click(); });
    await page.waitForTimeout(9000);
    const left = await sens('pir', '((c.state.until - performance.now()) / 1000).toFixed(1)');
    console.log(`PIR delay ${d} s → OUT stays HIGH for another ${left} s after the last movement seen`);
    await stop(); await page.waitForTimeout(800);
  }
  // PIR range: radius used for detection
  console.log('PIR radius at 3 m / 7 m (scene mm):', await page.evaluate(() => [230 * 3 / 5, 230 * 7 / 5].map((v) => v.toFixed(0)).join(' / ')));
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
