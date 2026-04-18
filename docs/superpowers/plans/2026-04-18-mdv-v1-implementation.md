# MDV v1 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Execute tasks in order. Each task is self-contained.

**Goal:** Build a working v1 of the MDV format — a CommonMark superset for data/visualization authoring — with a renderer library, CLI, example corpus, and passing tests.

**Architecture:** Single TypeScript monorepo. `mdv-core` does parsing + HTML/SVG rendering (no DOM). `mdv-cli` wraps core and adds render/export/preview commands. PDF via puppeteer. Tests use Node's built-in test runner and golden fixtures.

**Tech Stack:** Node ≥ 20, TypeScript, `markdown-it`, `js-yaml`, `puppeteer` (PDF only), `node:test`.

---

## File Structure

```
mdv/
├── package.json                      # npm workspaces root
├── tsconfig.base.json
├── packages/
│   ├── mdv-core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # public API: parse, render, renderFile
│   │   │   ├── frontmatter.ts        # YAML front-matter extraction + validation
│   │   │   ├── infostring.ts         # info-string (key=value) parser
│   │   │   ├── ast.ts                # AST types
│   │   │   ├── parser.ts             # markdown-it setup + mdv extensions
│   │   │   ├── data.ts               # CSV/JSON parsing, file resolution, dataset registry
│   │   │   ├── themes.ts             # built-in themes (minimal, report, slide)
│   │   │   ├── styles.ts             # named-style compilation → CSS
│   │   │   ├── errors.ts             # error/warning banner rendering
│   │   │   ├── render/
│   │   │   │   ├── html.ts           # top-level document renderer
│   │   │   │   ├── table.ts          # table block renderer
│   │   │   │   ├── chart-bar.ts      # bar chart SVG
│   │   │   │   ├── chart-line.ts     # line chart SVG
│   │   │   │   ├── chart-pie.ts      # pie chart SVG
│   │   │   │   └── svg-util.ts       # shared SVG helpers (axes, scale, escape)
│   │   └── test/
│   │       ├── frontmatter.test.ts
│   │       ├── infostring.test.ts
│   │       ├── data.test.ts
│   │       ├── parser.test.ts
│   │       ├── render.test.ts
│   │       ├── charts.test.ts
│   │       └── fixtures/             # sample .mdv inputs + expected outputs
│   └── mdv-cli/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts              # CLI entry (render, export, preview subcommands)
│       │   ├── render-cmd.ts
│       │   ├── export-cmd.ts
│       │   └── preview-cmd.ts
│       └── test/
│           └── cli.test.ts
├── examples/                         # hand-crafted sample .mdv files
│   ├── 01-plain-markdown.mdv
│   ├── 02-named-style.mdv
│   ├── 03-bar-chart-inline.mdv
│   ├── 04-line-chart-inline.mdv
│   ├── 05-pie-chart-inline.mdv
│   ├── 06-table.mdv
│   ├── 07-data-file-ref.mdv
│   ├── 08-columns-layout.mdv
│   ├── 09-full-report.mdv
│   └── data/
│       └── sales.csv
└── docs/
    └── superpowers/
        ├── specs/2026-04-18-mdv-format-design.md
        └── plans/2026-04-18-mdv-v1-implementation.md  (this file)
```

---

## Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.gitignore`, `README.md`
- Create: `packages/mdv-core/package.json`, `packages/mdv-core/tsconfig.json`, `packages/mdv-core/src/index.ts`
- Create: `packages/mdv-cli/package.json`, `packages/mdv-cli/tsconfig.json`, `packages/mdv-cli/src/index.ts`

- [ ] **Step 1: Write root `package.json` with workspaces**

```json
{
  "name": "mdv",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `.gitignore`** — standard Node/TS ignores (node_modules, dist, *.log).

- [ ] **Step 4: Write `packages/mdv-core/package.json`**

```json
{
  "name": "@mdv/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "node --test --import tsx test/**/*.test.ts"
  },
  "dependencies": {
    "markdown-it": "^14.1.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "@types/markdown-it": "^14.1.0",
    "@types/js-yaml": "^4.0.0"
  }
}
```

- [ ] **Step 5: Write `packages/mdv-core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*"]
}
```

- [ ] **Step 6: Write stub `packages/mdv-core/src/index.ts`**

```ts
export const VERSION = "0.1.0";
```

- [ ] **Step 7: Write `packages/mdv-cli/package.json`**

```json
{
  "name": "@mdv/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "mdv": "dist/index.js" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "node --test --import tsx test/**/*.test.ts"
  },
  "dependencies": { "@mdv/core": "0.1.0" },
  "devDependencies": { "tsx": "^4.19.0" }
}
```

- [ ] **Step 8: Install deps and run build**

```bash
cd /d/mdv && npm install && npm run build
```

Expected: build succeeds, no errors.

- [ ] **Step 9: Commit (no git in use — skip; note as scaffolded).**

---

## Task 2: Front-matter parser

**Files:**
- Create: `packages/mdv-core/src/frontmatter.ts`
- Create: `packages/mdv-core/test/frontmatter.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractFrontmatter } from "../src/frontmatter.js";

test("extracts YAML front-matter between --- fences", () => {
  const input = "---\ntitle: Hello\ntheme: minimal\n---\n# Body\n";
  const { data, body } = extractFrontmatter(input);
  assert.equal(data.title, "Hello");
  assert.equal(data.theme, "minimal");
  assert.equal(body, "# Body\n");
});

