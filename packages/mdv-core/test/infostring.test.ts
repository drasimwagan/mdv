import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInfoString } from "../src/infostring.ts";

test("parses type and key=value pairs", () => {
  const r = parseInfoString("chart type=bar x=region y=sales");
  assert.equal(r.lang, "chart");
  assert.deepEqual(r.opts, { type: "bar", x: "region", y: "sales" });
});

test("handles quoted values with spaces", () => {
  const r = parseInfoString('chart type=bar title="Revenue by region"');
  assert.equal(r.opts.title, "Revenue by region");
});

test("handles boolean flags", () => {
  const r = parseInfoString("chart type=line smooth points");
  assert.equal(r.opts.smooth, true);
  assert.equal(r.opts.points, true);
});

test("empty string yields empty result", () => {
  const r = parseInfoString("");
  assert.equal(r.lang, "");
  assert.deepEqual(r.opts, {});
});
