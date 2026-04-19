import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { renderFile } from "@mdv/core";

const RELOAD_SNIPPET = `
<script>
(function(){
  let v = null;
  async function tick(){
    try {
      const r = await fetch('/__mdv_version', { cache: 'no-store' });
      const nv = await r.text();
      if (v !== null && v !== nv) location.reload();
      v = nv;
    } catch(e){}
    setTimeout(tick, 500);
  }
  tick();
})();
</script>`;

export async function previewCommand(file: string, port: number): Promise<void> {
  const absFile = path.resolve(file);
  const baseDir = path.dirname(absFile);
  let version = 0;
  let lastError: string | null = null;

  const bumpVersion = () => {
    version++;
    console.error(`[mdv] reload -> v${version}`);
  };

  // Watch the source file and its directory (catches data-file changes).
  const watcher = fs.watch(baseDir, { recursive: true }, (_event, name) => {
    if (!name) return;
    const ext = path.extname(name).toLowerCase();
    if ([".mdv", ".csv", ".tsv", ".json"].includes(ext)) bumpVersion();
  });

  async function renderCurrent(): Promise<string> {
    try {
      const html = await renderFile(absFile);
      lastError = null;
      return html.replace(/<\/body>/, RELOAD_SNIPPET + "</body>");
    } catch (e) {
      lastError = (e as Error).message;
      return errorPage(lastError, file);
    }
  }

  const server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(url.parse(req.url || "/").pathname || "/");
    if (pathname === "/__mdv_version") {
      res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
      res.end(String(version));
      return;
    }
    if (pathname === "/" || pathname === "/index.html") {
      const html = await renderCurrent();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
      return;
    }
    const safe = path.normalize(pathname).replace(/^([/\\])+/, "");
    const full = path.resolve(baseDir, safe);
    if (!full.startsWith(baseDir + path.sep) && full !== baseDir) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.readFile(full, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const ext = path.extname(full).toLowerCase();
      const ct = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".csv": "text/csv",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
      }[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": ct });
      res.end(data);
    });
  });

  server.listen(port, () => {
    console.error(`[mdv] preview of ${file} at http://localhost:${port}`);
    console.error(`[mdv] watching ${baseDir} for changes; Ctrl+C to stop`);
  });

  process.on("SIGINT", () => {
    watcher.close();
    server.close();
    process.exit(0);
  });
}

function errorPage(message: string, file: string): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>MDV preview error</title><style>
body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2em auto; padding: 0 1em; color: #222; }
h1 { color: #c64a4a; }
pre { background: #ffecec; padding: 1em; border-left: 4px solid #c64a4a; overflow: auto; }
</style></head><body>
<h1>Render error</h1>
<p>File: <code>${esc(file)}</code></p>
<pre>${esc(message)}</pre>
${RELOAD_SNIPPET}
</body></html>`;
}
