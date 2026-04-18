# CLI reference

Everything you do from the command line goes through one binary: `mdv`.

```
mdv render <file.mdv> [--out <path>]
mdv preview <file.mdv> [--port <n>]
mdv export <file.mdv> --pdf [--out <path>] [--page-size letter|a4]
mdv version
```

(From this repo, invoke as `node packages/mdv-cli/dist/index.js <command>` or set an alias — see [getting-started.md](getting-started.md).)

## `mdv render` — write HTML to disk

```bash
mdv render report.mdv
# → writes report.html next to the source

mdv render report.mdv --out build/q1.html
# → writes to build/q1.html
```

The output is **self-contained**: all CSS is inlined, all chart SVGs are inlined, no external requests. You can email it as a single file.

**Exit codes:**
- `0` — success
- `1` — parse or render error (message goes to stderr)

## `mdv preview` — live-reload preview server

```bash
mdv preview report.mdv
# → listening on http://localhost:3000

mdv preview report.mdv --port 4000
```

What it does:
- Serves the `.mdv` file **rendered in-memory** — no HTML file is written to disk.
- Watches the source file's directory for changes to `.mdv`, `.csv`, `.tsv`, `.json`.
- Injects a tiny poll script into the page; the browser auto-reloads when a change is detected.
- Serves referenced data files from the same directory so charts can reload.
- Renders errors inline instead of crashing.

Stop with **Ctrl+C**.

## `mdv export --pdf` — PDF export

```bash
mdv export report.mdv --pdf
# → writes report.pdf next to the source (Letter paper)

mdv export report.mdv --pdf --out build/q1.pdf --page-size a4
```

**How it works:** the core renders the doc to HTML, an ephemeral local server serves it (so relative data files resolve), headless Chromium (via `puppeteer`) loads it and saves a PDF. The `@page` CSS in the output honors the page size and applies 0.6 in margins.

**Notes:**
- First run downloads Chromium (~180 MB). Subsequent runs are fast.
- Charts and stat cards render crisply — they're SVG, not bitmaps.
- Theme colors survive (`printBackground: true`).
- The theme's background color is reset to white for print so you don't waste ink.

**Supported page sizes:** `letter` (default), `a4`.

## `mdv version`

Prints the CLI version.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Parse / render / IO error — message on stderr |

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module '@mdv/core'` | Run `npm install && npm run build` from the repo root. |
| PDF export hangs on first run | Chromium is downloading. Watch `npm install` output the first time. |
| "Dataset 'X' not declared in front-matter" | Add an entry to the `data:` map in front-matter with a relative path to your `.csv`. |
| "Unknown chart type: …" | Check the spelling of `type=`. Valid values: `bar`, `line`, `pie`. |
| PDF page breaks mid-chart | Chrome splits on page boundaries. v1 has no manual page-break control. Resize the chart (`height=300`) to make it fit. |
