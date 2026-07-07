import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "./parser.js";
import { renderDocument } from "./render/html.js";

export { parse } from "./parser.js";
export { renderDocument as render } from "./render/html.js";
export type { MdvDoc, MdvToken, ChartMeta, TableMeta, ContainerMeta, ErrorMeta } from "./ast.js";
export { THEMES, getTheme, type Theme } from "./themes.js";

export interface RenderResult {
  html: string;
  /** Fatal error messages (e.g. invalid front-matter) that rendered as a top banner. */
  fatals: string[];
  /** Warning messages (unknown theme/style key, ragged data, unclosed container). */
  warnings: string[];
}

export async function renderFileWithDiagnostics(file: string): Promise<RenderResult> {
  const src = await fs.readFile(file, "utf8");
  const doc = await parse(src, { baseDir: path.dirname(path.resolve(file)) });
  const html = renderDocument(doc);
  const fatals: string[] = [];
  const warnings: string[] = [];
  for (const t of doc.tokens) {
    if (t.kind !== "error") continue;
    if (t.meta.severity === "fatal") fatals.push(t.meta.message);
    else if (t.meta.severity === "warning") warnings.push(t.meta.message);
  }
  return { html, fatals, warnings };
}

export async function renderFile(file: string): Promise<string> {
  return (await renderFileWithDiagnostics(file)).html;
}

export const VERSION = "0.2.0";