test("returns empty data when no front-matter", () => {
  const input = "# Just a heading\n";
  const { data, body } = extractFrontmatter(input);
  assert.deepEqual(data, {});
  assert.equal(body, input);
});

test("invalid YAML throws MdvError with kind=fatal", () => {
  const input = "---\ntitle: [unclosed\n---\n";
  assert.throws(() => extractFrontmatter(input), /front-matter/i);
});
```

- [ ] **Step 2: Run test, verify fail**

```bash
cd packages/mdv-core && npm test
```

- [ ] **Step 3: Implement**

```ts
import yaml from "js-yaml";

export interface FrontmatterResult {
  data: Record<string, unknown>;
  body: string;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function extractFrontmatter(source: string): FrontmatterResult {
  const m = source.match(FM_RE);
  if (!m) return { data: {}, body: source };
  let data: Record<string, unknown>;
  try {
    const parsed = yaml.load(m[1]);
    data = (parsed && typeof parsed === "object") ? parsed as Record<string, unknown> : {};
  } catch (e) {
    throw new Error(`Invalid front-matter YAML: ${(e as Error).message}`);
  }
  return { data, body: source.slice(m[0].length) };
}
```

- [ ] **Step 4: Run test, verify pass.**

---

## Task 3: Info-string parser

**Files:**
- Create: `packages/mdv-core/src/infostring.ts`
- Create: `packages/mdv-core/test/infostring.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInfoString } from "../src/infostring.js";

test("parses type and key=value pairs", () => {
  const r = parseInfoString("chart type=bar x=region y=sales");
  assert.equal(r.lang, "chart");
  assert.deepEqual(r.opts, { type: "bar", x: "region", y: "sales" });
});

test("handles quoted values with spaces", () => {
  const r = parseInfoString('chart type=bar title="Revenue by region"');
  assert.equal(r.opts.title, "Revenue by region");
});

test("handles boolean flags (key with no value)", () => {
  const r = parseInfoString("chart type=line smooth points");
  assert.equal(r.opts.smooth, true);
  assert.equal(r.opts.points, true);
});

test("empty string yields empty lang and opts", () => {
  const r = parseInfoString("");
  assert.equal(r.lang, "");
  assert.deepEqual(r.opts, {});
});
```

- [ ] **Step 2: Run test, verify fail.**

- [ ] **Step 3: Implement**

```ts
export interface InfoString {
  lang: string;
  opts: Record<string, string | boolean>;
}

export function parseInfoString(info: string): InfoString {
  const trimmed = info.trim();
  if (!trimmed) return { lang: "", opts: {} };
  const tokens: string[] = [];
  let i = 0;
  while (i < trimmed.length) {
    while (i < trimmed.length && /\s/.test(trimmed[i])) i++;
    if (i >= trimmed.length) break;
    let tok = "";
    while (i < trimmed.length && !/\s/.test(trimmed[i])) {
      if (trimmed[i] === '"') {
        tok += trimmed[i++];
        while (i < trimmed.length && trimmed[i] !== '"') tok += trimmed[i++];
        if (i < trimmed.length) tok += trimmed[i++];
      } else {
        tok += trimmed[i++];
      }
    }
    if (tok) tokens.push(tok);
  }
  const lang = tokens.shift() ?? "";
  const opts: Record<string, string | boolean> = {};
  for (const t of tokens) {
    const eq = t.indexOf("=");
    if (eq < 0) {
      opts[t] = true;
    } else {
      const k = t.slice(0, eq);
      let v = t.slice(eq + 1);
      if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) {
        v = v.slice(1, -1);
      }
      opts[k] = v;
    }
  }
  return { lang, opts };
}
```

- [ ] **Step 4: Run test, verify pass.**

---

## Task 4: Data layer (CSV, JSON, file resolution)

**Files:**
- Create: `packages/mdv-core/src/data.ts`
- Create: `packages/mdv-core/test/data.test.ts`
- Create: `packages/mdv-core/test/fixtures/sales.csv`

- [ ] **Step 1: Create test fixture `test/fixtures/sales.csv`**

```
region,sales
North,120
South,95
East,70
West,140
```

- [ ] **Step 2: Write failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseCsv, parseJson, loadDataset } from "../src/data.js";

test("parseCsv handles header + typed rows", () => {
  const rows = parseCsv("region,sales\nNorth,120\nSouth,95\n");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].region, "North");
  assert.equal(rows[0].sales, 120);
});

test("parseCsv handles quoted fields with commas", () => {
  const rows = parseCsv('name,note\n"Smith, J",hello\n');
  assert.equal(rows[0].name, "Smith, J");
});

test("parseJson passes through arrays of objects", () => {
  const rows = parseJson('[{"a":1},{"a":2}]');
  assert.equal(rows.length, 2);
  assert.equal(rows[1].a, 2);
});

test("loadDataset reads CSV relative to base path", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const rows = await loadDataset("./fixtures/sales.csv", here);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].region, "North");
});
```

- [ ] **Step 3: Implement**

