# MDV Documentation

MDV is a strict superset of CommonMark for authoring documents, dashboards, and slides that contain data and visualizations. Every valid `.md` file is a valid `.mdv` file.

## For authors

Start here if you want to write `.mdv` documents.

1. [Getting started](getting-started.md) — install, first file, render it.
2. [Syntax reference](syntax.md) — the full `.mdv` syntax in one page.
3. [Charts & stats](charts.md) — every visualization type.
4. [Data](data.md) — inline data, file references, formatting.
5. [Themes & styles](themes-and-styles.md) — visual control without CSS.

## For tooling

6. [CLI](cli.md) — `mdv render`, `mdv preview`, `mdv export --pdf`.
7. [VS Code extension](vscode.md) — live preview inside the editor.
8. [Publishing the VS Code extension](publishing-vscode-extension.md) — Marketplace workflow, PAT setup, CI release.

## Design & reference

- [Format design spec](superpowers/specs/2026-04-18-mdv-format-design.md) — authoritative specification.
- [v1 implementation plan](superpowers/plans/2026-04-18-mdv-v1-implementation.md) — the build plan.

## Key principles

- **CommonMark superset.** Every `.md` file parses as `.mdv`. New features degrade gracefully in plain Markdown viewers.
- **No selectors, no expressions.** Styling is named. Data has no transforms. Authors never touch CSS or code.
- **Deterministic output.** Same input → same HTML/SVG, byte for byte. Safe to diff and commit.
- **Errors never crash the doc.** Block errors render inline; siblings keep rendering.

## v1 feature matrix

| | Implemented |
|---|---|
| CommonMark body | ✅ |
| YAML front-matter | ✅ |
| Fenced `chart` / `table` / `stat` blocks | ✅ |
| `:::` containers (named styles, columns, toc) | ✅ |
| Themes (`minimal`, `report`, `slide`) | ✅ |
| Named styles (front-matter) | ✅ |
| Inline CSV / JSON + file references | ✅ |
| Bar / line / pie / table / stat visualizations | ✅ |
| Axis formats (`currency` / `percent` / `thousands`) | ✅ |
| Auto table of contents | ✅ |
| HTML export (self-contained) | ✅ |
| PDF export (via headless Chromium) | ✅ |
| Preview server (file watch + live reload) | ✅ |
| VS Code extension | ✅ |

Deferred to v1.x+: scatter charts, date-axis handling, table `sort=`/`limit=`, scaffold command, plain-string interpolation.
