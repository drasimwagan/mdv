#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { renderFile, VERSION } from "@mdv/core";
import { previewCommand } from "./preview-cmd.js";
import { exportPdfCommand } from "./export-cmd.js";

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
      console.error(`Error: ${(e as Error).message}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === "preview") {
    const file = rest[0];
    if (!file) usage();
    const portIdx = rest.indexOf("--port");
    const port = portIdx >= 0 ? Number(rest[portIdx + 1]) : 3000;
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
    try {
      const html = await renderFile(file);
      await fs.writeFile(out, html, "utf8");
      console.error(`Rendered ${file} -> ${path.resolve(out)}`);
    } catch (e) {
      console.error(`Error: ${(e as Error).message}`);
      process.exit(1);
    }
    return;
  }

  usage();
}

main();
