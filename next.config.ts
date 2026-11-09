import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// The local-network guard: requests from other devices reach only the player
// view, and only with the share token (see scripts/lan-guard.cjs). Loading it
// here covers `next start` and `next dev`; the desktop app loads it before the
// standalone server instead, which this config file never runs in.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require(path.join(process.cwd(), "scripts", "lan-guard.cjs"));

// Baked into the build so the app knows which version it is (the "What's new"
// dialog compares it with the last version the DM saw).
const { version } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
) as { version: string };

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle (.next/standalone) so the desktop
  // (Electron) build can launch the app without the full project tree.
  output: "standalone",
  env: { NEXT_PUBLIC_SANCTUM_VERSION: version },
  // The player view is meant to be opened from phones on the same Wi-Fi, which
  // means the dev server gets requests from http://<lan-ip>:<port> rather than
  // localhost. Next blocks cross-origin access to dev-only resources by
  // default, and that includes the HMR socket the dev runtime uses to resolve
  // `next/dynamic` chunks — so on a phone the battle map (loaded with
  // `ssr: false`) silently never mounted while the server-rendered rest of the
  // page looked fine. Allowing the private ranges restores it. Development
  // only: `next start` and the packaged desktop app never block these.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // better-sqlite3 is a native module and must never be bundled.
  serverExternalPackages: ["better-sqlite3"],
  // The upload route references process.cwd()-based paths, which makes Next's
  // file tracer pull the whole project directory into the standalone bundle.
  // Exclude build/data folders so a rebuild never bundles the previous dist/
  // (which otherwise snowballs the desktop app to gigabytes).
  outputFileTracingExcludes: {
    "*": [
      "dist/**",
      "data/**",
      "backups/**",
      "public/uploads/**",
      ".next/cache/**",
      "drizzle/**",
      // The DM's own files and the project's sources must never ship inside
      // the app: a local uploads/ folder (campaign images), personal notes
      // kept beside the repo, the docs and the TypeScript sources (the server
      // runs the compiled .next output, never src/), and the repository and
      // tool folders. scripts/build-desktop.mjs fails the build if anything
      // outside its allowlist still reaches the bundle.
      ".git/**",
      ".github/**",
      ".claude/**",
      "uploads/**",
      "* outputs/**",
      "docs/**",
      "src/**",
      // sharp is traced in as an optional dependency of Next's image optimizer,
      // which Sanctum never uses (nothing imports next/image). It drags in a
      // platform-specific @img/sharp-<platform>-<arch> binary, so leaving it in
      // both bloats the bundle and puts the host's binary inside a build for
      // another platform. Drop it. If next/image is ever adopted, remove this
      // line and make sure the desktop build runs on the target platform.
      "node_modules/sharp/**",
      "node_modules/@img/**",
    ],
  },
};

export default nextConfig;
