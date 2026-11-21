const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
const types = process.argv[2].split(','), tag = process.argv[3] || 'c', k = Number(process.argv[4] || 1.1);
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort()); await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 }); await page.addStyleTag({ content: '#empty,#seltools,.views,.rail{display:none!important}' }); await page.evaluate(() => document.getElementById('partsToggle').click());
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(800);
  await page.addStyleTag({ content: '#empty,#hint,.hint,#tip,.views,#status,.status,#toast,header,aside,.side,#side,#panel{display:none!important}' });
  for (const t of types) {
    await page.evaluate(([t, k]) => { for (const c of [...__lab.comps.values()]) __lab.removeComp(c); const c = __lab.createComp(t, 0, 0, 0, {}); const b = new c.group.position.constructor(); const box = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }; c.group.updateMatrixWorld(true);
      c.group.traverse(o => { if (o.isMesh && !o.userData.noPick && o.geometry) { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); for (let i = 0; i < 3; i++) { const a = ['x', 'y', 'z'][i]; box.min[i] = Math.min(box.min[i], bb.min[a]); box.max[i] = Math.max(box.max[i], bb.max[a]); } } });
      const cx = (box.min[0] + box.max[0]) / 2, cy = (box.min[1] + box.max[1]) / 2, cz = (box.min[2] + box.max[2]) / 2, s = Math.max(box.max[0] - box.min[0], box.max[2] - box.min[2]) * k + 20; const V = c.group.position.constructor;
      __lab.flyTo(new V(cx + s * 0.55, cy + s * 0.75, cz + s * 0.85), new V(cx, cy, cz), 1); }, [t, k]);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `rv/${tag}-${t}.png`, timeout: 300000 });
  }
  await browser.close();
})();
