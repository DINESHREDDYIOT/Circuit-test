const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 }); await page.waitForFunction(() => window.__lab, null, { timeout: 600000 });
  await page.addStyleTag({ content: '#empty,#seltools,.views,.rail,.tags,header{display:none!important}' });
  await page.evaluate(() => document.getElementById('partsToggle').click()); await page.waitForTimeout(800);
  const shots = [
    ['l293d', [8, 42, 52], [8, 0, 22], null],
    ['sshield', [8, 42, 52], [8, 0, 22], null],
    ['l293d', [-6, 42, -16], [-6, 0, -24], null],
    ['sshield', [-6, 42, -16], [-6, 0, -24], null],
  ];
  let k = 0;
  for (const [t, cp, tp, props] of shots) {
    await page.evaluate(([t, cp, tp, props]) => { for (const c of [...__lab.comps.values()]) __lab.removeComp(c); const c = __lab.createComp(t, 0, 0); if (props) Object.assign(c.props, props); const p = c.group.position, V = p.constructor; __lab.flyTo(new V(p.x + cp[0], p.y + cp[1], p.z + cp[2]), new V(p.x + tp[0], p.y + tp[1], p.z + tp[2]), 1); }, [t, cp, tp, props]);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `rv/det-${k++}.png`, clip: { x: 300, y: 60, width: 900, height: 600 }, timeout: 300000 });
  }
  console.log('errs', errs.slice(0, 3)); await browser.close();
})();
