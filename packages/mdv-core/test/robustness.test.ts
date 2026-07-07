import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/parser.ts";
import { renderDocument } from "../src/render/html.ts";
import { extractFrontmatterSafe } from "../src/frontmatter.ts";

async function renderSrc(src: string): Promise<string> {
  return renderDocument(await parse(src));
}

function divsBalanced(html: string): boolean {
  const open = (html.match(/<div/g) || []).length;
  const close = (html.match(/<\/div>/g) || []).length;
  return open === close;
}

// --- CommonMark-superset guarantee -----------------------------------------

test("::: inside a fenced code block stays literal (superset guarantee)", async () => {
  const src = "```\n::: callout\nHi\n:::\n```\n";
  const doc = await parse(src);
  assert.ok(!doc.tokens.some((t) => t.kind === "container-open"), "no container from fenced ::: lines");
  const html = renderDocument(doc);
  assert.match(html, /::: callout/);
  assert.doesNotMatch(html, /MDV_DIR/);
});

test("raw HTML is escaped, not emitted (html:false)", async () => {
  const html = await renderSrc("Hello <script>alert(1)</script> world\n");
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

// --- Container robustness ---------------------------------------------------

test("container names with hyphens work", async () => {
  const html = await renderSrc("::: call-out\n\nHi.\n\n:::\n");
  assert.match(html, /class="mdv-style-call-out"/);
  assert.ok(divsBalanced(html));
});

test("stray ::: close renders a warning, not an orphan </div>", async () => {
  const src = "Hello.\n\n:::\n\nWorld.\n";
  const doc = await parse(src);
  const warning = doc.tokens.find((t) => t.kind === "error" && t.meta.severity === "warning");
  assert.ok(warning, "expected a warning token");
  const html = renderDocument(doc);
  assert.match(html, /class="mdv-warning"/);
  assert.ok(divsBalanced(html), "divs must stay balanced");
});

test("unclosed container auto-closes at end of document with a warning", async () => {
  const html = await renderSrc("::: callout\n\nHi.\n");
  assert.match(html, /never closed/);
  assert.ok(divsBalanced(html));
});

test("unclosed ::: toc does not consume the next container's close", async () => {
  const src = "::: toc\n\n## Section A\n\n::: callout\n\nHi.\n\n:::\n\nAfter.\n";
  const html = await renderSrc(src);
  assert.match(html, /mdv-toc/);
  assert.match(html, /mdv-style-callout/);
  assert.ok(divsBalanced(html), "callout must be closed by its own :::");
});

test("::: toc with immediate close renders and stays balanced", async () => {
  const html = await renderSrc("::: toc\n:::\n\n## One\n\n### Two\n");
  assert.match(html, /mdv-toc/);
  assert.match(html, /href="#one"/);
  assert.ok(divsBalanced(html));
});

// --- Front-matter fatal handling ---------------------------------------------

test("invalid front-matter YAML renders a fatal top banner and the body still renders", async () => {
  const src = "---\ntitle: [unclosed\n---\n# Body heading\n";
  const doc = await parse(src);
  const fatal = doc.tokens.find((t) => t.kind === "error" && t.meta.severity === "fatal");
  assert.ok(fatal, "expected a fatal error token");
  const html = renderDocument(doc);
  assert.match(html, /mdv-fatal/);
  assert.match(html, /Invalid front-matter YAML/);
  assert.match(html, /Body heading/, "body must still render");
});

test("extractFrontmatterSafe reports the error and strips the block", () => {
  const r = extractFrontmatterSafe("---\ntitle: [unclosed\n---\n# Body\n");
  assert.ok(r.error && /front-matter/i.test(r.error));
  assert.deepEqual(r.data, {});
  assert.equal(r.body, "# Body\n");
});

// --- Chart validation --------------------------------------------------------

test("bar chart with misspelled y column renders a red banner, not silent zeros", async () => {
  const html = await renderSrc("```chart type=bar x=region y=salez\nregion,sales\nNorth,120\n```\n");
  assert.match(html, /mdv-error/);
  assert.match(html, /column &#39;salez&#39; not found/);
  assert.doesNotMatch(html, /<rect/);
});

test("bar chart with non-numeric y values renders a red banner", async () => {
  const html = await renderSrc("```chart type=bar x=region y=sales\nregion,sales\nNorth,12%\n```\n");
  assert.match(html, /mdv-error/);
  assert.match(html, /non-numeric value/);
});

test("all-negative bar chart stays inside the plot area", async () => {
  const html = await renderSrc("```chart type=bar x=a y=b\na,b\nX,-30\nY,-10\nZ,-25\n```\n");
  assert.match(html, /<rect/);
  const rects = [...html.matchAll(/<rect x="[^"]+" y="([\d.]+)" width="[^"]+" height="([\d.]+)"/g)];
  assert.ok(rects.length === 3, "expected 3 bars");
  for (const m of rects) {
    const y = Number(m[1]), h = Number(m[2]);
    assert.ok(y >= 29.5, `bar top ${y} must be at/below the top padding`);
    assert.ok(y + h <= 310.5, `bar bottom ${y + h} must be above the x-axis area`);
  }
});

test("line chart with misspelled series column renders a red banner", async () => {
  const html = await renderSrc("```chart type=line x=m y=v series=regoin\nm,v,region\nJan,1,N\n```\n");
  assert.match(html, /column &#39;regoin&#39; not found/);
});

test("single-datapoint line series renders a visible point marker", async () => {
  const html = await renderSrc("```chart type=line x=m y=v\nm,v\nJan,42\n```\n");
  assert.match(html, /<circle/);
});

test("pie chart with a single 100% slice renders a full disc", async () => {
  const html = await renderSrc("```chart type=pie label=a value=b\na,b\nAll,50\n```\n");
  assert.match(html, /<circle[^>]*r="140"/);
});

test("pie chart with negative values renders a red banner", async () => {
  const html = await renderSrc("```chart type=pie label=a value=b\na,b\nOne,30\nTwo,-5\n```\n");
  assert.match(html, /must be non-negative/);
});

test("stat block without label/value columns renders a red banner", async () => {
  const html = await renderSrc("```stat\nname,amount\nRevenue,100\n```\n");
  assert.match(html, /requires &#39;label&#39; and &#39;value&#39; columns/);
});

// --- Data-layer warnings ------------------------------------------------------

test("ragged CSV row renders a yellow warning and the block still renders", async () => {
  const src = "```stat\nlabel, value\nCustomers, 1,238\n```\n";
  const html = await renderSrc(src);
  assert.match(html, /mdv-warning/);
  assert.match(html, /fields but the header has/);
  assert.match(html, /mdv-stat-grid/, "stat block still renders");
});

// --- Theme robustness ----------------------------------------------------------

test("theme name from Object.prototype falls back with a warning instead of crashing", async () => {
  const html = await renderSrc("---\ntheme: constructor\n---\n# Hi\n");
  assert.match(html, /Unknown theme &#39;constructor&#39;/);
  assert.match(html, /<h1/);
});

// --- Review findings: blockquote / table / container interaction --------------

test("a blockquote as the last child of a container does not swallow the closing :::", async () => {
  const html = await renderSrc("::: callout\n\n> quoted\n\n:::\n\nafter\n");
  assert.ok(divsBalanced(html));
  assert.match(html, /<blockquote>/);
  // "after" and any warning must be OUTSIDE the callout div.
  assert.doesNotMatch(html, /never closed/);
  const afterIdx = html.indexOf("after");
  const closeIdx = html.lastIndexOf("</div>");
  assert.ok(afterIdx > html.indexOf("mdv-style-callout"), "after comes after the callout opens");
});

test("a directive immediately after a table row still opens the container", async () => {
  const html = await renderSrc("| a |\n|---|\n| 1 |\n::: note\n\nHi\n\n:::\n");
  assert.match(html, /<table/);
  assert.match(html, /class="mdv-style-note"/);
  assert.doesNotMatch(html, /<td>::: note<\/td>/);
  assert.ok(divsBalanced(html));
});

test("blockquote paragraph containing a > ::: line is not split (CommonMark fidelity)", async () => {
  const html = await renderSrc("> line one\n> ::: note\n> line two\n");
  // Single paragraph inside the blockquote — one <p>, no container.
  const pCount = (html.match(/<blockquote>\s*<p>/g) || []).length;
  assert.equal(pCount, 1);
  assert.doesNotMatch(html, /mdv-style-note/);
});

test("HTML comments do not appear as visible text in rendered output", async () => {
  const html = await renderSrc("Text.\n\n<!-- TODO: private note -->\n\nMore.\n");
  assert.doesNotMatch(html, /private note/);
  assert.match(html, /More\./);
});

// --- Review findings: security ------------------------------------------------

test("front-matter style values cannot break out of the <style> element", async () => {
  const src =
    "---\nstyles:\n  evil:\n    color: \"red } </style><script>alert(1)</script>\"\n---\n# Hi\n";
  const html = await renderSrc(src);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /Unsafe character in style value/);
});

// --- Review findings: data robustness ----------------------------------------

test("dataset name from the prototype chain yields the intended banner, not a Node TypeError", async () => {
  const html = await renderSrc("```chart type=bar x=a y=b data=constructor\n```\n");
  assert.match(html, /Dataset &#39;constructor&#39; not declared/);
  assert.doesNotMatch(html, /paths\[1\]/);
});

test("empty numeric cells render as zero and the chart still draws", async () => {
  const html = await renderSrc("```chart type=bar x=region y=sales\nregion,sales\nNorth,120\nSouth,\nEast,80\n```\n");
  assert.match(html, /<rect/);
  assert.doesNotMatch(html, /<div class="mdv-error"/);
  assert.equal((html.match(/<rect/g) || []).length, 3, "all three bars render");
});

test("benign trailing comma does not emit a ragged-row warning", async () => {
  const html = await renderSrc("```table\na,b\n1,2,\n3,4\n```\n");
  assert.match(html, /<table/);
  assert.doesNotMatch(html, /<div class="mdv-warning"/);
});

// --- Review findings: auto-close ordering & toc -------------------------------

test("unclosed-container warning renders after the closing </div>, not inside the grid", async () => {
  const html = await renderSrc("::: columns\n\n::: col\n\nA\n");
  assert.ok(divsBalanced(html));
  // Both the col- and columns-close </div> come before any warning banner, so
  // the warning is never a child of the grid.
  const warnIdx = html.indexOf('<div class="mdv-warning"');
  assert.ok(warnIdx > html.indexOf("</div></div>"), "warning banners follow the closing divs");
});

test("unclosed ::: toc emits a diagnostic warning", async () => {
  const html = await renderSrc("::: toc\n\n## A\n\nBody.\n");
  assert.match(html, /&#39;::: toc&#39; was never closed/);
});
