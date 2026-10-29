// Copies Leaflet's built JS and CSS out of node_modules into public/vendor/ so
// the atlas's "Interactive HTML" export can inline them into a standalone,
// offline file. (The in-app map imports Leaflet through the bundler; this copy
// exists only for the export, which has no bundler.)
//
// Like the pdf.js worker, the copy is generated rather than committed so it
// can never drift from the installed leaflet version, and it lives in public/
// so scripts/build-desktop.mjs carries it into the packaged app. Run before
// `next build` and `next dev`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "node_modules", "leaflet", "dist");
const targetDir = path.join(root, "public", "vendor", "leaflet");

fs.mkdirSync(targetDir, { recursive: true });
// LICENSE travels with the code: the export redistributes Leaflet (BSD-2-Clause).
for (const [dir, file] of [[sourceDir, "leaflet.js"], [sourceDir, "leaflet.css"], [path.dirname(sourceDir), "LICENSE"]]) {
  const source = path.join(dir, file);
  if (!fs.existsSync(source)) {
    console.error(`[leaflet] Not found: ${source}\nRun \`npm install\` — the atlas export cannot work without it.`);
    process.exit(1);
  }
  fs.copyFileSync(source, path.join(targetDir, file));
}
const kb = Math.round(fs.statSync(path.join(targetDir, "leaflet.js")).size / 1024);
console.log(`[leaflet] public/vendor/leaflet/ (${kb} KB js)`);
