const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html'); await page.waitForFunction(() => window.__lab, null, { timeout: 90000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(1200);
  const W = (ms) => page.waitForTimeout(ms);
  const E = (f, a) => page.evaluate(f, a);
  const find = (t) => `[...__lab.comps.values()].find(c => c.type === '${t}')`;
  const ser = () => page.$eval('#serialOut', e => e.textContent.trim().split('\n').slice(-1)[0]);
  const run = async (i) => { await E((i) => __lab.loadExample(i), i); await W(1500); await page.click('#btnRun'); await page.waitForFunction(() => __lab.run.state === 'running', null, { timeout: 40000 }); await W(900); };
  const stop = async () => { if (await E(() => __lab.run.state !== 'stopped')) await page.click('#btnRun'); await W(400); };
  const err = () => page.$eval('#err', e => e.hidden ? '' : e.textContent);
  const go = (i) => !only || only.includes(i);
  if (go(6)) { await run(6); console.log('traffic: green mA', await E(`(() => { const c = ${find('traffic')}; return +(__lab.solve().I.get(c.id + ':G') * 1000).toFixed(1); })()`), 'err', await err()); await stop(); }
  if (go(7)) { await run(7);
    await E(`${find('pot')}.props.pos = 100`); await E(() => { window.__d = 1; }); await page.evaluate(() => { __lab.markDirty && __lab.markDirty(); }); await W(1500);
    const a1 = await E(`Math.round(${find('servo')}.angle)`);
    await E(`${find('pot')}.props.pos = 0`); await page.evaluate(() => __lab.markDirty && __lab.markDirty()); await W(1500);
    console.log('servo: knob 100% →', a1, '° | knob 0% →', await E(`Math.round(${find('servo')}.angle)`), '° | err', await err()); await stop(); }
  if (go(8)) { await run(8); await W(1500);
    console.log('weather: LCD', JSON.stringify(await E(`${find('lcd')}.lcdText.map(r => r.join(''))`)));
    await W(4000); console.log('weather: after heater', JSON.stringify(await E(`${find('lcd')}.lcdText.map(r => r.join(''))`)), 'err', await err()); await stop(); }
  if (go(9)) { await run(9); await W(800); console.log('rainbow: lit', await E(`${find('strip')}.state.lit`), 'err', await err()); await page.screenshot({ path: 'rv/x-rainbow.png' }); await stop(); }
  if (go(10)) { await run(10); await W(800);
    const l1 = await E(`${find('matrix')}.litCount`);
    await E(`(() => { const j = ${find('joystick')}; j.props.x = 100; j.props.y = 0; })()`); await page.evaluate(() => __lab.markDirty && __lab.markDirty()); await W(1000);
    const l2 = await E(`(() => { const m = ${find('matrix')}; return m.mxSig; })()`);
    await E(`${find('joystick')}.state.pressed = true`); await page.evaluate(() => __lab.markDirty && __lab.markDirty()); await W(1000);
    console.log('joystick: lit', l1, '| moved rows', l2, '| pressed lit', await E(`${find('matrix')}.litCount`), 'err', await err());
    await E(`${find('joystick')}.state.pressed = false`); await stop(); }
  if (go(11)) { await run(11); await W(4000);
    console.log('gas: smoke', await E(`Math.round(${find('mq2')}.state.gas * 100)`), '% freq', await E(`${find('pbuzzer')}.state.freq`), '| serial', await ser());
    await E(`${find('candle')}.props.on = false`); await W(9000);
    console.log('gas: candle out → smoke', await E(`Math.round(${find('mq2')}.state.gas * 100)`), '% freq', await E(`${find('pbuzzer')}.state.freq`), 'err', await err()); await stop(); }
  if (go(12)) { await run(12); await W(5000);
    console.log('rain: wet', await E(`Math.round(${find('rain')}.state.wet * 100)`), '% D13', await E(() => __lab.pins.level[13]), '| serial', await ser(), 'err', await err()); await stop(); }
  if (go(13)) { await run(13); await W(600);
    for (const k of ['5', '7', 'A']) {
      await E((k) => { const c = [...__lab.comps.values()].find(c => c.type === 'keypad'); const KP = 16.2, row = ['123A', '456B', '789C', '*0#D'].findIndex(r => r.includes(k)), col = ['123A', '456B', '789C', '*0#D'][row].indexOf(k); c.state.hitPoint = c.group.localToWorld(new c.group.position.constructor((col - 1.5) * KP, 2, 6 + (row - 1.5) * KP)); c.state.pressed = true; }, k);
      await W(300); await E(`${find('keypad')}.state.pressed = false`); await W(400);
    }
    console.log('keypad: LCD', JSON.stringify(await E(`${find('lcd')}.lcdText.map(r => r.join(''))`)), 'err', await err()); await stop(); }
  if (go(14)) { await run(14); await E(`(() => { const m = ${find('mpu')}; m.props.tiltX = 30; m.props.tiltY = -15; })()`); await W(1500);
    console.log('tilt: serial', await ser(), 'err', await err()); await stop(); }
  if (go(15)) { await run(15); await W(1500);
    const m0 = await E(`Math.round(${find('soil')}.props.moisture)`), on0 = await E(`${find('pump')}.state.on`);
    await W(6000);
    console.log('pump: start moisture', m0, 'pump on', on0, '| later moisture', await E(`Math.round(${find('soil')}.props.moisture)`), 'pump on', await E(`${find('pump')}.state.on`), '| serial', await ser(), 'err', await err());
    await page.screenshot({ path: 'rv/x-pump.png' }); await stop(); }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
