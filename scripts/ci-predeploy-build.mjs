import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const built = "dist/server/index.js";

function onCi() {
  if (process.env.WORKERS_CI === "1") return true;
  if (process.env.CI === "true" || process.env.CI === "1") return true;
  if (process.cwd().includes("buildhome")) return true;
  return false;
}

if (!onCi()) {
  process.exit(0);
}

if (!existsSync(built)) {
  console.log("[ci-predeploy] running vite-build.mjs …");
  execSync("node scripts/vite-build.mjs", { stdio: "inherit", shell: true });
} else {
  copyFileSync("wrangler.deploy.jsonc", "wrangler.jsonc");
  copyFileSync("wrangler.deploy.jsonc", "wrangler.json");
}
