import type { TableMeta } from "../ast.js";
import { escapeHtml } from "./svg-util.js";

export function renderTable(meta: TableMeta): string {
  const rows = meta.data;
  if (!rows.length) return `<div class="mdv-error">Table has no data rows</div>`;
  const headers = Object.keys(rows[0]);
  const head = `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`;
  const body = `<tbody>${rows
    .map(
      (r) => `<tr>${headers.map((h) => `<td>${escapeHtml(r[h] ?? "")}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody>`;
  return `<table class="mdv-table">${head}${body}</table>`;
}
