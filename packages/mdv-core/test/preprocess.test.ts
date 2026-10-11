import { test } from "node:test";
import assert from "node:assert/strict";
import { preprocess, directiveFromText } from "../src/preprocess.ts";

// Round-trip: a directive line becomes an isolated paragraph whose text is a
// sentinel that directiveFromText decodes.
function directivesOf(src: string) {
  return preprocess(src)
    .split("\n")
    .map((l) => directiveFromText(l))
    .filter(Boolean);
}

test("column-0 ::: name becomes an open directive; bare ::: a close", () => {
  const dirs = directivesOf("::: callout\n\nHi\n\n:::\n");
  assert.deepEqual(dirs, [{ kind: "open", name: "callout" }, { kind: "close" }]);
});

test("::: inside a fenced code block is left literal", () => {
  const out = preprocess("```\n::: callout\n:::\n```\n");
  assert.match(out, /::: callout/);
  assert.equal(directivesOf("```\n::: callout\n:::\n```\n").length, 0);
});

test("::: inside a tilde fence is left literal", () => {
  assert.equal(directivesOf("~~~\n::: note\n~~~\n").length, 0);
});

test("indented ::: (1-3 spaces) is left literal, matching prior behavior", () => {
  assert.equal(directivesOf("  ::: callout\n").length, 0);
});

test("::: after a > blockquote prefix is left literal", () => {
  assert.equal(directivesOf("> ::: note\n").length, 0);
});

test("a standalone column-0 HTML comment line is dropped", () => {
  const out = preprocess("before\n<!-- secret note -->\nafter\n");
  assert.doesNotMatch(out, /secret note/);
  assert.match(out, /before/);
  assert.match(out, /after/);
});

test("an unterminated <!-- never truncates the document", () => {
  const out = preprocess("The `<!--` sequence.\n\nSecond paragraph.\n\nThird.\n");
  assert.match(out, /Second paragraph/);
  assert.match(out, /Third/);
});

test("an inline HTML comment is left untouched (no code-span corruption)", () => {
  const out = preprocess("keep <!-- drop --> this\n");
  assert.match(out, /keep <!-- drop --> this/);
});

test("a multi-line HTML comment is left untouched (conservative, never destructive)", () => {
  const out = preprocess("a\n<!-- line one\nline two -->\nb\n");
  assert.match(out, /line one/);
  assert.match(out, /line two/);
});

test("HTML comment inside a fenced code block is preserved", () => {
  const out = preprocess("```html\n<!-- a comment sample -->\n```\n");
  assert.match(out, /<!-- a comment sample -->/);
});

test("a 4-space-indented closing fence does not end the fence (no sentinel leak)", () => {
  const src = "```\ncode line\n    ```\n::: evil\nmore code\n```\n";
  const out = preprocess(src);
  assert.doesNotMatch(out, /MDVOPEN/, "no directive sentinel leaked");
  assert.doesNotMatch(out, /[\u{e000}\u{e001}]/u, "no private-use chars leaked");
  assert.match(out, /::: evil/, "the ::: line stays literal inside the fence");
});

test("a backtick fence whose info string contains a backtick is not treated as a fence", () => {
  // markdown-it rejects such an opener, so ::: after it must remain a directive.
  const dirs = directivesOf("```a`b\n::: callout\n:::\n");
  assert.ok(dirs.some((d) => d && d.kind === "open" && d.name === "callout"));
});

test("directive names with hyphens round-trip", () => {
  assert.deepEqual(directivesOf("::: call-out\n"), [{ kind: "open", name: "call-out" }]);
});

test("closing fence must match the opener length/char", () => {
  // A shorter run inside a longer fence does not close it.
  const out = preprocess("````\n```\n::: x\n````\n");
  assert.equal(directivesOf("````\n```\n::: x\n````\n").length, 0, "::: stays inside the ```` fence");
});

