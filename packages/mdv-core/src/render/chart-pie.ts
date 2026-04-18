import type { ChartMeta } from "../ast.js";
import type { Theme } from "../themes.js";
import { escapeHtml, fmt } from "./svg-util.js";

export function renderPieChart(meta: ChartMeta, theme: Theme): string {
  const labelKey = meta.opts.label as string;
  const valueKey = meta.opts.value as string;
  if (!labelKey || !valueKey) return `<div class="mdv-error">Pie chart requires label= and value= options</div>`;
  const rows = meta.data;
  if (!rows.length) return `<div class="mdv-error">Pie chart has no data rows</div>`;
  const total = rows.reduce((s, row) => s + Number(row[valueKey] ?? 0), 0);
  if (total <= 0) return `<div class="mdv-error">Pie chart total is zero</div>`;

  const W = 520, H = 360, cx = 180, cy = 180, r = 140;
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
    legend.push(`<g transform="translate(${cx + r + 40},${40 + i * 22})"><rect width="12" height="12" fill="${color}"/><text x="18" y="10" font-size="12" fill="${theme.textColor}">${escapeHtml(String(row[labelKey]))} (${fmt(val)})</text></g>`);
    angle = a2;
  });
  if (donut) slices.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="${theme.background}"/>`);

  const title = (meta.opts.title as string) || "";
  const t = title ? `<div class="mdv-chart-title">${escapeHtml(title)}</div>` : "";
  return `<figure class="mdv-chart">${t}<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">${slices.join("")}${legend.join("")}</svg></figure>`;
}
