// close-up renders of parts: node t130.cjs type1,type2 tag [views: "az,el;az,el"]
const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
const types = process.argv[2].split(','), tag = process.argv[3] || 'r', views = (process.argv[4] || '0.6,0.75').split(';').map((v) => v.split(',').map(Number));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.addStyleTag({ content: '#empty,#seltools,.views,.rail,.tags,header{display:none!important}' });
  await page.evaluate(() => { localStorage.clear(); document.getElementById('partsToggle').click(); }); await page.waitForTimeout(1200);
  for (const t of types) for (let vi = 0; vi < views.length; vi++) {
    const [az, el] = views[vi];
    await page.evaluate(([t, az, el]) => {
      for (const c of [...__lab.comps.values()]) __lab.removeComp(c);
      const c = __lab.createComp(t, 0, 0); c.group.updateMatrixWorld(true);
      const V = c.group.position.constructor; let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      c.group.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && !o.userData.noPick && o.geometry) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const v = new V(x, y, z).applyMatrix4(o.matrixWorld); mn = [Math.min(mn[0], v.x), Math.min(mn[1], v.y), Math.min(mn[2], v.z)]; mx = [Math.max(mx[0], v.x), Math.max(mx[1], v.y), Math.max(mx[2], v.z)]; } } });
      const ctr = new V((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2), s = Math.max(mx[0] - mn[0], mx[2] - mn[2], mx[1] - mn[1]) * 1.25 + 18;
      __lab.flyTo(new V(ctr.x + s * Math.sin(az) * Math.cos(el), ctr.y + s * Math.sin(el), ctr.z + s * Math.cos(az) * Math.cos(el)), ctr, 1);
    }, [t, az, el]);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `rv/${tag}-${t}-${vi}.png`, clip: { x: 0, y: 60, width: 1100, height: 700 }, timeout: 300000 });
  }
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
