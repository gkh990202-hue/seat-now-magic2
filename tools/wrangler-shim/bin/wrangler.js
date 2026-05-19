#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const projectRequire = createRequire(path.join(process.cwd(), "package.json"));
const shimRequire = createRequire(path.join(__dirname, "..", "package.json"));

const builtConfig = "dist/server/wrangler.json";
const args = process.argv.slice(2);
const isDeploy = args[0] === "deploy";

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: true });
  process.exit(result.status ?? 1);
}

if (isDeploy && !existsSync(builtConfig)) {
  console.log("[wrangler-shim] Running vite build before deploy…");
  const viteBin = path.join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(viteBin)) {
    console.error("[wrangler-shim] vite not found — run npm install first.");
    process.exit(1);
  }
  const build = spawnSync(process.execPath, [viteBin, "build"], {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

if (isDeploy && existsSync(builtConfig) && !args.includes("--config")) {
  args.push("--config", builtConfig);
}

const upstream = shimRequire.resolve("wrangler-upstream/bin/wrangler.js");
const result = spawnSync(process.execPath, [upstream, ...args], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 0);
