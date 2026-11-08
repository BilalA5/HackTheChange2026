// Bundles the Electron main, preload and shell scripts, then copies the static shell assets.
import * as esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "shell"), { recursive: true });

const common = { bundle: true, sourcemap: false, logLevel: "info", legalComments: "none" };

await esbuild.build({
  ...common,
  entryPoints: [path.join(root, "src/main.ts")],
  outfile: path.join(dist, "main.cjs"),
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron"],
});

// The preload runs in a sandboxed renderer: it may only require("electron").
await esbuild.build({
  ...common,
  entryPoints: [path.join(root, "src/preload.ts")],
  outfile: path.join(dist, "preload.cjs"),
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron"],
});

await esbuild.build({
  ...common,
  entryPoints: [path.join(root, "src/shell/shell.ts")],
  outfile: path.join(dist, "shell", "shell.js"),
  platform: "browser",
  format: "iife",
  target: "es2022",
});

await cp(path.join(root, "src/shell/shell.html"), path.join(dist, "shell", "shell.html"));
await cp(path.join(root, "src/shell/shell.css"), path.join(dist, "shell", "shell.css"));

console.log("[desktop] build complete ->", dist);
