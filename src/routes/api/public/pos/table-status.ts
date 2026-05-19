import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { runSetTableStatus } from "@/lib/set-table-status";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-pos-api-key, Authorization",
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

// POS event → table status mapping.
// "seated" = 손님 착석, "checkout" = 계산 완료(청소중), "cleaned" = 청소 완료(비움), "reserved" = 예약
const EventSchema = z.object({
  restaurant_id: z.string().uuid(),
  table_number: z.number().int().min(1).max(999),
  event: z.enum(["seated", "checkout", "cleaned", "reserved", "set_status"]),
  status: z.enum(["EMPTY", "OCCUPIED", "CLEANING", "RESERVED"]).optional(),
  source: z.string().min(1).max(64).optional(),
});

const eventToStatus: Record<string, "EMPTY" | "OCCUPIED" | "CLEANING" | "RESERVED"> = {
  seated: "OCCUPIED",
  checkout: "CLEANING",
  cleaned: "EMPTY",
  reserved: "RESERVED",
};

export const Route = createFileRoute("/api/public/pos/table-status")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        const apiKey = request.headers.get("x-pos-api-key");
        if (!apiKey) return json({ error: "missing x-pos-api-key" }, 401);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid json" }, 400);
        }

        const parsed = EventSchema.safeParse(body);
        if (!parsed.success) {
          return json({ error: "invalid payload", details: parsed.error.flatten() }, 400);
        }
        const data = parsed.data;

        // Verify the POS key belongs to the restaurant
        const { data: rest, error: restErr } = await supabaseAdmin
          .from("restaurants")
          .select("id, pos_api_key")
          .eq("id", data.restaurant_id)
          .maybeSingle();

        if (restErr) return json({ error: restErr.message }, 500);
        if (!rest || rest.pos_api_key !== apiKey) {
          return json({ error: "unauthorized" }, 401);
        }

        const newStatus = data.event === "set_status" ? data.status : eventToStatus[data.event];
        if (!newStatus) return json({ error: "status required for set_status" }, 400);

        // Look up the table
        const { data: table, error: tableErr } = await supabaseAdmin
          .from("restaurant_tables")
          .select("id, status")
          .eq("restaurant_id", data.restaurant_id)
          .eq("table_number", data.table_number)
          .maybeSingle();

        if (tableErr) return json({ error: tableErr.message }, 500);
        if (!table) return json({ error: "table not found" }, 404);

        try {
          const rpcData = await runSetTableStatus(supabaseAdmin, {
            table_id: table.id,
            new_status: newStatus,
            source: data.source ?? "pos",
            payload: JSON.parse(JSON.stringify(data)) as Json,
          });

          return json({
            ok: true,
            table_id: table.id,
            previous_status: rpcData.previous_status,
            new_status: newStatus,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          return json({ error: e instanceof Error ? e.message : "update failed" }, 500);
        }
      },
    },
  },
});
