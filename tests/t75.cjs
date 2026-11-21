const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html'); await page.waitForFunction(() => window.__lab, null, { timeout: 90000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(1200);
  await page.addStyleTag({ content: '#hint,.hint,#toast{display:none!important}' });
  const W = (ms) => page.waitForTimeout(ms);
  const get = (t) => page.evaluate((t) => { const c = [...__lab.comps.values()].find(c => c.type === t); return c && { x: +c.x.toFixed(1), z: +c.z.toFixed(1), rot: c.rot, id: c.id }; }, t);
  const scr = (t) => page.evaluate((t) => { const c = [...__lab.comps.values()].find(c => c.type === t); const b = new __lab.TYPES.constructor === Object ? null : null; const p = c.group.position.clone(); p.y += (c.height || 20) * 0.45; p.project(__lab.camera); const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; }, t);
  const run = async () => { await page.click('#btnRun'); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 30000 }); await W(1500); };
  const stop = async () => { if (await page.evaluate(() => __lab.run.state !== 'stopped')) await page.click('#btnRun'); await W(400); };
  const status = () => page.evaluate(() => { const s = document.getElementById('status'); return s.hidden ? 'hidden' : s.textContent.trim().slice(0, 60); });
  const light = () => page.evaluate(() => Math.round([...__lab.comps.values()].find(c => c.type === 'ldr').props.light));

  // 1 + 2: night light — status card gone, torch → lamp keeps the side and lights the sensor
  await page.evaluate(() => __lab.loadExample(1)); await W(1200);
  console.log('status before run:', await status());
  await run();
  console.log('status running:', await status());
  console.log('torch', await get('torch'), 'light', await light());
  await page.evaluate(() => { const t = [...__lab.comps.values()].find(c => c.type === 'torch'); __lab.select({ kind: 'comp', id: t.id }); }); await W(300);
  await page.selectOption('select[data-propkind]', 'lamp'); await W(1500);
  const ldr = await get('ldr');
  console.log('ldr', ldr, 'lamp', await get('lamp'), 'light', await light());
  await page.evaluate(() => __lab.select(null)); await page.click('[data-view="fit"]'); await W(1200); await page.screenshot({ path: 'rv/s-lamp.png' });
  // turn the lamp to face away → the sensor must go dark
  await page.evaluate(() => { const l = [...__lab.comps.values()].find(c => c.type === 'lamp'); l.rot = (l.rot + 2) % 4; l.group.rotation.y = -l.rot * Math.PI / 2; l.group.updateMatrixWorld(true); }); await W(1200);
  console.log('lamp turned away → light', await light());
  await stop();

  // 3: parking — car faces the sensor, click-carry slides only along the line
  await page.evaluate(() => __lab.loadExample(4)); await W(1200); await run();
  const us = await get('ultrasonic'), car0 = await get('obstacle');
  console.log('ultrasonic', us, 'car', car0, 'faces sensor?', car0.rot === (us.rot + 2) % 4);
  await page.evaluate(() => __lab.select(null)); await page.click('[data-view="fit"]'); await W(1200);
  let [cx, cy] = await scr('obstacle');
  await page.mouse.move(cx, cy); await W(300); await page.mouse.down(); await page.mouse.up(); await W(400);
  console.log('carrying after one click?', await page.evaluate(() => !!document.querySelector('#tip') && document.querySelector('#tip').textContent));
  await page.mouse.move(cx - 120, cy + 90, { steps: 8 }); await W(500);
  const car1 = await get('obstacle'); console.log('car moved (no button held) →', car1);
  await page.mouse.down(); await page.mouse.up(); await W(600);
  await page.mouse.move(cx + 200, cy - 100, { steps: 6 }); await W(400);
  console.log('after 2nd click, mouse moved away → car stays', await get('obstacle'), '| toolbar shown', await page.evaluate(() => !document.getElementById('seltools').hidden));
  await W(1500); await page.screenshot({ path: 'rv/s-sonar.png' });
  await stop();

  // 4: motion alarm — person far: moving does nothing; inside the area: detected
  await page.evaluate(() => __lab.loadExample(3)); await W(1200); await run();
  const pir = await get('pir'); console.log('pir', pir, 'person', await get('person'));
  const motion = () => page.evaluate(() => { const c = [...__lab.comps.values()].find(c => c.type === 'pir'); return performance.now() < c.state.until; });
  // wiggle the person far away (outside range)
  await page.evaluate(() => { const p = [...__lab.comps.values()].find(c => c.type === 'person'); p.state.wig = setInterval(() => { p.x += (Math.random() - 0.5) * 6; p.group.position.x = p.x; }, 30); });
  await W(2000); console.log('far + moving → motion?', await motion());
  await page.evaluate(() => { const p = [...__lab.comps.values()].find(c => c.type === 'person'); clearInterval(p.state.wig); });
  await page.evaluate(() => { const p = [...__lab.comps.values()].find(c => c.type === 'person'); __lab.startWalk(p); }); await W(2600);
  console.log('walked in → motion?', await motion(), 'person', await get('person'));
  await page.evaluate(() => __lab.select(null)); await page.click('[data-view="fit"]'); await W(1200); await page.screenshot({ path: 'rv/s-pir.png' });
  await stop();

  // 5: plant — click the can once: it waters; click again: back down
  await page.evaluate(() => __lab.loadExample(5)); await W(1200); await run();
  await page.evaluate(() => __lab.select(null)); await page.click('[data-view="fit"]'); await W(1200);
  [cx, cy] = await scr('can');
  await page.mouse.move(cx, cy); await W(300); await page.mouse.down(); await page.mouse.up(); await W(1800);
  const lifted = () => page.evaluate(() => { const c = [...__lab.comps.values()].find(c => c.type === 'can'); return { lift: !!c.state.lift, pour: +c.pourK.toFixed(2) }; });
  console.log('can after one click', await lifted());
  await page.mouse.move(cx + 40, cy + 20, { steps: 5 }); await W(800); await page.screenshot({ path: 'rv/s-can.png' });
  await page.mouse.down(); await page.mouse.up(); await W(1500);
  console.log('can after 2nd click', await lifted());
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await browser.close();
})();
