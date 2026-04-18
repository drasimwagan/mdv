import { build } from "esbuild";

/**
 * Bundle the extension into a single CommonJS file.
 *
 * We bundle @mdv/core (ESM) and all its transitive deps (markdown-it, js-yaml)
 * into the output so the published .vsix has no runtime Node dependencies
 * beyond what VS Code itself provides.
 */
await build({
  entryPoints: ["src/extension.ts"],
  outfile: "dist/extension.js",
  bundle: true,
  platform: "node",
  target: "node18",          // VS Code ships Electron with Node 18+
  format: "cjs",
  external: ["vscode"],      // provided by the VS Code runtime
  sourcemap: false,          // keep .vsix small; flip to true for debugging
  minify: true,
  legalComments: "none",
  logLevel: "info",
});
