const { chromium } = require('/Users/roboticschools/Desktop/rbs-hub/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  page.on('pageerror', e => console.log('ERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('404') && !m.text().includes('GPU stall')) console.log('console', m.text().slice(0, 300)); });
  await page.goto('http://localhost:8765/test.html'); await page.waitForTimeout(30000);
  console.log('lab?', await page.evaluate(() => !!window.__lab), 'thumbs', await page.evaluate(() => window.__lab ? Object.keys(__lab.thumbs).length : 0));
  await page.screenshot({ path: 'rv/lib.png' });
  await browser.close();
})();
