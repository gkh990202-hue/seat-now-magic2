/**
 * Applies demo table statuses via Supabase REST (requires public update RLS).
 * Run after supabase/patch-policies-rpc.sql (or apply-fix.sql).
 * Usage: npm run db:seed
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DEMO_NAME = "온반";

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
  console.error("Missing Supabase env vars in .env");
  process.exit(1);
}

const supabase = createClient(url, key);
const now = new Date().toISOString();

function statusForTable(n) {
  if (n <= 2) return "EMPTY";
  if (n <= 4) return "OCCUPIED";
  if (n === 5) return "CLEANING";
  if (n === 6) return "RESERVED";
  return "EMPTY";
}

function layoutForTable(n) {
  const positions = {
    1: { layout_x: 24, layout_y: 28 },
    2: { layout_x: 50, layout_y: 28 },
    3: { layout_x: 76, layout_y: 28 },
    4: { layout_x: 24, layout_y: 68 },
    5: { layout_x: 50, layout_y: 68 },
    6: { layout_x: 76, layout_y: 68 },
  };
  return positions[n] ?? { layout_x: 50, layout_y: 50 };
}

const { data: restaurant, error: rErr } = await supabase
  .from("restaurants")
  .select("id, name")
  .eq("name", DEMO_NAME)
  .maybeSingle();

if (rErr) {
  console.error("restaurants:", rErr.message);
  process.exit(1);
}

if (!restaurant) {
  console.error(
    `Demo restaurant "${DEMO_NAME}" not found. Run supabase/onban-layout.sql in Supabase SQL Editor first.`,
  );
  process.exit(1);
}

console.log(`Seeding: ${restaurant.name} (${restaurant.id})`);

const { data: allTables, error: tErr } = await supabase
  .from("restaurant_tables")
  .select("id, table_number, status")
  .eq("restaurant_id", restaurant.id)
  .lte("table_number", 6)
  .order("table_number");

if (tErr) {
  console.error("restaurant_tables:", tErr.message);
  process.exit(1);
}

if (!allTables?.length) {
  console.error("No tables 1–6 found. Run supabase/apply-fix.sql first.");
  process.exit(1);
}

for (const t of allTables) {
  const status = statusForTable(t.table_number);
  const layout = layoutForTable(t.table_number);
  const { data: updated, error } = await supabase
    .from("restaurant_tables")
    .update({
      status,
      ...layout,
      table_label: `T${t.table_number}`,
      seat_label: "4인석",
      layout_w: 24,
      layout_h: 22,
      occupied_at: t.table_number >= 3 && t.table_number <= 4 ? now : null,
      updated_at: now,
    })
    .eq("id", t.id)
    .select("table_number, status")
    .maybeSingle();

  if (error) {
    console.error(`update T${t.table_number}:`, error.message);
    process.exit(1);
  }

  if (!updated || updated.status !== status) {
    console.error(
      `update T${t.table_number}: no change (still ${t.status}). ` +
        `Run supabase/patch-policies-rpc.sql in Supabase SQL Editor to enable UPDATE.`,
    );
    process.exit(1);
  }

  console.log(`T${t.table_number} → ${status}`);
}

console.log("\nDemo seed applied. Run npm run db:check to verify.");
