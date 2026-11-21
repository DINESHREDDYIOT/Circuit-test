const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 800 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.addStyleTag({ content: '#empty{display:none!important}' });
  await page.evaluate(() => document.getElementById('partsToggle').click()); await page.waitForTimeout(800);
  const scr = (fn) => page.evaluate(fn);
  // Servo knob example: drag the pot knob, the servo should follow
  await page.evaluate(() => __lab.loadExample(7)); await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 300000 }); await page.waitForTimeout(2500);
  await page.evaluate(() => { const c = [...__lab.comps.values()].find((o) => o.type === 'pot'), p = c.group.position, V = p.constructor; __lab.flyTo(new V(p.x + 10, p.y + 70, p.z + 80), new V(p.x - 8, p.y + 6, p.z), 1); });
  await page.waitForTimeout(2000);
  const knob = await page.evaluate(() => { const c = [...__lab.comps.values()].find((o) => o.type === 'pot'), k = c.dialPicks[0]; k.updateWorldMatrix(true, false); const w = k.localToWorld(new k.position.constructor(0, 0, 0)), p = w.project(__lab.camera), r = document.querySelector('.stage canvas').getBoundingClientRect(); return [r.left + (p.x * 0.5 + 0.5) * r.width, r.top + (-p.y * 0.5 + 0.5) * r.height]; });
  const potState = () => page.evaluate(() => { const c = [...__lab.comps.values()].find((o) => o.type === 'pot'), sv = [...__lab.comps.values()].find((o) => o.type === 'servo'); return `knob ${c.props.pos.toFixed(0)}% · servo ${sv.state.angle != null ? sv.state.angle.toFixed(0) : (sv.horn ? (sv.horn.rotation.y * 57.3).toFixed(0) : '?')}°`; });
  console.log('pot before:', await potState());
  await page.mouse.move(knob[0], knob[1]); await page.mouse.down(); for (let i = 1; i <= 10; i++) await page.mouse.move(knob[0] + i * 12, knob[1]); await page.mouse.up(); await page.waitForTimeout(2500);
  console.log('pot after dragging right:', await potState());
  await page.mouse.move(knob[0], knob[1]); await page.mouse.down(); for (let i = 1; i <= 16; i++) await page.mouse.move(knob[0] - i * 12, knob[1]); await page.mouse.up(); await page.waitForTimeout(2500);
  console.log('pot after dragging left:', await potState());
  await page.evaluate(() => document.getElementById('btnRun').click()); await page.waitForTimeout(800);
  // joystick: hold the lever over to the right, read VRx while held, then let go
  await page.evaluate(() => { for (const c of [...__lab.comps.values()]) __lab.removeComp(c); const c = __lab.createComp('joystick', 0, 0), p = c.group.position, V = p.constructor; __lab.flyTo(new V(p.x + 10, p.y + 110, p.z + 90), new V(p.x + 4, p.y + 12, p.z), 1); });
  await page.waitForTimeout(2000);
  const cap = await page.evaluate(() => { const c = [...__lab.comps.values()][0], k = c.dialPicks[0]; k.updateWorldMatrix(true, false); const w = k.localToWorld(new k.position.constructor(0, 6, 0)), p = w.project(__lab.camera), r = document.querySelector('.stage canvas').getBoundingClientRect(); return [r.left + (p.x * 0.5 + 0.5) * r.width, r.top + (-p.y * 0.5 + 0.5) * r.height]; });
  await page.mouse.move(cap[0], cap[1]); await page.mouse.down(); for (let i = 1; i <= 10; i++) await page.mouse.move(cap[0] + i * 9, cap[1] - i * 3); await page.waitForTimeout(800);
  console.log('joystick while held:', await scr(() => { const c = [...__lab.comps.values()][0]; return `x ${c.props.x.toFixed(0)} · y ${c.props.y.toFixed(0)} · tilt ${(c.stick.rotation.z * 57.3).toFixed(0)}°/${(c.stick.rotation.x * 57.3).toFixed(0)}°`; }));
  await page.screenshot({ path: 'rv/joy-held.png', clip: { x: 300, y: 60, width: 900, height: 700 }, timeout: 300000 });
  await page.mouse.up(); await page.waitForTimeout(1200);
  console.log('joystick released:', await scr(() => { const c = [...__lab.comps.values()][0]; return `x ${c.props.x.toFixed(0)} · y ${c.props.y.toFixed(0)}`; }));
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
