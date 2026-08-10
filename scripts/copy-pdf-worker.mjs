// Copies pdf.js's web worker out of node_modules into public/ so the PDF
// viewer loads it from Sanctum's own origin.
//
// This exists because pdf.js's default is to fetch the worker from a CDN, which
// would break the offline guarantee outright. Serving it from public/ keeps the
// viewer working with no network at all, in dev, in the web build, and inside
// the packaged desktop app (scripts/build-desktop.mjs copies public/ into the
// standalone bundle).
//
// The copy is generated rather than committed, so it can never drift from the
// installed pdfjs-dist version. Run before `next build` and `next dev`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const targetDir = path.join(root, "public");
const target = path.join(targetDir, "pdf.worker.min.mjs");

if (!fs.existsSync(source)) {
  console.error(
    `[pdf-worker] Not found: ${source}\n` +
      "Run `npm install` — the PDF viewer cannot work without it.",
  );
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);

const kb = Math.round(fs.statSync(target).size / 1024);
console.log(`[pdf-worker] public/pdf.worker.min.mjs (${kb} KB)`);
