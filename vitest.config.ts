import { defineConfig } from "vitest/config";

import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: [
      "src/**/*.{test,spec}.?(c|m)[jt]s?(x)",
      "tests/unit/**/*.spec.ts",
    ],
    exclude: ["**/node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
