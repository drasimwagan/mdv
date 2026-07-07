import type { ChartMeta } from "../ast.js";
import type { Theme } from "../themes.js";
import { escapeHtml, niceTicks, formatNumber, parseFormat, columnSet, numericColumn } from "./svg-util.js";

export function renderBarChart(meta: ChartMeta, theme: Theme): string {
  const xKey = meta.opts.x as string;
  const yKey = meta.opts.y as string;
  if (!xKey || !yKey) return errBlock("Bar chart requires x= and y= options");
  const rows = meta.data;
  if (!rows.length) return errBlock("Bar chart has no data rows");
  const cols = columnSet(rows);
  if (!cols.has(xKey)) return errBlock(`Bar chart: column '${xKey}' not found in data (available: ${[...cols].join(", ")})`);
  if (!cols.has(yKey)) return errBlock(`Bar chart: column '${yKey}' not found in data (available: ${[...cols].join(", ")})`);
  const labels = rows.map((r) => String(r[xKey] ?? ""));
  const values = numericColumn(rows, yKey);
  if (typeof values === "string") return errBlock(`Bar chart: ${values}`);
  const yfmt = parseFormat(meta.opts.yFormat);
  const W = 720, H = 360, pad = { t: 30, r: 30, b: 50, l: 70 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  // The y-domain always includes zero on both sides so bars are anchored to a
  // zero baseline and all-negative data stays inside the viewBox.
  let ymin = 0, ymax = 0;
  for (const v of values) {
    if (v < ymin) ymin = v;
    if (v > ymax) ymax = v;
  }
  const ticks = niceTicks(ymin, ymax, 5);
  const t0 = ticks[0], tN = ticks[ticks.length - 1];
  const yScale = (v: number) => pad.t + ih - ((v - t0) / (tN - t0)) * ih;
  const slotW = iw / labels.length;
  const bw = slotW * 0.7;
  const color = theme.chartPalette[0];
  const title = (meta.opts.title as string) || "";

  const bars = labels.map((lbl, i) => {
    const x = pad.l + i * slotW + (slotW - bw) / 2;
    const yTop = yScale(Math.max(0, values[i]));
    const yBase = yScale(0);
    const h = Math.max(1, Math.abs(yBase - yScale(values[i])));
    const y = values[i] >= 0 ? yTop : yBase;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}"><title>${escapeHtml(lbl)}: ${formatNumber(values[i], yfmt)}</title></rect>`;
  }).join("");

  const xLabels = labels.map((lbl, i) => {
    const x = pad.l + i * slotW + slotW / 2;
    return `<text x="${x.toFixed(1)}" y="${H - pad.b + 18}" text-anchor="middle" font-size="11" fill="${theme.textColor}">${escapeHtml(lbl)}</text>`;
  }).join("");

  const yTicks = ticks.map((v) => {
    const y = yScale(v);
    return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.08)"/><text x="${pad.l - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${theme.textColor}">${formatNumber(v, yfmt)}</text>`;
  }).join("");

  const t = title ? `<div class="mdv-chart-title">${escapeHtml(title)}</div>` : "";
  return `<figure class="mdv-chart">${t}<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">${yTicks}${bars}${xLabels}</svg></figure>`;
}

function errBlock(msg: string): string {
  return `<div class="mdv-error">${escapeHtml(msg)}</div>`;
}