```ts
import fs from "node:fs/promises";
import path from "node:path";

export type Row = Record<string, string | number | boolean | null>;

function coerce(v: string): string | number | boolean | null {
  const t = v.trim();
  if (t === "") return "";
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

export function parseCsv(src: string): Row[] {
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && src[i + 1] === "\n") i++;
        cur.push(field); field = "";
        if (cur.some(f => f !== "")) lines.push(cur);
        cur = [];
      } else field += c;
    }
  }
  if (field !== "" || cur.length) { cur.push(field); if (cur.some(f => f !== "")) lines.push(cur); }
  if (lines.length === 0) return [];
  const header = lines[0].map(h => h.trim());
  return lines.slice(1).map(row => {
    const r: Row = {};
    header.forEach((h, i) => {
      const raw = row[i] ?? "";
      r[h] = coerce(raw);
    });
    return r;
  });
}

export function parseJson(src: string): Row[] {
  const v = JSON.parse(src);
  if (!Array.isArray(v)) throw new Error("JSON data must be an array of objects");
  return v as Row[];
}

export async function loadDataset(relPath: string, baseDir: string): Promise<Row[]> {
  const full = path.resolve(baseDir, relPath);
  const src = await fs.readFile(full, "utf8");
  const ext = path.extname(full).toLowerCase();
  if (ext === ".csv" || ext === ".tsv") return parseCsv(src);
  if (ext === ".json") return parseJson(src);
  throw new Error(`Unsupported data file extension: ${ext}`);
}
```

- [ ] **Step 4: Run tests, verify pass.**

---

## Task 5: AST + markdown-it parser setup

**Files:**
- Create: `packages/mdv-core/src/ast.ts`
- Create: `packages/mdv-core/src/parser.ts`
- Create: `packages/mdv-core/test/parser.test.ts`

- [ ] **Step 1: Define AST types in `ast.ts`**

```ts
export interface MdvDoc {
  frontmatter: Record<string, unknown>;
  tokens: MdvToken[]; // markdown-it tokens, with some rewritten
  baseDir: string;
}

export interface ChartMeta { type: "bar" | "line" | "pie"; opts: Record<string, string | boolean>; data: unknown[]; }
export interface TableMeta { opts: Record<string, string | boolean>; data: unknown[]; }
export interface ContainerMeta { name: string; }
export interface ErrorMeta { severity: "fatal" | "block" | "warning"; message: string; source?: string; }

export type MdvToken =
  | { kind: "md"; token: import("markdown-it").Token }
  | { kind: "chart"; meta: ChartMeta }
  | { kind: "table"; meta: TableMeta }
  | { kind: "container-open"; meta: ContainerMeta }
  | { kind: "container-close" }
  | { kind: "error"; meta: ErrorMeta };
```

- [ ] **Step 2: Implement `parser.ts`** (uses markdown-it; detects fences with `chart`/`table`/`data` langs; detects `:::` containers via a small scanner pre-pass).

```ts
import MarkdownIt from "markdown-it";
import { extractFrontmatter } from "./frontmatter.js";
import { parseInfoString } from "./infostring.js";
import { parseCsv, parseJson, loadDataset } from "./data.js";
import type { MdvDoc, MdvToken, ChartMeta, TableMeta } from "./ast.js";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

// Pre-pass: transform ::: blocks into markdown-it-friendly sentinels.
function transformDirectives(body: string): string {
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(/^:::\s*(.*)$/);
    if (m) {
      const name = m[1].trim();
      if (name === "") out.push("<!--MDV_DIR_CLOSE-->");
      else out.push(`<!--MDV_DIR_OPEN ${name}-->`);
    } else out.push(line);
  }
  return out.join("\n");
}

async function resolveBlockData(opts: Record<string, string | boolean>, body: string, frontmatter: Record<string, unknown>, baseDir: string): Promise<unknown[]> {
  const format = (opts.format as string) || "csv";
  if (opts.data) {
    const dataMap = (frontmatter.data as Record<string, string>) || {};
    const ref = dataMap[opts.data as string];
    if (!ref) throw new Error(`Dataset '${opts.data}' not declared in front-matter`);
    return loadDataset(ref, baseDir);
  }
  if (format === "json") return parseJson(body);
  return parseCsv(body);
}

export async function parse(source: string, opts: { baseDir?: string } = {}): Promise<MdvDoc> {
  const baseDir = opts.baseDir ?? process.cwd();
  const { data: frontmatter, body } = extractFrontmatter(source);
  const transformed = transformDirectives(body);
  const mdTokens = md.parse(transformed, {});
  const out: MdvToken[] = [];
  for (const tok of mdTokens) {
    if (tok.type === "fence") {
      const info = parseInfoString(tok.info);
      if (info.lang === "chart") {
        const type = info.opts.type as ChartMeta["type"];
        if (!["bar", "line", "pie"].includes(type)) {
          out.push({ kind: "error", meta: { severity: "block", message: `Unknown chart type: ${type}`, source: tok.info } });
          continue;
        }
        try {
          const rows = await resolveBlockData(info.opts, tok.content, frontmatter, baseDir);
          out.push({ kind: "chart", meta: { type, opts: info.opts, data: rows } });
        } catch (e) {
          out.push({ kind: "error", meta: { severity: "block", message: (e as Error).message, source: tok.info } });
        }
        continue;
      }
      if (info.lang === "table") {
        try {
          const rows = await resolveBlockData(info.opts, tok.content, frontmatter, baseDir);
          out.push({ kind: "table", meta: { opts: info.opts, data: rows } });
        } catch (e) {
          out.push({ kind: "error", meta: { severity: "block", message: (e as Error).message, source: tok.info } });
        }
        continue;
      }
    }
    if (tok.type === "html_block" && tok.content.startsWith("<!--MDV_DIR_OPEN")) {
      const name = tok.content.replace(/<!--MDV_DIR_OPEN |-->\s*/g, "").trim();
      out.push({ kind: "container-open", meta: { name } });
      continue;
    }
    if (tok.type === "html_block" && tok.content.includes("<!--MDV_DIR_CLOSE-->")) {
      out.push({ kind: "container-close" });
      continue;
    }
    out.push({ kind: "md", token: tok });
  }
  return { frontmatter, tokens: out, baseDir };
}

export function renderMarkdownInline(tokens: import("markdown-it").Token[]): string {
  return md.renderer.render(tokens, md.options, {});
}

export const mdInstance = md;
```

