# MDV — Markdown Data & Visualization

> Write documents, dashboards, and slides in a Markdown superset. Add charts, KPI cards, tables, and styled regions with nothing more complicated than fenced code blocks and named styles.

`.mdv` is **strict CommonMark plus four additions**:

1. **YAML front-matter** for title, theme, named styles, and dataset references.
2. **Fenced blocks** for data/visuals: `` ```chart type=bar x=region y=sales ``.
3. **`:::` containers** for styled regions and layout: `::: callout` / `::: columns`.
4. **`:::` `toc`** for an auto-generated table of contents.

No selectors, no classes, no expressions, no code. Themes provide defaults, named styles give reusable looks, the renderer does the rest.

## Quick look

````markdown
---
title: Q1 Report
theme: report
data:
  sales: ./data/sales.csv
---

::: toc
:::

# Q1 Results

```stat
label, value, delta
Total revenue, $2.06M, +14%
New customers, 1238, +8%
```

```chart type=line data=sales x=month y=revenue series=region yFormat=currency title="Monthly revenue"
```
````

Renders to self-contained HTML (charts are inline SVG, no JS runtime) and PDF. Lives inside VS Code via a side-by-side preview.

## Getting started

```bash
git clone <repo> mdv
cd mdv
npm install
npm run build

# Render an example
node packages/mdv-cli/dist/index.js render examples/09-full-report.mdv

# Or: live preview with auto-reload
node packages/mdv-cli/dist/index.js preview examples/09-full-report.mdv
```

See [docs/getting-started.md](docs/getting-started.md) for a walkthrough.

## Documentation

- [Getting started](docs/getting-started.md) — install, author your first file, see it rendered.
- [Syntax reference](docs/syntax.md) — front-matter, fenced blocks, `:::` containers.
- [Charts & stats](docs/charts.md) — every visualization type with all options.
- [Data](docs/data.md) — inline CSV / JSON / file-referenced datasets.
- [Themes & styles](docs/themes-and-styles.md) — built-in themes and how to define named styles.
- [CLI](docs/cli.md) — `render`, `preview`, `export --pdf`.
- [VS Code extension](docs/vscode.md) — side-by-side live preview.
- [Publishing the VS Code extension](docs/publishing-vscode-extension.md) — Marketplace workflow.

## Examples

[`examples/`](examples) contains 10 sample files covering every feature. Rendered HTML is in [`examples/out/`](examples/out).

## Status

v1, pre-release. Runs on Node ≥ 20. See [docs/superpowers/specs/2026-04-18-mdv-format-design.md](docs/superpowers/specs/2026-04-18-mdv-format-design.md) for scope, non-goals, and roadmap.
