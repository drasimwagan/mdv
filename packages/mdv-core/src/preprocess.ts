// Fence-aware source preprocessing, run before markdown-it.
//
// Two jobs, both of which must respect fenced code blocks so a document that
// *documents* MDV syntax still degrades cleanly as plain CommonMark:
//   1. Rewrite column-0 `:::` directive lines into isolated sentinel paragraphs.
//      Sentinels are plain text (private-use code points) so they survive
//      `html:false` — unlike the old HTML-comment sentinels, which relied on
//      `html:true` and let raw markup through.
//   2. Drop a line that is *entirely* one complete, column-0 HTML comment
//      (`<!-- … -->`). Under `html:false` markdown-it would otherwise print it
//      as visible text. The rule is deliberately narrow: inline comments,
//      multi-line comments, unterminated `<!--`, and indented/code comments are
//      left untouched, so this never deletes content or corrupts a code span.

// U+E000 / U+E001 are Unicode private-use code points — they never appear in
// real prose, so a sentinel built from them cannot collide with author text.
const PUA_A = String.fromCharCode(0xe000);
const PUA_B = String.fromCharCode(0xe001);
const OPEN_PREFIX = `${PUA_A}MDVOPEN:`;
const CLOSE_TEXT = `${PUA_A}MDVCLOSE${PUA_B}`;

export type Directive = { kind: "open"; name: string } | { kind: "close" };

/** Recognise a sentinel produced by {@link preprocess} from a paragraph's text. */
export function directiveFromText(content: string): Directive | null {
  if (content === CLOSE_TEXT) return { kind: "close" };
  if (content.startsWith(OPEN_PREFIX) && content.endsWith(PUA_B)) {
    return { kind: "open", name: content.slice(OPEN_PREFIX.length, -PUA_B.length) };
  }
  return null;
}

// Fence rules mirror CommonMark so the preprocessor's notion of "inside a fence"
// cannot drift from markdown-it's (any drift would leak a sentinel into <pre>):
//   - opener: 0-3 spaces, a run of >=3 backticks or tildes; a backtick fence's
//     info string may not contain a backtick.
//   - closer: 0-3 spaces, the same character, at least as long, then only spaces.
const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE_RE = /^ {0,3}(`+|~+)[ \t]*$/;
const DIRECTIVE_RE = /^:::[ \t]*(.*)$/;
const FULL_LINE_COMMENT_RE = /^<!--.*?-->[ \t]*$/;

export function preprocess(body: string): string {
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  let fenceMarker: string | null = null; // the run that opened the current fence

  for (const line of lines) {
    if (fenceMarker !== null) {
      out.push(line);
      const m = line.match(FENCE_CLOSE_RE);
      if (m && m[1][0] === fenceMarker[0] && m[1].length >= fenceMarker.length) fenceMarker = null;
      continue;
    }

    const fo = line.match(FENCE_OPEN_RE);
    if (fo && !(fo[1][0] === "`" && fo[2].includes("`"))) {
      fenceMarker = fo[1];
      out.push(line);
      continue;
    }

    // Directive (column-0 `:::`), matching the historical raw-line regex so
    // indented / blockquoted / list-nested `:::` stay literal exactly as before.
    const dm = line.match(DIRECTIVE_RE);
    if (dm) {
      const name = dm[1].trim();
      out.push("", name === "" ? CLOSE_TEXT : `${OPEN_PREFIX}${name}${PUA_B}`, "");
      continue;
    }

    if (FULL_LINE_COMMENT_RE.test(line)) continue;

    out.push(line);
  }

  return out.join("\n");
}
