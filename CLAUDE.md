# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**MDV** is a Markdown-superset format for authoring documents, dashboards, and slides with embedded data and visualizations. v0.2.0 ships `@mdv/core`, `@mdv/cli`, and a VS Code extension.

## Spec-driven development

This project follows spec-driven development (the DeepLearning.AI / JetBrains *Spec-Driven Development with Coding Agents* workflow). Specs come before code.

### The constitution

`specs/` is **maintainer-local and gitignored**; it is not in the published repo. Read the constitution before any non-trivial change:

- `specs/mission.md`: purpose, audiences in priority order, immutable principles, and non-goals
- `specs/tech-stack.md`: stack, dependency policy, and known gaps
- `specs/roadmap.md`: small phases, in order. The next phase is the first one not marked complete.

### Feature specs

Each roadmap phase gets `specs/YYYY-MM-DD-<feature-name>/`:

- `requirements.md`: scope, decisions, and context
- `plan.md`: numbered task groups
- `validation.md`: how we know it's done and mergeable

`specs/2026-04-18-mdv-v1/` is the retroactive spec for the original v1 build.

### The loop (one phase per branch: `phase-<N>-<kebab-name>`)

1. **Spec**: the `/feature-spec` skill (`.claude/skills/feature-spec/`) creates the branch, interviews the user, and writes the three files. Don't write files before the interview.
2. **Implement**: work through `plan.md` group by group. Keep the spec in sync if the plan changes.
3. **Validate and ship**: the `/feature-ship` skill runs the `validation.md` checks and reconciles the specs with reality (replanning). It then ticks the roadmap, runs `/changelog`, and opens a PR.
4. **Replan** whenever implementation contradicts the constitution: update `mission.md` / `tech-stack.md` / `roadmap.md` first, then code. Crossing a non-goal requires the owner's explicit approval.

Without the specs (for example, an external contributor), the core decisions below are the contract.

## Core Product Decisions (locked 2026-04-18)

These are non-negotiable constraints agreed with the owner. Do not revisit them without explicit approval. They are elaborated in `specs/mission.md`.

- **Audience**: non-technical authors (analysts, writers) come first. No selectors, classes, expressions, or code in the authoring surface. Secondary audiences: developers embedding `@mdv/core`, and docs-as-code/CI teams.
- **Format**: a strict **superset of CommonMark**. Every valid `.md` is a valid `.mdv`. Only additions, never changes to core Markdown syntax. Graceful degradation in plain MD viewers is a first-class requirement.
- **Syntax additions** (only these):
  - YAML front-matter for document-level config (`theme`, `data:`, `styles:`, `locale`).
  - Fenced code blocks with info-string options for **data and charts**: `` ```chart type=bar x=col y=col ``.
  - `:::` container directives for **styled regions and layout** (`::: callout`, `::: columns` / `::: col`, `::: toc`).
  - Info strings use `key=value` (quoted strings allowed). No JSON, no JS in options.
- **Styling model**: built-in themes plus named styles that authors define in front-matter. Flat vocabulary only: color, spacing, typography, layout. No per-element overrides.
- **Data**: inline CSV (the default), inline JSON (opt-in via `format=json`), or a named dataset referencing a local file (`./data/sales.csv`). **No URLs and no transformations.**
- **Visualizations**: `table`, `stat` (KPI cards), and `chart type=bar|line|pie` as inline SVG. Bar and line charts accept `yFormat=currency|percent|thousands`.
- **Exports**: self-contained HTML (`mdv render`) and PDF (`mdv export --pdf`, via puppeteer).

## Architecture

Monorepo using npm workspaces:

- `packages/mdv-core`: the parser (markdown-it base, `html: false`), AST, and HTML/SVG renderer. Pure TypeScript with no DOM dependencies. It has an in-house SVG chart renderer, with no Chart.js or D3.
- `packages/mdv-cli`: the `mdv render | export | preview | version` commands.
- `packages/mdv-vscode`: a VS Code extension providing side-by-side webview preview. It loads core through dynamic `import("@mdv/core")` (a CJS-to-ESM bridge). `@types/vscode` is pinned to `engines.vscode`.
- `scripts/build-site.mjs`: builds the GitHub Pages landing site and gallery.

Pipeline: `.mdv` → fence-aware `:::` pre-pass → markdown-it → mdv extension pass (front-matter, fenced blocks, containers, data resolution) → mdv AST → HTML renderer → self-contained HTML.

## Working Conventions

- **Spec first.** If a request conflicts with the constitution or a feature spec, flag it rather than silently diverging.
- **YAGNI is enforced.** New chart types, style keys, or data sources each need a roadmap phase.
- **Deterministic output.** Renderer output (HTML, SVG) must be byte-stable for identical input.
- **Errors never crash the document.** Block-level errors render an inline red banner and sibling blocks continue. Fatal errors render a top-of-document banner. Warnings render a yellow banner while the block renders with a fallback.
- **No new runtime dependencies** without the owner's approval.
- **`main` is protected.** Work on a branch and open a PR. Never merge yourself.

## Commands

```
npm ci                                   # install (Node ≥ 20)
npm run build                            # core → cli → vscode, in dependency order
npm test                                 # node:test via tsx (packages/mdv-core/test)

node packages/mdv-cli/dist/index.js render <file.mdv> [--out <path>] [--strict]
node packages/mdv-cli/dist/index.js preview <file.mdv> [--port <n>]
node packages/mdv-cli/dist/index.js export <file.mdv> --pdf [--out <path>] [--page-size letter|a4]

npm run build:site                       # GitHub Pages site → site/
cd packages/mdv-vscode && npx vsce package --no-dependencies   # build the .vsix
```
