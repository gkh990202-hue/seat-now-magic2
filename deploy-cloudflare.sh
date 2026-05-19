#!/usr/bin/env bash
set -euo pipefail

echo "[deploy-cloudflare] cwd=$(pwd)"
echo "[deploy-cloudflare] wrangler main=$(grep -E '"main"' wrangler.json wrangler.jsonc 2>/dev/null || true)"

if [ ! -f dist/server/index.js ]; then
  echo "[deploy-cloudflare] dist/server/index.js missing — running npm run build"
  npm run build
fi

exec npx wrangler deploy --config dist/server/wrangler.json
