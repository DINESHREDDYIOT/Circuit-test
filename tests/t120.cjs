const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 820 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.evaluate(() => { localStorage.clear(); document.getElementById('partsToggle').click(); }); await page.addStyleTag({ content: '#empty{display:none!important}' }); await page.waitForTimeout(1500);
  const knobXY = (i) => page.evaluate((i) => { const c = [...__lab.comps.values()].find((o) => o.trimKnobs); const k = c.trimKnobs[i].knob; k.updateWorldMatrix(true, false); const p = k.localToWorld(new k.position.constructor(0, 0.3, 0)).project(__lab.camera); const r = document.querySelector('.stage canvas').getBoundingClientRect(); return [r.left + (p.x * 0.5 + 0.5) * r.width, r.top + (-p.y * 0.5 + 0.5) * r.height]; }, i);
  const sdXY = () => page.evaluate(() => { const g = __lab.sd.group, ax = new g.position.constructor(0, 1, 0).applyQuaternion(g.quaternion); const p = g.position.clone().addScaledVector(ax, 30).project(__lab.camera); const r = document.querySelector('.stage canvas').getBoundingClientRect(); return [r.left + (p.x * 0.5 + 0.5) * r.width, r.top + (-p.y * 0.5 + 0.5) * r.height]; });
  const val = () => page.evaluate(() => { const c = [...__lab.comps.values()].find((o) => o.trimKnobs); return JSON.stringify(c.props.trim || {}); });
  const chip = () => page.evaluate(() => { const ch = document.querySelector('.screw-chip'); return ch && !ch.hidden ? ch.innerText.replace(/\n/g, ' | ') : 'hidden'; });
  for (const [type, i, view] of [['ir', 0, [40, 70, 75]], ['ldr', 0, [40, 70, 75]], ['rain', 0, [-10, 110, 110]], ['pir', 0, [30, 75, 95]], ['pir', 1, [30, 75, 95]]]) {
    await page.evaluate(([type, view]) => { for (const c of [...__lab.comps.values()]) __lab.removeComp(c); const c = __lab.createComp(type, 0, 0); const p = c.group.position, V = p.constructor; __lab.flyTo(new V(p.x + view[0], p.y + view[1], p.z + view[2]), new V(p.x + (type === 'rain' ? -25 : 0), p.y + 4, p.z), 1); }, [type, view]);
    await page.waitForTimeout(1800);
    // PIR screws are underneath: use the toolbar button (it tips the board up), others: click the screw itself
    if (type === 'pir') { await page.evaluate((i) => { const c = [...__lab.comps.values()][0]; __lab.select({ kind: 'comp', id: c.id }); document.querySelector(`#seltools [data-trim="${i}"]`).click(); }, i); await page.waitForTimeout(2200); }
    else { const [x, y] = await knobXY(i); await page.mouse.click(x, y); await page.waitForTimeout(1500); }
    const before = await val(), c1 = await chip();
    // drag the screwdriver to the right (clockwise)
    await page.waitForTimeout(1500); const [x, y] = await knobXY(i);
    await page.mouse.move(x, y); await page.mouse.down(); for (let k = 1; k <= 10; k++) await page.mouse.move(x + k * 16, y); await page.mouse.up();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `rv/sd-${type}${i}.png`, timeout: 300000 });
    const after = await val(), c2 = await chip();
    // click again: put the screwdriver away
    const [x2, y2] = await knobXY(i); await page.mouse.click(x2, y2); await page.waitForTimeout(1500);
    console.log(type, i, '| chip:', c1, '| before', before, 'after', after, '| chip after turn:', c2, '| after release:', await chip());
  }
  console.log('errs', errs.slice(0, 4)); await browser.close();
})();
