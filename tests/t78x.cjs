const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  await page.goto('http://localhost:8765/test.html'); await page.waitForFunction(() => window.__lab, null, { timeout: 90000 });
  await page.evaluate(() => localStorage.clear()); await page.waitForTimeout(800);
  await page.addStyleTag({ content: '#empty,#hint,.hint,#tip,.views,#status,.status,#toast{display:none!important}' });
  await page.evaluate((T) => { for (const c of [...__lab.comps.values()]) __lab.removeComp(c); const c = __lab.createComp(T, 0, 0, 0, {}); if (c.usbPlug) c.usbPlug.visible = false; c.group.rotation.x = Math.PI; c.group.position.y = 30; c.group.updateMatrixWorld(true); window.__flip = c; }, process.argv[2] || 'arduino');
  await page.waitForTimeout(400);
  await page.evaluate(() => { const c = window.__flip; c.group.rotation.x = Math.PI; c.group.position.y = 30; if (c.usbPlug) c.usbPlug.visible = false; const V = __lab.camera.position.constructor; __lab.flyTo(new V(0, 190, 4), new V(0, 20, 0)); });
  await page.waitForTimeout(900);
  await page.evaluate(() => { const c = window.__flip; c.group.rotation.x = Math.PI; c.group.position.y = 30; });
  await page.screenshot({ path: `rv/underx-${process.argv[2] || 'arduino'}.png`, clip: { x: 0, y: 70, width: 1040, height: 780 } });
  await browser.close();
})();
