import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseCsv, parseJson, loadDataset } from "../src/data.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

test("parseCsv handles header + typed rows", () => {
  const rows = parseCsv("region,sales\nNorth,120\nSouth,95\n");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].region, "North");
  assert.equal(rows[0].sales, 120);
});

test("parseCsv handles quoted fields with commas", () => {
  const rows = parseCsv('name,note\n"Smith, J",hello\n');
  assert.equal(rows[0].name, "Smith, J");
  assert.equal(rows[0].note, "hello");
});

test("parseJson accepts array of objects", () => {
  const rows = parseJson('[{"a":1},{"a":2}]');
  assert.equal(rows.length, 2);
  assert.equal(rows[1].a, 2);
});

test("loadDataset reads CSV relative to base", async () => {
  const rows = await loadDataset("./fixtures/sales.csv", here);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].region, "North");
  assert.equal(rows[0].sales, 120);
});
