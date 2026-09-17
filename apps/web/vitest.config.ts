import { defineConfig } from "vitest/config";

// Pinned at module load so date assertions resolve identically on every machine and in CI.
process.env.TZ = "UTC";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    passWithNoTests: true,
  },
});
