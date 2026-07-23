// Orchestrates the Sanctum desktop (Electron) build.
//
// Steps:
//   1. `next build` — produces the standalone server (with the Node-ABI native
//      better-sqlite3 binary).
//   2. Assemble the standalone bundle: copy in .next/static, public, drizzle.
//   3. Fetch the prebuilt better-sqlite3 binary for Electron's ABI and swap it
//      into the standalone bundle (the child process runs on Electron's Node
//      runtime), then restore the Node-ABI binary so `next dev`/`next build`
//      keep working. We download prebuilt binaries rather than compiling, so no
//      C++ toolchain is required — but Electron must be pinned to a version for
//      which better-sqlite3 publishes a prebuilt binary (currently v42.x).
//   4. `electron-builder` — package the Windows installer + portable exe.
//
// Run with: npm run desktop:build

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next", "standalone");
const bsqDir = path.join(root, "node_modules", "better-sqlite3");
const prebuildBin = path.join(root, "node_modules", "prebuild-install", "bin.js");
const nativeRel = path.join(
  "node_modules",
  "better-sqlite3",
  "build",
  "Release",
  "better_sqlite3.node",
);

function run(cmd, cwd = root) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) {
    console.log(`  (skip, missing) ${from}`);
    return;
  }
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`  copied ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}

// Download a prebuilt better-sqlite3 binary into node_modules/better-sqlite3.
// With no runtime given, prebuild-install fetches the binary for the current
// Node (used to restore the dev binary).
function fetchPrebuilt(runtime, target) {
  const flags =
    runtime && target
      ? ` --runtime=${runtime} --target=${target} --arch=x64 --platform=win32`
      : "";
  run(`node "${prebuildBin}"${flags}`, bsqDir);
}

// --- 1. Build the Next.js standalone server -------------------------------
run("npx next build");

if (!fs.existsSync(path.join(standalone, "server.js"))) {
  throw new Error(
    "Standalone server not found. Ensure next.config.ts sets output: 'standalone'.",
  );
}

// --- 2. Assemble the standalone bundle ------------------------------------
console.log("\nAssembling standalone bundle...");
copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
copyDir(path.join(root, "public"), path.join(standalone, "public"));
copyDir(path.join(root, "drizzle"), path.join(standalone, "drizzle"));

// --- 3. Swap in the Electron-ABI native binary ----------------------------
const electronVersion = JSON.parse(
  fs.readFileSync(path.join(root, "node_modules", "electron", "package.json"), "utf8"),
).version;
console.log(`\nFetching prebuilt better-sqlite3 for Electron ${electronVersion}...`);
fetchPrebuilt("electron", electronVersion);

const electronBinary = path.join(root, nativeRel);
const bundledBinary = path.join(standalone, nativeRel);
if (!fs.existsSync(electronBinary)) {
  throw new Error(
    `Prebuilt Electron binary not found. better-sqlite3 may not publish a build ` +
      `for Electron ${electronVersion} — pin Electron to a supported version.`,
  );
}
fs.mkdirSync(path.dirname(bundledBinary), { recursive: true });
fs.copyFileSync(electronBinary, bundledBinary);
console.log("  swapped Electron-ABI binary into standalone bundle");

// Immediately restore the Node-ABI binary so `next dev`/`next build` still work,
// regardless of whether packaging below succeeds.
console.log("\nRestoring Node-ABI better-sqlite3 (so `next dev` still works)...");
fetchPrebuilt();

// --- 4. Package with electron-builder -------------------------------------
run("npx electron-builder --win");

console.log("\nDesktop build complete. See the dist/ folder.");