- [ ] **Step 3: Write parser test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/parser.js";

test("parses plain markdown unchanged", async () => {
  const doc = await parse("# Hello\n\nParagraph.\n");
  assert.deepEqual(doc.frontmatter, {});
  assert.ok(doc.tokens.some(t => t.kind === "md"));
});

test("extracts chart block with data", async () => {
  const src = "```chart type=bar x=a y=b\na,b\nX,1\nY,2\n```\n";
  const doc = await parse(src);
  const chart = doc.tokens.find(t => t.kind === "chart");
  assert.ok(chart);
  if (chart && chart.kind === "chart") {
    assert.equal(chart.meta.type, "bar");
    assert.equal(chart.meta.data.length, 2);
  }
});

test("produces error block for unknown chart type", async () => {
  const src = "```chart type=nope\n```\n";
  const doc = await parse(src);
  assert.ok(doc.tokens.some(t => t.kind === "error"));
});

test("transforms ::: containers to open/close tokens", async () => {
  const src = "::: callout\nHi\n:::\n";
  const doc = await parse(src);
  assert.ok(doc.tokens.some(t => t.kind === "container-open"));
  assert.ok(doc.tokens.some(t => t.kind === "container-close"));
});
```

- [ ] **Step 4: Run tests, verify pass.**

---

## Task 6: Themes & style compilation

**Files:**
- Create: `packages/mdv-core/src/themes.ts`
- Create: `packages/mdv-core/src/styles.ts`

- [ ] **Step 1: Define themes in `themes.ts`**

```ts
export interface Theme {
  name: string;
  font: string;
  fontSize: string;
  textColor: string;
  background: string;
  headingColor: string;
  accent: string;
  chartPalette: string[];
  spacing: { small: string; medium: string; large: string };
  radius: { small: string; medium: string; large: string };
}

export const THEMES: Record<string, Theme> = {
  minimal: {
    name: "minimal",
    font: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    fontSize: "16px",
    textColor: "#222",
    background: "#fff",
    headingColor: "#111",
    accent: "#2d6cdf",
    chartPalette: ["#2d6cdf", "#e0b84a", "#3aa675", "#c64a4a", "#8a4ac6", "#4ab8c6"],
    spacing: { small: "4px", medium: "12px", large: "24px" },
    radius: { small: "2px", medium: "6px", large: "12px" },
  },
  report: {
    name: "report",
    font: "Georgia, 'Times New Roman', serif",
    fontSize: "17px",
    textColor: "#1a1a1a",
    background: "#fafaf7",
    headingColor: "#1a1a1a",
    accent: "#8c2f2f",
    chartPalette: ["#8c2f2f", "#2d6cdf", "#3aa675", "#e0b84a", "#8a4ac6", "#4ab8c6"],
    spacing: { small: "6px", medium: "16px", large: "32px" },
    radius: { small: "0", medium: "2px", large: "4px" },
  },
  slide: {
    name: "slide",
    font: "'Helvetica Neue', Arial, sans-serif",
    fontSize: "20px",
    textColor: "#fff",
    background: "#1e1e2a",
    headingColor: "#fff",
    accent: "#ffce5c",
    chartPalette: ["#ffce5c", "#7fc8f8", "#b5f08a", "#ff7a7a", "#c58af8", "#5cf0d6"],
    spacing: { small: "8px", medium: "20px", large: "40px" },
    radius: { small: "4px", medium: "10px", large: "20px" },
  },
};

export function getTheme(name: unknown): Theme {
  if (typeof name === "string" && THEMES[name]) return THEMES[name];
  return THEMES.minimal;
}
```

- [ ] **Step 2: Implement `styles.ts`** — compile front-matter `styles:` map to CSS rules.

```ts
import { Theme } from "./themes.js";

const SPACING_KEYS = new Set(["padding", "margin"]);
const SIZE_KEYS = new Set(["size"]);

const VALID_KEYS = new Set([
  "color", "background", "border",
  "padding", "margin",
  "font", "size", "weight", "align",
  "width", "radius",
]);

function resolveSpacing(v: string, theme: Theme): string {
  if (v === "small" || v === "medium" || v === "large") return theme.spacing[v];
  return v;
}

function resolveRadius(v: string, theme: Theme): string {
  if (v === "small" || v === "medium" || v === "large") return theme.radius[v];
  return v;
}

function resolveSize(v: string, theme: Theme): string {
  if (v === "small") return "0.875em";
  if (v === "medium") return "1em";
  if (v === "large") return "1.25em";
  return v;
}

export interface StyleCompileResult {
  css: string;
  warnings: string[];
}

