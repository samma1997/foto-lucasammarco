import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => {
  consoleErrors.push('PAGE ERROR: ' + err.message);
});

await page.goto('http://localhost:3027/', { waitUntil: 'networkidle', timeout: 30000 });

// Clicca il bottone [ enter ] per passare alla home con il globo
const enterBtn = page.locator('text=[ enter ]').first();
if (await enterBtn.count() > 0) {
  await enterBtn.click();
  console.log('Clicked [ enter ] button');
} else {
  console.log('[ enter ] button not found, looking for alternatives...');
  const allText = await page.locator('button, a').allTextContents();
  console.log('Available clickable elements:', allText.slice(0, 10));
}

// Aspetta che il canvas WebGL sia presente e il globo si carichi
await page.waitForTimeout(5000);

await page.screenshot({ path: '/tmp/globe-verify.png', fullPage: false });
console.log('Screenshot saved to /tmp/globe-verify.png');

if (consoleErrors.length > 0) {
  console.log('\nConsole errors found:');
  consoleErrors.forEach(e => console.log(' -', e));
} else {
  console.log('\nNo console errors');
}

// Analizza i pixel del canvas per verificare che non sia tutto bianco
const canvasColor = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { error: 'No canvas found' };
  const w = canvas.width;
  const h = canvas.height;
  // WebGL canvas — leggi i pixel direttamente
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return { error: 'No WebGL context' };
  const pixels = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  // Campiona pixel centro
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const idx = (cy * w + cx) * 4;
  const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2], a = pixels[idx+3];
  // Conta pixel non bianchi e non trasparenti
  let nonWhite = 0;
  let nonTransparent = 0;
  const step = 4;
  for (let i = 0; i < pixels.length; i += 4 * step) {
    if (pixels[i+3] > 0) {
      nonTransparent++;
      if (pixels[i] < 250 || pixels[i+1] < 250 || pixels[i+2] < 250) {
        nonWhite++;
      }
    }
  }
  return { center: {r,g,b,a}, nonWhite, nonTransparent, w, h };
});

console.log('\nCanvas pixel analysis:', JSON.stringify(canvasColor, null, 2));

await browser.close();
