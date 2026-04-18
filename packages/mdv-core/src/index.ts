import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "./parser.js";
import { renderDocument } from "./render/html.js";

export { parse } from "./parser.js";
export { renderDocument as render } from "./render/html.js";
export type { MdvDoc, MdvToken, ChartMeta, TableMeta, ContainerMeta, ErrorMeta } from "./ast.js";
export { THEMES, getTheme, type Theme } from "./themes.js";

export async function renderFile(file: string): Promise<string> {
  const src = await fs.readFile(file, "utf8");
  const doc = await parse(src, { baseDir: path.dirname(path.resolve(file)) });
  return renderDocument(doc);
}

export const VERSION = "0.1.0";
