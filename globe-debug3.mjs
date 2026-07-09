import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const allLogs = [];
page.on('console', (msg) => {
  allLogs.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => {
  allLogs.push('PAGE ERROR: ' + err.message);
});

await page.goto('http://localhost:3027/', { waitUntil: 'networkidle', timeout: 30000 });

const enterBtn = page.locator('text=[ enter ]').first();
if (await enterBtn.count() > 0) {
  await enterBtn.click();
}

await page.waitForTimeout(6000);

await page.screenshot({ path: '/tmp/globe-verify3.png' });
console.log('Screenshot saved to /tmp/globe-verify3.png');

console.log('\nAll logs:');
allLogs.forEach(l => console.log(' ', l));

await browser.close();
