import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseCsv, parseCsvFull, parseJson, loadDataset } from "../src/data.ts";

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

test("loadDataset parses .tsv with tab delimiter", async () => {
  const rows = await loadDataset("./fixtures/sales.tsv", here);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].region, "North");
  assert.equal(rows[0].sales, 120);
});

test("loadDataset reports a missing file without leaking the absolute path", async () => {
  await assert.rejects(
    () => loadDataset("./fixtures/nope.csv", here),
    (e: Error) => {
      assert.match(e.message, /Data file not found: \.\/fixtures\/nope\.csv/);
      assert.ok(!e.message.includes(here), "message must not contain the absolute base path");
      return true;
    },
  );
});

test("parseCsvFull warns on rows with mismatched field counts", () => {
  const { rows, warnings } = parseCsvFull("label,value\nCustomers,1,238\n");
  assert.equal(rows.length, 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /3 fields but the header has 2 columns/);
});

test("parseCsv supports an explicit delimiter", () => {
  const rows = parseCsv("a\tb\nX\t1\n", "\t");
  assert.equal(rows[0].a, "X");
  assert.equal(rows[0].b, 1);
});

test("parseJson rejects arrays of non-objects", () => {
  assert.throws(() => parseJson("[1,2,3]"), /array of objects/);
  assert.throws(() => parseJson('[["a"]]'), /array of objects/);
  assert.throws(() => parseJson('[{"a":1},null]'), /array of objects/);
});
