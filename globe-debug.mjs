import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleLogs = [];
page.on('console', (msg) => {
  consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => {
  consoleLogs.push('PAGE ERROR: ' + err.message);
});

await page.goto('http://localhost:3027/', { waitUntil: 'networkidle', timeout: 30000 });

const enterBtn = page.locator('text=[ enter ]').first();
if (await enterBtn.count() > 0) {
  await enterBtn.click();
}

await page.waitForTimeout(5000);

// Debug: analizza la struttura HTML e CSS del canvas
const debug = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { error: 'No canvas found' };

  const rect = canvas.getBoundingClientRect();
  const style = window.getComputedStyle(canvas);

  // Guarda il backgroundColor del canvas container
  const parent = canvas.parentElement;
  const parentStyle = window.getComputedStyle(parent);
  const grandparent = parent?.parentElement;
  const grandparentStyle = grandparent ? window.getComputedStyle(grandparent) : null;

  return {
    canvas: {
      width: canvas.width,
      height: canvas.height,
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      bgColor: style.backgroundColor,
      opacity: style.opacity,
    },
    parent: {
      tagName: parent?.tagName,
      bgColor: parentStyle.backgroundColor,
      className: parent?.className,
    },
    grandparent: {
      tagName: grandparent?.tagName,
      bgColor: grandparentStyle?.backgroundColor,
      className: grandparent?.className,
    },
    // Controlla se c'è qualcos'altro sopra
    bodyBg: window.getComputedStyle(document.body).backgroundColor,
  };
});

console.log('DOM debug:', JSON.stringify(debug, null, 2));

// Cerca il globeRef e il material
const materialDebug = await page.evaluate(() => {
  // Cerca tutti i canvas sulla pagina
  const canvases = document.querySelectorAll('canvas');
  const results = [];
  canvases.forEach((c, i) => {
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    results.push({
      index: i,
      width: c.width,
      height: c.height,
      hasWebGL: !!gl,
      bgColor: window.getComputedStyle(c).backgroundColor,
    });
  });
  return results;
});

console.log('Canvases:', JSON.stringify(materialDebug, null, 2));

// Screenshot con highlight del canvas
await page.screenshot({ path: '/tmp/globe-debug.png', fullPage: false });

const allLogs = consoleLogs.filter(l => !l.includes('[log]') || l.toLowerCase().includes('error') || l.toLowerCase().includes('warn'));
if (allLogs.length > 0) {
  console.log('\nAll relevant logs:');
  allLogs.forEach(l => console.log(' ', l));
}

await browser.close();
