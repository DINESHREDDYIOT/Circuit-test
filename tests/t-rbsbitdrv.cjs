const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
// RBS bit Driver Expansion Board: model, power path, motor outputs, API, part clicks, inspector views
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.addStyleTag({ content: '#empty{display:none!important}' });
  const r = await page.evaluate(async () => {
    const L = __lab, wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), out = {};
    for (const c of [...L.comps.values()]) L.removeComp(c);
    const c = L.createComp('rbsbitdrv', 0, 0), b = L.createComp('arduino', -110, 0), pump = L.createComp('pump', 0, -70);
    out.model = `${c.pins.length} pins · ${c.foot.w.toFixed(1)} × ${c.foot.d.toFixed(1)} × ${c.height.toFixed(1)} mm`;
    L.addWire(`${b.id}:5V`, `${c.id}:VIN+`, '#e2443a', false); L.addWire(`${b.id}:GND2`, `${c.id}:VIN-`, '#2a2730', false);
    L.addWire(`${pump.id}:+`, `${c.id}:1A+`, '#e2443a', false); L.addWire(`${pump.id}:-`, `${c.id}:1A-`, '#2a2730', false);
    c.props.test = 80; L.markDirty(); L.startProgram();
    for (let i = 0; i < 200 && L.run.state !== 'running'; i++) await wait(50); await wait(1500);
    const api = RBSLab.rbsbitDriver.get(c.id);
    out.on = { vin: +c.state.vin.toFixed(2), rail: +api.readPin('P0_V').toFixed(2), led: c.leds.pwr.level > 0.3, pump: !!pump.state.on };
    c.props.on = false; await wait(800); out.off = { vsw: +(c.state.vsw || 0).toFixed(2), led: c.leds.pwr.level > 0.3, pump: !!pump.state.on };
    c.props.on = true; c.props.test = 0; api.setMotor('1A', -0.5); await wait(800); out.reverse = { a: +api.readPin('1A+').toFixed(2), b: +api.readPin('1A-').toFixed(2), pump: !!pump.state.on };
    api.setMotor('1A', null); L.stopProgram(); await wait(300);
    const T = L.TYPES.rbsbitdrv, mesh = (id) => { let o = null; c.rbb.parts[id].traverse((m) => { if (!o && m.isMesh) o = m; }); return o; };
    L.select({ kind: 'comp', id: c.id }); T.clickPart(c, { obj: mesh('U2') }); await wait(200); out.click = { part: c.state.part, label: T.partLabel(c, { obj: mesh('U2') }), tinted: c.rbb.tinted };
    T.clickPart(c, { obj: mesh('SW1') }); out.switchClick = c.props.on;
    document.querySelector('[data-act="rbbInspect"]').click(); await wait(1500);
    out.inspector = { views: [...document.querySelectorAll('.rbbi [data-view]')].map((x) => x.dataset.view).join(' '), parts: document.querySelectorAll('.rbbi-list [data-part]').length };
    document.querySelector('.rbbi [data-view="front"]').click(); await wait(1200);
    document.querySelector('.rbbi-list [data-part="J3"]').click(); await wait(900); out.card = document.querySelector('.rbbi-info h3').textContent;
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  const ok = r.on.vin === 5 && r.on.rail === 3.3 && r.on.led && r.on.pump && !r.off.led && !r.off.pump && r.reverse.b > r.reverse.a && r.reverse.pump && r.click.part === 'U2' && r.switchClick === false && r.inspector.parts === 46 && r.card === 'Motors M1 · M2';
  console.log(ok ? 'PASS' : 'FAIL');
  await page.screenshot({ path: 'rv/rbsbitdrv-inspector.png', timeout: 300000 });
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
