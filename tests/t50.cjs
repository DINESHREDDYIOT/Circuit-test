const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
const types = process.argv[2].split(','); const tag = process.argv[3] || 'a';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html'); await page.waitForFunction(() => window.__lab, null, { timeout: 90000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(800);
  await page.addStyleTag({ content: '#empty,#hint,.hint,#tip,.views,#status,.status,#toast{display:none!important}' });
  for (const t of types) {
    const r = await page.evaluate((t) => {
      for (const c of [...__lab.comps.values()]) __lab.removeComp(c);
      const c = __lab.createComp(t, 0, 0, 0, {}); c.group.updateMatrixWorld(true);
      let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; const V = c.group.position.constructor;
      c.group.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !o.userData.noPick && o.geometry && o.material && o.material.visible !== false) { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) { const v = new V(x, y, z).applyMatrix4(o.matrixWorld); mn = [Math.min(mn[0], v.x), Math.min(mn[1], v.y), Math.min(mn[2], v.z)]; mx = [Math.max(mx[0], v.x), Math.max(mx[1], v.y), Math.max(mx[2], v.z)]; } } });
      return { mn, mx };
    }, t);
    const cx = (r.mn[0] + r.mx[0]) / 2, cy = (r.mn[1] + r.mx[1]) / 2, cz = (r.mn[2] + r.mx[2]) / 2, s = Math.max(r.mx[0] - r.mn[0], r.mx[1] - r.mn[1], r.mx[2] - r.mn[2]);
    const angles = process.argv[4] ? JSON.parse(process.argv[4]) : [[0.55, 0.55], [-2.3, 0.5], [0.0, 1.4]];
    for (let i = 0; i < angles.length; i++) {
      const [az, el] = angles[i], d = s * 2.0 + 30;
      await page.evaluate(([cx, cy, cz, az, el, d]) => { const V = __lab.camera.position.constructor; __lab.flyTo(new V(cx + Math.sin(az) * Math.cos(el) * d, cy + Math.sin(el) * d, cz + Math.cos(az) * Math.cos(el) * d), new V(cx, cy, cz), 1); }, [cx, cy, cz, az, el, d]);
      await page.waitForTimeout(650);
      await page.screenshot({ path: `rv/${tag}-${t}-${i}.png`, clip: { x: 0, y: 70, width: 1040, height: 780 } });
    }
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
