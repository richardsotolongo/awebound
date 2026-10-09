import { defineConfig } from "tsup";

// Bundles the API and the internal @awebound/* packages (consumed as TypeScript source)
// into dist/main.js. Third-party dependencies stay external and load from node_modules.
export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  sourcemap: true,
  clean: true,
  noExternal: [/^@awebound\//],
});
