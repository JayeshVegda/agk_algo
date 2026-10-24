import { defineConfig } from "vitest/config";
import * as path from "node:path";
import * as fs from "node:fs";

const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Ignore if already loaded or unreadable
  }
}

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/e2e/**", "**/dist/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
