export interface InfoString {
  lang: string;
  opts: Record<string, string | boolean>;
}

export function parseInfoString(info: string): InfoString {
  const trimmed = info.trim();
  if (!trimmed) return { lang: "", opts: {} };
  const tokens: string[] = [];
  let i = 0;
  while (i < trimmed.length) {
    while (i < trimmed.length && /\s/.test(trimmed[i])) i++;
    if (i >= trimmed.length) break;
    let tok = "";
    while (i < trimmed.length && !/\s/.test(trimmed[i])) {
      if (trimmed[i] === '"') {
        tok += trimmed[i++];
        while (i < trimmed.length && trimmed[i] !== '"') tok += trimmed[i++];
        if (i < trimmed.length) tok += trimmed[i++];
      } else {
        tok += trimmed[i++];
      }
    }
    if (tok) tokens.push(tok);
  }
  const lang = tokens.shift() ?? "";
  const opts: Record<string, string | boolean> = {};
  for (const t of tokens) {
    const eq = t.indexOf("=");
    if (eq < 0) {
      opts[t] = true;
    } else {
      const k = t.slice(0, eq);
      let v = t.slice(eq + 1);
      if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1);
      }
      opts[k] = v;
    }
  }
  return { lang, opts };
}
