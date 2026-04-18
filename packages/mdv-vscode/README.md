# MDV — VS Code Preview

Live preview for `.mdv` (Markdown Data & Visualization) files inside VS Code.

## Features

- Opens a side-by-side preview showing your document rendered with charts, tables, KPI stat cards, named styles, themes, and auto TOC.
- Updates as you type (200 ms debounce). Also refreshes when a referenced `.csv` / `.tsv` / `.json` data file in the same folder is saved.
- Preserves scroll position across refreshes.

## Usage

1. Open a `.mdv` file.
2. Press **Ctrl+Shift+V** (or **Cmd+Shift+V** on macOS) — or click the preview icon in the editor title bar.

Command palette entries:

- `MDV: Open Preview`
- `MDV: Open Preview to the Side`

## Installation (dev)

```bash
cd packages/mdv-vscode
npm install
npm run build
# Then press F5 in VS Code with this folder open to launch an Extension Development Host.
```

To package into a `.vsix` for local install:

```bash
npx vsce package --no-dependencies
code --install-extension mdv-vscode-0.1.0.vsix
```

## How it works

The extension calls `@mdv/core` (from the monorepo workspace) to parse and render the `.mdv` source in-process; the resulting self-contained HTML is pushed into a VS Code webview. No network, no temporary files.

Scripts are disabled in the webview (`enableScripts: false`) — MDV's v1 output is static HTML/SVG by design, so there's nothing to run. Inlined SVG charts render natively in the webview.
