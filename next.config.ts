import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle (.next/standalone) so the desktop
  // (Electron) build can launch the app without the full project tree.
  output: "standalone",
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
