#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { renderFile, renderFileWithDiagnostics, VERSION } from "@mdv/core";
import { previewCommand } from "./preview-cmd.js";
import { exportPdfCommand } from "./export-cmd.js";

function friendlyError(e: unknown, file: string): string {
  const err = e as NodeJS.ErrnoException;
  if (err.code === "ENOENT") return `file not found: ${file}`;
  return err.message;
}

function usage(): never {
  console.error("mdv — render MDV documents");
  console.error("Usage:");
  console.error("  mdv render <file.mdv> [--out <path>]");
  console.error("  mdv preview <file.mdv> [--port <n>]");
  console.error("  mdv export <file.mdv> --pdf [--out <path>] [--page-size letter|a4]");
  console.error("  mdv version");
  process.exit(1);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd) usage();

  if (cmd === "version" || cmd === "--version" || cmd === "-v") {
    console.log(VERSION);
    return;
  }

  if (cmd === "export") {
    const file = rest[0];
    if (!file || !rest.includes("--pdf")) usage();
    const outIdx = rest.indexOf("--out");
    if (outIdx >= 0 && !rest[outIdx + 1]) {
      console.error("Error: --out requires a path argument");
      process.exit(1);
    }
    const out = outIdx >= 0 ? rest[outIdx + 1] : file.replace(/\.mdv$/i, "") + ".pdf";
    const psIdx = rest.indexOf("--page-size");
    const rawPs = psIdx >= 0 ? rest[psIdx + 1] : "letter";
    if (rawPs !== "letter" && rawPs !== "a4") {
      console.error("Error: --page-size must be 'letter' or 'a4'");
      process.exit(1);
    }
    const ps = rawPs;
    try {
      await exportPdfCommand(file, out, ps);
    } catch (e) {
      console.error(`Error: ${friendlyError(e, file)}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === "preview") {
    const file = rest[0];
    if (!file) usage();
    const portIdx = rest.indexOf("--port");
    const portRaw = portIdx >= 0 ? rest[portIdx + 1] : "3000";
    const port = Number(portRaw);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      console.error(`Error: invalid --port '${portRaw ?? ""}' — expected a number between 1 and 65535`);
      process.exit(1);
    }
    await previewCommand(file, port);
    return;
  }

  if (cmd === "render") {
    const file = rest[0];
    if (!file) usage();
    const outIdx = rest.indexOf("--out");
    if (outIdx >= 0 && !rest[outIdx + 1]) {
      console.error("Error: --out requires a path argument");
      process.exit(1);
    }
    const out = outIdx >= 0 ? rest[outIdx + 1] : file.replace(/\.mdv$/i, "") + ".html";
    const strict = rest.includes("--strict");
    try {
      const { html, fatals, warnings } = await renderFileWithDiagnostics(file);
      await fs.mkdir(path.dirname(path.resolve(out)), { recursive: true });
      await fs.writeFile(out, html, "utf8");
      console.error(`Rendered ${file} -> ${path.resolve(out)}`);
      // The document renders regardless (errors never crash the doc), but the
      // author should still see problems on the terminal.
      for (const f of fatals) console.error(`  fatal: ${f}`);
      for (const w of warnings) console.error(`  warning: ${w}`);
      // --strict makes fatal document errors fail the command, for CI gating.
      if (strict && fatals.length) process.exit(1);
    } catch (e) {
      console.error(`Error: ${friendlyError(e, file)}`);
      process.exit(1);
    }
    return;
  }

  usage();
}

main();
