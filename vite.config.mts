import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globalSetup: "./vitest.global-setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["lcov", "json", "html"],
      enabled: true,
    },
    testTimeout: 10_000,
  },
});
