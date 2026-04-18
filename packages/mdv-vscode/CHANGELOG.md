# Change Log

## 0.1.0 — initial release

- `.mdv` language support: front-matter YAML, `:::` container directives, fenced `chart` / `table` / `stat` blocks.
- Commands: `MDV: Open Preview`, `MDV: Open Preview to the Side`.
- Keyboard shortcut: `Ctrl+Shift+V` / `Cmd+Shift+V` when editing a `.mdv` file.
- Preview icon in the editor title bar.
- Debounced (200 ms) live refresh on edits; also refreshes when a referenced `.csv` / `.tsv` / `.json` in the same folder is saved.
- Extension is fully self-contained — `@mdv/core` and all parsing/rendering logic are bundled into `dist/extension.js` via esbuild.
