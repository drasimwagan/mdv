import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/parser.ts";
import { renderDocument } from "../src/render/html.ts";

test("renders plain markdown to HTML", async () => {
  const doc = await parse("# Hi\n\nHello world.\n");
  const html = renderDocument(doc);
  assert.match(html, /<h1 [^>]*>Hi<\/h1>/);
  assert.match(html, /Hello world/);
});

test("renders bar chart as SVG", async () => {
  const src = "```chart type=bar x=a y=b\na,b\nX,1\nY,2\n```\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /<svg/);
  assert.match(html, /<rect/);
});

test("renders line chart as SVG", async () => {
  const src = "```chart type=line x=a y=b\na,b\nJ,10\nF,20\nM,15\n```\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /<polyline/);
});

test("renders pie chart as SVG", async () => {
  const src = "```chart type=pie label=a value=b\na,b\nOne,30\nTwo,70\n```\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /<path/);
});

test("renders table block", async () => {
  const src = "```table\ncol1,col2\nA,1\nB,2\n```\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /<table/);
  assert.match(html, /<td>A<\/td>/);
});

test("renders named style container", async () => {
  const src =
    "---\nstyles:\n  callout:\n    background: '#fff6e0'\n    padding: medium\n---\n::: callout\n\nHello.\n\n:::\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /class="mdv-style-callout"/);
  assert.match(html, /background: #fff6e0/);
});

test("warns on unknown theme", async () => {
  const src = "---\ntheme: bogus\n---\n# Hi\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /Unknown theme &#39;bogus&#39;/);
});

test("renders columns layout", async () => {
  const src = "::: columns\n::: col\n\nLeft\n\n:::\n::: col\n\nRight\n\n:::\n:::\n";
  const doc = await parse(src);
  const html = renderDocument(doc);
  assert.match(html, /class="mdv-columns"/);
  assert.match(html, /class="mdv-col"/);
});
