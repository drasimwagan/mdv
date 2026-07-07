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
