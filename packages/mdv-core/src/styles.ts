import type { Theme } from "./themes.js";

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

function resolveSize(v: string): string {
  if (v === "small") return "0.875em";
  if (v === "medium") return "1em";
  if (v === "large") return "1.25em";
  return v;
}

export interface StyleCompileResult {
  css: string;
  warnings: string[];
}

function cssSafe(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function compileStyles(
  styles: Record<string, unknown> | undefined,
  theme: Theme,
): StyleCompileResult {
  const warnings: string[] = [];
  if (!styles || typeof styles !== "object") return { css: "", warnings };
  const parts: string[] = [];
  for (const [name, defRaw] of Object.entries(styles)) {
    if (!defRaw || typeof defRaw !== "object") continue;
    const def = defRaw as Record<string, unknown>;
    const rules: string[] = [];
    for (const [k, vRaw] of Object.entries(def)) {
      if (!VALID_KEYS.has(k)) {
        warnings.push(`Unknown style key '${k}' in style '${name}'`);
        continue;
      }
      const v = String(vRaw);
      // The compiled CSS is emitted verbatim inside a <style> element. A value
      // containing these characters could close the rule or the element and
      // inject markup (e.g. `red } </style><script>…`). None are valid in the
      // flat style vocabulary, so reject the declaration.
      if (/[<>{}]/.test(v) || v.includes("</")) {
        warnings.push(`Unsafe character in style value for '${k}' in style '${name}' — ignored`);
        continue;
      }
      switch (k) {
        case "color": rules.push(`color: ${v}`); break;
        case "background": rules.push(`background: ${v}`); break;
        case "border": rules.push(`border: ${v}`); break;
        case "padding": rules.push(`padding: ${resolveSpacing(v, theme)}`); break;
        case "margin": rules.push(`margin: ${resolveSpacing(v, theme)}`); break;
        case "font": rules.push(`font-family: ${v}`); break;
        case "size": rules.push(`font-size: ${resolveSize(v)}`); break;
        case "weight": rules.push(`font-weight: ${v}`); break;
        case "align": rules.push(`text-align: ${v}`); break;
        case "width": rules.push(`width: ${v}`); break;
        case "radius": rules.push(`border-radius: ${resolveRadius(v, theme)}`); break;
      }
    }
    if (rules.length) {
      parts.push(`.mdv-style-${cssSafe(name)} { ${rules.join("; ")}; }`);
    }
  }
  return { css: parts.join("\n"), warnings };
}

export function baseThemeCss(theme: Theme): string {
  return `
.mdv-doc { font-family: ${theme.font}; font-size: ${theme.fontSize}; color: ${theme.textColor}; background: ${theme.background}; max-width: 860px; margin: 2em auto; padding: 2em 1em; line-height: 1.55; }
body { background: ${theme.background}; margin: 0; }
.mdv-doc h1, .mdv-doc h2, .mdv-doc h3, .mdv-doc h4 { color: ${theme.headingColor}; line-height: 1.25; }
.mdv-doc a { color: ${theme.accent}; }
.mdv-doc code { background: rgba(0,0,0,0.06); padding: 0.1em 0.35em; border-radius: 3px; font-size: 0.92em; }
.mdv-doc pre { background: rgba(0,0,0,0.06); padding: ${theme.spacing.medium}; border-radius: ${theme.radius.small}; overflow-x: auto; }
.mdv-doc blockquote { border-left: 3px solid ${theme.accent}; margin: 1em 0; padding: 0.2em 1em; opacity: 0.85; }
.mdv-doc table.mdv-table, .mdv-doc table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.mdv-doc th, .mdv-doc td { padding: 0.5em 0.8em; border-bottom: 1px solid rgba(0,0,0,0.1); text-align: left; }
.mdv-doc th { font-weight: 600; border-bottom: 2px solid ${theme.accent}; }
.mdv-doc .mdv-columns { display: grid; gap: ${theme.spacing.large}; grid-template-columns: 1fr 1fr; margin: 1em 0; }
.mdv-doc .mdv-error { background: #ffecec; border-left: 4px solid #c64a4a; padding: ${theme.spacing.medium}; margin: 1em 0; font-family: monospace; font-size: 0.9em; color: #5a1a1a; border-radius: ${theme.radius.small}; }
.mdv-doc .mdv-warning { background: #fff8e0; border-left: 4px solid #e0b84a; padding: ${theme.spacing.small} ${theme.spacing.medium}; margin: 0.5em 0; font-size: 0.9em; color: #5a4416; border-radius: ${theme.radius.small}; }
.mdv-doc .mdv-chart { margin: 1.2em 0; }
.mdv-doc .mdv-chart-title { font-weight: 600; margin-bottom: 0.5em; font-size: 1.05em; }
.mdv-doc .mdv-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: ${theme.spacing.medium}; margin: 1em 0; }
.mdv-doc .mdv-stat-card { background: ${theme.background === "#fff" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.04)"}; border: 1px solid rgba(0,0,0,0.08); border-left: 4px solid ${theme.accent}; padding: ${theme.spacing.medium}; border-radius: ${theme.radius.small}; }
.mdv-doc .mdv-stat-value { font-size: 1.8em; font-weight: 700; color: ${theme.headingColor}; line-height: 1.1; }
.mdv-doc .mdv-stat-label { font-size: 0.9em; opacity: 0.75; margin-top: 0.25em; }
.mdv-doc .mdv-stat-delta { font-size: 0.85em; margin-top: 0.4em; font-weight: 600; }
.mdv-doc .mdv-toc { background: rgba(0,0,0,0.03); padding: ${theme.spacing.medium} ${theme.spacing.large}; border-radius: ${theme.radius.small}; margin: 1em 0; }
.mdv-doc .mdv-toc-title { font-weight: 600; margin-bottom: 0.4em; }
.mdv-doc .mdv-toc ul { list-style: none; padding-left: 0; margin: 0; }
.mdv-doc .mdv-toc li { padding: 0.15em 0; }
.mdv-doc .mdv-toc li.mdv-toc-sub { padding-left: 1.5em; font-size: 0.95em; opacity: 0.85; }
  `.trim();
}
