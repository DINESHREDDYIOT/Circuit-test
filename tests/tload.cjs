const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'] });
  const page = await browser.newPage();
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  page.on('pageerror', e => console.log('ERR', e.message, (e.stack || '').split('\n')[1]));
  await page.goto('http://localhost:8765/test.html', { waitUntil: 'commit', timeout: 300000 });
  for (let i = 0; i < 30; i++) { await new Promise(r => setTimeout(r, 3000)); const st = await page.evaluate(() => [document.readyState, !!window.__lab]).catch(() => 'busy'); if (Array.isArray(st) && st[1]) { console.log('loaded after', (i + 1) * 3, 's'); break; } }
  await browser.close();
})();
