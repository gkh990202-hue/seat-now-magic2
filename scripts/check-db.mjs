import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error(JSON.stringify({ ok: false, error: "Missing VITE_SUPABASE_URL or key in .env" }));
  process.exit(1);
}

const supabase = createClient(url, key);

const out = { ok: true, url: url.replace(/https:\/\/([^.]+).*/, "https://$1.supabase.co") };

const { data: restaurants, error: rErr } = await supabase
  .from("restaurants")
  .select("id, name, address")
  .order("created_at");

if (rErr) {
  console.log(JSON.stringify({ ...out, ok: false, step: "restaurants", error: rErr.message, code: rErr.code }, null, 2));
  process.exit(1);
}

const { data: tables, error: tErr } = await supabase
  .from("restaurant_tables")
  .select("id, restaurant_id, table_number, status")
  .order("table_number");

if (tErr) {
  console.log(JSON.stringify({ ...out, ok: false, step: "restaurant_tables", error: tErr.message, code: tErr.code }, null, 2));
  process.exit(1);
}

let rpc = { tested: false };
if (tables?.length) {
  const first = tables[0];
  const { data: rpcData, error: rpcErr } = await supabase.rpc("set_table_status", {
    p_table_id: first.id,
    p_new_status: first.status,
    p_source: "check-db",
    p_payload: { dry: true },
  });
  rpc = {
    tested: true,
    ok: !rpcErr,
    error: rpcErr?.message ?? null,
    hint: rpcErr?.message?.includes("Could not find")
      ? "Run supabase/patch-policies-rpc.sql in Supabase SQL Editor"
      : null,
    sample: rpcData ?? null,
  };
} else {
  rpc = { tested: false, hint: "No tables — run supabase/apply-fix.sql seed" };
}

const statusCounts = (tables ?? []).reduce((acc, t) => {
  acc[t.status] = (acc[t.status] ?? 0) + 1;
  return acc;
}, {});

const allEmpty =
  tables?.length &&
  Object.keys(statusCounts).length === 1 &&
  statusCounts.EMPTY === tables.length;

const policiesHint = allEmpty
  ? "Tables exist but all EMPTY — run supabase/patch-policies-rpc.sql then npm run db:seed"
  : null;

console.log(
  JSON.stringify(
    {
      ...out,
      restaurants: restaurants?.length ?? 0,
      restaurantNames: restaurants?.map((r) => r.name) ?? [],
      tables: tables?.length ?? 0,
      tableStatusCounts: statusCounts,
      policiesHint,
      rpc,
    },
    null,
    2,
  ),
);
