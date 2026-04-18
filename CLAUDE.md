# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**MDV** — a Markdown-superset format for authoring documents, dashboards, and slides with embedded data and visualizations. Currently in the **design / pre-implementation** stage. No code exists yet.

Authoritative design spec: [docs/superpowers/specs/2026-04-18-mdv-format-design.md](docs/superpowers/specs/2026-04-18-mdv-format-design.md). Read this before working on the codebase — all decisions below are elaborated there.

## Core Product Decisions (locked in during brainstorming, 2026-04-18)

These are non-negotiable constraints agreed with the user. Do not revisit without explicit approval.

- **Audience**: non-technical authors (analysts, writers). No selectors, classes, expressions, or code in the authoring surface.
- **Format**: strict **superset of CommonMark**. Every valid `.md` is a valid `.mdv`. Only additions, never changes to core Markdown syntax. Graceful degradation in plain MD viewers is a first-class requirement.
- **Syntax additions** (only these):
  - YAML front-matter for doc-level config (`theme`, `data:`, `styles:`, `locale`).
  - Fenced code blocks with info-string options for **data and charts**: `` ```chart type=bar x=col y=col ``.
  - `:::` container directives for **styled regions and layout** (`::: callout`, `::: columns` / `::: col`).
  - Info strings use `key=value` (quoted strings allowed). No JSON, no JS in options.
- **Styling model**: themes (built-in) + named styles (author-defined in front-matter). Flat vocabulary only — color, spacing, typography, layout. No per-element overrides in v1.
- **Data**: inline CSV (default), inline JSON (opt-in via `format=json`), or named dataset referencing a local file (`./data/sales.csv`). **No URLs, no transformations** in v1.
- **v1 visualizations**: `table`, `stat` (KPI cards), `chart type=bar`, `chart type=line`, `chart type=pie`. Inline SVG output.
- **Axis number formats**: bar and line charts accept `yFormat=currency|percent|thousands` for axis + tooltip formatting.
- **Auto TOC**: `::: toc` container auto-generates a contents list from `##`/`###` headings with anchor links.
- **Exports**: self-contained HTML (`mdv render`), PDF (`mdv export --pdf`, via puppeteer headless Chromium).
- **Rendering**: `mdv preview` runs an in-memory live-preview server with file watching + auto-reload.

## Architecture (planned)

Monorepo, three packages:

- `packages/mdv-core` — parser (markdown-it base) + AST + HTML/SVG renderer. Pure TypeScript, no DOM deps.
- `packages/mdv-cli` — `mdv render | export | preview` commands.
- `packages/mdv-preview` — browser widget for live preview and embedding.
- `packages/mdv-vscode` — VS Code extension: side-by-side live preview in a webview, auto-refresh on edit/save and on data-file changes. Uses dynamic `import("@mdv/core")` (CJS → ESM bridge).

Pipeline: `.mdv` → markdown-it → mdv extension pass (front-matter, fenced blocks, `:::` containers, data resolution) → mdv AST → HTML renderer → self-contained HTML.

Runtime: Node ≥ 20. Key deps: `markdown-it`, `js-yaml`, `puppeteer` (PDF only). **In-house SVG chart renderer** for v1 — no Chart.js / D3 dependency.

## Non-goals (v1)

Explicitly deferred — don't design for these:

- Interactivity beyond hover `<title>` tooltips.
- Data transformations (filter, group-by, compute, expressions).
- Remote data sources (URLs, APIs, DBs).
- Chart types beyond the four v1 types.
- Per-block style overrides.
- Non-JS reference implementations (Python/Rust).

## Working Conventions

- **Follow the spec first.** If a requirement conflicts with the spec, flag it — don't silently diverge.
- **YAGNI is enforced.** Added features must serve the non-technical author. New chart types, new style keys, new data sources → belong to a future spec revision.
- **Deterministic output.** Renderer output (HTML, SVG) must be byte-stable for identical input. Golden-file testing depends on this.
- **Errors never crash the doc.** Block-level errors render an inline red banner; sibling blocks continue. Fatal errors render a top-of-doc banner. Warnings (unknown style key, unknown theme) render a yellow banner but the block still renders with fallback.

## Testing Strategy (planned)

- Parser: golden AST fixtures.
- Renderer: golden HTML fixtures.
- Charts: golden SVG fixtures (pixel-stable).
- CLI: integration tests over an example corpus; PDF validated by header + page count only.
- **Graceful-degradation test**: example corpus must parse through plain `markdown-it` without errors.

## Commands

No build/test commands exist yet — project is pre-implementation. This section will be filled in once `packages/mdv-cli` and the build pipeline exist. Expected surface (from spec):

```
mdv render <file.mdv> [--out <path>]                          # implemented
mdv preview <file.mdv> [--port <n>]                           # implemented — in-memory render + file watcher + live reload
mdv export <file.mdv> --pdf [--out <path>] [--page-size ...]  # implemented — puppeteer-based PDF export
```

## Brainstorming Trail (for context)

Decisions above were reached through a structured brainstorm. Key path the user chose:

1. Use case → **general-purpose** (docs + dashboards + slides from one source).
2. Audience → **non-technical** authors.
3. Data → **inline + local file refs**.
4. Styling → **themes + named styles** (not inline attributes).
5. Exports → **HTML + PDF** for v1, with live rendering as primary UX.
6. Relationship to Markdown → **strict superset of CommonMark** (graceful degradation required).
7. v1 visuals → **minimal**: table, bar, line, pie.
8. Syntax → **both** — fenced blocks for data/charts, `:::` for styled containers.
9. Architecture → **Approach 1**: single JS renderer library + thin CLI (chose over pandoc/MyST extension and multi-implementation spec-first approaches).
