import { existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const built = join(root, "dist", "server", "index.js");

const onCloudflare =
  process.cwd().includes("buildhome") ||
  process.env.WORKERS_CI === "1" ||
  process.env.CI === "true" ||
  process.env.CI === "1";

if (!onCloudflare) {
  process.exit(0);
}

if (!existsSync(built)) {
  console.log("[cf-prebuild] Running vite build…");
  execSync("npm run build", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
}

// npx wrangler deploy reads wrangler.jsonc — point at prebuilt worker, not src/server.ts
const deployConfig = `{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "seat-now-magic2",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "dist/server/index.js",
  "no_bundle": true,
  "assets": {
    "directory": "dist/client"
  }
}
`;

writeFileSync(join(root, "wrangler.jsonc"), deployConfig);
writeFileSync(join(root, "wrangler.json"), deployConfig);
console.log("[cf-prebuild] wrangler config → dist/server/index.js");
