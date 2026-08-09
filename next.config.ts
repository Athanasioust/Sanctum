import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle (.next/standalone) so the desktop
  // (Electron) build can launch the app without the full project tree.
  output: "standalone",
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
