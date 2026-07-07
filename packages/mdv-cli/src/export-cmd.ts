import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import http from "node:http";
import { renderFile } from "@mdv/core";

export async function exportPdfCommand(file: string, outPath: string, pageSize: "letter" | "a4"): Promise<void> {
  const absFile = path.resolve(file);
  const baseDir = path.dirname(absFile);
  const html = await renderFile(absFile);

  // Inline additional print CSS for page size + margins.
  const printCss = `<style>@page { size: ${pageSize}; margin: 0.6in; } body { background: #fff !important; } .mdv-doc { max-width: none !important; margin: 0 !important; padding: 0 !important; }</style>`;
  const printableHtml = html.replace("</head>", printCss + "</head>");

  // Serve the HTML locally so relative refs (data files / images) still resolve.
  const server = http.createServer((req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(printableHtml);
      return;
    }
    const full = path.resolve(baseDir, decodeURIComponent((req.url || "").replace(/^\/+/, "")));
    const rel = path.relative(baseDir, full);
    if (rel.startsWith("..") || path.isAbsolute(rel)) { res.writeHead(403); res.end(); return; }
    fsSync.readFile(full, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200);
      res.end(data);
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: pageSize === "a4" ? "A4" : "Letter", printBackground: true });
    await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
    await fs.writeFile(outPath, pdf);
  } finally {
    await browser.close();
    server.close();
  }
  console.error(`Exported ${file} -> ${outPath}`);
}
