import type { TableMeta } from "../ast.js";
import type { Theme } from "../themes.js";
import { escapeHtml } from "./svg-util.js";

export function renderStatBlock(meta: TableMeta, theme: Theme): string {
  const rows = meta.data;
  if (!rows.length) return `<div class="mdv-error">Stat block has no rows</div>`;

  const cards = rows.map((r) => {
    const label = String(r.label ?? "");
    const value = String(r.value ?? "");
    const delta = r.delta != null && r.delta !== "" ? String(r.delta) : null;
    const deltaNum = delta != null ? Number(delta.replace(/[^0-9.-]/g, "")) : NaN;
    let deltaHtml = "";
    if (delta != null) {
      const positive = !isNaN(deltaNum) ? deltaNum >= 0 : delta.trim().startsWith("+");
      const color = positive ? "#3aa675" : "#c64a4a";
      const arrow = positive ? "▲" : "▼";
      deltaHtml = `<div class="mdv-stat-delta" style="color:${color}">${arrow} ${escapeHtml(delta)}</div>`;
    }
    return `<div class="mdv-stat-card">
  <div class="mdv-stat-value">${escapeHtml(value)}</div>
  <div class="mdv-stat-label">${escapeHtml(label)}</div>
  ${deltaHtml}
</div>`;
  }).join("");

  return `<div class="mdv-stat-grid" style="--mdv-stat-accent:${theme.accent}">${cards}</div>`;
}
