const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push('console: ' + m.text()); });
  await page.goto('http://localhost:8765/test.html');
  await page.waitForFunction(() => window.__lab, null, { timeout: 90000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(1500);
  const W = (ms) => page.waitForTimeout(ms);
  const props = () => page.evaluate(() => [...__lab.comps.values()].filter(c => __lab.TYPES[c.type].prop).map(c => c.type + (c.props.kind ? ':' + c.props.kind : '')).join(',') || 'none');
  const find = (t, f = '') => page.evaluate(([t, f]) => { const c = [...__lab.comps.values()].find(c => c.type === t); return f ? eval(f) : c && c.id; }, [t, f]);
  const ledI = () => page.evaluate(() => { const c = [...__lab.comps.values()].find(c => c.type === 'led'); return +((__lab.solve().I.get(c.id + ':D') || 0) * 1000).toFixed(1); });
  const run = async () => { await page.click('#btnRun'); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 30000 }); await W(900); };
  const stop = async () => { if (await page.evaluate(() => __lab.run.state !== 'stopped')) await page.click('#btnRun'); await W(400); };
  // Night light
  await page.evaluate(() => __lab.loadExample(1)); await W(1500);
  console.log('night: before Start props =', await props());
  await run();
  console.log('night: after Start props =', await props(), '| light', await find('ldr', 'Math.round(c.props.light)'), '% LED', await ledI(), 'mA');
  await page.evaluate(() => { const t = [...__lab.comps.values()].find(c => c.type === 'torch'); t.props.on = false; }); await W(1500);
  console.log('night: torch off → light', await find('ldr', 'Math.round(c.props.light)'), '% LED', await ledI(), 'mA');
  // pick the lamp from the LDR's drop-down while running
  const before = await page.evaluate(() => { const t = [...__lab.comps.values()].find(c => c.type === 'torch'); t.x -= 20; t.z += 30; t.group.position.x = t.x; t.group.position.z = t.z; __lab.select({ kind: 'comp', id: t.id }); return [t.x.toFixed(1), t.z.toFixed(1), t.rot]; }); await W(400);
  console.log('night: sensor toolbar has picker?', await page.evaluate(() => { const c = [...__lab.comps.values()].find(c => c.type === 'ldr'); __lab.select({ kind: 'comp', id: c.id }); return !!document.querySelector('select[data-propkind]'); }));
  await page.evaluate(() => { const t = [...__lab.comps.values()].find(c => c.type === 'torch'); __lab.select({ kind: 'comp', id: t.id }); }); await W(300);
  await page.selectOption('select[data-propkind]', 'lamp'); await W(1500);
  console.log('night: torch was at', before, '→ lamp at', await page.evaluate(() => { const l = [...__lab.comps.values()].find(c => c.type === 'lamp'); return [l.x.toFixed(1), l.z.toFixed(1), l.rot]; }));
  console.log('night: picked lamp → props =', await props(), '| light', await find('ldr', 'Math.round(c.props.light)'), '% LED', await ledI(), 'mA');
  await page.screenshot({ path: 'rv/t31-night.png' });
  await stop();
  console.log('night: after Stop props =', await props());
  // Parking sensor
  await page.evaluate(() => __lab.loadExample(4)); await W(1500);
  await run(); await W(1200);
  console.log('parking: props =', await props(), '| dist', await find('ultrasonic', 'c.state.dist && Math.round(c.state.dist)'), 'mm | serial', JSON.stringify((await page.$eval('#serialOut', e => e.textContent)).trim().split('\n').slice(-1)[0]));
  await page.evaluate(() => { const s = [...__lab.comps.values()].find(c => c.type === 'ultrasonic'); const car = [...__lab.comps.values()].find(c => c.type === 'obstacle'); const V = s.group.position.constructor, D = new V(1, 0, 0).applyQuaternion(s.group.quaternion); car.x = s.x + D.x * 60; car.z = s.z + D.z * 60; car.group.position.x = car.x; car.group.position.z = car.z; car.group.updateMatrixWorld(true); }); await W(1500);
  console.log('parking: car closer → dist', await find('ultrasonic', 'Math.round(c.state.dist)'), 'mm | serial', JSON.stringify((await page.$eval('#serialOut', e => e.textContent)).trim().split('\n').slice(-1)[0]));
  await stop();
  // Thirsty plant
  await page.evaluate(() => __lab.loadExample(5)); await W(1500);
  await run(); await W(800);
  console.log('plant: props =', await props(), '| dry moisture', await find('soil', 'Math.round(c.props.moisture)'), '% LED', await ledI(), 'mA');
  await page.evaluate(() => { const can = [...__lab.comps.values()].find(c => c.type === 'can'); can.state.pourHold = true; }); await W(4500);
  console.log('plant after pouring: moisture', await find('soil', 'Math.round(c.props.moisture)'), '% LED', await ledI(), 'mA');
  await page.evaluate(() => { const can = [...__lab.comps.values()].find(c => c.type === 'can'); can.state.pourHold = false; });
  await stop();
  // Motion alarm
  await page.evaluate(() => __lab.loadExample(3)); await W(1500);
  await run(); await W(600);
  const rgb = () => page.evaluate(() => { const c = [...__lab.comps.values()].find(c => c.type === 'rgb'); const s = __lab.solve(); return 'R ' + ((s.I.get(c.id + ':R') || 0) * 1000).toFixed(1) + ' G ' + ((s.I.get(c.id + ':G') || 0) * 1000).toFixed(1); });
  console.log('alarm: props =', await props(), '| calm', await rgb());
  await page.evaluate(() => { const p = [...__lab.comps.values()].find(c => c.type === 'person'); __lab.startWalk(p); }); await W(2800);
  console.log('alarm: person walking', await rgb());
  await stop();
  console.log('saved props in storage:', await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('rbs-circuit-lab:v2') || '{}'); return (s.comps || []).filter(c => ['lamp', 'torch', 'obstacle', 'person', 'can'].includes(c.type)).length; }));
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
