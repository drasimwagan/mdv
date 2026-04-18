# MDV — Markdown Data & Visualization Format

**Status:** Draft design
**Date:** 2026-04-18
**Author:** Asim (dr.asim@aksiq.com)

## 1. Purpose

A general-purpose authoring format, rendered live like Markdown, that lets **non-technical authors** (analysts, writers) create documents, dashboards, and slide decks containing data and visualizations — without learning HTML, CSS, selectors, classes, or expressions.

One source file → HTML/PDF exports (v1). Live-renders anywhere an `mdv` renderer is embedded.

## 2. Design Principles

- **Superset of CommonMark.** Every valid `.md` is a valid `.mdv`. Only additions, no changes to core Markdown.
- **Graceful degradation.** Plain Markdown viewers (GitHub, VS Code) still render `.mdv` files readably; new blocks appear as code/plain text.
- **No selectors, no expressions, no code.** Authors pick styles by name; they don't write rules.
- **Deterministic, static output.** HTML export is self-contained, no JS runtime required for v1. PDF-friendly.
- **YAGNI.** Every added feature must serve the non-technical author. Interactivity, transformations, and broad chart libraries are deferred.

## 3. File Format

### 3.1 Structure

```
<optional YAML front-matter>
<CommonMark body, with optional extensions>
```

### 3.2 Front-matter (optional)

Doc-level config: `title`, `theme`, `locale`, `data` (named dataset map), `styles` (named style map).

```yaml
---
title: Q1 Sales Review
theme: minimal
locale: en-US
data:
  sales: ./data/sales.csv
  regions: ./data/regions.json
styles:
  callout:
    background: "#fff6e0"
    border: "1px solid #e0b84a"
    padding: medium
---
```

### 3.3 Extensions

**Fenced blocks with info strings** — for data and charts:

````
```chart type=bar x=region y=sales title="Revenue by region"
region, sales
North, 120
South, 95
```
````

Info-string format: `<block-type> key=value key="value with spaces" ...`. No JSON, no JS.

**Directive containers (`:::`)** — for styled regions and layout:

```
::: callout
Important note.
:::

::: columns
::: col
Left content
:::
::: col
Right content
:::
:::
```

### 3.4 Block types (v1)

| Block | Purpose |
|---|---|
| `` ```table `` | Styled HTML table |
| `` ```chart type=bar `` | Bar chart |
| `` ```chart type=line `` | Line chart |
| `` ```chart type=pie `` | Pie / donut chart |
| `::: <style-name>` | Styled container |
| `::: columns` / `::: col` | Layout grid |

## 4. Styling Model

### 4.1 Themes

Built-in: `minimal`, `report`, `slide` (v1). A theme defines defaults for typography, colors, chart palette, spacing scale.

### 4.2 Named styles

Defined in front-matter `styles:` map. Flat key/value only. v1 vocabulary:

- **Color**: `color`, `background`, `border`
- **Spacing**: `padding`, `margin` — values `small`/`medium`/`large` or `Npx`
- **Typography**: `font`, `size`, `weight` (`normal`/`bold`), `align` (`left`/`center`/`right`)
- **Layout**: `width` (`%`/`px`), `radius`

### 4.3 Resolution

Theme defaults → named style. No per-block overrides in v1. Each named style compiles to one `.mdv-style-<name>` CSS class emitted once in `<head>`.

**Built-in container directives** — `columns` and `col` are reserved names with layout semantics (not user-definable); they don't take a style from `styles:`. All other `::: <name>` containers resolve to a user-defined named style.

### 4.4 Validation

Unknown keys → warning banner (non-fatal). Unknown values → fall back to theme default.

## 5. Data References

Three mechanisms:

1. **Inline CSV** (default fence body).
2. **Inline JSON** via `format=json`.
3. **Named dataset** via `data=<name>`, resolved from front-matter.

### 5.1 File resolution

- Paths are **relative to the `.mdv` file**. No absolute paths, no URLs (v1).
- Extensions: `.csv`, `.tsv`, `.json`.
- Read once per render; cached by path.
- Missing/unreadable → inline error block; rest of doc renders.

