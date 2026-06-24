import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module and must never be bundled.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
