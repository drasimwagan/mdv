import yaml from "js-yaml";

export interface FrontmatterResult {
  data: Record<string, unknown>;
  body: string;
}

export interface FrontmatterSafeResult extends FrontmatterResult {
  /** Set when the YAML is invalid; `data` is empty and `body` has the front-matter block stripped. */
  error?: string;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function extractFrontmatterSafe(source: string): FrontmatterSafeResult {
  const m = source.match(FM_RE);
  if (!m) return { data: {}, body: source };
  const body = source.slice(m[0].length);
  try {
    const parsed = yaml.load(m[1]);
    const data = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    return { data, body };
  } catch (e) {
    return { data: {}, body, error: `Invalid front-matter YAML: ${(e as Error).message}` };
  }
}

export function extractFrontmatter(source: string): FrontmatterResult {
  const r = extractFrontmatterSafe(source);
  if (r.error) throw new Error(r.error);
  return { data: r.data, body: r.body };
}
