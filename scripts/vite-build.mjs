/**
 * Vite needs wrangler main = src/server.ts; Cloudflare deploy needs dist/server/index.js.
 */
import { copyFileSync } from "node:fs";
import { execSync } from "node:child_process";

copyFileSync("wrangler.build.jsonc", "wrangler.jsonc");
copyFileSync("wrangler.build.jsonc", "wrangler.json");

try {
  execSync("npx vite build", { stdio: "inherit", env: process.env, shell: true });
} finally {
  copyFileSync("wrangler.deploy.jsonc", "wrangler.jsonc");
  copyFileSync("wrangler.deploy.jsonc", "wrangler.json");
}
