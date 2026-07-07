# Changelog

All notable changes to MDV are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) (pre-1.0: minor
versions may include behavior changes).

## [0.2.0] — 2026-07-07

A correctness and robustness release. The renderer is now hardened against the
most common author mistakes and against untrusted `.mdv`/`.md` input, and no
longer silently produces wrong output.

### Security

- **Raw HTML is no longer emitted.** The parser runs markdown-it with
  `html: false`; `<script>`/raw markup in the document body is escaped, not
  passed through into exported HTML.
- **Front-matter style values are sanitized.** A named-style value can no
  longer break out of the `<style>` element (e.g. `color: "red } </style>…"`);
  offending declarations are dropped with a warning.

### Fixed

- **CommonMark-superset guarantee.** `:::` directives are now handled by a
  fence-aware pre-pass instead of a naive line rewrite, so `:::` shown inside a
  fenced code block stays literal and documents that document MDV syntax render
  identically under plain Markdown. Directives also interact correctly with
  blockquotes, tables and lists.
- **Errors never crash or corrupt the document.** Invalid front-matter YAML now
  renders a fatal banner at the top of the document (the body still renders)
  instead of throwing; every block renders inside a guard; unmatched/unclosed
  `:::` containers produce a warning and balanced HTML rather than orphaned
  `</div>`s.
- **Charts validate their inputs.** A misspelled or missing `x`/`y`/`label`/
  `value` column, or a non-numeric value, now renders an inline red banner
  instead of silently-wrong output. Empty/blank cells render as zero.
- **Chart geometry.** Bar charts anchor to a zero baseline (all-negative data
  stays in view); a 100% pie slice renders as a full disc; negative pie values
  are rejected; single-point line series show a visible marker.
- **Data.** `.tsv` datasets parse with a tab delimiter; ragged CSV rows emit a
  delimiter-aware warning (benign trailing commas do not); `format=json`
  rejects non-object arrays; a missing data file reports the author's relative
  path, never an absolute local path.
- **HTML comments.** A standalone `<!-- … -->` line is hidden; inline,
  multi-line and unterminated comments are left untouched (never destructive).
- **CLI.** `mdv render` prints fatal/warning diagnostics to stderr and gains
  `--strict` (non-zero exit on fatal errors); the preview server binds to
  `127.0.0.1` only, validates `--port`, and reports `EADDRINUSE` cleanly;
  `--out` creates missing parent directories; file-not-found messages are
  friendly and leak no absolute paths.
- A `theme:` name matching an `Object.prototype` key (e.g. `constructor`) no
  longer crashes the render.

### Added

- `renderFileWithDiagnostics()` in `@mdv/core`, returning `{ html, fatals,
  warnings }`.
- `mdv render --strict` for CI gating.

### Notes

- Under `html: false`, inline/multi-line HTML comments now render as visible
  (escaped) text rather than being invisible as in 0.1.x. Put private notes on
  their own line as a complete `<!-- … -->` to keep them hidden.

## [0.1.1] — earlier

- VS Code extension: initial Marketplace release.

## [0.1.0] — earlier

- Initial MDV: CommonMark superset with front-matter, `chart`/`table`/`stat`
  fenced blocks, `:::` containers, themes and named styles, TOC, and
  HTML/PDF export.
