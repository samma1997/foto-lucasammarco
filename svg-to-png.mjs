import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const IN = "/Users/mac/Downloads/foto-world-texture-medium 1.svg";
const OUT = "/Users/mac/Projects/foto-lucasammarco/public/world-texture.png";
const W = 4096;
const H = 2048;

const svg = fs.readFileSync(IN, "utf8");
const html = `<!DOCTYPE html><html><head><style>
body,html{margin:0;padding:0;background:#000;}
svg{display:block;width:${W}px;height:${H}px;}
</style></head><body>${svg}</body></html>`;

const tmpHtml = "/tmp/svg-render.html";
fs.writeFileSync(tmpHtml, html);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.goto("file://" + tmpHtml);
await page.waitForTimeout(500);
await page.screenshot({ path: OUT, omitBackground: false, fullPage: false, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

const sizeKb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`PNG saved: ${OUT} (${sizeKb} KB)`);
