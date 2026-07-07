import MarkdownIt from "markdown-it";
import { extractFrontmatterSafe } from "./frontmatter.js";
import { parseInfoString } from "./infostring.js";
import { parseCsvFull, parseJson, loadDataset, type Row } from "./data.js";
import { preprocess, directiveFromText } from "./preprocess.js";
import type { MdvDoc, MdvToken, ChartMeta } from "./ast.js";

// html:false — raw HTML in the authoring surface is escaped, never emitted
// verbatim into exports ("no selectors, no expressions, no code"). `:::`
// directives and HTML comments are handled by the fence-aware preprocessor
// (see preprocess.ts) rather than a markdown-it rule, so they interact
// correctly with blockquotes, tables and lists.
export const mdInstance = new MarkdownIt({ html: false, linkify: true, typographer: false });

async function resolveBlockData(
  opts: Record<string, string | boolean>,
  body: string,
  frontmatter: Record<string, unknown>,
  baseDir: string,
): Promise<{ rows: Row[]; warnings: string[] }> {
  const format = (opts.format as string) || "csv";
  const warnings: string[] = [];
  if (typeof opts.data === "string") {
    const dataMap = (frontmatter.data as Record<string, unknown>) || {};
    // Object.hasOwn: a dataset name like "constructor" must not resolve through
    // the prototype chain into a Function.
    const ref = typeof dataMap === "object" && dataMap && Object.hasOwn(dataMap, opts.data)
      ? (dataMap as Record<string, unknown>)[opts.data]
      : undefined;
    if (typeof ref !== "string") throw new Error(`Dataset '${opts.data}' not declared in front-matter`);
    const rows = await loadDataset(ref, baseDir, warnings);
    return { rows, warnings };
  }
  if (format === "json") return { rows: parseJson(body), warnings };
  const res = parseCsvFull(body);
  return { rows: res.rows, warnings: res.warnings };
}

export async function parse(source: string, opts: { baseDir?: string } = {}): Promise<MdvDoc> {
  const baseDir = opts.baseDir ?? process.cwd();
  const { data: frontmatter, body, error: fmError } = extractFrontmatterSafe(source);
  const out: MdvToken[] = [];
  if (fmError) {
    // Fatal per spec §6: top-of-doc banner; the body still renders below it.
    out.push({ kind: "error", meta: { severity: "fatal", message: fmError } });
  }
  const mdTokens = mdInstance.parse(preprocess(body), {});
  const containerStack: string[] = [];
  const pushWarnings = (warnings: string[]) => {
    for (const w of warnings) out.push({ kind: "error", meta: { severity: "warning", message: w } });
  };

  for (let i = 0; i < mdTokens.length; i++) {
    const tok = mdTokens[i];

    // A directive sentinel is a standalone paragraph: paragraph_open, inline, paragraph_close.
    if (tok.type === "paragraph_open" && mdTokens[i + 1]?.type === "inline" && mdTokens[i + 2]?.type === "paragraph_close") {
      const dir = directiveFromText(mdTokens[i + 1].content);
      if (dir) {
        i += 2; // consume the three paragraph tokens
        if (dir.kind === "open") {
          if (dir.name === "toc") {
            out.push({ kind: "toc" });
            containerStack.push("toc");
          } else {
            containerStack.push(dir.name);
            out.push({ kind: "container-open", meta: { name: dir.name } });
          }
        } else {
          const opened = containerStack.pop();
          if (opened === undefined) {
            out.push({ kind: "error", meta: { severity: "warning", message: "Ignored a ':::' close with no open container" } });
          } else if (opened !== "toc") {
            out.push({ kind: "container-close" });
          }
        }
        continue;
      }
    }

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
          const { rows, warnings } = await resolveBlockData(info.opts, tok.content, frontmatter, baseDir);
          pushWarnings(warnings);
          out.push({ kind: "chart", meta: { type, opts: info.opts, data: rows } });
        } catch (e) {
          out.push({ kind: "error", meta: { severity: "block", message: (e as Error).message, source: tok.info } });
        }
        continue;
      }
      if (info.lang === "table") {
        try {
          const { rows, warnings } = await resolveBlockData(info.opts, tok.content, frontmatter, baseDir);
          pushWarnings(warnings);
          out.push({ kind: "table", meta: { opts: info.opts, data: rows } });
        } catch (e) {
          out.push({ kind: "error", meta: { severity: "block", message: (e as Error).message, source: tok.info } });
        }
        continue;
      }
      if (info.lang === "stat") {
        try {
          const { rows, warnings } = await resolveBlockData(info.opts, tok.content, frontmatter, baseDir);
          pushWarnings(warnings);
          out.push({ kind: "stat", meta: { opts: info.opts, data: rows } });
        } catch (e) {
          out.push({ kind: "error", meta: { severity: "block", message: (e as Error).message, source: tok.info } });
        }
        continue;
      }
    }

    out.push({ kind: "md", token: tok });
  }

  // Auto-close containers left open at end of document so the HTML stays
  // balanced. Emit every close first, then the warnings, so a warning never
  // renders *inside* the container it is warning about (e.g. as a phantom
  // grid cell in `::: columns`).
  const closeWarnings: string[] = [];
  while (containerStack.length) {
    const name = containerStack.pop()!;
    if (name === "toc") {
      closeWarnings.push("'::: toc' was never closed — a later ':::' may have been treated as its close");
      continue;
    }
    out.push({ kind: "container-close" });
    closeWarnings.push(`Container '::: ${name}' was never closed (auto-closed at end of document)`);
  }
  for (const w of closeWarnings) out.push({ kind: "error", meta: { severity: "warning", message: w } });

  return { frontmatter, tokens: out, baseDir };
}
