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

await page.waitForTimeout(5000);

// Esegui codice nel browser per ispezionare il globo via __globeEl
const globeDebug = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { error: 'No canvas' };

  // Cerca il globo nella scena WebGL via proprietà react fiber
  const fiberKey = Object.keys(canvas).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternals'));

  // Cerca _reactFiber o simile nella scena container
  const containers = document.querySelectorAll('.scene-container');

  // Prova ad accedere via __threeObj
  let found = null;
  const traverse = (el, depth = 0) => {
    if (depth > 10) return;
    const keys = Object.keys(el);
    const fk = keys.find(k => k.startsWith('__react'));
    if (fk) {
      found = { depth, elTag: el.tagName, fiberKey: fk };
    }
    for (const child of el.children) {
      traverse(child, depth + 1);
    }
  };
  traverse(document.body);

  // Cerca direttamente il THREE.WebGLRenderer nella finestra
  const globeEl = document.querySelector('[data-engine]');
  const engineAttr = globeEl?.getAttribute('data-engine');

  return {
    found,
    engineAttr,
    containerCount: containers.length,
    canvasData: canvas.dataset,
    canvasAttr: canvas.getAttribute('data-engine'),
  };
});

console.log('Globe debug:', JSON.stringify(globeDebug, null, 2));

// Prova a trovare il globo tramite __globeEl o simile
const materialInfo = await page.evaluate(() => {
  // Cerca il renderer tramite data-engine attribute
  const canvas = document.querySelector('canvas[data-engine]');
  if (!canvas) return { error: 'No WebGL canvas found' };

  // Accedi all'istanza WebGL
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  // Campiona pixel in varie posizioni per capire se il bianco è uniforme
  const samples = [];
  const width = canvas.width;
  const height = canvas.height;

  // Forza un campionamento in 9 punti
  // (non funzionerà senza preserveDrawingBuffer, ma proviamo)
  const pixels = new Uint8Array(4);
  const checkPoints = [
    { x: width/2, y: height/2 },       // centro
    { x: width*0.3, y: height*0.5 },    // bordo sinistro
    { x: width*0.7, y: height*0.5 },    // bordo destro
  ];

  checkPoints.forEach(({ x, y }) => {
    gl.readPixels(Math.floor(x), Math.floor(y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    samples.push({ x: Math.floor(x), y: Math.floor(y), r: pixels[0], g: pixels[1], b: pixels[2], a: pixels[3] });
  });

  return { samples, width, height };
});

console.log('Material/pixel info:', JSON.stringify(materialInfo, null, 2));

// Screenshot finale
await page.screenshot({ path: '/tmp/globe-verify2.png' });
console.log('Screenshot saved to /tmp/globe-verify2.png');

console.log('\nAll logs (filtered):');
allLogs.filter(l => !l.includes('[info]') || l.includes('Globe') || l.includes('THREE') || l.includes('material')).forEach(l => console.log(' ', l));

await browser.close();
