// Orchestrates the Sanctum desktop (Electron) build.
//
// Steps:
//   1. `next build` — produces the standalone server (with the Node-ABI native
//      better-sqlite3 binary).
//   2. Assemble the standalone bundle: copy in .next/static, public, drizzle.
//   3. Fetch the prebuilt better-sqlite3 binary for Electron's ABI — one per
//      architecture we package — and stage them under .next/native, then
//      restore the Node-ABI binary so `next dev`/`next build` keep working.
//      The child process runs on Electron's Node runtime, so it needs the
//      Electron-ABI build. We download prebuilt binaries rather than compiling,
//      so no C++ toolchain is required — but Electron must be pinned to a
//      version for which better-sqlite3 publishes a prebuilt binary (v42.x).
//   4. `electron-builder` — package the installers for the target platform.
//      electron/after-pack.js picks the staged binary matching each arch.
//
// Run with: npm run desktop:build          (targets the host platform)
//           npm run desktop:build:linux    (explicit; must be run under Linux/WSL)
//           npm run desktop:build:mac      (explicit; must be run on a Mac)
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
// `archs` must stay in sync with the target list in electron-builder.yml: one
// native better-sqlite3 binary is staged per entry, and after-pack.js throws if
// electron-builder packages an arch that was never staged.
const SUPPORTED = {
  win32: { flag: "--win", label: "Windows", archs: ["x64"] },
  linux: { flag: "--linux", label: "Linux", archs: ["x64"] },
  darwin: { flag: "--mac", label: "macOS", archs: ["x64", "arm64"] },
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

// The macOS bundle icon. electron/icon.icns is used as-is when present;
// otherwise electron-builder generates one from electron/icon.png and rejects
// anything under 512x512. Check up front rather than failing at the packaging
// step, minutes in.
if (process.platform === "darwin") {
  const icnsPath = path.join(root, "electron", "icon.icns");
  if (fs.existsSync(icnsPath)) {
    console.log("Using electron/icon.icns for the macOS bundle icon.");
  } else {
    const png = fs.readFileSync(path.join(root, "electron", "icon.png"));
    // PNG IHDR stores width and height as big-endian uint32s at bytes 16 and 20.
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (width < 512 || height < 512) {
      throw new Error(
        `electron/icon.png is ${width}x${height}; macOS needs at least 512x512.\n` +
          `Replace it with a 1024x1024 export (or add electron/icon.icns) before ` +
          `building for macOS.`,
      );
    }
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
// the binary for the current Node on the current arch. prebuild-install always
// downloads (it has no "already present, skip" path), so calling this in a loop
// really does yield a different binary per arch.
function fetchPrebuilt(runtime, version, arch = process.arch) {
  const flags =
    runtime && version
      ? ` --runtime=${runtime} --target=${version}` +
        ` --arch=${arch} --platform=${process.platform}`
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
// `npx next build` skips npm's prebuild hook, so the pdf.js worker and the
// Leaflet files for the atlas export have to be staged into public/ here too.
run("node scripts/copy-pdf-worker.mjs");
run("node scripts/copy-leaflet.mjs");
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

// --- 3. Stage the Electron-ABI native binaries ----------------------------
// One binary per architecture we package. macOS ships both Intel and Apple
// Silicon from a single run, and a build carrying the wrong-arch .node fails at
// require() time on the user's machine — after the installer looked fine here.
//
// Fetching an Electron binary overwrites the Node-ABI one that npm installed,
// so stash a copy first. Restoring from that copy — rather than re-downloading
// the Node build — keeps `next dev` working even where no Node-ABI prebuild is
// published for the running Node version (the case on Linux/Node 20, which
// compiles better-sqlite3 from source at install time instead).
const electronBinary = path.join(root, nativeRel);
const nodeBinaryBackup = `${electronBinary}.node-abi.bak`;
const nativeStageRoot = path.join(root, ".next", "native");

if (fs.existsSync(electronBinary)) {
  fs.copyFileSync(electronBinary, nodeBinaryBackup);
  console.log("\nStashed the Node-ABI better-sqlite3 binary.");
}

const electronVersion = JSON.parse(
  fs.readFileSync(path.join(root, "node_modules", "electron", "package.json"), "utf8"),
).version;

fs.rmSync(nativeStageRoot, { recursive: true, force: true });

try {
  for (const arch of target.archs) {
    console.log(
      `\nFetching prebuilt better-sqlite3 for Electron ${electronVersion} ` +
        `(${process.platform}-${arch})...`,
    );
    fetchPrebuilt("electron", electronVersion, arch);

    if (!fs.existsSync(electronBinary)) {
      throw new Error(
        `Prebuilt Electron binary not found. better-sqlite3 may not publish a ` +
          `build for Electron ${electronVersion} on ${process.platform}-${arch} — ` +
          `pin Electron to a supported version.`,
      );
    }

    const stageDir = path.join(nativeStageRoot, `${process.platform}-${arch}`);
    fs.mkdirSync(stageDir, { recursive: true });
    fs.copyFileSync(electronBinary, path.join(stageDir, "better_sqlite3.node"));
    console.log(`  staged ${path.relative(root, stageDir)}`);
  }
} finally {
  // Always restore the Node-ABI binary, even if a fetch above failed partway —
  // otherwise a failed build leaves the working tree unable to run `next dev`.
  // Never fatal: the artifacts do not depend on it, and throwing here would
  // discard an otherwise finished build.
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
}

// Seed the standalone bundle with one of the staged binaries so it is coherent
// on its own (the host's, where that is a target). after-pack.js overwrites this
// per architecture, so which one lands here does not affect the artifacts.
const seedArch = target.archs.includes(process.arch) ? process.arch : target.archs[0];
const bundledBinary = path.join(standalone, nativeRel);
fs.mkdirSync(path.dirname(bundledBinary), { recursive: true });
fs.copyFileSync(
  path.join(nativeStageRoot, `${process.platform}-${seedArch}`, "better_sqlite3.node"),
  bundledBinary,
);
console.log(`\nSeeded the standalone bundle with the ${seedArch} Electron-ABI binary.`);

// --- 4. Package with electron-builder -------------------------------------
run(`npx electron-builder ${target.flag}`);

console.log("\nDesktop build complete. See the dist/ folder.");
