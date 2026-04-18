# VS Code extension

Live side-by-side preview for `.mdv` files inside VS Code.

## What it gives you

- `.mdv` files get a language id and basic syntax highlighting (front-matter YAML, `:::` directives, `chart` / `table` / `stat` fenced blocks).
- An **Open Preview to the Side** button in the editor title bar (the preview icon, for `.mdv` files).
- Commands:
  - `MDV: Open Preview` — preview replaces the current tab.
  - `MDV: Open Preview to the Side` — preview opens in the adjacent column.
- Keyboard shortcut: **Ctrl+Shift+V** (Windows/Linux) / **Cmd+Shift+V** (macOS) when an `.mdv` file is active.
- **Auto-refresh** with 200 ms debounce as you type. Also refreshes when any `.csv` / `.tsv` / `.json` in the same folder is saved.
- **Webview-only**: rendering happens in the extension host, the webview just displays static HTML. Scripts are disabled (`enableScripts: false`) because MDV's v1 output is static.

## Run the extension for development

### One-time setup

Open the extension folder as the workspace root:

```bash
cd D:\mdv\packages\mdv-vscode
code .
```

From the integrated terminal:

```bash
npm install   # only needed once (at the repo root)
npm run build # or: npx tsc -w to auto-rebuild
```

### Launch (F5)

The extension ships with a VS Code launch config ([`.vscode/launch.json`](../packages/mdv-vscode/.vscode/launch.json)) and a pre-launch build task ([`.vscode/tasks.json`](../packages/mdv-vscode/.vscode/tasks.json)).

1. Press **F5** (or **Run → Start Debugging**).
2. A second window titled **"[Extension Development Host]"** opens with the `examples/` folder loaded.
3. In that window, open any `.mdv` file.
4. Press **Ctrl+Shift+V** or click the preview icon.

Edits in the source auto-refresh the preview.

### Reload after changes

- **Changed `extension.ts`?** Rebuild (`npm run build` or leave `tsc -w` running), then press **Ctrl+R** in the Extension Development Host window to reload.
- **Changed `@mdv/core`?** Rebuild it (`npm run build --workspace @mdv/core` from the repo root), then reload the host with **Ctrl+R**.
- **Changed the `.mdv` file itself?** No reload needed — the preview debounces and re-renders.

## Package the extension for local install

```bash
cd packages/mdv-vscode
npx vsce package --no-dependencies
# → mdv-vscode-0.1.0.vsix

code --install-extension mdv-vscode-0.1.0.vsix
```

You can then open any `.mdv` file in your everyday VS Code without the dev host.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Command 'MDV: Open Preview' not found" | Extension didn't activate. In the first (dev) window, check the Debug Console for errors. Usually a build or missing-dep issue. |
| Preview panel is blank | Open the Debug Console. Render errors are logged there. Often a `.csv` path typo in front-matter. |
| `Cannot find module '@mdv/core'` | From the repo root, run `npm install && npm run build`, then Ctrl+R in the dev host. |
| Changes to the extension aren't reflected | Did you rebuild and Ctrl+R? The extension host doesn't hot-reload TypeScript. |
| Preview doesn't auto-refresh | Confirm the file extension is `.mdv` and that its language id is detected as `mdv` (shown in the status bar). |

## How it works (internals)

The extension is compiled to **CommonJS** (what VS Code's extension host expects). `@mdv/core` is **ESM**. The extension uses a dynamic `import("@mdv/core")` once, caches the promise, then calls `core.parse(src, {baseDir})` + `core.render(doc)` on every refresh. The resulting self-contained HTML is assigned to `panel.webview.html`.

Key code: [`packages/mdv-vscode/src/extension.ts`](../packages/mdv-vscode/src/extension.ts).

## What it doesn't do (yet)

- No Markdown-It-compatible syntax highlighting for the body prose beyond what VS Code's bundled `text.html.markdown` grammar gives you — the MDV grammar extends it but doesn't override it.
- No outline / TOC integration.
- No "Scroll with editor" sync (preview is independent).
- No intellisense for info-string options (`x=`, `y=`, `series=`).

These are straightforward to add; they just aren't v1.
