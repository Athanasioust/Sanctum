const fs = require("node:fs");
const path = require("node:path");

// Finalizes the packaged standalone Next.js server. Two problems are fixed here,
// after the app is packed into appOutDir but before installers are built:
//
//   1. electron-builder strips top-level node_modules from extraResources, which
//      drops the server's runtime deps (including the native better-sqlite3
//      binary). We copy them back from the assembled source bundle.
//
//   2. Turbopack's standalone output symlinks the externalized better-sqlite3
//      into `.next/node_modules/better-sqlite3-<hash>` using an ABSOLUTE path to
//      this dev machine's project. That symlink is broken on every other
//      machine and bypasses the Electron-ABI binary. We replace it with a real
//      copy of the (Electron-ABI) better-sqlite3 package.
exports.default = async function afterPack(context) {
  const { appOutDir, packager } = context;
  const srcStandalone = path.join(packager.projectDir, ".next", "standalone");
  const pkgStandalone = path.join(appOutDir, "resources", "standalone");

  // 1. Restore the stripped top-level node_modules (real dirs, dereferenced).
  const srcNM = path.join(srcStandalone, "node_modules");
  const pkgNM = path.join(pkgStandalone, "node_modules");
  if (!fs.existsSync(srcNM)) {
    throw new Error(
      `Standalone node_modules not found at ${srcNM}. Run the full desktop ` +
        `build (npm run desktop:build) so the bundle is assembled first.`,
    );
  }
  fs.rmSync(pkgNM, { recursive: true, force: true });
  fs.cpSync(srcNM, pkgNM, { recursive: true, dereference: true });

  const goodBinary = path.join(
    pkgNM,
    "better-sqlite3",
    "build",
    "Release",
    "better_sqlite3.node",
  );
  if (!fs.existsSync(goodBinary)) {
    throw new Error(`Electron-ABI better-sqlite3 binary missing at ${goodBinary}`);
  }

  // 2. Replace the absolute better-sqlite3 symlink(s) under .next/node_modules
  //    with a real copy of the packaged (Electron-ABI) better-sqlite3.
  const nextNM = path.join(pkgStandalone, ".next", "node_modules");
  if (fs.existsSync(nextNM)) {
    for (const entry of fs.readdirSync(nextNM)) {
      if (entry.startsWith("better-sqlite3")) {
        const target = path.join(nextNM, entry);
        fs.rmSync(target, { recursive: true, force: true });
        fs.cpSync(path.join(pkgNM, "better-sqlite3"), target, {
          recursive: true,
          dereference: true,
        });
        console.log(`  [afterPack] materialized ${path.join(".next", "node_modules", entry)}`);
      }
    }
  }

  console.log(`  [afterPack] finalized standalone runtime deps for ${appOutDir}`);
};