### 5.2 Parsing

CSV is permissive: quoted fields, whitespace trimmed, per-column type auto-detection (number/string/date). No type declarations.

### 5.3 Non-goal: transformations

No filters, group-by, computed columns, or expressions in v1. Authors pre-aggregate data. Hard line.

## 6. Visualization Specs

Common options: `title`, `data`, `format`, `width`, `height`.

| Chart | Required | Optional |
|---|---|---|
| `bar` | `x`, `y` | `orientation`, `group`, `stacked` |
| `line` | `x`, `y` | `series`, `smooth`, `points` |
| `pie` | `label`, `value` | `donut` |
| `table` | — | `sortable` (static indicators only), per-column `align` |

Rendering: **inline SVG**, deterministic layout, no animation. Colors from theme palette. Legends auto on >1 series. Bad options → inline error box.

## 7. Architecture

Monorepo, three packages:

```
mdv/
├── packages/
│   ├── mdv-core/       # parser + AST + HTML renderer (pure TS)
│   ├── mdv-cli/        # render / export / preview commands
│   └── mdv-preview/    # browser widget, live preview, embeddable
```

### 7.1 Pipeline

```
.mdv
  → markdown-it (CommonMark)
  → mdv extensions pass (front-matter, fenced blocks, :::-containers, data resolution)
  → mdv AST
  → HTML renderer (standard MD → HTML; ChartNode → inline SVG; ContainerNode → <div class="mdv-style-*">)
  → self-contained HTML
```

### 7.2 Dependencies

- `markdown-it` — CommonMark base, plugin-friendly.
- `js-yaml` — front-matter parsing.
- In-house SVG chart renderer for the 4 v1 types (keeps bundle small, deterministic, PDF-friendly).
- `puppeteer` — HTML → PDF for export.
- Node ≥ 20.

### 7.3 Public library API

`mdv-core` exports:

- `parse(source: string, opts?) => MdvAst`
- `render(ast: MdvAst, opts?) => string // HTML`
- `renderFile(path: string, opts?) => Promise<string>`

## 8. CLI

```
mdv render <file.mdv> [--out <path>] [--theme <name>] [--watch]
mdv export <file.mdv> --pdf [--out <path>] [--page-size letter|a4]
mdv preview <file.mdv> [--port 3000]
```

- `render` — writes self-contained HTML (default: `<file>.html`).
- `export --pdf` — HTML → headless Chromium → PDF. Respects theme `@page` CSS.
- `preview` — local HTTP server + watcher + live reload. Errors render inline.
- Exit codes: `0` ok, `1` parse/render error, `2` I/O error.

Distribution: `npm install -g @mdv/cli`.

## 9. Error Handling

| Severity | Behavior |
|---|---|
| Fatal | Exit 1; top-of-doc banner in preview. Examples: unparseable front-matter, cyclic data refs. |
| Block-level | Red inline banner replaces the block. Examples: unknown chart type, missing `x`/`y`, dataset not found. |
| Warning | Yellow inline banner, block still renders. Examples: unknown style key, unknown theme (falls back to `minimal`). |

Graceful degradation in plain MD viewers is a first-class requirement — verified by test.

## 10. Testing Strategy

- **Parser**: golden AST fixtures (`input.mdv` → `expected.ast.json`).
- **Renderer**: golden HTML fixtures.
- **Charts**: golden SVG fixtures (pixel-stable).
- **CLI**: run render/export on example corpus; assert exit codes + output file presence; for PDF, validate header + page count only.
- **Graceful-degradation**: example corpus parsed through plain `markdown-it` — no errors allowed.

## 11. Explicit Non-Goals (v1)

- Interactivity beyond hover `<title>` tooltips.
- Data transformations (filter, group-by, compute).
- Remote data (URLs, APIs, databases).
- Additional chart types beyond bar/line/pie/table.
- Per-block style overrides.
- Slide-deck export as a distinct format (slide theme → paged HTML only).
- Non-JS implementations.

## 12. Open Questions

None blocking v1. Future consideration: Python/Rust reference implementations once the spec stabilizes (currently deferred — Approach 2 in the brainstorm).
