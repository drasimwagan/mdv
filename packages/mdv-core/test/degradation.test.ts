import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";

const here = path.dirname(fileURLToPath(import.meta.url));
const examplesDir = path.resolve(here, "../../../examples");
const md = new MarkdownIt({ html: false, linkify: true });

test("every example .mdv renders through plain markdown-it without error", async () => {
  const files = (await fs.readdir(examplesDir)).filter((f) => f.endsWith(".mdv"));
  assert.ok(files.length > 0, "expected example .mdv files to exist");
  for (const f of files) {
    const src = await fs.readFile(path.join(examplesDir, f), "utf8");
    let html = "";
    assert.doesNotThrow(() => {
      html = md.render(src);
    }, `plain md parse threw for ${f}`);
    assert.ok(html.length > 0, `plain md parse produced empty output for ${f}`);
  }
});
