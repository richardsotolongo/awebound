// Refreshes this skill's assets from the live site code in packages/brand, so the skill stays in step.
// Run from anywhere inside the awebound repo, after `pnpm install`:
//   node .claude/skills/awebound-brand/scripts/sync-from-site.mjs
// Copies tokens, component CSS, the Tailwind theme, logos and marks; rebuilds the component bundles and
// their types; then checks that references/tokens.json lists every token. Usage notes in tokens.json and
// the Markdown references are written by hand: update them when a rule or value changes.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(skill, "../../..");
const brand = join(root, "packages/brand");
const assets = join(skill, "assets");
if (!existsSync(join(brand, "src/index.ts"))) throw new Error(`packages/brand not found under ${root}`);

const read = (p) => readFileSync(p, "utf8");
const write = (p, s) => writeFileSync(p, s.replace(/\r\n/g, "\n"));

// 1. Tokens: the site file verbatim, plus a Google Fonts import so the font fallbacks resolve off-site.
const tokens = read(join(brand, "src/styles/tokens.css")).replace(/^\/\*[\s\S]*?\*\/\s*/, "");
write(join(assets, "tokens.css"), `/* Awebound tokens, copied from packages/brand/src/styles/tokens.css (the live site). Keep the two in step.
   Dark (coal) is the default theme; set data-theme="light" on <html> or any wrapper for the bone-paper theme.
   This is the only file that may contain raw hex values.
   Fonts: the site self-hosts Grenze Gotisch, Manrope and Cormorant Garamond Italic 500 and exposes
   --font-grenze / --font-manrope / --font-cormorant. Outside the site, the Google Fonts import below
   supplies the same families by name. */
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Grenze+Gotisch:wght@100..900&family=Manrope:wght@200..800&display=swap");
${tokens}`);

// 2. Component CSS and the Tailwind v4 theme.
const components = read(join(brand, "src/styles/components.css")).replace(/^\/\*[\s\S]*?\*\/\s*/, "");
write(join(assets, "components/awebound.css"), `/* Awebound components, copied from packages/brand/src/styles/components.css (the live site). Keep the two in step.
   Every color, size and radius comes from tokens.css. Lives in cascade layers so Tailwind utilities can still
   override layout when needed. */

${components}`);
write(join(assets, "tailwind-theme.css"), read(join(brand, "src/styles/theme.css")).replace(
  "/* Tailwind v4 theme for Awebound.",
  "/* Tailwind v4 theme for Awebound, copied from packages/brand/src/styles/theme.css (what the site uses).",
));

// The Tailwind v3 preset, for projects not on v4: every color token, pointing at its CSS variable.
const NOT_COLOR = /^(space|radius|font|ease|duration|shadow|glow|container|gutter|tap|header|light-shaft)/;
const colorNames = [...new Set([...tokens.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]))].filter((n) => !NOT_COLOR.test(n));
write(join(assets, "tailwind-preset.js"), `/** Awebound Tailwind v3 preset, generated from tokens.css. The site itself uses Tailwind v4 with
 *  tailwind-theme.css; use this preset only in a Tailwind v3 project.
 *  Every value points at a CSS variable from tokens.css, so themes switch with data-theme.
 *  Usage: tailwind.config.js -> presets: [require("./awebound/tailwind-preset.js")] and import tokens.css once.
 *  Type styles are brand classes (.aw-display, .aw-h2, .aw-label, .aw-quote...) from awebound.css. */
module.exports = {
  theme: {
    extend: {
      colors: {
${colorNames.map((n) => `        "${n}": "var(--${n})"`).join(",\n")}
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        scripture: ["var(--font-scripture)"],
      },
      spacing: { ${[1, 2, 3, 4, 6, 8, 12, 16, 24].map((k) => `"aw-${k}": "var(--space-${k})"`).join(", ")} },
      borderRadius: { none: "0px", sm: "var(--radius-sm)", DEFAULT: "var(--radius-0)" },
      maxWidth: { container: "var(--container-max)" },
      boxShadow: { raised: "var(--shadow-raised)", glow: "var(--glow-primary)" },
      minHeight: { tap: "var(--tap-min)" },
      minWidth: { tap: "var(--tap-min)" },
      height: { header: "var(--header-height)" },
      transitionTimingFunction: { reverent: "var(--ease-reverent)" },
      transitionDuration: { fast: "var(--duration-fast)", base: "var(--duration-base)" },
    },
  },
};
`);

// 3. Logos, marks and concept imagery.
for (const dir of ["logos", "marks", "imagery"]) cpSync(join(brand, "assets", dir), join(assets, dir), { recursive: true });

// 4. Component bundles: ESM for React 18+ builds, and an IIFE that reads React from window.React.
const pnpm = join(root, "node_modules/.pnpm");
const esbuildDir = readdirSync(pnpm).filter((d) => d.startsWith("esbuild@")).sort().pop();
if (!esbuildDir) throw new Error("esbuild not found in node_modules/.pnpm; run pnpm install");
const esbuild = createRequire(join(pnpm, esbuildDir, "node_modules/esbuild/package.json"))("esbuild");
const entry = join(brand, "src/index.ts");
const out = join(assets, "components");
const note = (kind) => `/* Awebound brand components (${kind}), bundled from packages/brand/src (the live site) by
   scripts/sync-from-site.mjs. Do not edit by hand. Pair with tokens.css and awebound.css. Props: index.d.ts, references/web.md. */`;
