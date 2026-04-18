import type { ChartMeta } from "../ast.js";
import type { Theme } from "../themes.js";
import { escapeHtml, niceTicks, formatNumber, parseFormat } from "./svg-util.js";

export function renderLineChart(meta: ChartMeta, theme: Theme): string {
  const xKey = meta.opts.x as string;
  const yKey = meta.opts.y as string;
  const seriesKey = meta.opts.series as string | undefined;
  if (!xKey || !yKey) return `<div class="mdv-error">Line chart requires x= and y= options</div>`;
  const rows = meta.data;
  if (!rows.length) return `<div class="mdv-error">Line chart has no data rows</div>`;

  const yfmt = parseFormat(meta.opts.yFormat);
  const W = 720, H = 360, pad = { t: 30, r: 110, b: 50, l: 70 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

  const groups = new Map<string, typeof rows>();
  if (seriesKey) {
    for (const r of rows) {
      const s = String(r[seriesKey] ?? "");
      if (!groups.has(s)) groups.set(s, []);
      groups.get(s)!.push(r);
    }
  } else {
    groups.set("", rows);
  }

  const xUnique: string[] = [];
  for (const r of rows) {
    const s = String(r[xKey]);
    if (!xUnique.includes(s)) xUnique.push(s);
  }
  const xScale = (v: unknown) => {
    const idx = xUnique.indexOf(String(v));
    const denom = Math.max(1, xUnique.length - 1);
    return pad.l + (idx / denom) * iw;
  };
  const allYs = rows.map((r) => Number(r[yKey] ?? 0));
  const ymin = Math.min(0, ...allYs);
  const ymax = Math.max(...allYs);
  const ticks = niceTicks(ymin, ymax, 5);
  const t0 = ticks[0], tN = ticks[ticks.length - 1];
  const yScale = (v: number) => pad.t + ih - ((v - t0) / (tN - t0)) * ih;

  const palette = theme.chartPalette;
  const showPoints = Boolean(meta.opts.points);
  let i = 0;
  const parts: string[] = [];
  const legend: string[] = [];
  for (const [name, groupRows] of groups) {
    const color = palette[i % palette.length];
    const pts = groupRows.map((r) => {
      const x = xScale(r[xKey]);
      const y = yScale(Number(r[yKey] ?? 0));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    parts.push(`<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}"/>`);
    if (showPoints) {
      for (const r of groupRows) {
        const x = xScale(r[xKey]);
        const y = yScale(Number(r[yKey] ?? 0));
        parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}"><title>${escapeHtml(String(r[xKey]))}: ${formatNumber(Number(r[yKey]), yfmt)}</title></circle>`);
      }
    }
    if (name) {
      legend.push(`<g transform="translate(${W - pad.r + 10},${pad.t + i * 18 + 4})"><rect width="12" height="12" fill="${color}"/><text x="18" y="10" font-size="12" fill="${theme.textColor}">${escapeHtml(name)}</text></g>`);
    }
    i++;
  }

  const xLabels = xUnique.map((lbl) => {
    const x = xScale(lbl);
    return `<text x="${x.toFixed(1)}" y="${H - pad.b + 18}" text-anchor="middle" font-size="11" fill="${theme.textColor}">${escapeHtml(lbl)}</text>`;
  }).join("");
  const yTicks = ticks.map((v) => {
    const y = yScale(v);
    return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.08)"/><text x="${pad.l - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${theme.textColor}">${formatNumber(v, yfmt)}</text>`;
  }).join("");

  const title = (meta.opts.title as string) || "";
  const t = title ? `<div class="mdv-chart-title">${escapeHtml(title)}</div>` : "";
  return `<figure class="mdv-chart">${t}<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">${yTicks}${parts.join("")}${xLabels}${legend.join("")}</svg></figure>`;
}
