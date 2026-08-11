const fs = require("node:fs");
const path = require("node:path");

// electron-builder's `Arch` enum (builder-util) as plain numbers, so this hook
// does not have to require a transitive dependency of electron-builder.
const ARCH_NAMES = { 0: "ia32", 1: "x64", 2: "armv7l", 3: "arm64", 4: "universal" };

// Finalizes the packaged standalone Next.js server. Three problems are fixed
// here, after the app is packed into appOutDir but before it is signed:
//
//   1. electron-builder strips top-level node_modules from extraResources, which
//      drops the server's runtime deps (including the native better-sqlite3
//      binary). We copy them back from the assembled source bundle.
//
//   2. One packaging run can emit several architectures (macOS ships x64 and
//      arm64), but the source bundle holds only one better-sqlite3 binary. We
//      overwrite it with the binary staged for THIS arch by
//      scripts/build-desktop.mjs, or the app dies on load with a wrong-
//      architecture native module.
//
//   3. Turbopack's standalone output symlinks the externalized better-sqlite3
//      into `.next/node_modules/better-sqlite3-<hash>` using an ABSOLUTE path to
//      this dev machine's project. That symlink is broken on every other
//      machine and bypasses the Electron-ABI binary. We replace it with a real
//      copy of the (correct-arch) better-sqlite3 package.
//
// Order matters: the arch swap has to happen before the symlinks are
// materialized, since those are copied from the package we just fixed up.
exports.default = async function afterPack(context) {
  const { appOutDir, packager, arch, electronPlatformName } = context;
  const srcStandalone = path.join(packager.projectDir, ".next", "standalone");

  // On macOS the resources live inside `Sanctum.app/Contents/Resources`, not
  // directly under appOutDir the way they do on Windows and Linux. Ask the
  // packager instead of assuming, or every copy below lands in a stray folder
  // beside the .app while the shipped bundle stays broken — and, because the
  // checks then inspect the files we just wrote, the build still reports
  // success.
  const pkgStandalone = path.join(packager.getResourcesDir(appOutDir), "standalone");

  // 1. Restore the stripped top-level node_modules (real dirs, dereferenced).
  const srcNM = path.join(srcStandalone, "node_modules");
  const pkgNM = path.join(pkgStandalone, "node_modules");
  if (!fs.existsSync(srcNM)) {
    throw new Error(
      `Standalone node_modules not found at ${srcNM}. Run the full desktop ` +
        `build (npm run desktop:build) so the bundle is assembled first.`,
    );
  }
  if (!fs.existsSync(pkgStandalone)) {
    throw new Error(
      `Packaged standalone bundle not found at ${pkgStandalone}. The ` +
        `extraResources copy did not land where this hook expected it.`,
    );
  }
  fs.rmSync(pkgNM, { recursive: true, force: true });
  fs.cpSync(srcNM, pkgNM, { recursive: true, dereference: true });

  // 2. Swap in the native binary built for the architecture being packaged.
  //    `mas` builds are darwin under a different label; the staged binaries are
  //    keyed by the platform name the build script saw.
  const platformName = electronPlatformName === "mas" ? "darwin" : electronPlatformName;
  const archName = ARCH_NAMES[arch];
  if (!archName) {
    throw new Error(`Unrecognized electron-builder arch '${arch}'.`);
  }

  const stagedBinary = path.join(
    packager.projectDir,
    ".next",
    "native",
    `${platformName}-${archName}`,
    "better_sqlite3.node",
  );
  if (!fs.existsSync(stagedBinary)) {
    throw new Error(
      `No better-sqlite3 binary staged for ${platformName}-${archName} at ` +
        `${stagedBinary}. Run the full desktop build (npm run desktop:build), ` +
        `which fetches one per target architecture.`,
    );
  }

  const nativeDest = path.join(
    pkgNM,
    "better-sqlite3",
    "build",
    "Release",
    "better_sqlite3.node",
  );
  fs.mkdirSync(path.dirname(nativeDest), { recursive: true });
  fs.copyFileSync(stagedBinary, nativeDest);
  console.log(`  [afterPack] using the ${platformName}-${archName} better-sqlite3 binary`);

  // 3. Replace the absolute better-sqlite3 symlink(s) under .next/node_modules
  //    with a real copy of the packaged (correct-arch) better-sqlite3.
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
