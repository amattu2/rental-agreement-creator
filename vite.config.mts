import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globalSetup: "./vitest.global-setup.ts",
    exclude: ["node_modules", "dist", "tests/e2e"],
    coverage: {
      provider: "v8",
      reporter: ["lcov", "json", "html"],
      enabled: true,
    },
    testTimeout: 10_000,
  },
});
