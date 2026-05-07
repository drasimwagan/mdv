#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderFile } from "@mdv/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "site");
const TEMPLATE = path.join(ROOT, "scripts", "site-template");
const EXAMPLES_OUT = path.join(ROOT, "examples", "out");
const EXAMPLES_SRC = path.join(ROOT, "examples");
const DOCS_SRC = path.join(ROOT, "docs");

const EXAMPLES = [
  { id: "01-plain-markdown", title: "Plain Markdown", blurb: "Pure CommonMark — proves MDV is a strict superset." },
  { id: "02-named-style", title: "Named styles", blurb: "Define and reuse styled regions from front-matter." },
  { id: "03-bar-chart-inline", title: "Bar chart (inline CSV)", blurb: "Single-series bar chart from inline data." },
  { id: "04-line-chart-inline", title: "Line chart (inline CSV)", blurb: "Multi-series line chart with currency axis." },
  { id: "05-pie-chart-inline", title: "Pie chart (inline CSV)", blurb: "Pie chart with categorical breakdown." },
  { id: "06-table", title: "Table", blurb: "Tabular data block — same syntax as charts." },
  { id: "07-data-file-ref", title: "External data file", blurb: "Reference a CSV from front-matter `data:` and chart it." },
  { id: "08-columns-layout", title: "Columns layout", blurb: "`::: columns` containers for side-by-side regions." },
  { id: "09-full-report", title: "Full quarterly report", blurb: "All v1 features composed into a polished report." },
  { id: "10-new-features", title: "Latest additions", blurb: "TOC, currency axes, and multi-series charts." },
];

const DOCS = [
  { file: "getting-started.md", title: "Getting started", blurb: "Install, author your first file, see it rendered." },
  { file: "syntax.md", title: "Syntax reference", blurb: "Front-matter, fenced blocks, `:::` containers." },
  { file: "charts.md", title: "Charts & stats", blurb: "Every visualization type with all options." },
  { file: "data.md", title: "Data", blurb: "Inline CSV / JSON and file-referenced datasets." },
  { file: "themes-and-styles.md", title: "Themes & styles", blurb: "Built-in themes and how to define named styles." },
  { file: "cli.md", title: "CLI", blurb: "`render`, `preview`, `export --pdf`." },
  { file: "vscode.md", title: "VS Code extension", blurb: "Side-by-side live preview." },
  { file: "publishing-vscode-extension.md", title: "Publishing the VS Code extension", blurb: "Marketplace workflow." },
];

async function rmrf(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyFile(from, to) {
  await ensureDir(path.dirname(to));
  await fs.copyFile(from, to);
}

async function readTemplate(name) {
  return fs.readFile(path.join(TEMPLATE, name), "utf8");
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ""));
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function buildExamplesGallery(shell) {
  const cards = EXAMPLES.map((e) => `
    <div class="card card-split">
      <a class="card-main" href="examples/${e.id}.html">
        <h3>${escapeHtml(e.title)}</h3>
        <p>${escapeHtml(e.blurb)}</p>
      </a>
      <div class="card-foot">
        <a class="meta" href="examples/${e.id}.html">View rendered →</a>
        <a class="meta-link" href="examples/source/${e.id}.mdv">source</a>
      </div>
    </div>`).join("\n");

  const body = `
    <section class="page-head">
      <h1>Examples</h1>
      <p>Every v1 feature, end to end. Each card opens the rendered output; the <code>source</code> link shows the original <code>.mdv</code> input.</p>
    </section>
    <section class="card-grid">${cards}</section>`;

  return fillTemplate(shell, {
    title: "Examples — MDV",
    active_examples: "active",
    active_docs: "",
    active_home: "",
    body,
    base: "./",
  });
}

async function buildDocsIndex(shell) {
  const cards = DOCS.map((d) => {
    const slug = d.file.replace(/\.md$/, "");
    return `
    <a class="card" href="docs/${slug}.html">
      <h3>${escapeHtml(d.title)}</h3>
      <p>${escapeHtml(d.blurb)}</p>
      <div class="card-foot"><span class="meta">Read →</span></div>
    </a>`;
  }).join("\n");

  const body = `
    <section class="page-head">
      <h1>Documentation</h1>
      <p>Reference material for authors and contributors.</p>
    </section>
    <section class="card-grid">${cards}</section>`;

  return fillTemplate(shell, {
    title: "Documentation — MDV",
    active_examples: "",
    active_docs: "active",
    active_home: "",
    body,
    base: "./",
  });
}

async function renderDoc(file) {
  const full = path.join(DOCS_SRC, file);
  return renderFile(full);
}

function wrapDocPage(shell, title, mdvHtml) {
  const startBody = mdvHtml.indexOf("<body>") + "<body>".length;
  const endBody = mdvHtml.indexOf("</body>");
  const inner = mdvHtml.slice(startBody, endBody).trim();
  const body = `<section class="doc-content">${inner}</section>`;
  return fillTemplate(shell, {
    title: `${title} — MDV`,
    active_examples: "",
    active_docs: "active",
    active_home: "",
    body,
    base: "../",
  });
}

async function main() {
  console.log("Building site/...");
  await rmrf(SITE);
  await ensureDir(SITE);

  const shell = await readTemplate("shell.html");
  const indexBody = await readTemplate("index-body.html");
  const css = await readTemplate("site.css");

  // Landing
  const landingHtml = fillTemplate(shell, {
    title: "MDV — Markdown Data & Visualization",
    active_examples: "",
    active_docs: "",
    active_home: "active",
    body: indexBody,
    base: "./",
  });
  await fs.writeFile(path.join(SITE, "index.html"), landingHtml, "utf8");

  // Shared CSS
  await ensureDir(path.join(SITE, "assets"));
  await fs.writeFile(path.join(SITE, "assets", "site.css"), css, "utf8");

  // Examples gallery
  const galleryHtml = await buildExamplesGallery(shell);
  await fs.writeFile(path.join(SITE, "examples.html"), galleryHtml, "utf8");

  // Copy rendered example HTML + sources
  await ensureDir(path.join(SITE, "examples"));
  await ensureDir(path.join(SITE, "examples", "source"));
  for (const e of EXAMPLES) {
    await copyFile(path.join(EXAMPLES_OUT, `${e.id}.html`), path.join(SITE, "examples", `${e.id}.html`));
    await copyFile(path.join(EXAMPLES_SRC, `${e.id}.mdv`), path.join(SITE, "examples", "source", `${e.id}.mdv`));
  }

  // Docs index + rendered docs
  const docsIndexHtml = await buildDocsIndex(shell);
  await fs.writeFile(path.join(SITE, "docs.html"), docsIndexHtml, "utf8");
  await ensureDir(path.join(SITE, "docs"));
  for (const d of DOCS) {
    const rendered = await renderDoc(d.file);
    const wrapped = wrapDocPage(shell, d.title, rendered);
    const slug = d.file.replace(/\.md$/, "");
    await fs.writeFile(path.join(SITE, "docs", `${slug}.html`), wrapped, "utf8");
  }

  console.log(`Wrote site/ — ${EXAMPLES.length} examples, ${DOCS.length} docs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