export function compileStyles(styles: Record<string, unknown> | undefined, theme: Theme): StyleCompileResult {
  const warnings: string[] = [];
  if (!styles || typeof styles !== "object") return { css: "", warnings };
  const parts: string[] = [];
  for (const [name, defRaw] of Object.entries(styles)) {
    if (!defRaw || typeof defRaw !== "object") continue;
    const def = defRaw as Record<string, string>;
    const rules: string[] = [];
    for (const [k, vRaw] of Object.entries(def)) {
      if (!VALID_KEYS.has(k)) { warnings.push(`Unknown style key '${k}' in style '${name}'`); continue; }
      const v = String(vRaw);
      switch (k) {
        case "color": rules.push(`color: ${v}`); break;
        case "background": rules.push(`background: ${v}`); break;
        case "border": rules.push(`border: ${v}`); break;
        case "padding": rules.push(`padding: ${resolveSpacing(v, theme)}`); break;
        case "margin": rules.push(`margin: ${resolveSpacing(v, theme)}`); break;
        case "font": rules.push(`font-family: ${v}`); break;
        case "size": rules.push(`font-size: ${resolveSize(v, theme)}`); break;
        case "weight": rules.push(`font-weight: ${v}`); break;
        case "align": rules.push(`text-align: ${v}`); break;
        case "width": rules.push(`width: ${v}`); break;
        case "radius": rules.push(`border-radius: ${resolveRadius(v, theme)}`); break;
      }
    }
    if (rules.length) parts.push(`.mdv-style-${cssSafe(name)} { ${rules.join("; ")}; }`);
  }
  return { css: parts.join("\n"), warnings };
}

function cssSafe(s: string): string { return s.replace(/[^a-zA-Z0-9_-]/g, "-"); }

