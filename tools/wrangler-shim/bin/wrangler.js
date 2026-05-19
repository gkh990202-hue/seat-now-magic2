#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const projectRequire = createRequire(path.join(process.cwd(), "package.json"));
const shimRequire = createRequire(path.join(__dirname, "..", "package.json"));

const builtEntry = "dist/server/index.js";
const builtConfig = "dist/server/wrangler.json";
const args = process.argv.slice(2);
const isDeploy = args[0] === "deploy";

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: true });
  process.exit(result.status ?? 1);
}

if (isDeploy && !existsSync(builtEntry)) {
  console.log("[wrangler-shim] Running scripts/vite-build.mjs …");
  const build = spawnSync(process.execPath, ["scripts/vite-build.mjs"], {
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
