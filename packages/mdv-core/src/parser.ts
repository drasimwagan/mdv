import MarkdownIt from "markdown-it";
import { extractFrontmatter } from "./frontmatter.js";
import { parseInfoString } from "./infostring.js";
import { parseCsv, parseJson, loadDataset, type Row } from "./data.js";
import type { MdvDoc, MdvToken, ChartMeta } from "./ast.js";

export const mdInstance = new MarkdownIt({ html: true, linkify: true, typographer: false });

function transformDirectives(body: string): string {
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(/^:::\s*(.*)$/);
    if (m) {
      const name = m[1].trim();
      if (name === "") out.push("", "<!--MDV_DIR_CLOSE-->", "");
      else out.push("", `<!--MDV_DIR_OPEN ${name}-->`, "");
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}

async function resolveBlockData(
  opts: Record<string, string | boolean>,
  body: string,
  frontmatter: Record<string, unknown>,
  baseDir: string,
): Promise<Row[]> {
  const format = (opts.format as string) || "csv";
  if (typeof opts.data === "string") {
    const dataMap = (frontmatter.data as Record<string, string>) || {};
    const ref = dataMap[opts.data];
    if (!ref) throw new Error(`Dataset '${opts.data}' not declared in front-matter`);
    return loadDataset(ref, baseDir);
  }
  if (format === "json") return parseJson(body);
  return parseCsv(body);
}

export async function parse(source: string, opts: { baseDir?: string } = {}): Promise<MdvDoc> {
  const baseDir = opts.baseDir ?? process.cwd();
  const { data: frontmatter, body } = extractFrontmatter(source);
  const transformed = transformDirectives(body);
  const mdTokens = mdInstance.parse(transformed, {});
  const out: MdvToken[] = [];
  let skipNextClose = false;

  for (const tok of mdTokens) {
    if (tok.type === "fence") {
      const info = parseInfoString(tok.info);
      if (info.lang === "chart") {
        const type = info.opts.type as ChartMeta["type"];
        if (!["bar", "line", "pie"].includes(type)) {
          out.push({
            kind: "error",
            meta: { severity: "block", message: `Unknown chart type: ${type ?? "(missing)"}`, source: tok.info },
          });
          continue;
        }
        try {
          const rows = await resolveBlockData(info.opts, tok.content, frontmatter, baseDir);
          out.push({ kind: "chart", meta: { type, opts: info.opts, data: rows } });
        } catch (e) {
          out.push({ kind: "error", meta: { severity: "block", message: (e as Error).message, source: tok.info } });
        }
        continue;
      }
      if (info.lang === "table") {
        try {
          const rows = await resolveBlockData(info.opts, tok.content, frontmatter, baseDir);
          out.push({ kind: "table", meta: { opts: info.opts, data: rows } });
        } catch (e) {
          out.push({ kind: "error", meta: { severity: "block", message: (e as Error).message, source: tok.info } });
        }
        continue;
      }
      if (info.lang === "stat") {
        try {
          const rows = await resolveBlockData(info.opts, tok.content, frontmatter, baseDir);
          out.push({ kind: "stat", meta: { opts: info.opts, data: rows } });
        } catch (e) {
          out.push({ kind: "error", meta: { severity: "block", message: (e as Error).message, source: tok.info } });
        }
        continue;
      }
    }
    if (tok.type === "html_block") {
      const openMatch = tok.content.match(/<!--MDV_DIR_OPEN\s+([^-]+)-->/);
      if (openMatch) {
        const name = openMatch[1].trim();
        if (name === "toc") {
          out.push({ kind: "toc" });
          skipNextClose = true;
          continue;
        }
        out.push({ kind: "container-open", meta: { name } });
        continue;
      }
      if (tok.content.includes("<!--MDV_DIR_CLOSE-->")) {
        if (skipNextClose) { skipNextClose = false; continue; }
        out.push({ kind: "container-close" });
        continue;
      }
    }
    out.push({ kind: "md", token: tok });
  }
  return { frontmatter, tokens: out, baseDir };
}
