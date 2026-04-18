import puppeteer from "puppeteer";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(path.join(here, "icon.svg"), "utf8");

const html = `<!DOCTYPE html><html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`;

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 128, height: 128, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle0" });
  const buf = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: 128, height: 128 },
    omitBackground: true,
  });
  writeFileSync(path.join(here, "icon.png"), buf);
  console.log("Wrote", path.join(here, "icon.png"));
} finally {
  await browser.close();
}
