import fs from "node:fs/promises";
import path from "node:path";

export type Row = Record<string, string | number | boolean | null>;

function coerce(v: string): string | number | boolean | null {
  const t = v.trim();
  if (t === "") return "";
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

export function parseCsv(src: string): Row[] {
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && src[i + 1] === "\n") i++;
        cur.push(field); field = "";
        if (cur.some(f => f !== "")) lines.push(cur);
        cur = [];
      } else field += c;
    }
  }
  if (field !== "" || cur.length) {
    cur.push(field);
    if (cur.some(f => f !== "")) lines.push(cur);
  }
  if (lines.length === 0) return [];
  const header = lines[0].map(h => h.trim());
  return lines.slice(1).map(row => {
    const r: Row = {};
    header.forEach((h, i) => {
      const raw = row[i] ?? "";
      r[h] = coerce(raw);
    });
    return r;
  });
}

export function parseJson(src: string): Row[] {
  const v = JSON.parse(src);
  if (!Array.isArray(v)) throw new Error("JSON data must be an array of objects");
  return v as Row[];
}

export async function loadDataset(relPath: string, baseDir: string): Promise<Row[]> {
  const full = path.resolve(baseDir, relPath);
  const normalizedBase = path.resolve(baseDir);
  if (!full.startsWith(normalizedBase + path.sep) && full !== normalizedBase) {
    throw new Error(`Data file path escapes base directory: ${relPath}`);
  }
  const src = await fs.readFile(full, "utf8");
  const ext = path.extname(full).toLowerCase();
  if (ext === ".csv" || ext === ".tsv") return parseCsv(src);
  if (ext === ".json") return parseJson(src);
  throw new Error(`Unsupported data file extension: ${ext}`);
}
