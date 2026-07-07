import type { ChartMeta } from "../ast.js";
import type { Theme } from "../themes.js";
import { escapeHtml, fmt, columnSet, numericColumn } from "./svg-util.js";

export function renderPieChart(meta: ChartMeta, theme: Theme): string {
  const labelKey = meta.opts.label as string;
  const valueKey = meta.opts.value as string;
  if (!labelKey || !valueKey) return errBlock("Pie chart requires label= and value= options");
  const rows = meta.data;
  if (!rows.length) return errBlock("Pie chart has no data rows");
  const cols = columnSet(rows);
  if (!cols.has(labelKey)) return errBlock(`Pie chart: column '${labelKey}' not found in data (available: ${[...cols].join(", ")})`);
  if (!cols.has(valueKey)) return errBlock(`Pie chart: column '${valueKey}' not found in data (available: ${[...cols].join(", ")})`);
  const vals = numericColumn(rows, valueKey);
  if (typeof vals === "string") return errBlock(`Pie chart: ${vals}`);
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] < 0) {
      return errBlock(`Pie chart values must be non-negative ('${String(rows[i][labelKey])}' is ${vals[i]})`);
    }
  }
  const total = vals.reduce((s, v) => s + v, 0);
  if (total <= 0) return errBlock("Pie chart total is zero");

  const W = 520, H = 360, cx = 180, cy = 180, r = 140;
  const donut = Boolean(meta.opts.donut);
  let angle = -Math.PI / 2;
  const slices: string[] = [];
  const legend: string[] = [];
  rows.forEach((row, i) => {
    const val = vals[i];
    const frac = val / total;
    const color = theme.chartPalette[i % theme.chartPalette.length];
    const titleEl = `<title>${escapeHtml(String(row[labelKey]))}: ${fmt(val)} (${(frac * 100).toFixed(1)}%)</title>`;
    if (frac >= 1 - 1e-9) {
      // A 100% slice: an arc whose start and end coincide draws nothing, so
      // render the full disc directly.
      slices.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}">${titleEl}</circle>`);
    } else if (frac > 0) {
      const a2 = angle + frac * Math.PI * 2;
      const large = frac > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const d = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
      slices.push(`<path d="${d}" fill="${color}">${titleEl}</path>`);
      angle = a2;
    }
    legend.push(`<g transform="translate(${cx + r + 40},${40 + i * 22})"><rect width="12" height="12" fill="${color}"/><text x="18" y="10" font-size="12" fill="${theme.textColor}">${escapeHtml(String(row[labelKey]))} (${fmt(val)})</text></g>`);
  });
  if (donut) slices.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="${theme.background}"/>`);

  const title = (meta.opts.title as string) || "";
  const t = title ? `<div class="mdv-chart-title">${escapeHtml(title)}</div>` : "";
  return `<figure class="mdv-chart">${t}<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">${slices.join("")}${legend.join("")}</svg></figure>`;
}

function errBlock(msg: string): string {
  return `<div class="mdv-error">${escapeHtml(msg)}</div>`;
}
