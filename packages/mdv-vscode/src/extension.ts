import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";

// @mdv/core is ESM; we're compiled to CJS. Use dynamic import — esbuild
// inlines it at bundle time; at dev time (plain tsc + F5) Node 20+ resolves
// the workspace symlink as ESM and this just works.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type MdvCore = typeof import("@mdv/core", { with: { "resolution-mode": "import" } });
let corePromise: Promise<MdvCore> | null = null;
function getCore(): Promise<MdvCore> {
  if (!corePromise) corePromise = import("@mdv/core");
  return corePromise;
}

interface Preview {
  panel: vscode.WebviewPanel;
  sourceUri: vscode.Uri;
  disposables: vscode.Disposable[];
}

const previews = new Map<string, Preview>();

export function activate(ctx: vscode.ExtensionContext): void {
  const openPreview = (toSide: boolean) => async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.toLowerCase().endsWith(".mdv")) {
      vscode.window.showInformationMessage("Open a .mdv file first.");
      return;
    }
    await openPreviewFor(editor.document.uri, toSide);
  };

  ctx.subscriptions.push(
    vscode.commands.registerCommand("mdv.openPreview", openPreview(false)),
    vscode.commands.registerCommand("mdv.openPreviewToSide", openPreview(true)),
  );

  // Auto-refresh on edits to any .mdv doc currently being previewed, plus data files.
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      const key = e.document.uri.toString();
      if (previews.has(key)) {
        schedule(key);
      } else {
        // If a referenced data file changes, refresh any preview in the same folder.
        const ext = path.extname(e.document.fileName).toLowerCase();
        if ([".csv", ".tsv", ".json"].includes(ext)) {
          for (const [k, p] of previews) {
            if (path.dirname(p.sourceUri.fsPath) === path.dirname(e.document.fileName)) schedule(k);
          }
        }
      }
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      for (const [k, p] of previews) {
        if (p.sourceUri.fsPath === doc.fileName || path.dirname(p.sourceUri.fsPath) === path.dirname(doc.fileName)) {
          schedule(k);
        }
      }
    }),
  );
}

const debounceTimers = new Map<string, NodeJS.Timeout>();
function schedule(key: string): void {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    key,
    setTimeout(() => {
      debounceTimers.delete(key);
      refresh(key).catch((e) => console.error("mdv refresh error", e));
    }, 200),
  );
}

async function openPreviewFor(uri: vscode.Uri, toSide: boolean): Promise<void> {
  const key = uri.toString();
  const existing = previews.get(key);
  if (existing) {
    existing.panel.reveal(
      toSide ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
      true,
    );
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "mdv.preview",
    `MDV Preview — ${path.basename(uri.fsPath)}`,
    toSide ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
    {
      enableScripts: false,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.dirname(uri.fsPath))],
    },
  );

  const disposables: vscode.Disposable[] = [];
  disposables.push(
    panel.onDidDispose(() => {
      for (const d of disposables) d.dispose();
      previews.delete(key);
    }),
  );

  previews.set(key, { panel, sourceUri: uri, disposables });
  await refresh(key);
}

async function refresh(key: string): Promise<void> {
  const entry = previews.get(key);
  if (!entry) return;
  const { panel, sourceUri } = entry;

  let html: string;
  try {
    // Prefer the open-editor text to catch unsaved edits; fall back to disk.
    const openDoc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() === sourceUri.toString(),
    );
    const src = openDoc ? openDoc.getText() : await fs.readFile(sourceUri.fsPath, "utf8");
    const baseDir = path.dirname(sourceUri.fsPath);
    const core = await getCore();
    const doc = await core.parse(src, { baseDir });
    html = core.render(doc);
  } catch (e) {
    html = errorPage((e as Error).message, sourceUri.fsPath);
  }

  panel.webview.html = html;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

function errorPage(message: string, file: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>MDV preview error</title><style>
body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2em auto; padding: 0 1em; color: #222; }
h1 { color: #c64a4a; }
pre { background: #ffecec; padding: 1em; border-left: 4px solid #c64a4a; overflow: auto; white-space: pre-wrap; }
</style></head><body>
<h1>Render error</h1>
<p>File: <code>${escapeHtml(file)}</code></p>
<pre>${escapeHtml(message)}</pre>
</body></html>`;
}

export function deactivate(): void {
  for (const p of previews.values()) p.panel.dispose();
  previews.clear();
}
