import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Packaged desktop builds, local data and generated files — not source.
    "dist/**",
    "data/**",
    "backups/**",
    "uploads/**",
    "public/pdf.worker*",
    "public/vendor/**",
  ]),
  {
    // The Electron shell, and the server entry + LAN guard it loads ahead of
    // Next, run as plain CommonJS.
    files: ["electron/**/*.js", "scripts/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    rules: {
      // Apostrophes in copy are fine; correctness is enforced by tsc.
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
