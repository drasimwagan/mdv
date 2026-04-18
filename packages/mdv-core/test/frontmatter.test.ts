import { test } from "node:test";
import assert from "node:assert/strict";
import { extractFrontmatter } from "../src/frontmatter.ts";

test("extracts YAML front-matter between --- fences", () => {
  const input = "---\ntitle: Hello\ntheme: minimal\n---\n# Body\n";
  const { data, body } = extractFrontmatter(input);
  assert.equal(data.title, "Hello");
  assert.equal(data.theme, "minimal");
  assert.equal(body, "# Body\n");
});

test("returns empty data when no front-matter", () => {
  const input = "# Just a heading\n";
  const { data, body } = extractFrontmatter(input);
  assert.deepEqual(data, {});
  assert.equal(body, input);
});

test("invalid YAML throws", () => {
  const input = "---\ntitle: [unclosed\n---\n";
  assert.throws(() => extractFrontmatter(input), /front-matter/i);
});
