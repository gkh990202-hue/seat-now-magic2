import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runSetTableStatus } from "@/lib/set-table-status";

const StatusEnum = z.enum(["EMPTY", "OCCUPIED", "CLEANING", "RESERVED"]);

export const setTableStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        table_id: z.string().uuid(),
        new_status: StatusEnum,
        source: z.string().min(1).max(64).default("admin"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return runSetTableStatus(supabaseAdmin, {
      table_id: data.table_id,
      new_status: data.new_status,
      source: data.source,
      payload: { via: "admin-server-fn" },
    });
  });
