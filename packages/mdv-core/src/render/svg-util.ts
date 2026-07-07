import type { Row } from "../data.js";

/** Union of column names across all rows (JSON rows may be ragged). */
export function columnSet(rows: Row[]): Set<string> {
  const s = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) s.add(k);
  return s;
}

/**
 * Extract a numeric column. Empty and null cells become 0 (sparse data is
 * legitimate and rendered as a zero-height mark, as before). A genuinely
 * non-numeric value — a stray unit suffix like "12%" or a text column — returns
 * an error string so the caller can show a red banner instead of silently-wrong
 * output. A misspelled column name is caught earlier by {@link columnSet}.
 */
export function numericColumn(rows: Row[], key: string): number[] | string {
  const out: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i][key];
    if (raw == null || raw === "" || (typeof raw === "string" && raw.trim() === "")) {
      out.push(0);
      continue;
    }
    if (typeof raw === "boolean") {
      return `column '${key}' has a non-numeric value '${raw}' (data row ${i + 1})`;
    }
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) {
      return `column '${key}' has a non-numeric value '${String(raw)}' (data row ${i + 1})`;
    }
    out.push(n);
  }
  return out;
}

export function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
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
  for (let v = tickMin; v <= tickMax + step / 2; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

export function fmt(n: number): string {
  if (!isFinite(n)) return String(n);
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US");
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

export type NumberFormat = "currency" | "percent" | "thousands" | "plain";

export function formatNumber(n: number, format: NumberFormat = "plain"): string {
  if (!isFinite(n)) return String(n);
  switch (format) {
    case "currency":
      return "$" + n.toLocaleString("en-US", { maximumFractionDigits: Number.isInteger(n) ? 0 : 2 });
    case "percent":
      return (n * 100).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "%";
    case "thousands":
      return n.toLocaleString("en-US");
    default:
      return fmt(n);
  }
}

export function parseFormat(v: unknown): NumberFormat {
  const s = String(v ?? "").toLowerCase();
  if (s === "currency" || s === "percent" || s === "thousands") return s;
  return "plain";
}
