/**
 * Cloudflare Workers Builds often runs `npx wrangler deploy` without `npm run build`.
 * TanStack Start needs Vite output in dist/server/ before Wrangler can bundle.
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const builtConfig = "dist/server/wrangler.json";

function isCloudflareWorkersBuild() {
  if (process.env.WORKERS_CI === "1") return true;
  if (process.env.CI === "true" || process.env.CI === "1") return true;
  // Workers Builds runs in /opt/buildhome/ (see wrangler error logs)
  if (process.cwd().includes("buildhome")) return true;
  return false;
}

if (!isCloudflareWorkersBuild()) {
  process.exit(0);
}

if (existsSync(builtConfig)) {
  console.log("[ci-predeploy] dist/server/wrangler.json exists — skip build.");
  process.exit(0);
}

console.log("[ci-predeploy] Building for Cloudflare (vite build)…");
execSync("npm run build", { stdio: "inherit" });
