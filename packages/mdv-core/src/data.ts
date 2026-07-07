import fs from "node:fs/promises";
import path from "node:path";

export type Row = Record<string, string | number | boolean | null>;

export interface CsvParseResult {
  rows: Row[];
  warnings: string[];
}

function coerce(v: string): string | number | boolean | null {
  const t = v.trim();
  if (t === "") return "";
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

export function parseCsvFull(src: string, delimiter = ","): CsvParseResult {
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
      else if (c === delimiter) { cur.push(field); field = ""; }
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
  if (lines.length === 0) return { rows: [], warnings: [] };
  const header = lines[0].map(h => h.trim());
  const warnings: string[] = [];
  const MAX_RAGGED_WARNINGS = 3;
  const delimName = delimiter === "\t" ? "tab" : delimiter === "," ? "comma" : `'${delimiter}'`;
  const quoted = delimiter === "\t" ? '"a\tb"' : '"1,238"';
  let ragged = 0;
  const rows = lines.slice(1).map((row, idx) => {
    // A trailing delimiter produces one extra empty field; that is harmless and
    // renders identically, so only warn when the surplus/deficit is meaningful.
    const surplusAllEmpty = row.length > header.length && row.slice(header.length).every((f) => f === "");
    if (row.length !== header.length && !surplusAllEmpty) {
      ragged++;
      if (ragged <= MAX_RAGGED_WARNINGS) {
        warnings.push(
          `Data row ${idx + 1} has ${row.length} fields but the header has ${header.length} columns — ` +
          `quote values that contain the ${delimName} (e.g. ${quoted})`,
        );
      }
    }
    const r: Row = {};
    header.forEach((h, i) => {
      const raw = row[i] ?? "";
      r[h] = coerce(raw);
    });
    return r;
  });
  if (ragged > MAX_RAGGED_WARNINGS) {
    warnings.push(`…and ${ragged - MAX_RAGGED_WARNINGS} more rows with mismatched field counts`);
  }
  return { rows, warnings };
}

export function parseCsv(src: string, delimiter = ","): Row[] {
  return parseCsvFull(src, delimiter).rows;
}

export function parseJson(src: string): Row[] {
  const v = JSON.parse(src);
  if (!Array.isArray(v)) throw new Error("JSON data must be an array of objects");
  for (const item of v) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error("JSON data must be an array of objects (found a non-object element)");
    }
  }
  return v as Row[];
}

export async function loadDataset(relPath: string, baseDir: string, warnings?: string[]): Promise<Row[]> {
  const normalizedBase = path.resolve(baseDir);
  const full = path.resolve(normalizedBase, relPath);
  const rel = path.relative(normalizedBase, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Data file path escapes base directory: ${relPath}`);
  }
  let src: string;
  try {
    src = await fs.readFile(full, "utf8");
  } catch (e) {
    // Report the author's relative reference, not the absolute path — error
    // messages end up in shareable rendered HTML.
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") throw new Error(`Data file not found: ${relPath}`);
    throw new Error(`Cannot read data file '${relPath}'${code ? ` (${code})` : ""}`);
  }
  const ext = path.extname(full).toLowerCase();
  if (ext === ".csv" || ext === ".tsv") {
    const res = parseCsvFull(src, ext === ".tsv" ? "\t" : ",");
    if (warnings) warnings.push(...res.warnings);
    return res.rows;
  }
  if (ext === ".json") return parseJson(src);
  throw new Error(`Unsupported data file extension: ${ext}`);
}
