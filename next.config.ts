import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle (.next/standalone) so the desktop
  // (Electron) build can launch the app without the full project tree.
  output: "standalone",
  // better-sqlite3 is a native module and must never be bundled.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
