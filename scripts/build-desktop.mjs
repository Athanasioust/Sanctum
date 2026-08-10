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
//   4. `electron-builder` — package the installers for the target platform.
//
// Run with: npm run desktop:build          (targets the host platform)
//           npm run desktop:build:linux    (explicit; must be run under Linux/WSL)
//
// Cross-building is deliberately refused. The native better-sqlite3 binary could
// be fetched for another platform, but the rest cannot: electron-builder needs
// `fpm` for deb/rpm (unavailable on Windows) and AppImage/tar.gz need real
// executable bits and the setuid chrome-sandbox, which NTFS does not carry.
// Build the Linux artifacts from WSL, where `npm ci` also installs the Linux
// native packages that the standalone bundle traces.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- Target platform ------------------------------------------------------
// Default to the host. An explicit --win/--linux must match the host, because
// the packaging step cannot cross-build (see the note at the top of this file).
const SUPPORTED = {
  win32: { flag: "--win", label: "Windows" },
  linux: { flag: "--linux", label: "Linux" },
  darwin: { flag: "--mac", label: "macOS" },
};

const requested = process.argv
  .slice(2)
  .find((a) => a === "--win" || a === "--linux" || a === "--mac");
const hostTarget = SUPPORTED[process.platform];

if (!hostTarget) {
  throw new Error(
    `Unsupported build host '${process.platform}'. Sanctum packages on Windows, Linux or macOS.`,
  );
}
if (requested && requested !== hostTarget.flag) {
  throw new Error(
    `Cannot build ${requested} artifacts on ${hostTarget.label}. Cross-building is not ` +
      `supported — run this build under the target platform (WSL for Linux, a Mac for macOS).`,
  );
}

const target = hostTarget;
console.log(`Building Sanctum desktop for ${target.label} (${process.platform}).`);

// electron-builder generates the macOS .icns from electron/icon.png and rejects
// anything under 512x512. Check it up front rather than letting a build fail at
// the packaging step, minutes in.
if (process.platform === "darwin") {
  const iconPath = path.join(root, "electron", "icon.png");
  const png = fs.readFileSync(iconPath);
  // PNG IHDR stores width and height as big-endian uint32s at bytes 16 and 20.
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width < 512 || height < 512) {
    throw new Error(
      `electron/icon.png is ${width}x${height}; macOS needs at least 512x512.
` +
        `Replace it with a 1024x1024 export (or add electron/icon.icns) before ` +
        `building for macOS.`,
    );
  }
}

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

// Download a prebuilt better-sqlite3 binary into node_modules/better-sqlite3,
// replacing whatever is there. With no runtime given, prebuild-install fetches
// the binary for the current Node.
function fetchPrebuilt(runtime, version) {
  const flags =
    runtime && version
      ? ` --runtime=${runtime} --target=${version}` +
        ` --arch=${process.arch} --platform=${process.platform}`
      : "";
  run(`node "${prebuildBin}"${flags}`, bsqDir);
}

// --- 0. Clean stale output ------------------------------------------------
// Removing dist/ and the previous standalone bundle is essential: Next traces
// the project directory, so a leftover dist/ would be bundled into the new
// build and the desktop app would snowball in size each rebuild.
for (const dir of ["dist", path.join(".next", "standalone")]) {
  fs.rmSync(path.join(root, dir), { recursive: true, force: true });
}

// --- 1. Build the Next.js standalone server -------------------------------
// `npx next build` skips npm's prebuild hook, so the pdf.js worker has to be
// staged into public/ explicitly here as well.
run("node scripts/copy-pdf-worker.mjs");
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

// Next's Turbopack standalone trace omits some compiled next-server runtimes
// (notably app-route-turbo.runtime.prod.js), which breaks API routes at runtime.
// Copy the full set so every route type works.
copyDir(
  path.join(root, "node_modules", "next", "dist", "compiled", "next-server"),
  path.join(standalone, "node_modules", "next", "dist", "compiled", "next-server"),
);

// --- 3. Swap in the Electron-ABI native binary ----------------------------
// Fetching the Electron binary overwrites the Node-ABI one that npm installed,
// so stash a copy first. Restoring from that copy — rather than re-downloading
// the Node build — keeps `next dev` working even where no Node-ABI prebuild is
// published for the running Node version (the case on Linux/Node 20, which
// compiles better-sqlite3 from source at install time instead).
const electronBinary = path.join(root, nativeRel);
const nodeBinaryBackup = `${electronBinary}.node-abi.bak`;

if (fs.existsSync(electronBinary)) {
  fs.copyFileSync(electronBinary, nodeBinaryBackup);
  console.log("\nStashed the Node-ABI better-sqlite3 binary.");
}

const electronVersion = JSON.parse(
  fs.readFileSync(path.join(root, "node_modules", "electron", "package.json"), "utf8"),
).version;
console.log(`\nFetching prebuilt better-sqlite3 for Electron ${electronVersion}...`);
fetchPrebuilt("electron", electronVersion);

const bundledBinary = path.join(standalone, nativeRel);
if (!fs.existsSync(electronBinary)) {
  throw new Error(
    `Prebuilt Electron binary not found. better-sqlite3 may not publish a build ` +
      `for Electron ${electronVersion} on ${process.platform}-${process.arch} — ` +
      `pin Electron to a supported version.`,
  );
}
fs.mkdirSync(path.dirname(bundledBinary), { recursive: true });
fs.copyFileSync(electronBinary, bundledBinary);
console.log("  swapped Electron-ABI binary into standalone bundle");

// Restore the Node-ABI binary immediately, so `next dev`/`next build` still work
// regardless of whether packaging below succeeds. Never fatal: the artifacts do
// not depend on it, and failing here would throw away a finished build.
console.log("\nRestoring Node-ABI better-sqlite3 (so `next dev` still works)...");
try {
  if (fs.existsSync(nodeBinaryBackup)) {
    fs.copyFileSync(nodeBinaryBackup, electronBinary);
    fs.rmSync(nodeBinaryBackup, { force: true });
    console.log("  restored from the stashed copy");
  } else {
    fetchPrebuilt();
  }
} catch (err) {
  console.warn(
    `  WARNING: could not restore the Node-ABI binary (${err.message}).\n` +
      `  node_modules/better-sqlite3 now holds the Electron build, so \`next dev\`\n` +
      `  will report an ABI mismatch until you run: npm rebuild better-sqlite3`,
  );
}

// --- 4. Package with electron-builder -------------------------------------
run(`npx electron-builder ${target.flag}`);

console.log("\nDesktop build complete. See the dist/ folder.");
