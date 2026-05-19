import { copyFileSync, existsSync } from "node:fs";
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

console.log("[cf-prebuild] Cloudflare CI — ensure dist + deploy wrangler config");

if (!existsSync(built)) {
  execSync("node scripts/vite-build.mjs", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
} else {
  copyFileSync(join(root, "wrangler.deploy.jsonc"), join(root, "wrangler.jsonc"));
  copyFileSync(join(root, "wrangler.deploy.jsonc"), join(root, "wrangler.json"));
}

console.log("[cf-prebuild] ready for npx wrangler deploy");
