import type { MdvDoc } from "../ast.js";
import { getTheme, THEMES } from "../themes.js";
import { baseThemeCss, compileStyles } from "../styles.js";
import { renderBarChart } from "./chart-bar.js";
import { renderLineChart } from "./chart-line.js";
import { renderPieChart } from "./chart-pie.js";
import { renderTable } from "./table.js";
import { renderStatBlock } from "./stat.js";
import { escapeHtml } from "./svg-util.js";
import { mdInstance } from "../parser.js";
import type { Token } from "../ast.js";

function cssSafe(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function renderToc(headings: { level: number; text: string; slug: string }[]): string {
  const shown = headings.filter((h) => h.level >= 2 && h.level <= 3);
  if (!shown.length) return `<nav class="mdv-toc"><em>No headings to list.</em></nav>`;
  const items = shown.map((h) => {
    const indent = h.level === 3 ? "mdv-toc-sub" : "";
    return `<li class="${indent}"><a href="#${h.slug}">${escapeHtml(h.text)}</a></li>`;
  }).join("");
  return `<nav class="mdv-toc"><div class="mdv-toc-title">Contents</div><ul>${items}</ul></nav>`;
}

export function renderDocument(doc: MdvDoc): string {
  const themeName = doc.frontmatter.theme;
  const theme = getTheme(themeName);
  const title = (doc.frontmatter.title as string) || "MDV Document";

  const themeWarnings: string[] = [];
  if (typeof themeName === "string" && !Object.hasOwn(THEMES, themeName)) {
    themeWarnings.push(`Unknown theme '${themeName}', falling back to '${theme.name}'`);
  }
  const { css: stylesCss, warnings: styleWarnings } = compileStyles(
    doc.frontmatter.styles as Record<string, unknown>,
    theme,
  );
  const allWarnings = [...themeWarnings, ...styleWarnings];

  const body: string[] = [];
  // Fatal errors render as a top-of-doc banner (spec §6); the rest of the doc still renders.
  for (const tok of doc.tokens) {
    if (tok.kind === "error" && tok.meta.severity === "fatal") {
      body.push(`<div class="mdv-error mdv-fatal">${escapeHtml(tok.meta.message)}</div>`);
    }
  }
  for (const w of allWarnings) body.push(`<div class="mdv-warning">${escapeHtml(w)}</div>`);

  // Collect headings for optional TOC.
  const headings: { level: number; text: string; slug: string }[] = [];
  const slugs = new Set<string>();
  const slug = (s: string) => {
    let base = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
    let out = base, i = 2;
    while (slugs.has(out)) out = `${base}-${i++}`;
    slugs.add(out);
    return out;
  };
  for (let i = 0; i < doc.tokens.length; i++) {
    const t = doc.tokens[i];
    if (t.kind === "md" && t.token.type === "heading_open") {
      const level = Number(t.token.tag.slice(1));
      const inline = doc.tokens[i + 1];
      if (inline && inline.kind === "md" && inline.token.type === "inline") {
        const text = inline.token.content;
        headings.push({ level, text, slug: slug(text) });
      }
    }
  }
  let headingIdx = 0;

  let mdBuffer: Token[] = [];
  const flushMd = () => {
    if (mdBuffer.length) {
      body.push(mdInstance.renderer.render(mdBuffer as any, mdInstance.options, {}));
      mdBuffer = [];
    }
  };

  for (const tok of doc.tokens) {
    if (tok.kind === "md") {
      // Inject id on heading_open so TOC links work.
      if (tok.token.type === "heading_open" && headingIdx < headings.length) {
        const h = headings[headingIdx++];
        const attrs = (tok.token.attrs ?? []).filter((a) => a[0] !== "id");
        attrs.push(["id", h.slug]);
        tok.token.attrs = attrs;
      }
      mdBuffer.push(tok.token);
      continue;
    }
    flushMd();
    // Per-block guard: a failing block renders an inline error banner and
    // never takes down the rest of the document.
    if (tok.kind === "toc" || tok.kind === "stat" || tok.kind === "chart" || tok.kind === "table") {
      try {
        if (tok.kind === "toc") body.push(renderToc(headings));
        else if (tok.kind === "stat") body.push(renderStatBlock(tok.meta, theme));
        else if (tok.kind === "chart") {
          if (tok.meta.type === "bar") body.push(renderBarChart(tok.meta, theme));
          else if (tok.meta.type === "line") body.push(renderLineChart(tok.meta, theme));
          else if (tok.meta.type === "pie") body.push(renderPieChart(tok.meta, theme));
        } else body.push(renderTable(tok.meta));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        body.push(`<div class="mdv-error">Failed to render ${tok.kind} block: ${escapeHtml(msg)}</div>`);
      }
      continue;
    }
    if (tok.kind === "container-open") {
      const name = tok.meta.name;
      if (name === "columns") body.push(`<div class="mdv-columns">`);
      else if (name === "col") body.push(`<div class="mdv-col">`);
      else body.push(`<div class="mdv-style-${cssSafe(name)}">`);
    } else if (tok.kind === "container-close") {
      body.push(`</div>`);
    } else if (tok.kind === "error") {
      if (tok.meta.severity === "fatal") continue; // already rendered at top of doc
      const cls = tok.meta.severity === "warning" ? "mdv-warning" : "mdv-error";
      body.push(
        `<div class="${cls}">${escapeHtml(tok.meta.message)}${tok.meta.source ? ` <code>(${escapeHtml(tok.meta.source)})</code>` : ""}</div>`,
      );
    }
  }
  flushMd();

  const css = baseThemeCss(theme) + (stylesCss ? "\n" + stylesCss : "");

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