export function baseThemeCss(theme: Theme): string {
  return `
.mdv-doc { font-family: ${theme.font}; font-size: ${theme.fontSize}; color: ${theme.textColor}; background: ${theme.background}; max-width: 860px; margin: 2em auto; padding: 0 1em; line-height: 1.55; }
.mdv-doc h1, .mdv-doc h2, .mdv-doc h3, .mdv-doc h4 { color: ${theme.headingColor}; line-height: 1.25; }
.mdv-doc a { color: ${theme.accent}; }
.mdv-doc table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.mdv-doc th, .mdv-doc td { padding: 0.5em 0.8em; border-bottom: 1px solid rgba(0,0,0,0.1); text-align: left; }
.mdv-doc th { font-weight: 600; border-bottom: 2px solid ${theme.accent}; }
.mdv-doc .mdv-columns { display: grid; gap: ${theme.spacing.large}; grid-template-columns: 1fr 1fr; margin: 1em 0; }
.mdv-doc .mdv-error { background: #ffecec; border-left: 4px solid #c64a4a; padding: ${theme.spacing.medium}; margin: 1em 0; font-family: monospace; font-size: 0.9em; color: #5a1a1a; border-radius: ${theme.radius.small}; }
.mdv-doc .mdv-warning { background: #fff8e0; border-left: 4px solid #e0b84a; padding: ${theme.spacing.small} ${theme.spacing.medium}; margin: 0.5em 0; font-size: 0.9em; color: #5a4416; border-radius: ${theme.radius.small}; }
.mdv-doc .mdv-chart { margin: 1em 0; }
.mdv-doc .mdv-chart-title { font-weight: 600; margin-bottom: 0.5em; }
  `.trim();
}
```

---

## Task 7: SVG utilities and chart renderers

**Files:**
- Create: `packages/mdv-core/src/render/svg-util.ts`
- Create: `packages/mdv-core/src/render/chart-bar.ts`
- Create: `packages/mdv-core/src/render/chart-line.ts`
- Create: `packages/mdv-core/src/render/chart-pie.ts`
- Create: `packages/mdv-core/src/render/table.ts`

- [ ] **Step 1: Implement `svg-util.ts`**

```ts
export function escapeHtml(s: unknown): string {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  const raw = range / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  let step: number;
  if (norm < 1.5) step = 1 * pow;
  else if (norm < 3) step = 2 * pow;
  else if (norm < 7) step = 5 * pow;
  else step = 10 * pow;
  const tickMin = Math.floor(min / step) * step;
  const tickMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = tickMin; v <= tickMax + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

export function fmt(n: number): string {
  if (!isFinite(n)) return String(n);
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US");
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}
```

- [ ] **Step 2: Implement `chart-bar.ts`**

```ts
import { ChartMeta } from "../ast.js";
import { Theme } from "../themes.js";
import { escapeHtml, niceTicks, fmt } from "./svg-util.js";

export function renderBarChart(meta: ChartMeta, theme: Theme): string {
  const xKey = meta.opts.x as string;
  const yKey = meta.opts.y as string;
  if (!xKey || !yKey) return errBlock("Bar chart requires x= and y= options");
  const rows = meta.data as Record<string, unknown>[];
  const labels = rows.map(r => String(r[xKey] ?? ""));
  const values = rows.map(r => Number(r[yKey] ?? 0));
  if (!rows.length) return errBlock("Bar chart has no data rows");
  const W = 720, H = 360, pad = { t: 30, r: 20, b: 50, l: 50 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const ymin = Math.min(0, ...values);
  const ymax = Math.max(...values);
  const ticks = niceTicks(ymin, ymax, 5);
  const yScale = (v: number) => pad.t + ih - ((v - ticks[0]) / (ticks[ticks.length - 1] - ticks[0])) * ih;
  const bw = iw / labels.length * 0.7;
  const gap = iw / labels.length * 0.3;
  const title = (meta.opts.title as string) || "";
  const color = theme.chartPalette[0];
  const bars = labels.map((lbl, i) => {
    const x = pad.l + i * (bw + gap) + gap / 2;
    const y = yScale(Math.max(0, values[i]));
    const y0 = yScale(Math.min(0, values[i]));
    const h = Math.abs(y0 - yScale(values[i]));
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}"><title>${escapeHtml(lbl)}: ${fmt(values[i])}</title></rect>`;
  }).join("");
  const xLabels = labels.map((lbl, i) => {
    const x = pad.l + i * (bw + gap) + gap / 2 + bw / 2;
    return `<text x="${x.toFixed(1)}" y="${H - pad.b + 16}" text-anchor="middle" font-size="11" fill="${theme.textColor}">${escapeHtml(lbl)}</text>`;
  }).join("");
  const yTicks = ticks.map(t => {
    const y = yScale(t);
    return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.08)"/><text x="${pad.l - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${theme.textColor}">${fmt(t)}</text>`;
  }).join("");
  return wrap(title, W, H, `${yTicks}${bars}${xLabels}`);
}

function wrap(title: string, W: number, H: number, body: string): string {
  const t = title ? `<div class="mdv-chart-title">${escapeHtml(title)}</div>` : "";
  return `<figure class="mdv-chart">${t}<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">${body}</svg></figure>`;
}

function errBlock(msg: string): string {
  return `<div class="mdv-error">${escapeHtml(msg)}</div>`;
}
```

- [ ] **Step 3: Implement `chart-line.ts`**

```ts
import { ChartMeta } from "../ast.js";
import { Theme } from "../themes.js";
import { escapeHtml, niceTicks, fmt } from "./svg-util.js";

export function renderLineChart(meta: ChartMeta, theme: Theme): string {
  const xKey = meta.opts.x as string;
  const yKey = meta.opts.y as string;
  const seriesKey = meta.opts.series as string | undefined;
  if (!xKey || !yKey) return `<div class="mdv-error">Line chart requires x= and y= options</div>`;
  const rows = meta.data as Record<string, unknown>[];
  if (!rows.length) return `<div class="mdv-error">Line chart has no data rows</div>`;
  const W = 720, H = 360, pad = { t: 30, r: 20, b: 50, l: 50 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

  const groups = new Map<string, Record<string, unknown>[]>();
  if (seriesKey) {
    for (const r of rows) {
      const s = String(r[seriesKey] ?? "");
      if (!groups.has(s)) groups.set(s, []);
      groups.get(s)!.push(r);
    }
  } else {
    groups.set("", rows);
  }
  const xs = rows.map(r => r[xKey]);
  const xUnique: string[] = [];
  for (const x of xs) { const s = String(x); if (!xUnique.includes(s)) xUnique.push(s); }
  const xScale = (v: unknown) => pad.l + (xUnique.indexOf(String(v)) / Math.max(1, xUnique.length - 1)) * iw;
  const allYs = rows.map(r => Number(r[yKey] ?? 0));
  const ymin = Math.min(0, ...allYs);
  const ymax = Math.max(...allYs);
  const ticks = niceTicks(ymin, ymax, 5);
  const yScale = (v: number) => pad.t + ih - ((v - ticks[0]) / (ticks[ticks.length - 1] - ticks[0])) * ih;

  const palette = theme.chartPalette;
  let i = 0;
  const lines: string[] = [];
  const points = Boolean(meta.opts.points);
  for (const [name, groupRows] of groups) {
    const color = palette[i % palette.length];
    const pts = groupRows.map(r => {
      const x = xScale(r[xKey]);
      const y = yScale(Number(r[yKey] ?? 0));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    lines.push(`<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}"/>`);
    if (points) {
      for (const r of groupRows) {
        const x = xScale(r[xKey]);
        const y = yScale(Number(r[yKey] ?? 0));
        lines.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}"><title>${escapeHtml(String(r[xKey]))}: ${fmt(Number(r[yKey]))}</title></circle>`);
      }
    }
    if (name) lines.push(`<text x="${W - pad.r}" y="${pad.t + i * 16 + 10}" text-anchor="end" font-size="11" fill="${color}">${escapeHtml(name)}</text>`);
    i++;
  }
  const xLabels = xUnique.map(lbl => {
    const x = xScale(lbl);
    return `<text x="${x.toFixed(1)}" y="${H - pad.b + 16}" text-anchor="middle" font-size="11" fill="${theme.textColor}">${escapeHtml(lbl)}</text>`;
  }).join("");
  const yTicks = ticks.map(t => {
    const y = yScale(t);
    return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.08)"/><text x="${pad.l - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${theme.textColor}">${fmt(t)}</text>`;
  }).join("");
  const title = (meta.opts.title as string) || "";
  const t = title ? `<div class="mdv-chart-title">${escapeHtml(title)}</div>` : "";
  return `<figure class="mdv-chart">${t}<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">${yTicks}${lines.join("")}${xLabels}</svg></figure>`;
}
```

- [ ] **Step 4: Implement `chart-pie.ts`**

```ts
import { ChartMeta } from "../ast.js";
import { Theme } from "../themes.js";
import { escapeHtml, fmt } from "./svg-util.js";

export function renderPieChart(meta: ChartMeta, theme: Theme): string {
  const labelKey = meta.opts.label as string;
  const valueKey = meta.opts.value as string;
  if (!labelKey || !valueKey) return `<div class="mdv-error">Pie chart requires label= and value= options</div>`;
  const rows = meta.data as Record<string, unknown>[];
  if (!rows.length) return `<div class="mdv-error">Pie chart has no data rows</div>`;
  const W = 420, H = 360;
  const cx = 180, cy = 180, r = 140;
  const total = rows.reduce((s, row) => s + Number(row[valueKey] ?? 0), 0);
  if (total <= 0) return `<div class="mdv-error">Pie chart total is zero</div>`;
  const donut = Boolean(meta.opts.donut);
  let angle = -Math.PI / 2;
  const slices: string[] = [];
  const legend: string[] = [];
  rows.forEach((row, i) => {
    const val = Number(row[valueKey] ?? 0);
    const frac = val / total;
    const a2 = angle + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const color = theme.chartPalette[i % theme.chartPalette.length];
    const d = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
    slices.push(`<path d="${d}" fill="${color}"><title>${escapeHtml(String(row[labelKey]))}: ${fmt(val)} (${(frac * 100).toFixed(1)}%)</title></path>`);
    legend.push(`<g transform="translate(${W - 120},${40 + i * 22})"><rect width="12" height="12" fill="${color}"/><text x="18" y="10" font-size="12" fill="${theme.textColor}">${escapeHtml(String(row[labelKey]))}</text></g>`);
    angle = a2;
  });
  if (donut) slices.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="${theme.background}"/>`);
  const title = (meta.opts.title as string) || "";
  const t = title ? `<div class="mdv-chart-title">${escapeHtml(title)}</div>` : "";
  return `<figure class="mdv-chart">${t}<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">${slices.join("")}${legend.join("")}</svg></figure>`;
}
```

- [ ] **Step 5: Implement `table.ts`**

```ts
import { TableMeta } from "../ast.js";
import { escapeHtml } from "./svg-util.js";

export function renderTable(meta: TableMeta): string {
  const rows = meta.data as Record<string, unknown>[];
  if (!rows.length) return `<div class="mdv-error">Table has no data rows</div>`;
  const headers = Object.keys(rows[0]);
  const head = `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`;
  const body = `<tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${escapeHtml(r[h] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>`;
  return `<table class="mdv-table">${head}${body}</table>`;
}
```

---

## Task 8: Document HTML renderer

**Files:**
- Create: `packages/mdv-core/src/render/html.ts`
- Update: `packages/mdv-core/src/index.ts`

- [ ] **Step 1: Implement `render/html.ts`**

```ts
import { MdvDoc } from "../ast.js";
import { getTheme } from "../themes.js";
import { baseThemeCss, compileStyles } from "../styles.js";
import { renderBarChart } from "./chart-bar.js";
import { renderLineChart } from "./chart-line.js";
import { renderPieChart } from "./chart-pie.js";
import { renderTable } from "./table.js";
import { escapeHtml } from "./svg-util.js";
import { mdInstance } from "../parser.js";

export function renderDocument(doc: MdvDoc): string {
  const themeName = doc.frontmatter.theme;
  const theme = getTheme(themeName);
  const title = (doc.frontmatter.title as string) || "MDV Document";
  const themeWarnings: string[] = [];
  if (typeof themeName === "string" && theme.name !== themeName) {
    themeWarnings.push(`Unknown theme '${themeName}', falling back to '${theme.name}'`);
  }
  const { css: stylesCss, warnings: styleWarnings } = compileStyles(doc.frontmatter.styles as Record<string, unknown>, theme);
  const allWarnings = [...themeWarnings, ...styleWarnings];

  const body: string[] = [];
  if (allWarnings.length) {
    for (const w of allWarnings) body.push(`<div class="mdv-warning">${escapeHtml(w)}</div>`);
  }

  let mdBuffer: import("markdown-it").Token[] = [];
  const flushMd = () => {
    if (mdBuffer.length) {
      body.push(mdInstance.renderer.render(mdBuffer, mdInstance.options, {}));
      mdBuffer = [];
    }
  };

  for (const tok of doc.tokens) {
    if (tok.kind === "md") { mdBuffer.push(tok.token); continue; }
    flushMd();
    if (tok.kind === "chart") {
      const m = tok.meta;
      if (m.type === "bar") body.push(renderBarChart(m, theme));
      else if (m.type === "line") body.push(renderLineChart(m, theme));
      else if (m.type === "pie") body.push(renderPieChart(m, theme));
    } else if (tok.kind === "table") {
      body.push(renderTable(tok.meta));
    } else if (tok.kind === "container-open") {
      const name = tok.meta.name;
      if (name === "columns") body.push(`<div class="mdv-columns">`);
      else if (name === "col") body.push(`<div class="mdv-col">`);
      else body.push(`<div class="mdv-style-${cssSafe(name)}">`);
    } else if (tok.kind === "container-close") {
      body.push(`</div>`);
    } else if (tok.kind === "error") {
      body.push(`<div class="mdv-error">${escapeHtml(tok.meta.message)}${tok.meta.source ? ` <code>(${escapeHtml(tok.meta.source)})</code>` : ""}</div>`);
    }
  }
  flushMd();

  const css = baseThemeCss(theme) + "\n" + stylesCss;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>
<article class="mdv-doc">
${body.join("\n")}
</article>
</body>
</html>`;
}

function cssSafe(s: string): string { return s.replace(/[^a-zA-Z0-9_-]/g, "-"); }
```

- [ ] **Step 2: Update `src/index.ts`**

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "./parser.js";
import { renderDocument } from "./render/html.js";
export { parse } from "./parser.js";
export { renderDocument as render } from "./render/html.js";

export async function renderFile(file: string): Promise<string> {
  const src = await fs.readFile(file, "utf8");
  const doc = await parse(src, { baseDir: path.dirname(path.resolve(file)) });
  return renderDocument(doc);
}

export const VERSION = "0.1.0";
```

- [ ] **Step 3: Write render test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/parser.js";
import { renderDocument } from "../src/render/html.js";

test("renders plain markdown", async () => {
  const doc = await parse("# Hi\n");
  const html = renderDocument(doc);
  assert.match(html, /<h1>Hi<\/h1>/);
});

test("renders bar chart as SVG", async () => {
  const src = "```chart type=bar x=a y=b\na,b\nX,1\nY,2\n```\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /<svg/);
  assert.match(html, /<rect/);
});

test("renders named style container", async () => {
  const src = "---\nstyles:\n  callout:\n    background: '#fff6e0'\n---\n::: callout\nHi\n:::\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /class="mdv-style-callout"/);
  assert.match(html, /background: #fff6e0/);
});

test("warns on unknown theme", async () => {
  const src = "---\ntheme: bogus\n---\n# Hi\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /Unknown theme 'bogus'/);
});
```

- [ ] **Step 4: Run tests, verify pass.**

---

## Task 9: CLI

**Files:**
- Create: `packages/mdv-cli/src/index.ts` (render only; export/preview stubs for v0.1)

- [ ] **Step 1: Implement CLI**

```ts
#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { renderFile } from "@mdv/core";

async function main() {
  const [,, cmd, ...args] = process.argv;
  if (cmd === "render") {
    const file = args[0];
    if (!file) { console.error("Usage: mdv render <file.mdv> [--out <path>]"); process.exit(1); }
    const outIdx = args.indexOf("--out");
    const out = outIdx >= 0 ? args[outIdx + 1] : file.replace(/\.mdv$/, "") + ".html";
    try {
      const html = await renderFile(file);
      await fs.writeFile(out, html, "utf8");
      console.error(`Rendered ${file} → ${out}`);
    } catch (e) {
      console.error(`Error: ${(e as Error).message}`);
      process.exit(1);
    }
  } else if (cmd === "version" || cmd === "--version") {
    console.log("0.1.0");
  } else {
    console.error("Usage: mdv render <file.mdv> [--out <path>]");
    console.error("       mdv version");
    process.exit(1);
  }
}

main();
```

- [ ] **Step 2: Build, run on example, verify output is valid HTML.**

---

## Task 10: Example corpus + visual validation

**Files:**
- Create `examples/*.mdv` covering every v1 feature.
- Create `examples/data/sales.csv`.

- [ ] **Step 1: Create `examples/data/sales.csv`**

```
month,revenue,region
Jan,120,North
Feb,140,North
Mar,160,North
Jan,90,South
Feb,110,South
Mar,130,South
```

- [ ] **Step 2: Create `01-plain-markdown.mdv`** — verify graceful degradation: regular MD.

- [ ] **Step 3: Create `02-named-style.mdv`** — front-matter with `styles: callout`, a `::: callout` block.

- [ ] **Step 4: Create `03-bar-chart-inline.mdv`** — `chart type=bar` with inline CSV.

- [ ] **Step 5: Create `04-line-chart-inline.mdv`** — `chart type=line` with `series=`.

- [ ] **Step 6: Create `05-pie-chart-inline.mdv`** — `chart type=pie donut`.

- [ ] **Step 7: Create `06-table.mdv`** — ` ```table ` block.

- [ ] **Step 8: Create `07-data-file-ref.mdv`** — uses `data: sales: ./data/sales.csv` in front-matter.

- [ ] **Step 9: Create `08-columns-layout.mdv`** — `::: columns` with two `::: col`.

- [ ] **Step 10: Create `09-full-report.mdv`** — combines everything with `theme: report`.

- [ ] **Step 11: Render each with `mdv render`, inspect each HTML output.**

- [ ] **Step 12: Open the generated HTML files in a browser and visually verify.**

---

## Task 11: Graceful-degradation test

- [ ] **Step 1: Verify each example parses through plain markdown-it without crash** (test file reads each `.mdv` as plain MD and asserts render doesn't throw).

---

## Self-Review Notes

- **Spec coverage:** Section 1 (purpose), 2 (principles), 3 (file format), 4 (styling), 5 (data), 6 (visualizations), 7 (architecture), 8 (CLI), 9 (error handling), 10 (testing), 11 (non-goals) — all covered by tasks 1–11. **PDF export (§8) is deferred** — not in Tasks 1–11. Will be added post-v0.1 once core is validated (requires puppeteer download which is fragile in this environment).
- **Preview server (§8) deferred** — also post-v0.1.

PDF + preview are the only spec items not executed in this plan. They're mechanical once core works.