// ---------------------------------------------------------------------------
// Security: ReDoS (CodeQL js/polynomial-redos) and line-ending parity.
// Before the fix, `:::` / fence lines containing a lone \r, U+2028 or U+2029
// backtracked quadratically: ~0.4 s at 40k chars, minutes at 1 MB.
// ---------------------------------------------------------------------------

const N = 200_000;
const BREAKERS: Array<[string, string]> = [
  ["lone CR", "\r"],
  ["U+2028", " "],
  ["U+2029", " "],
];
const RUNS: Array<[string, string]> = [
  [":::", ":::" + "\t".repeat(N)],
  ["backtick fence", "`".repeat(N)],
  ["tilde fence", "~".repeat(N)],
  ["comment", "<!--" + "-->\t".repeat(N / 4)],
];

for (const [runName, run] of RUNS) {
  for (const [brkName, brk] of BREAKERS) {
    test(`ReDoS guard: ${runName} line + ${brkName} (${N} chars) preprocesses in linear time`, () => {
      const line = run + brk + "x";
      const t0 = performance.now();
      preprocess(line);
      const ms = performance.now() - t0;
      assert.ok(ms < 200, `took ${ms.toFixed(1)} ms`);
    });
  }
}

const DOC_LF = "intro\n\n::: callout\nInside.\n:::\n\n```js\n::: not-a-directive\n```\n\ntail\n";

test("LF, CRLF and lone-CR line endings preprocess identically", () => {
  const lf = preprocess(DOC_LF);
  assert.equal(preprocess(DOC_LF.replace(/\n/g, "\r\n")), lf);
  assert.equal(preprocess(DOC_LF.replace(/\n/g, "\r")), lf);
});

test("lone-CR document renders identically to its LF twin (no fence drift)", async () => {
  const { parse } = await import("../src/parser.ts");
  const { renderDocument } = await import("../src/render/html.ts");
  const lf = renderDocument(await parse(DOC_LF));
  const cr = renderDocument(await parse(DOC_LF.replace(/\n/g, "\r")));
  assert.equal(cr, lf);
  assert.match(lf, /::: not-a-directive/); // still literal inside the fence
});

test("directive names are still trimmed of surrounding spaces and tabs", () => {
  assert.deepEqual(directivesOf(":::\t callout \t\n\n:::\n"), [
    { kind: "open", name: "callout" },
    { kind: "close" },
  ]);
});

test("fence info strings with leading spaces still open a fence", () => {
  assert.equal(directivesOf("```   js title=x\n::: callout\n```\n").length, 0);
});

// CodeQL js/bad-tag-filter on FULL_LINE_COMMENT_RE is a false positive: the
// regex is not a sanitizer. html:false escapes every raw tag, so comments the
// regex leaves alone (multi-line, inline) render as escaped text, never markup.
test("comments the regex does not hide render escaped, never as live markup", async () => {
  const { parse } = await import("../src/parser.ts");
  const { renderDocument } = await import("../src/render/html.ts");
  const html = renderDocument(
    await parse("a\n<!-- multi\nline --><script>alert(1)</script>\nb <!-- x --> <img src=x onerror=alert(1)>\n"),
  );
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;!-- multi/);
  assert.match(html, /&lt;script&gt;/);
});

// The full-line-comment check is plain string logic (no regex, so no
// bad-tag-filter false positive). Differential test against the former regex
// over a deterministic pseudo-random corpus of comment-ish lines.
test("isFullLineComment matches the former /^<!--.*?-->[ \t]*$/ exactly", () => {
  const OLD = /^<!--.*?-->[ \t]*$/;
  const parts = ["<!--", "-->", "--", "-", "<", "!", ">", " ", "\t", "a", "<!-->", "x y"];
  let seed = 12345;
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n);
  for (let i = 0; i < 20000; i++) {
    let line = "";
    const k = 1 + rnd(7);
    for (let j = 0; j < k; j++) line += parts[rnd(parts.length)];
    const dropped = !preprocess(`a\n${line}\nb`).includes(line);
    assert.equal(dropped, OLD.test(line), `mismatch for ${JSON.stringify(line)}`);
  }
});
