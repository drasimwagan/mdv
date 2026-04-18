import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/parser.ts";

test("parses plain markdown", async () => {
  const doc = await parse("# Hello\n\nParagraph.\n");
  assert.deepEqual(doc.frontmatter, {});
  assert.ok(doc.tokens.some((t) => t.kind === "md"));
});

test("extracts bar chart block with inline CSV data", async () => {
  const src = "```chart type=bar x=a y=b\na,b\nX,1\nY,2\n```\n";
  const doc = await parse(src);
  const chart = doc.tokens.find((t) => t.kind === "chart");
  assert.ok(chart);
  if (chart && chart.kind === "chart") {
    assert.equal(chart.meta.type, "bar");
    assert.equal(chart.meta.data.length, 2);
  }
});

test("produces error block for unknown chart type", async () => {
  const src = "```chart type=nope\n```\n";
  const doc = await parse(src);
  assert.ok(doc.tokens.some((t) => t.kind === "error"));
});

test("transforms ::: containers to open/close tokens", async () => {
  const src = "::: callout\n\nHi there.\n\n:::\n";
  const doc = await parse(src);
  assert.ok(doc.tokens.some((t) => t.kind === "container-open"));
  assert.ok(doc.tokens.some((t) => t.kind === "container-close"));
});
