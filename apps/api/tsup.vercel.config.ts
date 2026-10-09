import { mkdir, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

/**
 * Builds the API as a Vercel Function using the Build Output API
 * (https://vercel.com/docs/build-output-api/v3). Everything, third-party packages included, is
 * bundled into one CommonJS file so the function needs no node_modules at runtime.
 * Run with `pnpm build:vercel`; Vercel deploys .vercel/output as is.
 */
const output = ".vercel/output";
const fn = `${output}/functions/index.func`;

export default defineConfig({
  entry: { index: "src/vercel.ts" },
  format: ["cjs"],
  platform: "node",
  target: "node22",
  outDir: fn,
  outExtension: () => ({ js: ".cjs" }),
  noExternal: [/.*/],
  splitting: false,
  // Export the handler as module.exports itself, and keep .default for launchers that look there.
  footer: {
    js: "if (module.exports.default) module.exports = Object.assign(module.exports.default, { default: module.exports.default });",
  },
  sourcemap: false,
  clean: true,
  minify: false,
  async onSuccess() {
    await mkdir(fn, { recursive: true });
    await writeFile(
      `${fn}/.vc-config.json`,
      JSON.stringify(
        {
          runtime: "nodejs22.x",
          handler: "index.cjs",
          launcherType: "Nodejs",
          shouldAddHelpers: false,
          supportsResponseStreaming: true,
          maxDuration: 30,
        },
        null,
        2,
      ),
    );
    await writeFile(
      `${output}/config.json`,
      JSON.stringify({ version: 3, routes: [{ src: "/(.*)", dest: "/index" }] }, null, 2),
    );
  },
});
