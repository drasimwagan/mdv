import yaml from "js-yaml";

export interface FrontmatterResult {
  data: Record<string, unknown>;
  body: string;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function extractFrontmatter(source: string): FrontmatterResult {
  const m = source.match(FM_RE);
  if (!m) return { data: {}, body: source };
  let data: Record<string, unknown>;
  try {
    const parsed = yaml.load(m[1], { schema: yaml.DEFAULT_SAFE_SCHEMA });
    data = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch (e) {
    throw new Error(`Invalid front-matter YAML: ${(e as Error).message}`);
  }
  return { data, body: source.slice(m[0].length) };
}