await esbuild.build({
  entryPoints: [entry], bundle: true, format: "esm", platform: "browser", target: "es2020", jsx: "automatic",
  external: ["react", "react/jsx-runtime"], banner: { js: `"use client";\n${note("ESM, React 18+")}` },
  outfile: join(out, "awebound-components.jsx"), legalComments: "none", logLevel: "warning",
});
const reactGlobal = {
  name: "react-global",
  setup(b) {
    b.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, (a) => ({ path: a.path, namespace: "rg" }));
    // jsxs gets static children, so they are spread as arguments (no key warnings); jsx passes one child.
    b.onLoad({ filter: /.*/, namespace: "rg" }, (a) => ({
      loader: "js",
      contents: a.path === "react" ? "module.exports = window.React;" : `var R = window.React;
function el(spread) {
  return function (t, p, k) {
    var q = Object.assign({}, p), c = q.children; delete q.children;
    if (k !== undefined) q.key = k;
    if (c === undefined) return R.createElement(t, q);
    return spread ? R.createElement.apply(null, [t, q].concat(c)) : R.createElement(t, q, c);
  };
}
module.exports = { jsx: el(false), jsxs: el(true), Fragment: R.Fragment };`,
    }));
  },
};
await esbuild.build({
  entryPoints: [entry], bundle: true, format: "iife", globalName: "Awebound", platform: "browser", target: "es2018",
  jsx: "automatic", plugins: [reactGlobal], banner: { js: note("global window.Awebound, needs React 18 UMD on window.React") },
  outfile: join(out, "awebound.umd.js"), legalComments: "none", logLevel: "warning",
});

// 5. Types: emit declarations from the source, then merge them into one index.d.ts.
const dts = mkdtempSync(join(tmpdir(), "awebound-dts-"));
const tsc = join(brand, "node_modules/typescript/bin/tsc");
execFileSync(process.execPath, [tsc, "-p", join(brand, "tsconfig.json"), "--noEmit", "false", "--declaration",
  "--emitDeclarationOnly", "--rootDir", join(brand, "src"), "--outDir", dts], { stdio: "inherit" });
const order = ["cx", "hex", "link", "marks/paths", "components/marks", "components/radio-group", "components/button",
  "components/scripture-ref", "components/scripture-quote", "components/thorn-rule", "components/header",
  "components/hero", "components/product-card", "components/plate", "components/swatches", "components/size-selector",
  "components/collection-banner", "components/altar-panel", "components/footer"];
const runtime = new Set(read(join(out, "awebound-components.jsx")).match(/export \{([^}]*)\}/)[1]
  .split(",").map((s) => s.trim()).filter(Boolean));
const reactTypes = new Set();
const body = order.map((f) => read(join(dts, `${f}.d.ts`)).split(/\r?\n/).filter((l) => {
  const m = l.match(/^import (?:type )?\{(.*)\} from "react";/);
  if (m) {
    m[1].split(",").map((s) => s.replace("type", "").trim()).filter(Boolean).forEach((n) => reactTypes.add(n));
    return false;
  }
  return !/^import .* from "\.\.?\//.test(l) && l.trim() !== "export {};";
}).join("\n").trim()).join("\n\n")
  .replace(/import\("react"\)\.JSX\.Element/g, "JSX.Element")
  .split("\n").filter((l) => !(/^export declare const (\w+)/.test(l) && !runtime.has(l.match(/^export declare const (\w+)/)[1])))
  .join("\n");
const exported = [...body.matchAll(/^export declare (?:function|const) (\w+)/gm)].map((m) => m[1]);
const missing = [...runtime].filter((n) => !exported.includes(n) && !/^[A-Z]\w*Props$/.test(n));
if (missing.length) console.warn("Exports without a declaration (add the file to `order`):", missing.join(", "));
write(join(out, "index.d.ts"), `/* Types for awebound-components.jsx and awebound.umd.js, generated from packages/brand/src by scripts/sync-from-site.mjs. */
import type { ${[...reactTypes].sort().join(", ")}, JSX } from "react";

${body}

declare global {
    interface Window {
        /** Set by awebound.umd.js. */
        Awebound: { ${exported.map((n) => `${n}: typeof ${n}`).join("; ")} };
    }
}
`);
rmSync(dts, { recursive: true, force: true });

// 6. tokens.json must list every token in tokens.css with the same values.
const json = JSON.parse(read(join(skill, "references/tokens.json")));
const css = read(join(assets, "tokens.css"));
const [darkPart, rest] = css.split('[data-theme="light"]');
const [lightPart, after] = rest.split(/\}([\s\S]*)/);
const vars = (s) => Object.fromEntries([...s.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const dark = { ...vars(darkPart), ...vars(after.split("@media")[0]) };
const light = vars(lightPart);
const values = Object.fromEntries(json.color.tokens.map((t) => [t.name, t.value]));
for (const g of ["spacing", "radius", "shadow", "layout", "motion"]) for (const t of json[g].tokens) values[t.name] = t.value;
const problems = [];
for (const [n, v] of Object.entries(dark)) {
  if (n.startsWith("font-")) continue;
  const jv = values[n];
  if (jv === undefined) { problems.push(`missing in tokens.json: ${n} (${v})`); continue; }
  const jd = typeof jv === "object" ? jv.dark : jv;
  if (jd.toLowerCase() !== v.toLowerCase()) problems.push(`${n}: tokens.json ${jd}, site ${v}`);
  if (light[n]) {
    const jl = typeof jv === "object" ? jv.light : jv;
    if (jl.toLowerCase() !== light[n].toLowerCase()) problems.push(`${n} (light): tokens.json ${jl}, site ${light[n]}`);
  }
}
for (const n of Object.keys(values)) if (!(n in dark)) problems.push(`in tokens.json but not on the site: ${n}`);
console.log(problems.length ? `Synced. Update references/tokens.json:\n  ${problems.join("\n  ")}` : "Synced. tokens.json matches the site.");
