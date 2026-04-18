# Getting started

## Prerequisites

- Node.js **≥ 20** and npm ≥ 10.
- Windows, macOS, or Linux.

## Install

From the repo root:

```bash
npm install
npm run build
```

This builds all three packages: `@mdv/core` (parser + renderer), `@mdv/cli` (`mdv` command), and `mdv-vscode` (editor extension).

The `mdv` binary isn't installed globally yet; invoke it with:

```bash
node packages/mdv-cli/dist/index.js <command> [args]
```

Or add a convenience alias:

```bash
# bash / zsh
alias mdv="node $PWD/packages/mdv-cli/dist/index.js"

# PowerShell
function mdv { node D:\mdv\packages\mdv-cli\dist\index.js @args }
```

## Your first `.mdv` file

Save this as `hello.mdv`:

````markdown
---
title: Hello MDV
theme: minimal
---

# Hello MDV

This is standard Markdown. Below is a chart, written as a fenced block:

```chart type=bar x=fruit y=count title="Favorite fruit"
fruit, count
Apple, 12
Banana, 8
Cherry, 5
```

And a KPI card:

```stat
label, value, delta
Survey responses, 25, +3
```
````

## Render it

```bash
mdv render hello.mdv
# → writes hello.html next to the source
```

Open `hello.html` in any browser. It's a **self-contained** HTML file: SVG charts are inlined, CSS is inlined, no network requests.

## Watch + live-reload

```bash
mdv preview hello.mdv --port 3000
```

Open <http://localhost:3000>. Edit `hello.mdv` in any editor — the browser reloads automatically. The server renders in memory; no file is written to disk.

## Export a PDF

```bash
mdv export hello.mdv --pdf
# → writes hello.pdf next to the source (uses headless Chromium)
```

## Edit in VS Code with side-by-side preview

Open the `mdv-vscode` folder in VS Code and press F5 — see [the VS Code guide](vscode.md). Inside the dev window, open `hello.mdv` and press **Ctrl+Shift+V**.

## Next steps

- Learn the full [syntax](syntax.md).
- Browse the [charts reference](charts.md).
- Pick a [theme](themes-and-styles.md) and define some named styles.
